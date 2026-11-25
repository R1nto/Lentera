'use client';
import { IllustratedIcon } from '@/components/ui/illustrated-icon';
import { SearchField } from '@/components/ui/search-field';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, Calendar, Clock, BookOpen, BarChart2, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { downloadCsv } from '@/lib/export-csv';
import { formatRelativeTime } from '@/lib/utils';

interface RiwayatPageData {
  sessions: {
    id: string;
    title: string;
    topic: string;
    date: string;
    subject_name: string;
    class_name: string;
    phase: string;
    status: string;
    duration_minutes: number;
    analysis_status: string | null;
    assessment_count: number;
  }[];
  user: {
    full_name: string;
    role: string;
    avatar_url?: string;
    email?: string;
  };
}

export default function GuruRiwayatPage() {
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

  const { data: sessions, error: sessionsError } = await supabase
    .from('learning_sessions')
    .select(`
      id, title, topic, date, phase, status, duration_minutes,
      subjects!inner(name),
      classes!inner(name)
    `)
    .eq('teacher_id', user.id)
    .order('date', { ascending: false })
    .returns<Array<{
      id: string;
      title: string;
      topic: string;
      date: string;
      phase: string;
      status: string;
      duration_minutes: number;
      subjects: { name: string };
      classes: { name: string }
    }>>();

  if (sessionsError) throw new Error(`Gagal memuat riwayat: ${sessionsError.message}`);

  const sessionIds = sessions?.map(s => s.id) || [];
  const [{ data: analyses }, { data: assessments }] = await Promise.all([
    supabase.from('ai_analyses').select('learning_session_id, status').in('learning_session_id', sessionIds),
    supabase.from('assessment_activities').select('learning_session_id').in('learning_session_id', sessionIds),
  ]);

  const analysisMap = new Map(analyses?.map(a => [a.learning_session_id, a.status]) || []);
  const assessmentCountMap = new Map<string, number>();
  assessments?.forEach(a => {
    const count = assessmentCountMap.get(a.learning_session_id) || 0;
    assessmentCountMap.set(a.learning_session_id, count + 1);
  });

  const pageData: RiwayatPageData = {
    sessions: sessions?.map(s => ({
      id: s.id,
      title: s.title,
      topic: s.topic,
      date: s.date,
      subject_name: s.subjects.name,
      class_name: s.classes.name,
      phase: s.phase,
      status: s.status,
      duration_minutes: s.duration_minutes,
      analysis_status: analysisMap.get(s.id) || null,
      assessment_count: assessmentCountMap.get(s.id) || 0,
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

  return <GuruRiwayatContent data={pageData} />;
}

function GuruRiwayatContent({ data }: { data: RiwayatPageData }) {
  const [query,setQuery]=React.useState('');
  const [statusFilter,setStatusFilter]=React.useState('');
  const visible=data.sessions.filter(s=>(!statusFilter||s.status===statusFilter)&&[s.title,s.topic,s.class_name,s.subject_name].some(x=>x.toLowerCase().includes(query.toLowerCase())));
  const exportRows=()=>downloadCsv('lentera-riwayat.csv', [['Judul','Topik','Kelas','Pelajaran','Tanggal','Durasi','Status','Analisis'],...visible.map(s=>[s.title,s.topic,s.class_name,s.subject_name,s.date,s.duration_minutes,s.status,s.analysis_status||'Belum'])]);
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/pilih-peran';
  };

  const statusColors: Record<string, string> = {
    draft: 'badge-default',
    planned: 'badge-info',
    completed: 'badge-success',
    archived: 'badge-default',
  };

  const analysisColors: Record<string, string> = {
    pending: 'badge-warning',
    processing: 'badge-info',
    completed: 'badge-success',
    failed: 'badge-destructive',
  };

  return (
    <DashboardLayout
      role="guru"
      user={data.user}
      onLogout={handleLogout}
      breadcrumbs={[
        { label: 'Beranda', href: '/guru' },
        { label: 'Riwayat Pembelajaran' },
      ]}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="heading-2">Riwayat Pembelajaran</h1>
            <p className="body mt-1">Lihat dan kelola riwayat semua pembelajaran yang telah dibuat</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Laporan
            </Button>
            <Link href="/guru/analisis/buat">
              <Button className="gap-2">
                <BookOpen className="h-4 w-4" />
                Buat Baru
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="card-hover">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="metric-label">Total Pembelajaran</p>
                  <p className="metric-value">{data.sessions.length}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                  <BookOpen className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
          <div className="card-hover">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="metric-label">Selesai</p>
                  <p className="metric-value">
                    {data.sessions.filter(s => s.status === 'completed').length}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-100 text-success-600">
                  <FileText className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
          <div className="card-hover">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="metric-label">Dengan Analisis</p>
                  <p className="metric-value">
                    {data.sessions.filter(s => s.analysis_status === 'completed').length}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-100 text-warning-600">
                  <BarChart2 className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
          <div className="card-hover">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="metric-label">Total Durasi</p>
                  <p className="metric-value">
                    {Math.round(data.sessions.reduce((sum, s) => sum + s.duration_minutes, 0) / 60)} Jam
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-100 text-navy-600">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="card animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="card-content">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <SearchField value={query} onChange={setQuery} placeholder="Cari pembelajaran..." label="Cari daftar" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select className="input" aria-label="Filter riwayat" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ width: 'auto' }}>
                  <option value="">Semua Status</option>
                  <option value="completed">Selesai</option>
                  <option value="planned">Terencana</option>
                  <option value="draft">Draft</option>
                </select>

                <Button variant="outline" className="gap-2" disabled={!visible.length} onClick={exportRows}>
                  <Download className="h-4 w-4" />Ekspor CSV
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="card animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="card-content p-0">
            {visible.length === 0 ? (
              <div className="empty-state p-12">
                <IllustratedIcon icon={BookOpen} label="Riwayat Pembelajaran" size="lg" />
                <h3 className="empty-state-title">Belum ada riwayat pembelajaran</h3>
                <p className="empty-state-description">Mulai membuat pembelajaran pertama Anda</p>
                <Link href="/guru/analisis/buat" className="mt-4 inline-block">
                  <Button className="gap-2">
                    <BookOpen className="h-4 w-4" />
                    Buat Pembelajaran Baru
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Pembelajaran</th>
                      <th>Mata Pelajaran</th>
                      <th>Kelas</th>
                      <th>Tanggal</th>
                      <th>Fase</th>
                      <th>Durasi</th>
                      <th>Status</th>
                      <th>Analisis</th>
                      <th>Asesmen</th>
                      <th className="w-32">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map(session => (
                      <tr key={session.id}>
                        <td>
                          <div>
                            <p className="font-medium text-navy-950">{session.title}</p>
                            <p className="text-sm text-navy-500">{session.topic}</p>
                          </div>
                        </td>
                        <td>{session.subject_name}</td>
                        <td>{session.class_name}</td>
                        <td className="text-navy-600">
                          {new Date(session.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td>
                          <Badge variant="outline" className="bg-teal-50 text-teal-700">
                            {session.phase}
                          </Badge>
                        </td>
                        <td className="text-center text-navy-600">{session.duration_minutes} menit</td>
                        <td>
                          <Badge variant={statusColors[session.status] as any}>
                            {session.status}
                          </Badge>
                        </td>
                        <td>
                          {session.analysis_status ? (
                            <Badge variant={analysisColors[session.analysis_status] as any}>
                              {session.analysis_status}
                            </Badge>
                          ) : (
                            <span className="text-navy-400 text-sm">Belum</span>
                          )}
                        </td>
                        <td className="text-center">{session.assessment_count}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            <Link href="/guru/analisis" className="btn btn-ghost btn-sm btn-icon" aria-label="Lihat detail">
                              <BarChart2 className="h-4 w-4" />
                            </Link>
                            <Link href="/guru/analisis" className="btn btn-ghost btn-sm btn-icon" aria-label="Edit">
                              <FileText className="h-4 w-4" />
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