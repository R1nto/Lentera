'use client';
import { IllustratedIcon } from '@/components/ui/illustrated-icon';
import { SearchField } from '@/components/ui/search-field';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Download, ClipboardList, FileText, Eye, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { downloadCsv } from '@/lib/export-csv';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';

interface AsesmenPageData {
  assessments: {
    id: string;
    title: string;
    type: string;
    date: string;
    max_score: number;
    subject_name: string;
    class_name: string;
    learning_session_title?: string;
    module_title?: string;
    status: string;
    result_count: number;
  }[];
  user: {
    full_name: string;
    role: string;
    avatar_url?: string;
    email?: string;
  };
}

export default function GuruAsesmenPage() {
  const [pageData, setPageData] = React.useState<any>(null);
  const [loadError, setLoadError] = React.useState<string | false>(false);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {

  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) { window.location.assign('/pilih-peran'); return; }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, avatar_url')
    .eq('id', user.id)
    .single();

  const { data: assessments, error: assessmentsError } = await supabase
    .from('assessment_activities')
    .select(`
      id, title, type, date, max_score, is_published, module_id,
      subjects!inner(name),
      classes!inner(name),
      learning_sessions(title)
    `)
    .eq('teacher_id', user.id)
    .order('date', { ascending: false })
    .returns<Array<{
      id: string;
      title: string;
      type: string;
      date: string;
      max_score: number;
      is_published: boolean;
      module_id: string | null;
      subjects: { name: string };
      classes: { name: string };
      learning_sessions: { title: string } | null;
    }>>();

  if (assessmentsError) throw new Error(`Gagal memuat asesmen: ${assessmentsError.message}`);

  const moduleIds = [...new Set((assessments || []).map(item => item.module_id).filter((id): id is string => Boolean(id)))];
  const { data: linkedModules } = moduleIds.length
    ? await supabase.from('teaching_modules').select('id,title').in('id', moduleIds).eq('teacher_id', user.id)
    : { data: [] as { id: string; title: string }[] };
  const moduleTitles = new Map((linkedModules || []).map(module => [module.id, module.title]));
  const assessmentIds = assessments?.map(a => a.id) || [];
  const { data: results } = await supabase
    .from('assessment_results')
    .select('assessment_activity_id')
    .in('assessment_activity_id', assessmentIds);

  const resultCountMap = new Map<string, number>();
  results?.forEach(r => {
    const count = resultCountMap.get(r.assessment_activity_id) || 0;
    resultCountMap.set(r.assessment_activity_id, count + 1);
  });

  const pageData: AsesmenPageData = {
    assessments: assessments?.map(a => ({
      id: a.id,
      title: a.title,
      type: a.type,
      date: a.date,
      max_score: a.max_score,
      subject_name: a.subjects.name,
      class_name: a.classes.name,
      learning_session_title: a.learning_sessions?.title,
      module_title: a.module_id ? moduleTitles.get(a.module_id) || undefined : undefined,
      status: a.is_published ? 'published' : 'draft',
      result_count: resultCountMap.get(a.id) || 0,
    })) || [],
    user: {
      full_name: profile?.full_name || 'Guru',
      role: profile?.role || 'guru',
      avatar_url: profile?.avatar_url,
      email: user.email || undefined,
    },
  };

  if (!cancelled) setPageData(pageData);

    };

    load().catch((error) => {
      console.error('LENTERA page load failed:', error);
      if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Data tidak dapat dimuat.');
    });

    return () => { cancelled = true; };
  }, [attempt]);

  if (loadError) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 rounded-2xl bg-rose-50 p-4 text-rose-600">Terjadi kendala saat memuat data: {loadError}</div>
        <button type="button" onClick={() => { setLoadError(false); setAttempt((value) => value + 1); }} className="rounded-xl bg-[#17324D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#245B7A]">Coba lagi</button>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center px-6">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#299C96] border-t-transparent" />
          <span className="text-sm font-medium text-slate-600">Menyiapkan ruang belajar...</span>
        </div>
      </div>
    );
  }

  return <GuruAsesmenContent data={pageData} />;
}

function GuruAsesmenContent({ data }: { data: AsesmenPageData }) {
  const [query,setQuery]=React.useState('');
  const [typeFilter,setTypeFilter]=React.useState('');
  const [publishingId,setPublishingId]=React.useState<string | null>(null);
  const publishLock=React.useRef(false);
  const publishAssessment = async (id: string) => {
    if (publishLock.current) return;
    publishLock.current = true; setPublishingId(id);
    try {
      const res = await fetch('/api/assessments/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assessment_id: id }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal menerbitkan nilai.');
      toast.success(`${result.published_count} hasil siswa diterbitkan untuk Wali Murid.`);
      window.location.reload();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Publikasi gagal.'); }
    finally { publishLock.current = false; setPublishingId(null); }
  };
  const visible=data.assessments.filter(a=>(!typeFilter||a.type.toLowerCase()===typeFilter)&&[a.title,a.subject_name,a.class_name].some(x=>x.toLowerCase().includes(query.toLowerCase())));
  const exportRows=()=>downloadCsv('lentera-asesmen.csv', [['Judul','Jenis','Pelajaran','Kelas','Modul Ajar','Tanggal','Nilai maks','Status','Jumlah nilai siswa'],...visible.map(a=>[a.title,a.type,a.subject_name,a.class_name,a.module_title || 'Mandiri',a.date,a.max_score,a.status,a.result_count])]);
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/pilih-peran';
  };

  const typeColors: Record<string, string> = {
    formatif: 'badge-info',
    sumatif: 'badge-warning',
  };

  const statusColors: Record<string, string> = {
    draft: 'badge-default',
    published: 'badge-success',
    archived: 'badge-default',
  };

  return (
    <DashboardLayout
      role="guru"
      user={data.user}
      onLogout={handleLogout}
      breadcrumbs={[
        { label: 'Beranda', href: '/guru' },
        { label: 'Asesmen' },
      ]}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="heading-2">Asesmen</h1>
            <p className="body mt-1">Kelola kegiatan asesmen formatif dan sumatif</p>
          </div>
          <Link href="/guru/asesmen/input">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Input Asesmen Baru
            </Button>
          </Link>
        </div>

        {/* Toolbar */}
        <div className="card animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="card-content">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <SearchField value={query} onChange={setQuery} placeholder="Cari asesmen..." label="Cari daftar" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select className="input" aria-label="Filter jenis asesmen" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{ width: 'auto' }}>
                  <option value="">Semua Jenis</option>
                  <option value="formatif">Formatif</option>
                  <option value="sumatif">Sumatif</option>
                </select>

                <Button variant="outline" className="gap-2" disabled={!visible.length} onClick={exportRows}>
                  <Download className="h-4 w-4" />Ekspor CSV
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Assessments List */}
        <div className="card animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="card-content p-0">
            {visible.length === 0 ? (
              <div className="empty-state p-12">
                <IllustratedIcon icon={ClipboardList} label="Asesmen" size="lg" />
                <h3 className="empty-state-title">Belum ada asesmen</h3>
                <p className="empty-state-description">Mulai input asesmen pertama untuk kelas Anda</p>
                <Link href="/guru/asesmen/input" className="mt-4 inline-block">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Input Asesmen Pertama
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Asesmen</th>
                      <th>Jenis</th>
                      <th>Mata Pelajaran</th>
                      <th>Kelas</th>
                      <th>Tanggal</th>
                      <th>Skor Maks</th>
                      <th>Pertemuan</th>
                      <th>Status</th>
                      <th>Hasil</th>
                      <th className="w-56">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map(assessment => (
                      <tr key={assessment.id}>
                        <td>
                          <div>
                            <p className="font-medium text-navy-950">{assessment.title}</p>{assessment.module_title && <p className="mt-1 text-xs text-teal-700">Modul: {assessment.module_title}</p>}
                          </div>
                        </td>
                        <td>
                          <Badge variant={typeColors[assessment.type] as any}>
                            {assessment.type}
                          </Badge>
                        </td>
                        <td>{assessment.subject_name}</td>
                        <td>{assessment.class_name}</td>
                        <td className="text-navy-600">
                          {new Date(assessment.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="text-center text-navy-900">{assessment.max_score}</td>
                        <td className="text-navy-600 text-sm">
                          {assessment.learning_session_title || '-'}
                        </td>
                        <td>
                          <Badge variant={statusColors[assessment.status] as any}>
                            {assessment.status}
                          </Badge>
                        </td>
                        <td className="text-center">
                          <span className="font-medium text-navy-900">{assessment.result_count}</span>
                          <span className="text-navy-400 text-xs"> siswa</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <Link href={`/guru/asesmen/${assessment.id}`} className="btn btn-ghost btn-sm btn-icon" aria-label="Lihat detail">
                              <Eye className="h-4 w-4" />
                            </Link>
                            <button type="button" className="rounded-lg border border-teal-200 px-2 py-1 text-xs font-semibold text-teal-800 disabled:opacity-50" disabled={publishingId !== null || assessment.result_count === 0} onClick={() => publishAssessment(assessment.id)} title="Terbitkan nilai yang sudah disimpan untuk wali murid">{publishingId === assessment.id ? 'Menerbitkan…' : assessment.status === 'published' ? 'Terbitkan ulang' : 'Publikasikan'}</button>
                            <Link href={`/guru/asesmen/${assessment.id}/input`} className="btn btn-ghost btn-sm btn-icon" aria-label="Input nilai">
                              <ClipboardList className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}