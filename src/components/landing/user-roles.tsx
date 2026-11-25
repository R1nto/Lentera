import Link from 'next/link';
import { UserRound, School, House, ArrowUpRight, BookOpenCheck, ClipboardCheck, BarChart3, FileText, UsersRound, Bell } from 'lucide-react';

const roles = [
  {
    icon: UserRound,
    label: 'Untuk pengelola kelas',
    title: 'Guru Kelas',
    description: 'Kelola kelas, asesmen, refleksi, analisis, dan modul ajar dari satu ruang kerja.',
    features: [
      { icon: BookOpenCheck, label: 'Kelola CP, TP, dan indikator' },
      { icon: ClipboardCheck, label: 'Catat asesmen dan hasil belajar' },
      { icon: BarChart3, label: 'Analisis dan tindak lanjut' },
    ],
    tone: 'bg-[#E1F3E9] text-[#2E927C]',
    panel: 'bg-[#F2FAF5]',
    href: '/pilih-peran',
  },
  {
    icon: School,
    label: 'Untuk pimpinan sekolah',
    title: 'Kepala Sekolah',
    description: 'Pantau ringkasan perkembangan kelas dan laporan sesuai kewenangan sekolah.',
    features: [
      { icon: UsersRound, label: 'Monitoring kelas dan guru' },
      { icon: BarChart3, label: 'Ringkasan perkembangan' },
      { icon: FileText, label: 'Laporan sekolah' },
    ],
    tone: 'bg-[#E7EFFA] text-[#5A80AF]',
    panel: 'bg-[#F4F7FC]',
    href: '/pilih-peran',
  },
  {
    icon: House,
    label: 'Untuk pendamping belajar',
    title: 'Wali Murid',
    description: 'Ikuti perkembangan belajar anak melalui informasi yang telah dipublikasikan guru.',
    features: [
      { icon: UsersRound, label: 'Profil anak terverifikasi' },
      { icon: ClipboardCheck, label: 'Hasil asesmen terpublikasi' },
      { icon: Bell, label: 'Laporan perkembangan' },
    ],
    tone: 'bg-[#FFF0D7] text-[#B88335]',
    panel: 'bg-[#FFFAF0]',
    href: '/pilih-peran',
  },
];

export function UserRoles() {
  return (
    <section data-reveal id="pengguna" className="bg-[#FFFDF7] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1260px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
          <div className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#4D9D8B]">Ruang untuk setiap peran</div>
          <h2 className="text-3xl font-black tracking-[-0.04em] text-[#30383B] sm:text-4xl">Semua terhubung, sesuai kebutuhan.</h2>
          <p className="mt-4 text-sm leading-7 text-[#758078] sm:text-base">Setiap pengguna memiliki tampilan dan akses yang disesuaikan dengan tanggung jawabnya.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {roles.map((role) => (
            <article key={role.title} className="group overflow-hidden rounded-[28px] border border-[#ECEDE4] bg-white shadow-[0_8px_25px_rgba(58,75,60,0.045)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(60,110,86,0.10)]">
              <div className={`${role.panel} p-6 sm:p-7`}>
                <div className="mb-5 flex items-center justify-between">
                  <div className={`grid h-14 w-14 place-items-center rounded-[20px] ${role.tone}`}><role.icon className="h-7 w-7" /></div>
                  <span className="rounded-full bg-white/80 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#78877F]">{role.label}</span>
                </div>
                <h3 className="text-xl font-black text-[#35433D]">{role.title}</h3>
                <p className="mt-2 min-h-[54px] text-sm leading-6 text-[#79847D]">{role.description}</p>
              </div>
              <div className="p-6 sm:p-7">
                <div className="space-y-3">
                  {role.features.map((feature) => <div key={feature.label} className="flex items-center gap-3 text-xs font-semibold text-[#5E6E65]"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#F5F7F2] text-[#729589]"><feature.icon className="h-4 w-4" /></span>{feature.label}</div>)}
                </div>
                <Link href={role.href} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#DDEBE2] bg-white px-4 py-3 text-xs font-extrabold text-[#438675] transition-all hover:border-[#A9D5C3] hover:bg-[#F3FAF5]">
                  Masuk sebagai {role.title} <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
