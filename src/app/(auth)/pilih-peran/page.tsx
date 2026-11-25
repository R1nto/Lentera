'use client';

import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, BookOpenCheck, Check, GraduationCap, Home, School, ShieldCheck, UserRound } from 'lucide-react';
import { BrandMark } from '@/components/brand/brand-mark';
import { Button } from '@/components/ui/button';

const roles = [
  {
    role: 'guru',
    title: 'Guru Kelas',
    description: 'Kelola tujuan pembelajaran, asesmen, refleksi, dan tindak lanjut kelas.',
    icon: UserRound,
    points: ['Kelola kelas dan data siswa', 'Analisis ketercapaian TP', 'Susun modul ajar berbantuan AI'],
    iconClass: 'bg-[#E8F5F3] text-[#217D77]',
  },
  {
    role: 'kepala_sekolah',
    title: 'Kepala Sekolah',
    description: 'Pantau aktivitas pembelajaran dan ringkasan perkembangan sekolah.',
    icon: School,
    points: ['Monitoring kelas dan guru', 'Lihat tren pembelajaran', 'Unduh laporan sekolah'],
    iconClass: 'bg-[#EEF2F8] text-[#315B81]',
  },
  {
    role: 'wali_murid',
    title: 'Wali Murid',
    description: 'Ikuti perkembangan belajar anak dan baca laporan yang dibagikan guru.',
    icon: Home,
    points: ['Lihat profil dan kelas anak', 'Pantau hasil yang dipublikasikan', 'Baca laporan dan arahan belajar'],
    iconClass: 'bg-[#FFF4DF] text-[#95651E]',
  },
];

function RoleSelectionContent() {
  const searchParams = useSearchParams();
  const isRegister = searchParams.get('register') === 'true';
  const selectedRole = searchParams.get('role');

  return (
    <div className="auth-page min-h-screen">
      <header className="auth-topbar">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="LENTERA beranda"><BrandMark size="sm" showTagline /></Link>
          <Link href="/" className="rounded-xl px-3 py-2 text-sm font-semibold text-[#526579] transition hover:bg-white hover:text-[#17324D]">Kembali ke beranda</Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D7E8E4] bg-white px-3.5 py-1.5 text-xs font-bold tracking-wide text-[#1D716B]">
            {isRegister ? <ShieldCheck className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />}
            {isRegister ? 'AKSES DAN PENDAFTARAN' : 'SELAMAT DATANG'}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#17324D] sm:text-4xl">{isRegister ? 'Pilih jenis akun' : 'Masuk ke ruang LENTERA'}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#607387] sm:text-base">
            {isRegister
              ? 'Pilih peran sesuai kebutuhan. Pendaftaran Wali Murid memerlukan kode undangan resmi, sedangkan akun Guru dan Kepala Sekolah diterbitkan oleh sekolah.'
              : 'Setiap pengguna memiliki ruang kerja dan informasi yang disesuaikan dengan tanggung jawabnya.'}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {roles.map((role) => {
            const Icon = role.icon;
            const href = isRegister ? `/daftar?role=${role.role}` : `/masuk?role=${role.role}`;
            const isSelected = selectedRole === role.role;
            const action = isRegister
              ? role.role === 'wali_murid' ? 'Daftar sebagai wali murid' : 'Informasi akses sekolah'
              : `Masuk sebagai ${role.title}`;

            return (
              <article key={role.role} className={`flex h-full flex-col rounded-[26px] border bg-white p-6 shadow-[0_8px_28px_rgba(23,50,77,0.05)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(23,50,77,0.10)] ${isSelected ? 'border-[#299C96] ring-2 ring-[#299C96]/15' : 'border-[#E1E8EE]'}`}>
                <div className="flex items-center justify-between">
                  <span className={`grid h-12 w-12 place-items-center rounded-2xl ${role.iconClass}`}><Icon className="h-6 w-6" /></span>
                  {isSelected && <span className="rounded-full bg-[#E8F5F3] px-2.5 py-1 text-[11px] font-bold text-[#1D716B]">Dipilih</span>}
                </div>
                <h2 className="mt-5 text-xl font-bold text-[#17324D]">{role.title}</h2>
                <p className="mt-2 min-h-[68px] text-sm leading-6 text-[#627487]">{role.description}</p>
                <div className="my-5 h-px bg-[#E9EEF2]" />
                <ul className="mb-7 flex-1 space-y-3">
                  {role.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm leading-5 text-[#405568]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#25847D]" />{point}
                    </li>
                  ))}
                </ul>
                <Link href={href} className="mt-auto block">
                  <Button className="h-11 w-full rounded-xl bg-[#17324D] text-sm font-semibold text-white hover:bg-[#245B7A]">
                    {action}<ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                {isRegister && role.role !== 'wali_murid' && <p className="mt-3 text-center text-xs leading-5 text-[#7A8997]">Akun dibuat oleh administrator sekolah.</p>}
              </article>
            );
          })}
        </div>

        <div className="mx-auto mt-10 flex max-w-3xl flex-col items-center gap-4 rounded-3xl border border-[#DCE8E6] bg-[#F2F8F7] px-5 py-5 text-center sm:flex-row sm:text-left">
          <Image src="/images/lentera-mascot.png" alt="Maskot LENTERA" width={108} height={96} className="h-24 w-28 shrink-0 object-contain" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-[#17324D]">Sahabat LENTERA siap menemani.</h3>
            <p className="mt-1 text-sm leading-6 text-[#607387]">Pilih peran dengan benar agar informasi pembelajaran hanya dapat dilihat oleh pihak yang berwenang.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1D716B]"><BookOpenCheck className="h-4 w-4" /> Aman dan terarah</div>
        </div>

        <p className="mt-9 text-center text-sm text-[#718096]">
          {isRegister ? 'Sudah memiliki akun?' : 'Belum memiliki akun?'}{' '}
          <Link href={isRegister ? '/pilih-peran' : '/pilih-peran?register=true'} className="font-bold text-[#1D716B] underline-offset-4 hover:underline">
            {isRegister ? 'Kembali ke pilihan masuk' : 'Lihat pilihan pendaftaran'}
          </Link>
        </p>
      </main>
    </div>
  );
}

export default function RoleSelectionPage() {
  return <Suspense fallback={<div className="auth-page flex min-h-screen items-center justify-center text-sm text-[#526579]">Memuat pilihan akun...</div>}><RoleSelectionContent /></Suspense>;
}
