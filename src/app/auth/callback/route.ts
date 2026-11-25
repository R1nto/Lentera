import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const requestedNext = request.nextUrl.searchParams.get('next') || '/wali-murid';
  const next = requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/wali-murid';
  const redirectUrl = new URL(next, request.url);
  const response = NextResponse.redirect(redirectUrl);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!code || !url || !key) {
    return NextResponse.redirect(new URL('/masuk?verification=failed', request.url));
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL('/masuk?verification=failed', request.url));
  }

  return response;
}
