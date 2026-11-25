'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'mint' | 'blue' | 'cream' | 'lilac' | 'coral';
type Motif = 'book' | 'school' | 'chart' | 'people' | 'clipboard' | 'report' | 'letter' | 'clock' | 'home' | 'gear' | 'spark';
const palettes: Record<Tone, { light: string; mid: string; dark: string; glow: string }> = {
  mint: { light: '#E6FFF3', mid: '#7DDEBB', dark: '#128C79', glow: '#FFE5A0' },
  blue: { light: '#E9F5FF', mid: '#89C9F5', dark: '#227EB9', glow: '#FFE5A0' },
  cream: { light: '#FFF8E6', mid: '#F2CA79', dark: '#B47A25', glow: '#B5E9D9' },
  lilac: { light: '#F4EDFF', mid: '#C9B4F4', dark: '#8054BC', glow: '#FFE5A0' },
  coral: { light: '#FFF0E8', mid: '#F6B6A2', dark: '#BF6654', glow: '#D2F6E7' },
};

export function illustrationTone(label: string): Tone {
  const x = label.toLowerCase();
  if (/analisis|grafik|monitoring|perkembangan|statistik|capaian|progres|performa|ai|api|sistem/.test(x)) return 'blue';
  if (/asesmen|tugas|refleksi|evaluasi|riwayat|laporan/.test(x)) return 'cream';
  if (/modul|buku|pembelajaran|materi|kurikulum|kelas/.test(x)) return 'lilac';
  if (/undangan|pesan|notifikasi|peringatan|komunikasi/.test(x)) return 'coral';
  return 'mint';
}
function motifFrom(label: string): Motif {
  const x = label.toLowerCase();
  if (/undangan|pesan|komunikasi|email/.test(x)) return 'letter';
  if (/modul|buku|materi|pembelajaran|kurikulum/.test(x)) return 'book';
  if (/sekolah|kelas/.test(x)) return 'school';
  if (/analisis|monitoring|perkembangan|statistik|capaian|progres|performa/.test(x)) return 'chart';
  if (/asesmen|tugas|refleksi|evaluasi/.test(x)) return 'clipboard';
  if (/laporan|dokumen|arsip/.test(x)) return 'report';
  if (/riwayat|jadwal|aktivitas/.test(x)) return 'clock';
  if (/siswa|guru|staf|wali|anak|akun|pengguna/.test(x)) return 'people';
  if (/profil|pengaturan|konfigurasi|api key|server/.test(x)) return 'gear';
  if (/beranda|home/.test(x)) return 'home';
  return 'spark';
}

/** Small, original SVG spot illustrations. Decorative only; the adjacent visible label stays accessible. */
function Scene({ motif, c }: { motif: Motif; c: (typeof palettes)[Tone] }) {
  const stroke = { stroke: c.dark, strokeWidth: 2.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const art: Record<Motif, ReactNode> = {
    book: <><path d="M10 12q11-5 19 2v23q-9-7-19-2z" fill="#fff" {...stroke}/><path d="M29 14q9-7 20-2v23q-11-4-20 2z" fill={c.mid} {...stroke}/><path d="M29 14v23M16 21h7M16 26h7M35 21h7" fill="none" {...stroke}/><path d="M39 7l4 7 5-7" fill={c.glow} stroke="none"/></>,
    school: <><path d="M8 24L29 9l21 15" fill="none" {...stroke}/><path d="M12 23h34v24H12z" fill="#fff" {...stroke}/><path d="M22 47V32h12v15" fill={c.mid} {...stroke}/><path d="M16 28h5v6h-5zM37 28h5v6h-5z" fill={c.light} {...stroke}/><path d="M29 9V5h12v7" fill="none" {...stroke}/></>,
    chart: <><rect x="9" y="11" width="41" height="37" rx="8" fill="#fff" {...stroke}/><rect x="16" y="31" width="7" height="11" rx="2" fill={c.mid}/><rect x="26" y="24" width="7" height="18" rx="2" fill={c.glow}/><rect x="36" y="18" width="7" height="24" rx="2" fill={c.mid}/><path d="M17 24l11-7 10 2 6-7" fill="none" {...stroke}/></>,
    people: <><circle cx="29" cy="19" r="9" fill="#fff" {...stroke}/><circle cx="13" cy="23" r="6" fill={c.mid} {...stroke}/><circle cx="45" cy="23" r="6" fill={c.mid} {...stroke}/><path d="M13 37q-8 0-8 10h13M45 37q8 0 8 10H40" fill={c.mid} {...stroke}/><path d="M14 48q1-16 15-16t15 16" fill="#fff" {...stroke}/></>,
    clipboard: <><rect x="13" y="10" width="33" height="39" rx="6" fill="#fff" {...stroke}/><rect x="23" y="6" width="13" height="9" rx="4" fill={c.mid} {...stroke}/><path d="M20 26l3 3 5-6M32 27h7M20 38l3 3 5-6M32 39h7" fill="none" {...stroke}/></>,
    report: <><path d="M15 7h21l9 10v31H15z" fill="#fff" {...stroke}/><path d="M36 7v10h9" fill={c.mid} {...stroke}/><path d="M22 27h15M22 32h7" fill="none" {...stroke}/><path d="M24 43v-6M31 43V34M38 43v-10" fill="none" {...stroke}/></>,
    letter: <><rect x="8" y="17" width="43" height="31" rx="6" fill="#fff" {...stroke}/><path d="M9 21l20 15 21-15" fill="none" {...stroke}/><path d="M10 45l14-12M49 45L35 33" fill="none" {...stroke}/><circle cx="42" cy="14" r="8" fill={c.mid} {...stroke}/><path d="M42 10v8m-4-4h8" {...stroke}/></>,
    clock: <><circle cx="29" cy="29" r="22" fill="#fff" {...stroke}/><circle cx="29" cy="29" r="16" fill={c.light} stroke={c.mid} strokeWidth="2"/><path d="M29 17v13l9 7" fill="none" {...stroke}/><path d="M29 6v5M29 47v5" {...stroke}/></>,
    home: <><path d="M7 26L29 8l22 18" fill="none" {...stroke}/><path d="M13 24v24h32V24" fill="#fff" {...stroke}/><path d="M23 48V32h12v16" fill={c.mid} {...stroke}/><rect x="36" y="28" width="5" height="6" rx="1" fill={c.glow}/></>,
    gear: <><rect x="10" y="12" width="39" height="35" rx="8" fill="#fff" {...stroke}/><path d="M19 23h21M19 35h21" {...stroke}/><circle cx="27" cy="23" r="5" fill={c.mid} {...stroke}/><circle cx="35" cy="35" r="5" fill={c.mid} {...stroke}/></>,
    spark: <><rect x="11" y="18" width="36" height="29" rx="8" fill="#fff" {...stroke}/><path d="M29 9l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill={c.glow} {...stroke}/><path d="M20 40h18" {...stroke}/></>,
  };
  return <>{art[motif]}</>;
}

export function IllustratedIcon({
  icon: _Icon, label, tone, size = 'md', className = '',
}: {
  icon: LucideIcon;
  label: string;
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const c = palettes[tone ?? illustrationTone(label)];
  const dims = { sm: 36, md: 48, lg: 60 }[size];
  return (
    <span className={cn('lentera-illustrated-icon', className)} aria-hidden="true" style={{
      position: 'relative', display: 'inline-grid', placeItems: 'center', flexShrink: 0,
      width: dims, height: dims, minWidth: dims,
    }}>
      <svg viewBox="0 0 60 60" width="100%" height="100%" focusable="false" aria-hidden="true">
        <rect x="6" y="9" width="48" height="48" rx="17" transform="rotate(-9 30 30)" fill={c.mid} opacity=".65"/>
        <rect x="6" y="5" width="48" height="48" rx="17" fill={c.light} stroke="#ffffff" strokeWidth="2"/>
        <g transform="translate(3 2) scale(.9)"><Scene motif={motifFrom(label)} c={c}/></g>
        <circle cx="50" cy="8" r="4" fill={c.glow}/>
        <path d="M50 15l3 3m-8-12l-3-2" stroke={c.dark} strokeWidth="1.5" opacity=".45" strokeLinecap="round"/>
      </svg>
    </span>
  );
}
