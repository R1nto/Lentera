import { NextRequest, NextResponse } from 'next/server';
import { isCurrentUserPlatformAdmin } from '@/lib/admin/authorization';
import { createServiceClient } from '@/lib/supabase/server';

const responseError = (error: string, status: number) => NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });

/** Translate known backend failures to actionable messages without exposing credentials. */
function schoolFailure(error: unknown): { message: string; status: number } {
  const issue = error as { code?: string; message?: string; status?: number } | null;
  const code = issue?.code || '';
  const message = (issue?.message || '').toLowerCase();
  if (message.includes('supabase server secret belum dikonfigurasi')) {
    return { message: 'SUPABASE_SECRET_KEY belum disetel di server. Isi .env.local dengan Secret Key project Supabase yang benar, lalu restart server.', status: 503 };
  }
  if (code === '42501' || message.includes('row-level security') || message.includes('permission denied')) {
    return { message: 'Supabase menolak izin menulis tabel schools. Periksa SUPABASE_SECRET_KEY (bukan publishable/anon key), project URL, dan grants/RLS.', status: 503 };
  }
  if (code === '42P01' || code === 'PGRST205' || message.includes('schema cache') && message.includes('schools')) {
    return { message: 'Tabel public.schools tidak ditemukan. Jalankan migrasi database LENTERA pada project Supabase yang sama.', status: 503 };
  }
  if (code === '23505') return { message: 'Data sekolah duplikat menurut aturan unik database.', status: 409 };
  if (code === '23502' || code === '23514' || code === '22P02' || code === 'PGRST204') {
    return { message: 'Skema tabel schools tidak sesuai dengan source code V6. Periksa kolom name, academic_year, dan address serta migrasi yang diterapkan.', status: 503 };
  }
  if (message.includes('invalid api key') || message.includes('jwt') || issue?.status === 401) {
    return { message: 'Kredensial Supabase server ditolak. Cocokkan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SECRET_KEY pada project yang sama.', status: 503 };
  }
  return { message: 'Sekolah gagal ditambahkan. Periksa log terminal Next.js (Admin school creation failed) untuk kode error Supabase.', status: 500 };
}

export async function GET() {
  const { isAdmin } = await isCurrentUserPlatformAdmin();
  if (!isAdmin) return responseError('Akses administrator diperlukan.', 403);
  try {
    const service = await createServiceClient();
    const { data, error } = await service.from('schools').select('id,name,address,academic_year').order('name');
    if (error) throw error;
    return NextResponse.json({ schools: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Admin schools read failed:', error);
    const failure = schoolFailure(error);
    return responseError(failure.message, failure.status);
  }
}

export async function POST(request: NextRequest) {
  const { isAdmin } = await isCurrentUserPlatformAdmin();
  if (!isAdmin) return responseError('Akses administrator diperlukan.', 403);
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return responseError('Format permintaan tidak valid.', 400); }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const academicYear = typeof body.academic_year === 'string' ? body.academic_year.trim() : '';
  const address = typeof body.address === 'string' ? body.address.trim() : '';
  if (name.length < 3 || name.length > 160 || !/^\d{4}\/\d{4}$/.test(academicYear) || address.length > 500) {
    return responseError('Nama sekolah dan tahun ajaran (contoh: 2026/2027) wajib diisi dengan benar.', 400);
  }
  try {
    const service = await createServiceClient();
    const { data, error } = await service.from('schools')
      .insert({ name, academic_year: academicYear, address: address || null })
      .select('id,name,address,academic_year').single();
    if (error) throw error;
    return NextResponse.json({ school: data, message: 'Sekolah berhasil ditambahkan.' }, { status: 201 });
  } catch (error) {
    console.error('Admin school creation failed:', error);
    const failure = schoolFailure(error);
    return responseError(failure.message, failure.status);
  }
}
