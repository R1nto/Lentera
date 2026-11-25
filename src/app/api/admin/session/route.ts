import { NextResponse } from 'next/server';
import { isCurrentUserPlatformAdmin } from '@/lib/admin/authorization';

/** Authentication status only; never depends on AI keys or service-role credentials. */
export async function GET() {
  try {
    const { isAdmin, user } = await isCurrentUserPlatformAdmin();
    if (!user) return NextResponse.json({ error: 'Silakan login kembali.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    if (!isAdmin) return NextResponse.json({ error: 'Akun ini belum terdaftar sebagai admin platform. Periksa public.platform_admins dan RPC is_platform_admin.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Verifikasi admin gagal. Periksa koneksi Supabase.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
