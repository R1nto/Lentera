import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpenCheck, ClipboardCheck, Sparkles, BarChart3, ShieldCheck } from 'lucide-react';

const proofPoints = [
  { icon: ClipboardCheck, label: 'Asesmen terhubung' },
  { icon: Sparkles, label: 'Refleksi kontekstual' },
  { icon: BarChart3, label: 'Analisis berbasis bukti' },
];

export function Hero() {
  return (
    <section id="beranda" className="relative isolate overflow-hidden bg-[#FFF9EE] pb-16 pt-28 sm:pt-32 lg:pb-24 lg:pt-36">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-16 h-64 w-64 rounded-full bg-[#CDEFE4]/70 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-36 h-72 w-72 rounded-full bg-[#DCEFFA]/75 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#F7FCF6] to-transparent" />

      <div className="relative mx-auto grid max-w-[1260px] items-center gap-9 px-4 sm:px-6 lg:grid-cols-[1fr_0.96fr] lg:gap-12 lg:px-8">
        <div className="relative order-2 mx-auto w-full max-w-[590px] lg:order-1">
          <div className="hero-scene relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-[34px] border border-white/90 bg-gradient-to-br from-[#DDF4EA] via-[#EEF8E8] to-[#E1F1F8] px-5 pb-8 pt-4 shadow-[0_24px_55px_rgba(43,98,82,0.10)] sm:min-h-[465px] sm:rounded-[42px]">
            <div aria-hidden="true" className="absolute -left-10 top-10 h-36 w-36 rounded-full border-[18px] border-white/35" />
            <div aria-hidden="true" className="absolute -bottom-12 right-8 h-44 w-44 rounded-full bg-[#F8D99B]/35 blur-xl" />
            <div aria-hidden="true" className="absolute right-10 top-12 h-5 w-5 rotate-12 rounded-md bg-[#F6A49A]/80" />
            <Image
              src="/images/lentera-mascot.png"
              alt="Maskot LENTERA, lentera kecil yang membawa buku"
              width={900}
              height={794}
              priority
              className="mascot-float relative z-10 h-auto w-[78%] max-w-[410px] drop-shadow-[0_18px_22px_rgba(30,66,59,0.16)] sm:w-[74%]"
              sizes="(max-width: 768px) 78vw, 410px"
            />

            <div className="absolute bottom-5 left-4 z-20 rounded-2xl border border-white/90 bg-white/95 px-3.5 py-3 shadow-[0_10px_28px_rgba(42,79,67,0.13)] sm:bottom-7 sm:left-7 sm:px-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#E4F5EE] text-[#218C7B]"><BookOpenCheck className="h-4.5 w-4.5" /></span>
                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.13em] text-[#6A8D82]">Satu ruang</span>
                  <span className="mt-0.5 block text-xs font-extrabold text-[#2B4540] sm:text-sm">Semua proses belajar</span>
                </span>
              </div>
            </div>

            <div className="absolute right-3 top-5 z-20 hidden rounded-2xl border border-white/90 bg-white/95 p-3 shadow-[0_10px_25px_rgba(42,79,67,0.12)] sm:block sm:right-6 sm:top-8">
              <div className="flex items-center gap-2 text-[11px] font-bold text-[#31554D]">
                <span className="h-2 w-2 rounded-full bg-[#55B99F]" /> Data pembelajaran
              </div>
              <div className="mt-2 flex gap-1.5">
                <span className="rounded-full bg-[#E5F5ED] px-2 py-1 text-[9px] font-bold text-[#328575]">CP</span>
                <span className="rounded-full bg-[#FFF1D8] px-2 py-1 text-[9px] font-bold text-[#A57930]">TP</span>
                <span className="rounded-full bg-[#FCE8E5] px-2 py-1 text-[9px] font-bold text-[#C76E69]">Asesmen</span>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {proofPoints.map((item, index) => (
              <div key={item.label} className="flex min-h-[68px] items-center gap-2 rounded-2xl border border-[#E7E9D8] bg-white/90 px-2.5 py-3 shadow-[0_5px_18px_rgba(67,83,57,0.04)] sm:gap-2.5 sm:px-3.5">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${index === 0 ? 'bg-[#E0F4EC] text-[#278D7B]' : index === 1 ? 'bg-[#FFF0D9] text-[#C38B3A]' : 'bg-[#E8F1FB] text-[#527CA8]'}`}><item.icon className="h-4 w-4" /></span>
                <span className="text-[9px] font-bold leading-4 text-[#52645E] sm:text-[11px]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div data-reveal className="order-1 mx-auto max-w-[570px] text-center lg:order-2 lg:mx-0 lg:text-left">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#CDE9DF] bg-white/75 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#398B7B] shadow-sm sm:text-[11px]">
            <span className="h-2 w-2 rounded-full bg-[#55B99F]" /> Platform Evaluasi & Refleksi Pembelajaran
          </div>
          <h1 className="text-balance text-[2.55rem] font-black leading-[1.08] tracking-[-0.055em] text-[#30383B] sm:text-5xl lg:text-[3.7rem]">
            Terangi proses belajar,
            <span className="block text-[#2BAA92]">tumbuhkan potensi.</span>
            <span className="block text-[#F08079]">Bersama LENTERA.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-[510px] text-sm leading-7 text-[#64716B] sm:text-base sm:leading-8 lg:mx-0">
            Hubungkan tujuan pembelajaran, bukti asesmen, dan refleksi guru dalam satu alur. LENTERA membantu guru memahami perkembangan belajar dan merencanakan tindak lanjut dengan lebih terarah.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
            <Link href="/pilih-peran" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#F17D78] px-7 text-sm font-extrabold text-white shadow-[0_9px_20px_rgba(241,125,120,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[#E96D68] sm:w-auto">
              Masuk ke LENTERA <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="#fitur" className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#D7E6DD] bg-white/80 px-7 text-sm font-bold text-[#42665C] transition-colors hover:border-[#9BCDBD] hover:bg-white sm:w-auto">
              Jelajahi Fitur
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-semibold text-[#73817A] lg:justify-start">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-[#3EAA91]" /> Guru tetap mengambil keputusan</span>
            <span className="inline-flex items-center gap-1.5"><BookOpenCheck className="h-4 w-4 text-[#3EAA91]" /> Berbasis CP, TP, dan indikator</span>
          </div>
        </div>
      </div>
    </section>
  );
}
