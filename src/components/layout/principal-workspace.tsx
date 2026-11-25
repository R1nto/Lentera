'use client';
import { SearchField } from '@/components/ui/search-field';

import * as React from 'react';
import Link from 'next/link';
import { IllustratedIcon } from '@/components/ui/illustrated-icon';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { HomeHero, HomeMetric, HomePanel, HomeQuickAction, HomeEmpty } from '@/components/dashboard/home-kit';
import { Activity, ArrowRight, BookOpen, CheckCircle2, ChevronRight, ClipboardList, Download, Plus, FileBarChart2, GraduationCap, LoaderCircle, RefreshCw, Search, School, ShieldAlert, Sparkles, TrendingUp, Users, X } from 'lucide-react';

type View = 'overview' | 'monitoring' | 'teachers' | 'analysis' | 'reports' | 'profile';
type Entry = { id: string; title: string; detail: string; second: string; tag: string; description?: string; meta?: Record<string, string> };
type Profile = { id: string; full_name: string; role: string; school_id: string; identifier: string; avatar_url?: string; email?: string };
type Data = { classes: any[]; students: any[]; teachers: any[]; sessions: any[]; analyses: any[]; reports: any[]; schoolName: string };
const views: Record<View, { title: string; eyebrow: string; subtitle: string }> = {
  overview: { title: 'Beranda Kepala Sekolah', eyebrow: 'RINGKASAN SEKOLAH', subtitle: 'Pantau aktivitas pembelajaran dan temukan informasi penting dalam satu tempat.' },
  monitoring: { title: 'Monitoring Kelas', eyebrow: 'PEMANTAUAN', subtitle: 'Lihat kelas, wali kelas, jumlah siswa, dan sesi pembelajaran.' },
  teachers: { title: 'Laporan Guru', eyebrow: 'AKTIVITAS PENDIDIK', subtitle: 'Pantau aktivitas guru berdasarkan data pembelajaran yang tersedia.' },
  analysis: { title: 'Analisis Sekolah', eyebrow: 'PERKEMBANGAN PEMBELAJARAN', subtitle: 'Lihat hasil analisis yang sudah dibuat oleh guru di sekolah.' },
  reports: { title: 'Laporan Sekolah', eyebrow: 'DOKUMEN SEKOLAH', subtitle: 'Telusuri laporan dan periode yang telah disimpan.' },
  profile: { title: 'Profil Kepala Sekolah', eyebrow: 'PENGATURAN AKUN', subtitle: 'Informasi akun dan identitas kepala sekolah.' },
};
const routes: { href: string; title: string; subtitle: string; Icon: typeof School }[] = [
  { href: '/kepala-sekolah/monitoring', title: 'Monitoring Kelas', subtitle: 'Kelas dan aktivitas siswa', Icon: School },
  { href: '/kepala-sekolah/laporan-guru', title: 'Laporan Guru', subtitle: 'Aktivitas tenaga pendidik', Icon: Users },
  { href: '/kepala-sekolah/analisis', title: 'Analisis Sekolah', subtitle: 'Hasil dan indikator belajar', Icon: TrendingUp },
  { href: '/kepala-sekolah/laporan', title: 'Laporan Sekolah', subtitle: 'Rekap dan dokumentasi', Icon: FileBarChart2 },
  { href: '/kepala-sekolah/undangan', title: 'Undangan Wali Murid', subtitle: 'Hubungkan keluarga dan siswa', Icon: GraduationCap },
];
const initialData: Data = { classes: [], students: [], teachers: [], sessions: [], analyses: [], reports: [], schoolName: '' };
function ensure<T>(result: { data: T | null; error: { message: string; code?: string } | null }, name: string): T {
  if (result.error) throw new Error(`Gagal memuat ${name}: ${result.error.message}`);
  return (result.data ?? []) as T;
}
function readable(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : 'Belum tersedia';
}
function dateLabel(value: unknown) {
  if (typeof value !== 'string' || !value) return 'Belum tersedia';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}
function csvDownload(rows: Entry[], title: string) {
  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = ['Nama,Keterangan,Informasi,Status', ...rows.map((r) => [r.title, r.detail, r.second, r.tag].map(escape).join(','))].join('\r\n');
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `lentera-${title}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function PrincipalWorkspace({ view }: { view: View }) {
  const router = useRouter();
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [data, setData] = React.useState<Data>(initialData);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [attempt, setAttempt] = React.useState(0);
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState('semua');
  const [selected, setSelected] = React.useState<Entry | null>(null);
  const [editingName, setEditingName] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState('');
  const [dataWarning, setDataWarning] = React.useState('');
  const [showAddClass, setShowAddClass] = React.useState(false);
  const [classSaving, setClassSaving] = React.useState(false);
  const [classError, setClassError] = React.useState('');
  const [classForm, setClassForm] = React.useState({ name: '', grade: '1', academic_year: '2026/2027', homeroom_teacher_id: '' });

  React.useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true); setError(''); setDataWarning('');
      const supabase = createClient();
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) { router.replace('/masuk?role=kepala_sekolah'); return; }
      const profileResult = await supabase.from('profiles').select('id, full_name, role, school_id, identifier, avatar_url').eq('id', auth.user.id).maybeSingle();
      if (profileResult.error) throw new Error(`Profil tidak dapat dibaca: ${profileResult.error.message}`);
      const p = profileResult.data;
      if (!p || p.role !== 'kepala_sekolah' || !p.school_id) throw new Error('Akun tidak mempunyai profil Kepala Sekolah yang terhubung dengan sekolah. Hubungi Admin LENTERA.');
      const schoolId = p.school_id;
      const [schoolRes, classRes, studentsRes, teachersRes] = await Promise.all([
        supabase.from('schools').select('name').eq('id', schoolId).maybeSingle(),
        supabase.from('classes').select('id,name,grade,homeroom_teacher_id,academic_year').eq('school_id', schoolId).order('name'),
        supabase.from('students').select('id,class_id').eq('school_id', schoolId).eq('is_active', true),
        supabase.from('profiles').select('id,full_name,identifier').eq('school_id', schoolId).eq('role', 'guru').order('full_name'),
      ]);
      const classes = ensure<any[]>(classRes, 'kelas');
      const students = ensure<any[]>(studentsRes, 'siswa');
      const teachers = teachersRes.error ? [] : (teachersRes.data || []);
      if (teachersRes.error && mounted) setDataWarning('Data guru tidak dapat dibaca. Periksa izin SELECT dan RLS tabel profiles.');
      if (schoolRes.error) throw new Error(`Gagal membaca sekolah: ${schoolRes.error.message}`);
      const classIds = classes.map((c) => c.id);
      const [sessionsRes, reportsRes] = await Promise.all([
        classIds.length ? supabase.from('learning_sessions').select('id,title,topic,date,class_id,teacher_id').in('class_id', classIds).order('date', { ascending: false }).limit(300) : Promise.resolve({ data: [], error: null }),
        supabase.from('school_reports').select('id,created_by,report_type,period_start,period_end,report_snapshot,created_at').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(100),
      ]);
      const sessions = sessionsRes.error ? [] : (sessionsRes.data || []);
      const reports = reportsRes.error ? [] : (reportsRes.data || []);
      if (mounted && sessionsRes.error) setDataWarning(`Sebagian data pembelajaran tidak dapat dibaca: ${sessionsRes.error.message}`);
      if (mounted && reportsRes.error && view === 'reports') setDataWarning(`Laporan sekolah belum dapat dibaca: ${reportsRes.error.message}`);
      const sessionIds = sessions.map((s) => s.id);
      const analysesRes = sessionIds.length
        ? await supabase.from('ai_analyses').select('id,learning_session_id,status,deterministic_metrics,created_at').in('learning_session_id', sessionIds).order('created_at', { ascending: false }).limit(200)
        : { data: [], error: null };
      const analyses = analysesRes.error ? [] : (analysesRes.data || []);
      if (mounted && analysesRes.error && view === 'analysis') setDataWarning(`Analisis belum dapat dibaca: ${analysesRes.error.message}`);
      if (mounted) {
        const userProfile: Profile = { ...p, email: auth.user.email || undefined };
        setProfile(userProfile); setEditingName(p.full_name);
        setData({ classes, students, teachers, sessions, analyses, reports, schoolName: schoolRes.data?.name || 'Sekolah' });
      }
    };
    run().catch((e) => { if (mounted) setError(e instanceof Error ? e.message : 'Data tidak dapat dimuat.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [router, attempt]);

  const className = (id: string) => data.classes.find((c) => c.id === id)?.name || 'Kelas tidak tersedia';
  const teacherName = (id: string) => data.teachers.find((t) => t.id === id)?.full_name || 'Belum ditugaskan';
  const sessionsForClass = (id: string) => data.sessions.filter((s) => s.class_id === id);
  const metricValue = (a: any): string => {
    const metrics = a.deterministic_metrics;
    const n = metrics?.achievement_percentage ?? metrics?.overall_achievement_percentage;
    return typeof n === 'number' && Number.isFinite(n) ? `${Math.round(n)}%` : 'Belum tersedia';
  };
  const records: Entry[] = view === 'monitoring'
    ? data.classes.map((c) => ({ id: c.id, title: c.name, detail: `Tingkat ${c.grade} · ${c.academic_year || ''}`, second: `${data.students.filter((s) => s.class_id === c.id).length} siswa · ${sessionsForClass(c.id).length} sesi`, tag: teacherName(c.homeroom_teacher_id), meta: { 'Nama kelas': c.name, 'Tingkat': c.grade, 'Wali kelas': teacherName(c.homeroom_teacher_id), 'Jumlah siswa': String(data.students.filter((s) => s.class_id === c.id).length), 'Sesi pembelajaran': String(sessionsForClass(c.id).length) } }))
    : view === 'teachers'
    ? data.teachers.map((t) => ({ id: t.id, title: t.full_name, detail: `ID Guru: ${readable(t.identifier)}`, second: `${data.sessions.filter((s) => s.teacher_id === t.id).length} sesi pembelajaran`, tag: `${data.classes.filter((c) => c.homeroom_teacher_id === t.id).length} kelas perwalian`, meta: { 'Nama Guru': t.full_name, 'ID Guru': readable(t.identifier), 'Sesi pembelajaran': String(data.sessions.filter((s) => s.teacher_id === t.id).length), 'Kelas perwalian': String(data.classes.filter((c) => c.homeroom_teacher_id === t.id).length) } }))
    : view === 'analysis'
    ? data.analyses.map((a) => { const s = data.sessions.find((x) => x.id === a.learning_session_id); return { id: a.id, title: s?.title || 'Analisis pembelajaran', detail: `${s ? className(s.class_id) : 'Kelas tidak tersedia'} · ${s ? teacherName(s.teacher_id) : 'Guru tidak tersedia'}`, second: `Dibuat ${dateLabel(a.created_at)}`, tag: a.status === 'completed' ? 'Selesai' : readable(a.status), meta: { 'Judul': s?.title || 'Analisis', 'Kelas': s ? className(s.class_id) : '-', 'Guru': s ? teacherName(s.teacher_id) : '-', 'Tanggal': dateLabel(a.created_at), 'Status': readable(a.status), 'Hasil numerik': metricValue(a) } }; })
    : view === 'reports'
    ? data.reports.map((r) => ({ id: r.id, title: `Laporan ${String(r.report_type || 'Sekolah').replaceAll('_', ' ')}`, detail: `${dateLabel(r.period_start)} – ${dateLabel(r.period_end)}`, second: `Dibuat ${dateLabel(r.created_at)}`, tag: 'Tersimpan', meta: { 'Jenis laporan': readable(r.report_type), 'Awal periode': dateLabel(r.period_start), 'Akhir periode': dateLabel(r.period_end), 'Dibuat': dateLabel(r.created_at), 'Isi tersedia': r.report_snapshot ? 'Ya (snapshot tersimpan)' : 'Tidak' } }))
    : [];
  const tags = Array.from(new Set(records.map((r) => r.tag))).sort();
  const results = records.filter((r) => {
    const q = search.toLocaleLowerCase('id-ID');
    return (filter === 'semua' || r.tag === filter) && `${r.title} ${r.detail} ${r.second} ${r.tag}`.toLocaleLowerCase('id-ID').includes(q);
  });
  const addClass = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setClassSaving(true);
    setClassError('');
    try {
      const response = await fetch('/api/kepala-sekolah/kelas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classForm),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menambahkan kelas.');
      setShowAddClass(false);
      setClassForm({ name: '', grade: '1', academic_year: classForm.academic_year, homeroom_teacher_id: '' });
      setAttempt((value) => value + 1);
    } catch (err) {
      setClassError(err instanceof Error ? err.message : 'Gagal menambahkan kelas.');
    } finally {
      setClassSaving(false);
    }
  };
  const handleLogout = async () => { await createClient().auth.signOut(); router.replace('/pilih-peran'); router.refresh(); };
  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); if (!profile || !editingName.trim()) return;
    setSaving(true); setNotice('');
    const { error: updateError } = await createClient().from('profiles').update({ full_name: editingName.trim() }).eq('id', profile.id);
    if (updateError) setNotice(`Profil belum tersimpan: ${updateError.message}`);
    else { setProfile((p) => p && { ...p, full_name: editingName.trim() }); setNotice('Nama berhasil diperbarui.'); }
    setSaving(false);
  };

  return (
    <DashboardLayout role="kepala_sekolah" user={profile || { full_name: 'Kepala Sekolah', role: 'kepala_sekolah' }} onLogout={handleLogout} breadcrumbs={[{ label: 'Beranda', href: '/kepala-sekolah' }, ...(view === 'overview' ? [] : [{ label: views[view].title }])]}>
      <div className="principal-workspace space-y-7">
        {view === 'overview' ? <HomeHero name={profile?.full_name?.split(' ')[0] || 'Kepala Sekolah'} eyebrow="RUANG KEPALA SEKOLAH" variant="kepala" description="Pantau kinerja pembelajaran, aktivitas guru, dan perkembangan kelas dalam satu ruang kerja yang terintegrasi." href="/kepala-sekolah/monitoring" action="Lihat monitoring kelas" /> : (        <div className="principal-hero relative overflow-hidden rounded-[28px] p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
          <div className="relative max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-[11px] font-bold tracking-[.12em] text-white"><Sparkles className="h-3.5 w-3.5" />{views[view].eyebrow}</div>
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">{views[view].title}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#E4F5EF]">{views[view].subtitle}</p>
            {profile && <p className="mt-4 text-xs font-medium text-white/85">{data.schoolName} · {profile.full_name}</p>}
          </div>
        </div>)}

        {error && <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-[#F5CCC9] bg-[#FFF2F1] p-5 text-sm text-[#852D29] sm:flex-row sm:items-center sm:justify-between"><span className="flex items-start gap-2"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />{error}</span><button type="button" onClick={() => setAttempt((n) => n + 1)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#8D332D] px-4 py-2 font-semibold text-white"><RefreshCw className="h-4 w-4" />Coba lagi</button></div>}
        {loading && <div role="status" className="flex min-h-52 items-center justify-center gap-3 rounded-2xl border border-[#DFEAE4] bg-white text-sm font-medium text-[#395C50]"><LoaderCircle className="h-5 w-5 animate-spin" />Memuat data sekolah...</div>}
        {dataWarning && !loading && !error && <div role="alert" className="rounded-2xl border border-[#F1D7A1] bg-[#FFF9E9] p-4 text-sm font-medium text-[#74531D]">{dataWarning}</div>}
        {!loading && !error && <>
          {view === 'overview' && <div className="lentera-home space-y-5">
            <div className="lentera-home-metrics">
              <HomeMetric label="Total guru" value={data.teachers.length} icon={Users} href="/kepala-sekolah/laporan-guru" color="mint" />
              <HomeMetric label="Siswa aktif" value={data.students.length} icon={GraduationCap} href="/kepala-sekolah/monitoring" color="blue" />
              <HomeMetric label="Kelas aktif" value={data.classes.length} icon={School} href="/kepala-sekolah/monitoring" color="lilac" />
              <HomeMetric label="Laporan sekolah" value={data.reports.length} icon={ClipboardList} href="/kepala-sekolah/laporan" color="cream" />
            </div>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
              <div className="space-y-5">
                <HomePanel title="Aktivitas pembelajaran terbaru" action="Monitoring" href="/kepala-sekolah/monitoring">
                  {data.sessions.length ? data.sessions.slice(0,6).map(s => <div className="lentera-home-row" key={s.id}><span className="lentera-home-row-icon"><BookOpen size={19}/></span><span className="min-w-0 flex-1"><span className="lentera-home-row-title block truncate">{s.title}</span><span className="lentera-home-row-description block">{className(s.class_id)} · {teacherName(s.teacher_id)}</span></span><span className="text-xs text-[#5e7689]">{dateLabel(s.date)}</span></div>) : <HomeEmpty>Belum ada sesi pembelajaran yang tercatat di sekolah.</HomeEmpty>}
                </HomePanel>
                <HomePanel title="Ringkasan sekolah">
                  <div className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-2xl bg-[#e5f8ed] p-4"><p className="text-xs font-medium text-[#496c60]">Sesi pembelajaran</p><strong className="mt-2 block text-2xl text-[#163d34]">{data.sessions.length}</strong></div><div className="rounded-2xl bg-[#e5f2ff] p-4"><p className="text-xs font-medium text-[#476b87]">Analisis tersedia</p><strong className="mt-2 block text-2xl text-[#173e68]">{data.analyses.length}</strong></div></div>
                </HomePanel>
              </div>
              <div className="space-y-5">
                <HomePanel title="Aksi cepat"><div className="grid gap-2"><HomeQuickAction title="Pantau kelas" icon={School} href="/kepala-sekolah/monitoring" color="mint"/><HomeQuickAction title="Laporan guru" icon={Users} href="/kepala-sekolah/laporan-guru" color="blue"/><HomeQuickAction title="Undangan Wali Murid" icon={GraduationCap} href="/kepala-sekolah/undangan" color="cream"/><HomeQuickAction title="Analisis sekolah" icon={TrendingUp} href="/kepala-sekolah/analisis" color="lilac"/></div></HomePanel>
                <HomePanel title="Sekolah aktif"><div className="flex items-center gap-3 rounded-2xl bg-[#effaf5] p-4"><School className="h-7 w-7 text-[#148477]"/><div><strong className="block text-sm text-[#183d35]">{data.schoolName}</strong><p className="mt-1 text-xs text-[#5b7a70]">Data hanya untuk sekolah yang terhubung dengan akun ini.</p></div></div></HomePanel>
              </div>
            </div>
          </div>}
          {view === 'profile' && profile && <form onSubmit={saveProfile} className="principal-card max-w-2xl space-y-5 p-6"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#E4F4ED] text-[#277F6D]"><IllustratedIcon icon={GraduationCap} label="Profil Kepala Sekolah" size="md" /></span><div><h2 className="font-bold text-[#244234]">Identitas akun</h2><p className="text-xs text-[#627B6D]">Hanya nama yang dapat diperbarui dari halaman ini.</p></div></div><label className="block text-sm font-semibold text-[#304D3E]">Nama lengkap<input required value={editingName} onChange={(e) => setEditingName(e.target.value)} className="principal-input mt-2 w-full" /></label><div className="grid gap-4 sm:grid-cols-2"><div><p className="text-xs font-semibold text-[#61796C]">Email akun</p><p className="mt-1 break-all text-sm font-medium text-[#2C4438]">{profile.email || '-'}</p></div><div><p className="text-xs font-semibold text-[#61796C]">ID akun</p><p className="mt-1 break-all text-sm font-medium text-[#2C4438]">{readable(profile.identifier)}</p></div><div><p className="text-xs font-semibold text-[#61796C]">Role</p><p className="mt-1 text-sm font-medium text-[#2C4438]">Kepala Sekolah</p></div><div><p className="text-xs font-semibold text-[#61796C]">Sekolah</p><p className="mt-1 text-sm font-medium text-[#2C4438]">{data.schoolName}</p></div></div>{notice && <p role="status" className="rounded-xl bg-[#EAF6EF] px-3 py-2 text-sm text-[#225C47]">{notice}</p>}<button disabled={saving} type="submit" className="principal-button">{saving ? 'Menyimpan...' : 'Simpan perubahan'}</button></form>}
          {view === 'monitoring' && <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D9EAE1] bg-white p-4"><div><h2 className="text-base font-bold text-[#244234]">Kelola kelas sekolah</h2><p className="mt-1 text-sm text-[#60766A]">Kepala Sekolah dapat menambah kelas dan memilih wali kelas.</p></div><button type="button" onClick={() => { setClassError(''); setShowAddClass(true); }} className="principal-button inline-flex items-center gap-2"><Plus className="h-4 w-4" />Tambah Kelas</button></div>}
          {view !== 'overview' && view !== 'profile' && <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="principal-card p-5"><p className="text-xs font-semibold text-[#667F70]">Total data</p><p className="mt-2 text-3xl font-extrabold text-[#254336]">{records.length}</p></div><div className="principal-card p-5"><p className="text-xs font-semibold text-[#667F70]">Hasil pencarian</p><p className="mt-2 text-3xl font-extrabold text-[#254336]">{results.length}</p></div><div className="principal-card col-span-2 p-5 sm:col-span-1"><p className="text-xs font-semibold text-[#667F70]">Informasi terkini</p><p className="mt-2 text-sm font-bold text-[#267963]">Data dari Supabase</p></div></div>
            <div className="principal-card overflow-hidden"><div className="flex flex-col gap-3 border-b border-[#E3EDE6] p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><SearchField value={search} onChange={setSearch} placeholder="Cari nama, kelas, atau keterangan..." label="Cari data sekolah" /></div><label><span className="sr-only">Filter status</span><select value={filter} onChange={(e) => setFilter(e.target.value)} className="principal-input w-full sm:w-48"><option value="semua">Semua kategori</option>{tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}</select></label><button type="button" onClick={() => csvDownload(results, view)} disabled={results.length === 0} className="principal-button inline-flex items-center justify-center gap-2"><Download className="h-4 w-4" />Export CSV</button></div>
              {results.length === 0 ? <div className="flex min-h-52 flex-col items-center justify-center px-5 py-10 text-center"><Search className="mb-3 h-8 w-8 text-[#9AABA0]" /><h2 className="text-sm font-bold text-[#294536]">{records.length === 0 ? 'Belum ada data' : 'Data tidak ditemukan'}</h2><p className="mt-1 max-w-sm text-xs leading-5 text-[#678073]">{records.length === 0 ? 'Data pada menu ini akan muncul setelah aktivitas sekolah tersimpan.' : 'Coba gunakan kata kunci atau kategori lain.'}</p>{records.length > 0 && <button type="button" onClick={() => { setSearch(''); setFilter('semua'); }} className="mt-4 text-sm font-bold text-[#187E69]">Hapus filter</button>}</div>
              : <div className="divide-y divide-[#E7EFEA]">{results.map((r) => <button type="button" key={r.id} onClick={() => setSelected(r)} className="group flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[#F5FAF6] focus-visible:bg-[#F0F8F3] focus-visible:outline-2 focus-visible:outline-[#258A78] sm:p-5"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#E8F5ED] text-[#287C66]">{view === 'monitoring' ? <School className="h-5 w-5" /> : view === 'teachers' ? <Users className="h-5 w-5" /> : view === 'analysis' ? <Activity className="h-5 w-5" /> : <ClipboardList className="h-5 w-5" />}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-[#263E34]">{r.title}</span><span className="mt-1 block text-xs leading-5 text-[#60766A]">{r.detail}</span><span className="mt-1 block text-xs text-[#71867A]">{r.second}</span></span><span className="hidden max-w-36 truncate rounded-full bg-[#EDF6F0] px-2.5 py-1 text-[11px] font-semibold text-[#346C55] sm:block">{r.tag}</span><ChevronRight className="h-5 w-5 shrink-0 text-[#87A092] transition-transform group-hover:translate-x-1" /></button>)}</div>}
            </div>
          </>}
        </>}
      </div>
      {showAddClass && <div className="fixed inset-0 z-[85] flex items-center justify-center bg-[#122A20]/55 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !classSaving) setShowAddClass(false); }}><div role="dialog" aria-modal="true" aria-labelledby="add-class-title" className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl"><div className="flex items-start justify-between gap-4 border-b border-[#E4EDE5] p-5"><div><p className="text-xs font-bold tracking-wide text-[#25826C]">KELOLA KELAS</p><h2 id="add-class-title" className="mt-1 text-lg font-bold text-[#253E32]">Tambah Kelas</h2></div><button type="button" onClick={() => setShowAddClass(false)} disabled={classSaving} aria-label="Tutup formulir" className="rounded-xl p-2 text-[#51695B] hover:bg-[#F0F6F2]"><X className="h-5 w-5" /></button></div>
        <form onSubmit={addClass} className="space-y-4 p-5">
          <label className="block text-sm font-semibold text-[#304D3E]">Nama kelas<input required maxLength={80} minLength={2} value={classForm.name} onChange={(e) => setClassForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Contoh: 4A" className="principal-input mt-2 w-full" /></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold text-[#304D3E]">Tingkat<select value={classForm.grade} onChange={(e) => setClassForm((prev) => ({ ...prev, grade: e.target.value }))} className="principal-input mt-2 w-full">{Array.from({ length: 6 }, (_, index) => <option key={index + 1} value={index + 1}>Kelas {index + 1}</option>)}</select></label><label className="block text-sm font-semibold text-[#304D3E]">Tahun ajaran<input required pattern="[0-9]{4}/[0-9]{4}" value={classForm.academic_year} onChange={(e) => setClassForm((prev) => ({ ...prev, academic_year: e.target.value }))} placeholder="2026/2027" className="principal-input mt-2 w-full" /></label></div>
          <label className="block text-sm font-semibold text-[#304D3E]">Wali kelas (opsional)<select value={classForm.homeroom_teacher_id} onChange={(e) => setClassForm((prev) => ({ ...prev, homeroom_teacher_id: e.target.value }))} className="principal-input mt-2 w-full"><option value="">Belum ditentukan</option>{data.teachers.map((teacher) => <option value={teacher.id} key={teacher.id}>{teacher.full_name}</option>)}</select></label>
          {classError && <p role="alert" className="rounded-xl bg-[#FFF2F1] p-3 text-sm text-[#852D29]">{classError}</p>}
          <div className="flex flex-wrap justify-end gap-2 border-t border-[#EDF2EF] pt-4"><button type="button" onClick={() => setShowAddClass(false)} disabled={classSaving} className="rounded-xl border border-[#D8E5DE] px-4 py-2 text-sm font-semibold text-[#294538]">Batal</button><button type="submit" disabled={classSaving} className="principal-button">{classSaving ? 'Menyimpan...' : 'Simpan kelas'}</button></div>
        </form></div></div>}
      {selected && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#122A20]/55 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><div role="dialog" aria-modal="true" aria-label={`Detail ${selected.title}`} className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl"><div className="flex items-start justify-between gap-4 border-b border-[#E4EDE5] p-5"><div><p className="text-xs font-bold tracking-wide text-[#25826C]">DETAIL INFORMASI</p><h2 className="mt-1 text-lg font-bold text-[#253E32]">{selected.title}</h2></div><button type="button" onClick={() => setSelected(null)} aria-label="Tutup detail" className="rounded-xl p-2 text-[#51695B] hover:bg-[#F0F6F2]"><X className="h-5 w-5" /></button></div><dl className="max-h-[65vh] space-y-3 overflow-y-auto p-5">{Object.entries(selected.meta || {}).map(([key, value]) => <div key={key} className="grid gap-1 border-b border-[#EDF2EF] pb-3 sm:grid-cols-[140px_1fr]"><dt className="text-xs font-semibold text-[#687D70]">{key}</dt><dd className="break-words text-sm font-semibold text-[#294538]">{value}</dd></div>)}</dl><div className="flex justify-end border-t border-[#EDF2EF] p-4"><button type="button" onClick={() => setSelected(null)} className="principal-button">Tutup</button></div></div></div>}
    </DashboardLayout>
  );
}
