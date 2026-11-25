import { BarChart3, Brain, BookOpen, UsersRound, ArrowUpRight, Check } from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    title: 'Analisis Ketercapaian',
    description: 'Lihat hasil belajar berdasarkan bukti asesmen dan indikator tujuan pembelajaran.',
    detail: 'Data lebih mudah dibaca',
    tone: 'bg-[#DDF3EC] text-[#26947F]',
    accent: 'text-[#238B79]',
  },
  {
    icon: Brain,
    title: 'Refleksi Berbantu AI',
    description: 'Dapatkan pertanyaan refleksi yang menyesuaikan materi, kelas, dan proses belajar.',
    detail: 'Refleksi lebih kontekstual',
    tone: 'bg-[#FCE8DF] text-[#D87969]',
    accent: 'text-[#C96F62]',
  },
  {
    icon: BookOpen,
    title: 'Generator Modul Ajar',
    description: 'Susun kerangka modul ajar yang dapat ditinjau dan disunting kembali oleh guru.',
    detail: 'Mudah disesuaikan',
    tone: 'bg-[#E4EFFA] text-[#5486B0]',
    accent: 'text-[#4C7DA6]',
  },
  {
    icon: UsersRound,
    title: 'Monitoring Perkembangan',
    description: 'Bagikan ringkasan pembelajaran kepada kepala sekolah dan wali murid sesuai akses.',
    detail: 'Informasi sesuai kewenangan',
    tone: 'bg-[#FFF0CC] text-[#C28D38]',
    accent: 'text-[#A8792D]',
  },
];

export function Features() {
  return (
    <section data-reveal id="fitur" className="bg-[#FFFDF7] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1260px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
          <div className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#4D9D8B]">Keunggulan LENTERA</div>
          <h2 className="text-3xl font-black tracking-[-0.04em] text-[#30383B] sm:text-4xl">Satu ruang, banyak kemudahan.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#758078] sm:text-base">
            Proses perencanaan, asesmen, refleksi, dan tindak lanjut tersusun dalam satu pengalaman yang saling terhubung.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <article key={feature.title} data-reveal className="group flex min-h-[265px] flex-col rounded-[27px] border border-[#EEEDE3] bg-white p-6 shadow-[0_7px_24px_rgba(60,75,58,0.045)] transition-all duration-300 hover:-translate-y-1 hover:border-[#CFE6DB] hover:shadow-[0_16px_34px_rgba(60,110,86,0.10)] sm:p-7">
              <div className={`mb-5 grid h-[62px] w-[62px] place-items-center rounded-full ${feature.tone} transition-transform duration-300 group-hover:scale-105`}>
                <feature.icon className="h-7 w-7" strokeWidth={1.8} />
              </div>
              <h3 className="text-lg font-extrabold leading-snug text-[#35413D]">{feature.title}</h3>
              <p className="mt-2 flex-1 text-[13px] leading-6 text-[#78827C]">{feature.description}</p>
              <div className={`mt-5 flex items-center gap-2 text-[11px] font-extrabold ${feature.accent}`}>
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[#EFF8F3]"><Check className="h-3 w-3" /></span>
                {feature.detail}
                <ArrowUpRight className="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
