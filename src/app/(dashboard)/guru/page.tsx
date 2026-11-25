'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, BarChart2, ClipboardList, Plus, ArrowRight, Clock, TrendingUp, FileText, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils';
import { HomeHero, HomeMetric, HomePanel, HomeQuickAction, HomeEmpty } from '@/components/dashboard/home-kit';
import { IllustratedIcon } from '@/components/ui/illustrated-icon';
import type { LucideIcon } from 'lucide-react';

interface DashboardData {
  stats: {
    totalClasses: number;
    totalStudents: number;
    totalSessions: number;
    totalAssessments: number;
  };
  recentSessions: {
    id: string;
    title: string;
    topic: string;
    date: string;
    subject_name: string;
    class_name: string;
    status: string;
    analysis_status: string | null;
  }[];
  recentAssessments: {
    id: string;
    title: string;
    type: string;
    date: string;
    subject_name: string;
    class_name: string;
  }[];
  user: {
    full_name: string;
    role: string;
    avatar_url?: string;
    email?: string;
  };
}

export default function GuruDashboardPage() {
  const [pageData, setPageData] = React.useState<any>(null);
  const [loadError, setLoadError] = React.useState<string | false>(false);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {

  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) { window.location.assign('/pilih-peran'); return; }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, avatar_url')
    .eq('id', user.id)
    .single();

  // Fetch teacher's classes
  const { data: teacherClasses } = await supabase
    .from('teacher_classes')
    .select('class_id')
    .eq('teacher_id', user.id);

  const classIds = teacherClasses?.map((tc) => tc.class_id) || [];

  // Fetch stats
  const [
    { count: totalStudents },
    { count: totalSessions },
    { count: totalAssessments },
  ] = await Promise.all([
    supabase.from('students').select('id', { count: 'exact', head: true }).in('class_id', classIds).eq('is_active', true),
    supabase.from('learning_sessions').select('id', { count: 'exact', head: true }).eq('teacher_id', user.id),
    supabase.from('assessment_activities').select('id', { count: 'exact', head: true }).eq('teacher_id', user.id),
  ]);

  // Fetch recent sessions
  const { data: recentSessions } = await supabase
    .from('learning_sessions')
    .select(`
      id, title, topic, date, status,
      subjects!inner(name),
      classes!inner(name)
    `)
    .eq('teacher_id', user.id)
    .order('date', { ascending: false })
    .limit(5)
    .returns<Array<{ id: string; title: string; topic: string; date: string; status: string; subjects: { name: string }; classes: { name: string } }>>();

  // Fetch recent assessments
  const { data: recentAssessments } = await supabase
    .from('assessment_activities')
    .select(`
      id, title, type, date,
      subjects!inner(name),
      classes!inner(name)
    `)
    .eq('teacher_id', user.id)
    .order('date', { ascending: false })
    .limit(5)
    .returns<Array<{ id: string; title: string; type: string; date: string; subjects: { name: string }; classes: { name: string } }>>();

  // Fetch analysis status for recent sessions
  const sessionIds = recentSessions?.map((s) => s.id) || [];
  const { data: analyses } = await supabase
    .from('ai_analyses')
    .select('learning_session_id, status')
    .in('learning_session_id', sessionIds);

  const analysisMap = new Map(analyses?.map((a) => [a.learning_session_id, a.status]) || []);

  const dashboardData: DashboardData = {
    stats: {
      totalClasses: classIds.length,
      totalStudents: totalStudents || 0,
      totalSessions: totalSessions || 0,
      totalAssessments: totalAssessments || 0,
    },
    recentSessions: recentSessions?.map((s) => ({
      id: s.id,
      title: s.title,
      topic: s.topic,
      date: s.date,
      subject_name: s.subjects.name,
      class_name: s.classes.name,
      status: s.status,
      analysis_status: analysisMap.get(s.id) || null,
    })) || [],
    recentAssessments: recentAssessments?.map((a) => ({
      id: a.id,
      title: a.title,
      type: a.type,
      date: a.date,
      subject_name: a.subjects.name,
      class_name: a.classes.name,
    })) || [],
    user: {
      full_name: profile?.full_name || 'Guru',
      role: profile?.role || 'guru',
      avatar_url: profile?.avatar_url,
      email: user.email || undefined,
    },
  };

  if (!cancelled) setPageData(dashboardData);

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

  return <GuruDashboardContent data={pageData} />;
}

function GuruDashboardContent({ data }: { data: DashboardData }) {
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/pilih-peran';
  };

  return (
    <DashboardLayout
      role="guru"
      user={data.user}
      onLogout={handleLogout}
    >
      <div className="lentera-home space-y-5">
        <HomeHero name={data.user.full_name.split(' ')[0]} eyebrow="RUANG GURU" description="Kelola kelas, pantau perkembangan siswa, dan lanjutkan aktivitas pembelajaran dengan lebih mudah bersama LENTERA." href="/guru/analisis/buat" action="Buat pembelajaran baru" />
        <div className="lentera-home-metrics">
          <HomeMetric label="Kelas saya" value={data.stats.totalClasses} icon={Users} href="/guru/kelas" color="mint" />
          <HomeMetric label="Peserta didik" value={data.stats.totalStudents} icon={Users} href="/guru/siswa" color="blue" />
          <HomeMetric label="Sesi pembelajaran" value={data.stats.totalSessions} icon={BookOpen} href="/guru/riwayat" color="lilac" />
          <HomeMetric label="Asesmen tercatat" value={data.stats.totalAssessments} icon={ClipboardList} href="/guru/asesmen" color="cream" />
        </div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
          <div className="space-y-5">
            <HomePanel title="Pembelajaran terbaru" action="Lihat semua" href="/guru/riwayat">
              {data.recentSessions.length ? data.recentSessions.map((session) => <Link key={session.id} href="/guru/riwayat" className="lentera-home-row hover:bg-sky-50 rounded-xl px-1"><span className="lentera-home-row-icon"><BookOpen size={20}/></span><span className="min-w-0 flex-1"><span className="lentera-home-row-title block truncate">{session.title}</span><span className="lentera-home-row-description block">{session.class_name} · {session.subject_name} · {formatRelativeTime(session.date)}</span></span><ArrowRight size={16}/></Link>) : <HomeEmpty>Belum ada sesi pembelajaran. Buat pembelajaran pertama untuk memulai.</HomeEmpty>}
            </HomePanel>
            <HomePanel title="Asesmen terbaru" action="Lihat semua" href="/guru/asesmen">
              {data.recentAssessments.length ? data.recentAssessments.map((a) => <Link key={a.id} href={`/guru/asesmen/${a.id}`} className="lentera-home-row hover:bg-sky-50 rounded-xl px-1"><span className="lentera-home-row-icon"><ClipboardList size={20}/></span><span className="min-w-0 flex-1"><span className="lentera-home-row-title block truncate">{a.title}</span><span className="lentera-home-row-description block">{a.class_name} · {a.subject_name} · {formatRelativeTime(a.date)}</span></span><ArrowRight size={16}/></Link>) : <HomeEmpty>Belum ada asesmen yang tercatat.</HomeEmpty>}
            </HomePanel>
          </div>
          <div className="space-y-5">
            <HomePanel title="Aksi cepat">
              <div className="grid gap-2">
                <HomeQuickAction title="Buat pembelajaran" icon={Plus} href="/guru/analisis/buat" color="cream" />
                <HomeQuickAction title="Kelola asesmen" icon={ClipboardList} href="/guru/asesmen" color="blue" />
                <HomeQuickAction title="Susun modul ajar" icon={BookOpen} href="/guru/modul-ajar" color="mint" />
                <HomeQuickAction title="Lihat analisis kelas" icon={BarChart2} href="/guru/analisis" color="lilac" />
              </div>
            </HomePanel>
            <HomePanel title="Ringkasan aktivitas">
              <div className="space-y-3 text-sm text-[#2b485c]">
                <p className="flex justify-between gap-3"><span>Kelas dikelola</span><strong>{data.stats.totalClasses}</strong></p>
                <p className="flex justify-between gap-3"><span>Pembelajaran dibuat</span><strong>{data.stats.totalSessions}</strong></p>
                <p className="flex justify-between gap-3"><span>Asesmen terinput</span><strong>{data.stats.totalAssessments}</strong></p>
              </div>
              <p className="mt-4 text-xs leading-5 text-[#667e91]">Ringkasan berdasarkan data yang tersimpan, bukan angka ilustrasi.</p>
            </HomePanel>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  href,
}: {
  title: string;
  value: number;
  icon: LucideIcon;
  iconColor: string;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <div className="card-hover">
        <div className="card-content">
          <div className="flex items-center justify-between">
            <div>
              <p className="metric-label">{title}</p>
              <p className="metric-value">{value}</p>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconColor}`}>
              <IllustratedIcon icon={Icon} label={title} size="md" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function QuickActionButton({
  icon: Icon,
  label,
  href,
  primary = false,
}: {
  icon: LucideIcon;
  label: string;
  href: string;
  primary?: boolean;
}) {
  return (
    <Link href={href}>
      <Button
        variant={primary ? 'default' : 'outline'}
        className="w-full justify-start gap-3"
      >
        <IllustratedIcon icon={Icon} label={label} size="sm" />
        {label}
      </Button>
    </Link>
  );
}

function SessionRow({
  session,
}: {
  session: {
    id: string;
    title: string;
    topic: string;
    date: string;
    subject_name: string;
    class_name: string;
    status: string;
    analysis_status: string | null;
  };
}) {
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
    <Link href="/guru/analisis" className="block p-3 rounded-lg hover:bg-navy-50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-navy-950 truncate">{session.title}</h4>
          <p className="text-sm text-navy-600">{session.topic}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-navy-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(session.date)}
            </span>
            <span>{session.subject_name} - {session.class_name}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge variant={statusColors[session.status] as any} className="gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {session.status}
          </Badge>
          {session.analysis_status && (
            <Badge variant={analysisColors[session.analysis_status] as any} className="gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              Analisis: {session.analysis_status}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}

function AssessmentRow({
  assessment,
}: {
  assessment: {
    id: string;
    title: string;
    type: string;
    date: string;
    subject_name: string;
    class_name: string;
  };
}) {
  const typeColors: Record<string, string> = {
    formatif: 'badge-info',
    sumatif: 'badge-warning',
  };

  return (
    <Link href={`/guru/asesmen/${assessment.id}`} className="block p-3 rounded-lg hover:bg-navy-50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-navy-950 truncate">{assessment.title}</h4>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-navy-500">
            <Badge variant={typeColors[assessment.type] as any}>
              {assessment.type}
            </Badge>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(assessment.date)}
            </span>
            <span>{assessment.subject_name} - {assessment.class_name}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}