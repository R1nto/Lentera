import { BookOpenCheck, ClipboardCheck, ShieldCheck, Sparkles, UsersRound, Check } from 'lucide-react';

const principles = [
  'Tujuan pembelajaran dan indikator menjadi acuan evaluasi.',
  'Angka ketercapaian dihitung dari bukti asesmen yang valid.',
  'AI membantu interpretasi, guru tetap menentukan tindak lanjut.',
];

const process = [
  { title: 'Planning', desc: 'Susun CP, TP, indikator, dan sesi belajar.', icon: BookOpenCheck, tint: 'bg-[#E2F3E9] text-[#358B78]' },
  { title: 'Assessment', desc: 'Catat bukti belajar formatif dan sumatif.', icon: ClipboardCheck, tint: 'bg-[#FFF0D8] text-[#B88335]' },
  { title: 'Reflection', desc: 'Tinjau pengalaman pembelajaran bersama AI.', icon: Sparkles, tint: 'bg-[#FBE8E5] text-[#C9786D]' },
  { title: 'Analysis', desc: 'Baca ketercapaian dan pola hasil berdasarkan bukti.', icon: ClipboardCheck, tint: 'bg-[#E8EFFA] text-[#5C81B1]' },
  { title: 'Improvement', desc: 'Pilih tindak lanjut yang sesuai kebutuhan.', icon: UsersRound, tint: 'bg-[#E8EFFA] text-[#5C81B1]' },
];

export function About() {
  return (
    <section data-reveal id="tentang" className="bg-[#FFFDF7] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1260px] px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[34px] border border-[#D5ECE3] bg-gradient-to-br from-[#E2F5EB] via-[#E8F7F0] to-[#DDF1EE] p-6 sm:rounded-[42px] sm:p-9 lg:p-12">
          <div aria-hidden="true" className="absolute -right-20 -top-24 h-72 w-72 rounded-full border-[35px] border-white/30" />
          <div aria-hidden="true" className="absolute -bottom-20 left-[38%] h-60 w-60 rounded-full bg-white/25 blur-2xl" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
            <div>
              <div className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#438E7C]">Tentang LENTERA</div>
              <h2 className="text-3xl font-black leading-[1.12] tracking-[-0.045em] text-[#30463E] sm:text-4xl">Membantu guru melihat pembelajaran secara utuh.</h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-[#60776D] sm:text-base">
                LENTERA menghubungkan perencanaan, asesmen, refleksi, analisis, dan perbaikan pembelajaran. Semua informasi disusun agar guru lebih mudah membaca bukti dan merencanakan langkah berikutnya.
              </p>
              <div className="mt-6 space-y-3">
                {principles.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm font-semibold leading-6 text-[#48665B]">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-[#32977F]"><Check className="h-3.5 w-3.5" /></span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/65 px-3 py-2 text-[10px] font-bold text-[#4D7D6D]"><ShieldCheck className="h-3.5 w-3.5" /> Akses sesuai peran</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/65 px-3 py-2 text-[10px] font-bold text-[#4D7D6D]"><Sparkles className="h-3.5 w-3.5" /> AI sebagai pendamping</span>
              </div>
            </div>

            <div className="relative rounded-[28px] border border-white/85 bg-white/75 p-5 shadow-[0_16px_42px_rgba(53,105,82,0.08)] backdrop-blur-sm sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#78A293]">Alur terintegrasi</span>
                  <h3 className="mt-1 text-xl font-black text-[#334B42]">Lima proses LENTERA</h3>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#E4F4EB] text-[#32977F]"><BookOpenCheck className="h-6 w-6" /></div>
              </div>
              <div className="space-y-3">
                {process.map((item, index) => (
                  <div key={item.title} className="relative flex items-center gap-3 rounded-2xl border border-[#EEF1E8] bg-white/90 p-3.5 sm:gap-4 sm:p-4">
                    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${item.tint}`}><item.icon className="h-5 w-5" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><h4 className="text-sm font-extrabold text-[#3B5148]">{item.title}</h4><span className="rounded-full bg-[#F4F7F1] px-2 py-0.5 text-[9px] font-bold text-[#88958B]">0{index + 1}</span></div>
                      <p className="mt-0.5 text-xs leading-5 text-[#819087]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#E9F5ED] px-4 py-3 text-[11px] font-bold leading-5 text-[#4B8874]">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#51B493]" /> Data, refleksi, dan tindak lanjut tersimpan dalam satu alur.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
