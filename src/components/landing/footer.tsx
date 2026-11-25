import Link from 'next/link';
import { ArrowUpRight, BookOpenCheck, ShieldCheck, Sparkles } from 'lucide-react';
import { BrandMark } from '@/components/brand/brand-mark';

const groups = [
  {
    title: 'Jelajahi',
    links: [
      { label: 'Tentang LENTERA', href: '#tentang' },
      { label: 'Keunggulan', href: '#fitur' },
      { label: 'Alur Kerja', href: '#cara-kerja' },
    ],
  },
  {
    title: 'Ruang Pengguna',
    links: [
      { label: 'Guru Kelas', href: '/pilih-peran' },
      { label: 'Kepala Sekolah', href: '/pilih-peran' },
      { label: 'Wali Murid', href: '/pilih-peran' },
    ],
  },
  {
    title: 'Akses',
    links: [
      { label: 'Masuk', href: '/pilih-peran' },
      { label: 'Daftar', href: '/pilih-peran?register=true' },
      { label: 'Kembali ke atas', href: '#beranda' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-[#319F8B] via-[#36B59E] to-[#53C5AA] text-white">
      <div aria-hidden="true" className="absolute -left-24 -top-28 h-80 w-80 rounded-full border-[35px] border-white/10" />
      <div aria-hidden="true" className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-[#B8EBD8]/15 blur-2xl" />
      <div className="relative mx-auto max-w-[1260px] px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_2fr] lg:gap-16">
          <div className="max-w-sm">
            <Link href="/" aria-label="LENTERA — Beranda" className="inline-flex rounded-2xl bg-white/95 p-2.5">
              <BrandMark size="md" />
            </Link>
            <p className="mt-5 text-sm leading-7 text-white/85">Platform evaluasi, refleksi, dan pengembangan pembelajaran. Terangi pembelajaran, tumbuhkan potensi.</p>
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-white/90"><ShieldCheck className="h-4 w-4 text-[#D7F5E8]" /> Akses data sesuai kewenangan</div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-white/90"><BookOpenCheck className="h-4 w-4 text-[#D7F5E8]" /> Terhubung dengan CP, TP, dan indikator</div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-white/90"><Sparkles className="h-4 w-4 text-[#D7F5E8]" /> AI mendukung keputusan guru</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {groups.map((group) => (
              <div key={group.title}>
                <h3 className="mb-4 text-sm font-extrabold text-white">{group.title}</h3>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}><Link href={link.href} className="group inline-flex items-center gap-1 text-xs font-medium text-white/80 transition-colors hover:text-white">{link.label}<ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" /></Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-white/20 pt-6 text-[11px] font-medium text-white/75 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} LENTERA. Terangi Pembelajaran, Tumbuhkan Potensi.</p>
          <p>Platform pendukung pembelajaran — keputusan pedagogis tetap pada guru.</p>
        </div>
      </div>
    </footer>
  );
}
