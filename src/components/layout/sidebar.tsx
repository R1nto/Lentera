'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Activity, BarChart3, BookOpen, ClipboardList, FileBarChart, FileText,
  GraduationCap, History, Home, KeyRound, LayoutDashboard, Menu, School, Settings,
  TrendingUp, UserRound, Users, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/brand/brand-mark';
import { IllustratedIcon } from '@/components/ui/illustrated-icon';

interface SidebarProps {
  role: 'guru' | 'kepala_sekolah' | 'wali_murid';
}

const navigationItems = {
  guru: [
    { href: '/guru', label: 'Beranda', icon: LayoutDashboard },
    { href: '/guru/kelas', label: 'Kelas', icon: School },
    { href: '/guru/siswa', label: 'Data Siswa', icon: Users },
    { href: '/guru/analisis', label: 'Analisis Ketercapaian', icon: BarChart3 },
    { href: '/guru/asesmen', label: 'Asesmen', icon: ClipboardList },
    { href: '/guru/modul-ajar', label: 'Modul Ajar', icon: BookOpen },
    { href: '/guru/riwayat', label: 'Riwayat Pembelajaran', icon: History },
    { href: '/guru/laporan', label: 'Laporan Pembelajaran', icon: FileText },
    { href: '/guru/profil', label: 'Profil Saya', icon: Settings },
  ],
  kepala_sekolah: [
    { href: '/kepala-sekolah', label: 'Beranda', icon: LayoutDashboard },
    { href: '/kepala-sekolah/monitoring', label: 'Monitoring Kelas', icon: School },
    { href: '/kepala-sekolah/undangan', label: 'Undangan Wali Murid', icon: KeyRound },
    { href: '/kepala-sekolah/laporan-guru', label: 'Laporan Guru', icon: ClipboardList },
    { href: '/kepala-sekolah/analisis', label: 'Analisis Sekolah', icon: TrendingUp },
    { href: '/kepala-sekolah/laporan', label: 'Laporan Sekolah', icon: FileBarChart },
    { href: '/kepala-sekolah/profil', label: 'Profil Saya', icon: Settings },
  ],
  wali_murid: [
    { href: '/wali-murid', label: 'Beranda', icon: Home },
    { href: '/wali-murid/profil-anak', label: 'Profil Anak', icon: UserRound },
    { href: '/wali-murid/perkembangan', label: 'Perkembangan Belajar', icon: Activity },
    { href: '/wali-murid/asesmen', label: 'Hasil Asesmen', icon: ClipboardList },
    { href: '/wali-murid/laporan', label: 'Laporan Pembelajaran', icon: GraduationCap },
    { href: '/wali-murid/profil', label: 'Profil Saya', icon: Settings },
  ],
} as const;

const roleLabels = {
  guru: 'Ruang Guru',
  kepala_sekolah: 'Ruang Kepala Sekolah',
  wali_murid: 'Ruang Wali Murid',
};

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const items = navigationItems[role];
  const homePath = `/${role.replace('_', '-')}`;

  React.useEffect(() => setMobileOpen(false), [pathname]);

  const navContent = (
    <>
      <div className="border-b border-[#E7EDE5] px-5 py-5">
        <Link href={homePath} aria-label="LENTERA dashboard"><BrandMark size="md" showTagline /></Link>
        <p className="mt-4 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#87958B]">{roleLabels[role]}</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Navigasi utama">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== homePath && pathname.startsWith(`${item.href}/`));
          return (
            <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}
              className={cn(
                'lentera-nav-link group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors',
                active ? 'bg-[#DAF5F1] text-[#134F67]' : 'text-[#415C70] hover:bg-[#EAF5FF] hover:text-[#163E60]'
              )}>
              <IllustratedIcon icon={Icon} label={item.label} size="sm" />
              <span className="min-w-0 flex-1 leading-5">{item.label}</span>
              {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#4AAE90]" />}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 pb-3">
        <div className="flex items-center gap-3 rounded-2xl border border-[#DFECE0] bg-[#F1F8F0] p-3">
          <Image src="/images/lentera-mascot.png" alt="" width={58} height={58} className="h-12 w-12 shrink-0 object-contain" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#354A40]">Sahabat LENTERA</p>
            <p className="mt-0.5 text-[10px] leading-4 text-[#6D8175]">Terangi pembelajaran, tumbuhkan potensi.</p>
          </div>
        </div>
      </div>
      <div className="border-t border-[#E7EDE5] px-5 py-3 text-[10px] font-medium text-[#8A988E]">LENTERA · Platform Pembelajaran</div>
    </>
  );

  return (
    <>
      <button type="button" onClick={() => setMobileOpen(true)} aria-label="Buka navigasi"
        className="fixed left-3 top-3 z-40 grid h-10 w-10 place-items-center rounded-xl border border-[#DCE8DD] bg-[#FFFEFA] text-[#3F5C50] shadow-sm transition hover:bg-[#F1F7F0] lg:hidden">
        <Menu className="h-5 w-5" />
      </button>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-[#E5ECE2] bg-[#FFFEFA] lg:flex">
        {navContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" onClick={() => setMobileOpen(false)} aria-label="Tutup navigasi" className="absolute inset-0 bg-[#102235]/45 backdrop-blur-[2px]" />
          <aside className="relative flex h-full w-[min(86vw,300px)] flex-col bg-white shadow-2xl">
            <button type="button" onClick={() => setMobileOpen(false)} aria-label="Tutup menu" className="absolute right-3 top-4 z-10 grid h-9 w-9 place-items-center rounded-lg text-[#6D8175] hover:bg-[#F1F7F0]"><X className="h-5 w-5" /></button>
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
