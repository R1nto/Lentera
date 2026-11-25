'use client';

import * as React from 'react';
import Link from 'next/link';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { BrandMark } from '@/components/brand/brand-mark';

const navItems = [
  { href: '#tentang', label: 'Tentang' },
  { href: '#fitur', label: 'Keunggulan' },
  { href: '#cara-kerja', label: 'Alur Kerja' },
  { href: '#pengguna', label: 'Pengguna' },
];

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <nav
        aria-label="Navigasi utama"
        className={`relative mx-auto flex max-w-[1260px] items-center justify-between rounded-full border px-4 py-2.5 transition-all duration-300 sm:px-6 ${
          scrolled
            ? 'border-[#D6ECE5] bg-white/95 shadow-[0_10px_35px_rgba(39,83,73,0.12)] backdrop-blur-xl'
            : 'border-white/80 bg-[#EAF8F3]/90 shadow-[0_8px_30px_rgba(39,83,73,0.07)] backdrop-blur-xl'
        }`}
      >
        <Link href="/" onClick={closeMenu} aria-label="LENTERA — Beranda" className="shrink-0">
          <BrandMark size="sm" showTagline />
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-[13px] font-semibold text-[#53635F] transition-colors hover:text-[#168A7B]">
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/pilih-peran" className="rounded-full px-4 py-2.5 text-[13px] font-bold text-[#46615B] transition-colors hover:bg-white/80 hover:text-[#167F72]">
            Masuk
          </Link>
          <Link href="/pilih-peran?register=true" className="inline-flex items-center gap-2 rounded-full bg-[#F17C78] px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_5px_14px_rgba(241,124,120,0.23)] transition-all hover:-translate-y-0.5 hover:bg-[#E96D69]">
            Mulai Sekarang <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={mobileMenuOpen}
          className="grid h-10 w-10 place-items-center rounded-full bg-white/80 text-[#31554D] transition-colors hover:bg-white lg:hidden"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {mobileMenuOpen && (
          <div className="absolute left-0 right-0 top-[calc(100%+10px)] rounded-[26px] border border-[#DDEDE7] bg-[#FFFEFA] p-3 shadow-[0_18px_45px_rgba(39,83,73,0.16)] lg:hidden">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={closeMenu} className="rounded-2xl px-4 py-3 text-sm font-semibold text-[#405B54] transition-colors hover:bg-[#EAF7F2] hover:text-[#168A7B]">
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#E7EEE9] pt-3">
                <Link href="/pilih-peran" onClick={closeMenu} className="rounded-full border border-[#D7E8E1] bg-white px-4 py-3 text-center text-sm font-bold text-[#36564D]">Masuk</Link>
                <Link href="/pilih-peran?register=true" onClick={closeMenu} className="rounded-full bg-[#F17C78] px-4 py-3 text-center text-sm font-bold text-white">Daftar</Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
