import { NextRequest, NextResponse } from 'next/server';
import { isCurrentUserPlatformAdmin } from '@/lib/admin/authorization';
import { createServiceClient } from '@/lib/supabase/server';

const responseError = (error: string, status: number) => NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET() {
  const { isAdmin } = await isCurrentUserPlatformAdmin();
  if (!isAdmin) return responseError('Akses administrator diperlukan.', 403);
  try {
    const service = await createServiceClient();
    const { data, error } = await service.from('profiles')
      .select('id,full_name,role,identifier,school_id,created_at')
      .in('role', ['guru', 'kepala_sekolah']).order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return NextResponse.json({ staff: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Admin staff read failed:', error);
    return responseError('Daftar akun staf gagal dimuat.', 500);
  }
}

export async function POST(request: NextRequest) {
  const { isAdmin, user } = await isCurrentUserPlatformAdmin();
  if (!isAdmin || !user) return responseError('Akses administrator diperlukan.', 403);

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return responseError('Format permintaan tidak valid.', 400); }
  const role = body.role;
  const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const identifier = typeof body.identifier === 'string' ? body.identifier.trim() : '';
  const schoolId = typeof body.school_id === 'string' ? body.school_id : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (role !== 'guru' && role !== 'kepala_sekolah') return responseError('Peran akun tidak valid.', 400);
  if (fullName.length < 3 || fullName.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return responseError('Nama lengkap dan alamat email harus valid.', 400);
  }
  if (identifier.length < 3 || identifier.length > 80 || /[%_]/.test(identifier) || !uuid.test(schoolId)) {
    return responseError('NIP / ID akun dan sekolah harus valid (hindari karakter % dan _).', 400);
  }
  if (password.length < 12 || password.length > 128 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return responseError('Password awal minimal 12 karakter dan mengandung huruf serta angka.', 400);
  }

  try {
    const service = await createServiceClient();
    const { data: school, error: schoolError } = await service.from('schools').select('id').eq('id', schoolId).maybeSingle();
    if (schoolError) throw schoolError;
    if (!school) return responseError('Sekolah tidak ditemukan.', 404);

    const { data: existing, error: existingError } = await service.from('profiles')
      .select('id').eq('role', role).ilike('identifier', identifier).maybeSingle();
    if (existingError) throw existingError;
    if (existing) return responseError('NIP / ID akun untuk role tersebut sudah digunakan.', 409);

    // Only server-side service credentials may create Auth users or grant privileged roles.
    const { data: created, error: authError } = await service.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (authError || !created.user) {
      if (authError?.message?.toLowerCase().includes('already')) return responseError('Email sudah digunakan akun lain.', 409);
      console.error('Admin create auth user failed:', authError);
      return responseError('Gagal membuat akun Supabase Auth. Periksa email dan pengaturan Auth.', 400);
    }

    const createdId = created.user.id;
    const { error: profileError } = await service.from('profiles').insert({
      id: createdId, full_name: fullName, role, identifier, school_id: schoolId,
    });
    if (profileError) {
      // Compensation: a failed profile must not leave a login account with no assigned role.
      const { error: rollbackError } = await service.auth.admin.deleteUser(createdId);
      if (rollbackError) console.error('URGENT: staff account rollback failed:', createdId, rollbackError);
      console.error('Admin create profile failed:', profileError);
      return responseError(rollbackError
        ? 'Profil gagal disimpan dan rollback Auth gagal. Hubungi pengelola untuk memeriksa akun sebelum mencoba lagi.'
        : profileError.code === '23505' ? 'NIP / ID akun sudah digunakan. Akun Auth baru dibatalkan.'
          : 'Profil gagal disimpan. Akun Auth baru dibatalkan; periksa migrasi dan skema database.', 500);
    }

    return NextResponse.json({
      message: `Akun ${role === 'guru' ? 'Guru' : 'Kepala Sekolah'} berhasil dibuat. Berikan kredensial awal secara aman dan minta pengguna mengganti password.`,
      staff: { id: createdId, full_name: fullName, email, role, identifier, school_id: schoolId },
    }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Admin staff provisioning failed:', error);
    return responseError('Pembuatan akun gagal karena masalah server. Periksa log server.', 500);
  }
}
