'use client';

import * as React from 'react';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Home, Loader2, LockKeyhole, Mail, School, ShieldCheck, UserRound, AlertCircle } from 'lucide-react';
import { BrandMark } from '@/components/brand/brand-mark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const roleConfigs = {
  guru: {
    label: 'Guru Kelas',
    icon: UserRound,
    identifierLabel: 'NIP atau email akun',
    placeholder: 'Masukkan NIP atau email',
    description: 'Akses ruang kerja untuk mengelola kelas, asesmen, dan refleksi pembelajaran.',
  },
  kepala_sekolah: {
    label: 'Kepala Sekolah',
    icon: School,
    identifierLabel: 'ID akun atau email',
    placeholder: 'Masukkan ID akun atau email',
    description: 'Akses ringkasan monitoring pembelajaran di lingkungan sekolah.',
  },
  wali_murid: {
    label: 'Wali Murid',
    icon: Home,
    identifierLabel: 'Alamat email',
    placeholder: 'nama@email.com',
    description: 'Lihat perkembangan dan laporan belajar anak yang dibagikan oleh guru.',
  },
} as const;

type RoleKey = keyof typeof roleConfigs;

function LoginPageContent() {
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get('role') || 'guru';
  const role: RoleKey = requestedRole in roleConfigs ? requestedRole as RoleKey : 'guru';
  const config = roleConfigs[role];
  const Icon = config.icon;
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!identifier.trim() || !password) {
      setError('Masukkan identitas akun dan password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password, role }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Identitas atau password tidak sesuai.');
        return;
      }
      // Full navigation ensures the browser sends the newly issued session cookies.
      window.location.assign(`/${role.replace('_', '-')}`);
    } catch (loginError) {
      console.error('Login failed:', loginError);
      setError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page min-h-screen">
      <header className="auth-topbar">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="LENTERA beranda"><BrandMark size="sm" showTagline /></Link>
          <Link href="/pilih-peran" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#526579] transition hover:bg-white hover:text-[#17324D]">
            <ArrowLeft className="h-4 w-4" /> Pilih peran
          </Link>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:px-8 lg:py-12">
        <aside className="auth-story relative hidden min-h-[620px] overflow-hidden rounded-[32px] bg-[#17324D] p-10 text-white shadow-[0_24px_70px_rgba(23,50,77,0.16)] lg:flex lg:flex-col">
          <div className="pointer-events-none absolute -right-20 -top-16 h-72 w-72 rounded-full border border-white/10" />
          <div className="relative z-10 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#CDEDE8]">
            <ShieldCheck className="h-4 w-4" /> AKSES SESUAI PERAN
          </div>
          <div className="relative z-10 mt-12">
            <h1 className="max-w-md text-4xl font-bold leading-[1.12] tracking-tight">Pembelajaran lebih terarah, dimulai dari satu ruang.</h1>
            <p className="mt-5 max-w-md text-base leading-8 text-[#D5E0E9]">Data asesmen, refleksi, dan laporan tersusun agar setiap langkah belajar lebih mudah dipahami.</p>
          </div>
          <div className="relative z-10 mt-auto flex items-end justify-between gap-2">
            <div className="max-w-[225px] rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-sm font-semibold text-white">Sahabat LENTERA</p>
              <p className="mt-1 text-xs leading-5 text-[#D5E0E9]">Terangi pembelajaran, tumbuhkan potensi.</p>
            </div>
            <Image src="/images/lentera-mascot.png" alt="Maskot lentera LENTERA" width={300} height={265} priority className="-mb-4 w-[235px] object-contain drop-shadow-2xl" />
          </div>
        </aside>

        <section className="mx-auto w-full max-w-[520px]">
          <div className="mb-6 lg:hidden"><BrandMark size="md" showTagline /></div>
          <div className="mb-7">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E8F5F3] px-3 py-1.5 text-xs font-bold text-[#1C6862]">
              <Icon className="h-3.5 w-3.5" /> MASUK SEBAGAI {config.label.toUpperCase()}
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-[#17324D] sm:text-[34px]">Selamat datang kembali</h2>
            <p className="mt-2 text-sm leading-6 text-[#607387]">{config.description}</p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-3xl border border-[#E1E8EE] bg-white p-5 shadow-[0_12px_36px_rgba(23,50,77,0.07)] sm:p-8">
            {error && <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-[#F2D2D0] bg-[#FFF3F2] p-4 text-sm leading-6 text-[#A33C37]"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />{error}</div>}
            <div>
              <Label htmlFor="identifier" className="mb-2 block text-[13px] font-semibold text-[#26384A]">{config.identifierLabel}</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#75879A]" />
                <Input id="identifier" type="text" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder={config.placeholder} autoComplete="username" required disabled={isLoading} className="h-12 rounded-xl border-[#D6E0E8] bg-white pl-11 pr-4 text-sm text-[#243447] placeholder:text-[#8795A3] focus-visible:border-[#299C96] focus-visible:ring-[#299C96]/20" />
              </div>
            </div>
            <div className="mt-5">
              <Label htmlFor="password" className="mb-2 block text-[13px] font-semibold text-[#26384A]">Password</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#75879A]" />
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan password" autoComplete="current-password" required disabled={isLoading} className="h-12 rounded-xl border-[#D6E0E8] bg-white pl-11 pr-11 text-sm text-[#243447] placeholder:text-[#8795A3] focus-visible:border-[#299C96] focus-visible:ring-[#299C96]/20" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-[#718096] hover:bg-[#F1F5F8] hover:text-[#17324D]" aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </div>
            <Button type="submit" disabled={isLoading} className="mt-7 h-12 w-full rounded-xl bg-[#17324D] text-sm font-bold text-white hover:bg-[#245B7A]">
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memeriksa akun...</> : <>Masuk ke dashboard <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
            <p className="mt-5 text-center text-sm text-[#68798A]">Belum memiliki akun?{' '}
              {role === 'wali_murid' ? <Link href="/daftar?role=wali_murid" className="font-bold text-[#1D716B] underline-offset-4 hover:underline">Daftar sebagai wali murid</Link> : <Link href={`/daftar?role=${role}`} className="font-bold text-[#1D716B] underline-offset-4 hover:underline">Informasi akses sekolah</Link>}
            </p>
          </form>
          <p className="mt-6 text-center text-xs leading-5 text-[#7C8A98]">Gunakan akun yang diterbitkan atau diverifikasi oleh sekolah.</p>
        </section>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="auth-page flex min-h-screen items-center justify-center text-sm text-[#526579]">Memuat halaman masuk...</div>}><LoginPageContent /></Suspense>;
}
