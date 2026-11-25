import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

type DatabaseError = { code?: string; message?: string; details?: string | null; hint?: string | null };

function dbFailure(error: DatabaseError, stage: string) {
  // Detailed diagnostics are server-only; do not leak names, identifiers, or secrets to the browser.
  console.error('Teacher create student database failure:', {
    stage,
    code: error.code ?? 'unknown',
    message: error.message ?? 'unknown',
    hint: error.hint ?? null,
  });
  switch (error.code) {
    case '42501':
      return NextResponse.json({ error: `Izin database tidak mencukupi saat ${stage}. Periksa izin service_role pada students, classes, dan teacher_classes.`, code: error.code }, { status: 503 });
    case '23505':
      return NextResponse.json({ error: 'NIS sudah digunakan di sekolah ini.', code: error.code }, { status: 409 });
    case '23503':
      return NextResponse.json({ error: 'Data sekolah atau kelas tidak ditemukan. Muat ulang halaman dan pilih kelas kembali.', code: error.code }, { status: 409 });
    case '23514':
    case '23502':
      return NextResponse.json({ error: 'Data siswa tidak memenuhi ketentuan database. Periksa nama, NIS, kelas, dan jenis kelamin.', code: error.code }, { status: 400 });
    case '42P01':
    case '42703':
      return NextResponse.json({ error: 'Struktur tabel belum sesuai migrasi LENTERA. Periksa migrasi Supabase.', code: error.code }, { status: 503 });
    default:
      return NextResponse.json({ error: `Database menolak operasi saat ${stage}. Periksa log server untuk kode dan pesan PostgreSQL.`, code: error.code ?? 'unknown' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await createClient();
  const { data: authData, error: authError } = await auth.auth.getUser();
  if (authError || !authData.user) return NextResponse.json({ error: 'Sesi login tidak tersedia.' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Format data tidak valid.' }, { status: 400 });
  }
  const name = typeof body.full_name === 'string' ? body.full_name.trim() : '';
  const nis = typeof body.nis === 'string' ? body.nis.trim() : '';
  const classId = typeof body.class_id === 'string' ? body.class_id : '';
  const gender = body.gender === 'L' || body.gender === 'P' ? body.gender : null;
  if (name.length < 2 || name.length > 150 || !/^[a-zA-Z0-9./-]{1,32}$/.test(nis) || !/^[a-f0-9-]{36}$/i.test(classId)) {
    return NextResponse.json({ error: 'Nama, NIS, atau kelas tidak valid.' }, { status: 400 });
  }

  try {
    const db = await createServiceClient();
    // Use a service-side read for authorization data; do not depend on browser RLS for role lookup.
    const profileResult = await db.from('profiles')
      .select('role,school_id').eq('id', authData.user.id).maybeSingle();
    if (profileResult.error) return dbFailure(profileResult.error, 'membaca profil Guru');
    const profile = profileResult.data;
    if (profile?.role !== 'guru' || !profile.school_id) {
      return NextResponse.json({ error: 'Akses Guru tidak valid atau sekolah belum ditetapkan.' }, { status: 403 });
    }

    const [assignment, selectedClass] = await Promise.all([
      db.from('teacher_classes').select('id').eq('teacher_id', authData.user.id).eq('class_id', classId).limit(1).maybeSingle(),
      db.from('classes').select('id,school_id').eq('id', classId).maybeSingle(),
    ]);
    if (assignment.error) return dbFailure(assignment.error, 'memeriksa penugasan Guru');
    if (selectedClass.error) return dbFailure(selectedClass.error, 'memeriksa kelas');
    if (!assignment.data || selectedClass.data?.school_id !== profile.school_id) {
      return NextResponse.json({ error: 'Kelas bukan tanggung jawab Guru ini. Minta Kepala Sekolah menugaskan Guru ke kelas tersebut.' }, { status: 403 });
    }

    const result = await db.from('students').insert({
      school_id: profile.school_id,
      class_id: classId,
      full_name: name,
      nis,
      gender,
      is_active: true,
    }).select('id').single();
    if (result.error) return dbFailure(result.error, 'menyimpan siswa');
    return NextResponse.json({ ok: true, id: result.data.id }, { status: 201 });
  } catch (error) {
    console.error('Teacher create student unexpected failure:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Layanan penyimpanan siswa tidak tersedia. Periksa konfigurasi server dan log terminal.', code: 'SERVER_CONFIGURATION' }, { status: 503 });
  }
}
