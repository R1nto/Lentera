import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

const validRoles = new Set(['guru', 'kepala_sekolah', 'wali_murid']);
const invalidCredentials = 'Identitas atau password tidak sesuai. Pastikan peran akun benar.';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = String(body.identifier || '').trim();
    const password = String(body.password || '');
    const role = String(body.role || '');

    if (!identifier || !password || !validRoles.has(role) || /[%_]/.test(identifier)) {
      return NextResponse.json({ error: 'Lengkapi identitas, password, dan peran akun.' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !publishableKey || !secretKey) {
      return NextResponse.json({ error: 'Konfigurasi autentikasi belum lengkap. Hubungi administrator aplikasi.' }, { status: 503 });
    }

    const admin = createSupabaseAdmin(url, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });

    // Email goes directly to Supabase Auth. Non-email IDs are resolved using the
    // server-side profile mapping. The browser never receives the mapped email.
    let email = identifier;
    if (!identifier.includes('@')) {
      const { data: profile, error } = await admin.from('profiles')
        .select('id').eq('role', role).ilike('identifier', identifier).maybeSingle();
      if (error) {
        console.error('Login identifier lookup failed:', { code: error.code, message: error.message });
        return NextResponse.json({ error: 'Database belum mengizinkan pencarian akun. Admin perlu memeriksa izin SELECT pada tabel profiles untuk service_role.' }, { status: 503 });
      }
      if (!profile) return NextResponse.json({ error: invalidCredentials }, { status: 401 });
      const { data: record, error: recordError } = await admin.auth.admin.getUserById(profile.id);
      if (recordError || !record.user?.email) {
        return NextResponse.json({ error: 'Akun belum lengkap di Supabase Auth. Hubungi Admin LENTERA.' }, { status: 403 });
      }
      email = record.user.email;
    }

    // Explicitly set session cookies on the login response, so the following
    // navigation can authenticate in middleware even on Next.js 16.
    const sessionResponse = NextResponse.json(
      { ok: true, role },
      { headers: { 'Cache-Control': 'no-store' } },
    );
    const supabase = createServerClient(url, publishableKey, {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            sessionResponse.cookies.set(name, value, options);
          });
        },
      },
    });
    const { data: signedIn, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !signedIn.user) {
      return NextResponse.json({ error: invalidCredentials }, { status: 401 });
    }

    // Confirm the role server-side. A valid email/password must never authorize
    // another school role merely because the login form selected that role.
    const { data: profile, error: profileError } = await admin.from('profiles')
      .select('role').eq('id', signedIn.user.id).maybeSingle();
    if (profileError || !profile || profile.role !== role) {
      await supabase.auth.signOut();
      if (profileError) {
        console.error('Login role lookup failed:', { code: profileError.code, message: profileError.message });
        return NextResponse.json({ error: 'Gagal membaca profil akun. Admin perlu memeriksa izin SELECT tabel profiles.' }, { status: 503 });
      }
      return NextResponse.json({ error: 'Akun tidak terdaftar untuk peran yang dipilih. Pilih peran sesuai akun yang dibuat Admin.' }, { status: 403 });
    }

    return sessionResponse;
  } catch (error) {
    console.error('Login request failed:', error);
    return NextResponse.json({ error: 'Tidak dapat memproses login saat ini.' }, { status: 500 });
  }
}
