'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LegacyRegistrationRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get('role') || 'wali_murid';
  const role = ['guru', 'kepala_sekolah', 'wali_murid'].includes(requestedRole) ? requestedRole : 'wali_murid';

  useEffect(() => {
    router.replace(`/daftar?role=${role}`);
  }, [router, role]);

  return <div className="auth-page flex min-h-screen items-center justify-center text-sm font-medium text-[#526579]">Mengalihkan ke formulir pendaftaran terbaru...</div>;
}

export default function LegacyRegistrationPage() {
  return <Suspense fallback={<div className="auth-page flex min-h-screen items-center justify-center text-sm text-[#526579]">Memuat...</div>}><LegacyRegistrationRedirect /></Suspense>;
}
