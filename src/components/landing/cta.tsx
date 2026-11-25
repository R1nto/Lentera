import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export function CTA() {
  return (
    <section data-reveal className="bg-[#FFFDF7] px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
      <div className="relative mx-auto flex max-w-[1260px] flex-col items-center justify-between gap-7 overflow-hidden rounded-[32px] border border-[#D0E9DF] bg-gradient-to-r from-[#DDF4E9] via-[#EAF7EB] to-[#DDF3EF] px-6 py-8 sm:rounded-[40px] sm:px-10 lg:flex-row lg:px-14 lg:py-9">
        <div aria-hidden="true" className="absolute -right-14 -top-24 h-64 w-64 rounded-full border-[30px] border-white/25" />
        <div className="relative z-10 flex max-w-2xl items-center gap-4 sm:gap-6">
          <div className="hidden h-28 w-28 shrink-0 items-center justify-center rounded-full bg-white/60 sm:flex">
            <Image src="/images/lentera-mascot.png" alt="" width={120} height={120} className="h-28 w-28 object-contain" />
          </div>
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#4B9D87]"><Sparkles className="h-3.5 w-3.5" /> Mulai dari langkah sederhana</div>
            <h2 className="text-2xl font-black leading-tight tracking-[-0.04em] text-[#2F4B41] sm:text-3xl">Bersama, buat pembelajaran lebih bermakna.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#668176]">Masuk ke LENTERA dan lanjutkan proses belajar dengan data, refleksi, serta tindak lanjut yang lebih terarah.</p>
          </div>
        </div>
        <div className="relative z-10 flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
          <Link href="/pilih-peran?register=true" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#2DA58E] px-6 text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(45,165,142,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#208E7A]">
            Mulai Sekarang <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="#fitur" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#C8E2D7] bg-white/75 px-6 text-sm font-bold text-[#477568] transition-colors hover:bg-white">Lihat Fitur</Link>
        </div>
      </div>
    </section>
  );
}
