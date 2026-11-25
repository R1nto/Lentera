import type { Metadata } from 'next';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { isCurrentUserPlatformAdmin } from '@/lib/admin/authorization';
import { AdminConsole } from './ui';

export const metadata: Metadata = {
  title: 'Panel Admin Internal',
  robots: { index: false, follow: false, noarchive: true },
};

// Supabase authentication relies on request-scoped cookies and can use the
// current time internally when checking tokens. Never run it during the
// Cache Components prerender pass.
async function AuthenticatedAdminConsole() {
  await connection();
  const { isAdmin, user } = await isCurrentUserPlatformAdmin();
  if (!user) redirect('/lentera-system-access');
  if (!isAdmin) redirect('/');

  return <AdminConsole />;
}

export default function PlatformAdminPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[#F4F7FA] text-[#203449]">Memverifikasi akses Admin…</main>}>
      <AuthenticatedAdminConsole />
    </Suspense>
  );
}
