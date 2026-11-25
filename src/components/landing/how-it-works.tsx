import { MessageSquare, BarChart3, NotebookPen, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

export function HowItWorks() {
  return (
    <section data-reveal id="cara-kerja" className="bg-[#F5FBF6] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1260px] px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#4D9D8B]">Alur kerja terintegrasi</div>
            <h2 className="text-3xl font-black tracking-[-0.04em] text-[#30383B] sm:text-4xl">Dari data belajar menjadi langkah nyata.</h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-[#758078] sm:text-right sm:text-base">
            Tidak perlu berpindah-pindah catatan. LENTERA menjaga setiap tahap tetap terhubung dan mudah ditinjau.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          <article className="relative overflow-hidden rounded-[30px] border border-[#DCECE2] bg-[#DFF3E8] p-6 sm:p-8 lg:col-span-7 lg:min-h-[360px]">
            <div className="relative z-10 max-w-[390px]">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#438A78]"><Sparkles className="h-3.5 w-3.5" /> Ruang kerja guru</span>
              <h3 className="mt-5 text-2xl font-black leading-tight tracking-[-0.035em] text-[#2F4940] sm:text-3xl">Semua bukti pembelajaran tersusun rapi.</h3>
              <p className="mt-3 text-sm leading-7 text-[#60786D]">Mulai dari tujuan pembelajaran, indikator, hingga catatan asesmen. Guru dapat melihat konteksnya sebelum menentukan tindak lanjut.</p>
            </div>
            <div className="relative mt-7 grid grid-cols-2 gap-3 sm:absolute sm:bottom-7 sm:right-7 sm:mt-0 sm:w-[42%]">
              <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
                <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-[#779187]">TUJUAN BELAJAR</span><span className="h-2 w-2 rounded-full bg-[#59B69A]" /></div>
                <div className="mt-4 h-2 w-4/5 rounded-full bg-[#DDEBE2]" />
                <div className="mt-2 h-2 w-3/5 rounded-full bg-[#EAF0E7]" />
                <div className="mt-4 inline-flex rounded-full bg-[#E9F6EE] px-2.5 py-1 text-[9px] font-bold text-[#418A75]">CP · TP · Indikator</div>
              </div>
              <div className="mt-6 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm sm:mt-9">
                <div className="text-[10px] font-bold text-[#779187]">BUKTI ASESMEN</div>
                <div className="mt-4 space-y-2.5">
                  {[0, 1, 2].map((item) => <div key={item} className="flex items-center gap-2"><span className="h-6 w-6 rounded-lg bg-[#F3F0DF]" /><span className="h-2 flex-1 rounded-full bg-[#E7EEE5]" /><span className="h-2 w-5 rounded-full bg-[#B8DCCB]" /></div>)}
                </div>
                <div className="mt-3 text-[9px] font-semibold text-[#779187]">Data per peserta didik</div>
              </div>
              <div className="col-span-2 flex items-center gap-2 rounded-2xl border border-white/80 bg-white/85 px-3 py-2.5 text-[10px] font-bold text-[#4E786A] shadow-sm">
                <CheckCircle2 className="h-4 w-4 text-[#48A88D]" /> Data ditinjau sebelum dianalisis
              </div>
            </div>
            <div aria-hidden="true" className="absolute -bottom-20 -left-14 h-56 w-56 rounded-full border-[28px] border-white/25" />
          </article>

          <article className="overflow-hidden rounded-[30px] border border-[#F0E6D5] bg-[#FFF1D9] p-6 sm:p-8 lg:col-span-5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/80 text-[#BB873D]"><MessageSquare className="h-6 w-6" /></div>
            <h3 className="mt-5 text-xl font-black text-[#554638]">Refleksi yang sesuai konteks.</h3>
            <p className="mt-2 text-sm leading-7 text-[#83715B]">Pertanyaan refleksi dibuat dengan mempertimbangkan CP, TP, materi, metode, dan ringkasan hasil asesmen yang tersedia.</p>
            <div className="mt-6 rounded-2xl border border-white/90 bg-white/85 p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#FFF0D8] text-[#B88335]"><Sparkles className="h-3.5 w-3.5" /></span><span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A38355]">Contoh pertanyaan</span></div>
              <p className="text-sm font-bold leading-6 text-[#594B3D]">Bagian mana dari kegiatan hari ini yang paling membantu peserta didik memahami materi?</p>
              <div className="mt-3 h-2 w-full rounded-full bg-[#F3E9D7]" />
              <div className="mt-2 h-2 w-4/5 rounded-full bg-[#F3E9D7]" />
            </div>
          </article>

          <article className="overflow-hidden rounded-[30px] border border-[#DCE7F1] bg-[#EAF2FA] p-6 sm:p-8 lg:col-span-5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/85 text-[#5D84B1]"><BarChart3 className="h-6 w-6" /></div>
            <h3 className="mt-5 text-xl font-black text-[#394D63]">Hasil analisis mudah dipahami.</h3>
            <p className="mt-2 text-sm leading-7 text-[#687D92]">Sistem menghitung berdasarkan bukti yang valid. AI membantu menjelaskan pola, keterbatasan data, dan opsi perbaikan.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/90 p-4">
                <span className="text-[10px] font-bold text-[#7890A5]">INDIKATOR</span>
                <div className="mt-3 h-2 rounded-full bg-[#E5EDF5]"><div className="h-2 w-2/3 rounded-full bg-[#89B8D3]" /></div>
                <span className="mt-2 block text-[10px] font-semibold text-[#5E7890]">Bukti tersedia</span>
              </div>
              <div className="rounded-2xl bg-white/90 p-4">
                <span className="text-[10px] font-bold text-[#7890A5]">TINDAK LANJUT</span>
                <div className="mt-3 flex gap-1.5"><span className="h-7 flex-1 rounded-lg bg-[#DDEFE7]" /><span className="h-7 flex-1 rounded-lg bg-[#F7E9CF]" /><span className="h-7 flex-1 rounded-lg bg-[#F7DFDB]" /></div>
                <span className="mt-2 block text-[10px] font-semibold text-[#5E7890]">Pilihan strategi</span>
              </div>
            </div>
          </article>

          <article className="overflow-hidden rounded-[30px] border border-[#F0DEDE] bg-[#FBECE9] p-6 sm:p-8 lg:col-span-7">
            <div className="flex h-full flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div className="max-w-[340px]">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/85 text-[#C9786D]"><NotebookPen className="h-6 w-6" /></div>
                <h3 className="mt-5 text-xl font-black text-[#5B4543]">Rencana berikutnya lebih terarah.</h3>
                <p className="mt-2 text-sm leading-7 text-[#866B67]">Rekomendasi dapat ditinjau, disunting, dan dipilih guru sebelum diterapkan di kelas.</p>
              </div>
              <div className="w-full max-w-[270px] rounded-2xl border border-white/90 bg-white/90 p-4 shadow-sm">
                <div className="flex items-center justify-between"><span className="text-[10px] font-extrabold uppercase tracking-wider text-[#B28C84]">Rencana tindak lanjut</span><span className="rounded-full bg-[#E7F5ED] px-2 py-1 text-[9px] font-bold text-[#438A75]">Draft</span></div>
                {['Penguatan materi', 'Kegiatan pengayaan', 'Asesmen lanjutan'].map((item, index) => <div key={item} className="mt-3 flex items-center gap-2.5"><span className={`grid h-6 w-6 place-items-center rounded-lg ${index === 0 ? 'bg-[#E4F4EB] text-[#278F7B]' : index === 1 ? 'bg-[#FFF0D8] text-[#B88335]' : 'bg-[#E9F0FB] text-[#5C81B1]'}`}><CheckCircle2 className="h-3.5 w-3.5" /></span><span className="text-xs font-semibold text-[#5D625E]">{item}</span></div>)}
              </div>
            </div>
          </article>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 rounded-full border border-[#E6EADF] bg-white/75 px-4 py-3 text-[10px] font-extrabold text-[#748078] sm:gap-4 sm:text-xs">
          {['Perencanaan', 'Asesmen', 'Refleksi', 'Analisis', 'Perbaikan'].map((step, index) => <div key={step} className="flex items-center gap-2"><span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] ${index === 4 ? 'bg-[#FCE8E5] text-[#C9786D]' : 'bg-[#E5F4EC] text-[#398D79]'}`}>{index + 1}</span><span>{step}</span>{index < 4 && <ArrowRight className="ml-1 h-3 w-3 text-[#B5C5BA]" />}</div>)}
        </div>
      </div>
    </section>
  );
}
