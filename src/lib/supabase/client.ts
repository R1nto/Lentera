'use client';

import { createBrowserClient } from '@supabase/ssr';

// Use dummy values during build if env vars are not set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || 'dummy-key-for-build';

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey);
}