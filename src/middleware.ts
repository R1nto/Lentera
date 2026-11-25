import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

const ADMIN_CONSOLE_PATH = '/panel-internal-lentera';
const ADMIN_LOGIN_PATH = '/lentera-system-access';
const publicExactRoutes = new Set([
  '/',
  '/masuk',
  '/daftar',
  '/daftar-mandiri',
  '/pilih-peran',
  '/auth/callback',
  ADMIN_LOGIN_PATH,
]);

const publicPrefixes = ['/api/auth/'];
const roleDashboard: Record<string, string> = {
  guru: '/guru',
  kepala_sekolah: '/kepala-sekolah',
  wali_murid: '/wali-murid',
};

function isPathWithin(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`);
}

function isPublicPath(pathname: string) {
  return publicExactRoutes.has(pathname) || publicPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const publicPath = isPublicPath(pathname);

  // API route handlers return JSON auth errors and enforce their own role/resource checks.
  if (pathname.startsWith('/api/')) return NextResponse.next();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  // Keep public marketing/auth pages accessible before environment setup.
  // Protected pages still fail closed and send the user to the setup-aware login flow.
  if (!supabaseUrl || !supabaseKey) {
    if (publicPath) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = '/pilih-peran';
    url.searchParams.set('setup', 'supabase');
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    if (isPathWithin(pathname, ADMIN_CONSOLE_PATH)) {
      const url = request.nextUrl.clone();
      url.pathname = ADMIN_LOGIN_PATH;
      url.search = '';
      return NextResponse.redirect(url);
    }
    if (publicPath) return response;
    const url = request.nextUrl.clone();
    url.pathname = '/pilih-peran';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Platform admins are separate from the three school-level profile roles.
  // Membership is resolved by a SECURITY DEFINER RPC; browser metadata is never trusted.
  const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin');
  if (isPlatformAdmin === true) {
    if (isPathWithin(pathname, ADMIN_CONSOLE_PATH) || pathname === ADMIN_LOGIN_PATH || publicPath) {
      return response;
    }
    const url = request.nextUrl.clone();
    url.pathname = ADMIN_CONSOLE_PATH;
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Non-admin users cannot enter the internal console. Their normal role routing applies.
  // API handlers enforce their own authentication and resource-level authorization.
  if (pathname.startsWith('/api/')) return response;

  // Role lookup is server-side and keyed to the verified Auth user ID.
  // Service-role privileges are required for provisioning and role lookup;
  // the untrusted browser never chooses the role. Do not expose this client.
  const serverSecret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serverSecret) {
    console.error('Role lookup unavailable: Supabase secret key is missing');
    if (publicPath) return response;
    const url = request.nextUrl.clone();
    url.pathname = '/masuk';
    url.searchParams.set('error', 'server-config');
    return NextResponse.redirect(url);
  }
  const admin = createSupabaseAdmin(supabaseUrl, serverSecret, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) {
    console.error('Middleware role lookup failed:', {
      code: profileError.code, message: profileError.message,
    });
  }

  if (profileError || !profile?.role || !roleDashboard[profile.role]) {
    if (publicPath) return response;
    const url = request.nextUrl.clone();
    url.pathname = '/pilih-peran';
    url.searchParams.set('setup', 'profile');
    return NextResponse.redirect(url);
  }

  const dashboardPath = roleDashboard[profile.role];

  if (publicPath) {
    // Keep the landing page public; authenticated users may also revisit it.
    if (pathname === '/') return response;
    const url = request.nextUrl.clone();
    url.pathname = dashboardPath;
    url.search = '';
    return NextResponse.redirect(url);
  }

  const permitted = isPathWithin(pathname, dashboardPath);
  if (!permitted) {
    const url = request.nextUrl.clone();
    url.pathname = dashboardPath;
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
