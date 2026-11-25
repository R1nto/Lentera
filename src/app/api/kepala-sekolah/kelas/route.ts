import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

const fail = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function phaseForGrade(grade: number): 'A' | 'B' | 'C' {
  if (grade <= 2) return 'A';
  if (grade <= 4) return 'B';
  return 'C';
}

export async function POST(request: NextRequest) {
  const auth = await createClient();
  const { data: { user }, error: authError } = await auth.auth.getUser();
  if (authError || !user) return fail('Sesi tidak valid. Silakan masuk kembali.', 401);

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return fail('Format data kelas tidak valid.', 400);
  }
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const grade = Number(payload.grade);
  const academicYear = typeof payload.academic_year === 'string' ? payload.academic_year.trim() : '';
  const teacherId = typeof payload.homeroom_teacher_id === 'string' ? payload.homeroom_teacher_id.trim() : '';

  if (name.length < 2 || name.length > 80 || !Number.isInteger(grade) || grade < 1 || grade > 6 ||
    !/^(\d{4})\/(\d{4})$/.test(academicYear) || Number(academicYear.slice(5)) !== Number(academicYear.slice(0, 4)) + 1 ||
    (teacherId && !uuidPattern.test(teacherId))) {
    return fail('Periksa nama kelas, tingkat (1–6), tahun ajaran, dan pilihan wali kelas.', 400);
  }

  try {
    const service = await createServiceClient();
    const { data: principal, error: principalError } = await service.from('profiles')
      .select('id,role,school_id').eq('id', user.id).maybeSingle();
    if (principalError) throw principalError;
    if (principal?.role !== 'kepala_sekolah' || !principal.school_id) return fail('Hanya Kepala Sekolah dengan sekolah aktif yang dapat membuat kelas.', 403);

    if (teacherId) {
      const { data: teacher, error: teacherError } = await service.from('profiles')
        .select('id').eq('id', teacherId).eq('school_id', principal.school_id).eq('role', 'guru').maybeSingle();
      if (teacherError) throw teacherError;
      if (!teacher) return fail('Guru tidak ditemukan pada sekolah Anda.', 400);
    }

    const { data: existing, error: existingError } = await service.from('classes')
      .select('id').eq('school_id', principal.school_id).eq('academic_year', academicYear)
      .ilike('name', name).limit(1);
    if (existingError) throw existingError;
    if (existing?.length) return fail('Nama kelas ini sudah digunakan untuk tahun ajaran tersebut.', 409);

    const { data: created, error: createError } = await service.from('classes')
      .insert({ school_id: principal.school_id, name, grade: String(grade), phase: phaseForGrade(grade), academic_year: academicYear, homeroom_teacher_id: teacherId || null })
      .select('id,name,grade,phase,academic_year,homeroom_teacher_id').single();
    if (createError) throw createError;

    if (teacherId) {
      const { error: assignmentError } = await service.from('teacher_classes')
        .insert({ teacher_id: teacherId, class_id: created.id, is_homeroom: true });
      if (assignmentError) {
        // Avoid leaving a class with a partial homeroom assignment.
        const { error: rollbackError } = await service.from('classes').delete().eq('id', created.id).eq('school_id', principal.school_id);
        if (rollbackError) console.error('Principal class rollback failed:', rollbackError.code);
        throw assignmentError;
      }
    }

    return NextResponse.json({ class: created, message: 'Kelas berhasil ditambahkan.' },
      { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const issue = error as { code?: string; message?: string };
    console.error('Principal class creation failed:', issue?.code, issue?.message);
    if (issue?.code === '42501') return fail('Izin database untuk kelas belum tersedia. Pastikan migrasi 015 dijalankan.', 503);
    if (issue?.code === '23505') return fail('Kelas atau penugasan ini sudah ada.', 409);
    return fail('Kelas belum berhasil disimpan. Periksa log server dan izin database.', 500);
  }
}
