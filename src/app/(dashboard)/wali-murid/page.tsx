'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, BookOpen, ClipboardList, GraduationCap, TrendingUp, Activity, Calendar, School, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatRelativeTime, formatDate } from '@/lib/utils';
import { HomeHero, HomeMetric, HomePanel, HomeQuickAction, HomeEmpty } from '@/components/dashboard/home-kit';
import { IllustratedIcon } from '@/components/ui/illustrated-icon';
import type { LucideIcon } from 'lucide-react';

interface ParentDashboardData {
  children: {
    id: string;
    full_name: string;
    nis: string;
    class_name: string;
    grade: string;
    school_name: string;
    avatar_url?: string;
  }[];
  selectedChild?: {
    id: string;
    full_name: string;
    nis: string;
    class_name: string;
    grade: string;
    school_name: string;
    recentProgress: {
      subject_name: string;
      topic: string;
      date: string;
      achievement_percentage: number | null;
      status: string;
      achieved_count: number;
      indicator_count: number;
      evidence_count: number;
    }[];
    recentAssessments: {
      id: string;
      title: string;
      subject_name: string;
      date: string;
      score: number;
      max_score: number;
      type: string;
    }[];
    recentReports: {
      id: string;
      title: string;
      period: string;
      published_at: string;
    }[];
  };
  user: {
    full_name: string;
    role: string;
    avatar_url?: string;
    email?: string;
  };
}

// ChildCard component
function ChildCard({
  child,
  isSelected,
}: {
  child: ParentDashboardData['children'][0];
  isSelected: boolean;
}) {
  return (
    <button
      className={`relative p-4 rounded-xl border-2 transition-colors w-full text-left ${
        isSelected
          ? 'border-teal-500 bg-teal-50'
          : 'border-navy-200 hover:border-teal-300'
      }`}
    >
      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-teal-500 text-white text-xs px-2 py-0.5 rounded-full">
          Dipilih
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-600 font-bold">
          {child.full_name.charAt(0)}
        </div>
        <div>
          <p className="font-medium text-navy-950">{child.full_name}</p>
          <p className="text-sm text-navy-500">Kelas {child.class_name} • {child.school_name}</p>
        </div>
      </div>
    </button>
  );
}

// ProgressCard component
function ProgressCard({
  title,
  value,
  icon: Icon,
  iconColor,
  subtitle,
}: {
  title: string;
  value: number;
  icon: LucideIcon;
  iconColor: string;
  subtitle: string;
}) {
  return (
    <div className="card-hover">
      <div className="card-content">
        <div className="flex items-center justify-between">
          <div>
            <p className="metric-label">{title}</p>
            <p className="metric-value">{value}</p>
            <p className="caption mt-1">{subtitle}</p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconColor}`}>
            <IllustratedIcon icon={Icon} label={title} size="md" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ProgressRow component
function ProgressRow({
  progress,
}: {
  progress: {
    subject_name: string;
    topic: string;
    date: string;
    achievement_percentage: number | null;
    status: string;
  };
}) {
  const getStatusColor = (percentage: number | null) => {
    if (percentage === null) return 'text-navy-500 bg-navy-100';
    if (percentage >= 80) return 'text-success-600 bg-success-100';
    if (percentage >= 60) return 'text-warning-600 bg-warning-100';
    return 'text-error-600 bg-error-100';
  };

  return (
    <div className="p-3 rounded-lg bg-navy-50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-navy-950 truncate">{progress.subject_name}</h4>
          <p className="text-sm text-navy-600">{progress.topic}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-navy-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(progress.date)}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className={`text-lg font-bold ${getStatusColor(progress.achievement_percentage)}`}>
            {progress.achievement_percentage === null ? 'Belum ada angka' : `${progress.achievement_percentage.toFixed(1)}%`}
          </div>
          <div className="text-xs text-navy-500">Ketercapaian</div>
        </div>
      </div>
    </div>
  );
}

// AssessmentRow component
function AssessmentRow({
  assessment,
}: {
  assessment: {
    id: string;
    title: string;
    subject_name: string;
    date: string;
    score: number;
    max_score: number;
    type: string;
  };
}) {
  const percentage = assessment.max_score > 0 ? Math.round((assessment.score / assessment.max_score) * 100) : 0;
  const typeColors: Record<string, string> = {
    formatif: 'badge-info',
    sumatif: 'badge-warning',
  };

  return (
    <div className="p-3 rounded-lg bg-navy-50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-navy-950 truncate">{assessment.title}</h4>
          <p className="text-sm text-navy-600">{assessment.subject_name}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-navy-500">
            <Badge variant={typeColors[assessment.type] as any}>
              {assessment.type}
            </Badge>
            <span>{formatDate(assessment.date)}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-bold text-navy-950">
            {assessment.score}/{assessment.max_score}
          </div>
          <div className="text-xs text-navy-500">{percentage}%</div>
        </div>
      </div>
    </div>
  );
}

interface ReportRowProps {
  report: {
    id: string;
    title: string;
    period: string;
    published_at: string;
  };
}

function ReportRow({ report }: ReportRowProps) {
  return (
    <Link href={`/wali-murid/laporan/${report.id}`} className="block p-3 rounded-lg hover:bg-navy-50 transition-colors">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-navy-950 truncate">{report.title}</h4>
          <div className="flex items-center gap-2 mt-1 text-sm text-navy-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Periode: {formatDate(report.period)}
            </span>
            <span className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              Dipublikasikan: {formatRelativeTime(report.published_at)}
            </span>
          </div>
        </div>
        <GraduationCap className="h-8 w-8 text-teal-500" />
      </div>
    </Link>
  );
}

// Main content component
function WaliMuridDashboardContent({ data }: { data: ParentDashboardData }) {
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/pilih-peran';
  };

  return (
    <DashboardLayout
      role="wali_murid"
      user={data.user}
      onLogout={handleLogout}
    >
      <div className="lentera-home space-y-5">
        <HomeHero name={data.user.full_name.split(' ')[0]} variant="wali" eyebrow="RUANG WALI MURID" description="Ikuti perjalanan belajar anak, lihat asesmen yang sudah dipublikasikan, dan dukung perkembangannya bersama LENTERA." href="/wali-murid/perkembangan" action="Lihat perkembangan anak" />
        {data.selectedChild ? <>
          <div className="lentera-home-metrics">
            <HomeMetric label="Anak terhubung" value={data.children.length} icon={User} href="/wali-murid/profil-anak" color="mint" />
            <HomeMetric label="Data perkembangan" value={data.selectedChild.recentProgress.length} icon={TrendingUp} href="/wali-murid/perkembangan" color="blue" />
            <HomeMetric label="Asesmen diterbitkan" value={data.selectedChild.recentAssessments.length} icon={ClipboardList} href="/wali-murid/asesmen" color="cream" />
            <HomeMetric label="Laporan tersedia" value={data.selectedChild.recentReports.length} icon={GraduationCap} href="/wali-murid/laporan" color="lilac" />
          </div>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
            <div className="space-y-5">
              <HomePanel title="Perkembangan belajar" action="Lihat semua" href="/wali-murid/perkembangan">
                {data.selectedChild.recentProgress.length ? data.selectedChild.recentProgress.map((r,i) => <div className="lentera-home-row" key={i}><span className="lentera-home-row-icon"><TrendingUp size={20}/></span><span className="min-w-0 flex-1"><span className="lentera-home-row-title block">{r.subject_name || 'Mata pelajaran'}</span><span className="lentera-home-row-description block truncate">{r.topic}</span></span><strong className="text-sm text-[#147d73]">{r.indicator_count > 0 ? `${r.achieved_count}/${r.indicator_count} tercapai` : 'Belum dinilai'}</strong></div>) : <HomeEmpty>Data perkembangan akan tampil setelah laporan dipublikasikan oleh sekolah.</HomeEmpty>}
              </HomePanel>
              <div className="grid gap-5 lg:grid-cols-2">
                <HomePanel title="Asesmen terbaru" action="Lihat semua" href="/wali-murid/asesmen">
                  {data.selectedChild.recentAssessments.length ? data.selectedChild.recentAssessments.slice(0,4).map(a => <div key={a.id} className="lentera-home-row"><span className="lentera-home-row-icon"><ClipboardList size={19}/></span><span className="min-w-0 flex-1"><span className="lentera-home-row-title block truncate">{a.title}</span><span className="lentera-home-row-description block">{a.subject_name}</span></span><strong className="text-sm">{a.score}/{a.max_score}</strong></div>) : <HomeEmpty>Belum ada asesmen diterbitkan.</HomeEmpty>}
                </HomePanel>
                <HomePanel title="Laporan terbaru" action="Lihat semua" href="/wali-murid/laporan">
                  {data.selectedChild.recentReports.length ? data.selectedChild.recentReports.slice(0,4).map(r => <Link key={r.id} href="/wali-murid/laporan" className="lentera-home-row"><span className="lentera-home-row-icon"><BookOpen size={19}/></span><span className="min-w-0 flex-1"><span className="lentera-home-row-title block truncate">{r.title}</span><span className="lentera-home-row-description block">{formatRelativeTime(r.published_at)}</span></span></Link>) : <HomeEmpty>Belum ada laporan dipublikasikan.</HomeEmpty>}
                </HomePanel>
              </div>
            </div>
            <div className="space-y-5">
              <HomePanel title="Profil anak">
                <div className="flex items-center gap-3 rounded-xl bg-[#ecf9f5] p-3"><span className="grid h-12 w-12 place-items-center rounded-full bg-white text-xl font-extrabold text-[#0b8d7a]">{data.selectedChild.full_name.charAt(0)}</span><span><strong className="block text-sm text-[#19354e]">{data.selectedChild.full_name}</strong><span className="block text-xs text-[#526e7f]">Kelas {data.selectedChild.class_name} · {data.selectedChild.school_name}</span></span></div>
                {data.children.length>1 && <p className="mt-3 text-xs text-[#526e7f]">{data.children.length} anak terhubung. Lihat semuanya melalui Profil Anak.</p>}
              </HomePanel>
              <HomePanel title="Aksi cepat"><div className="grid gap-2"><HomeQuickAction icon={TrendingUp} title="Perkembangan anak" href="/wali-murid/perkembangan" color="mint"/><HomeQuickAction icon={ClipboardList} title="Lihat asesmen" href="/wali-murid/asesmen" color="cream"/><HomeQuickAction icon={BookOpen} title="Baca laporan" href="/wali-murid/laporan" color="blue"/></div></HomePanel>
              <HomePanel title="Informasi pembelajaran"><p className="text-sm leading-6 text-[#466476]">Informasi pada beranda berasal dari asesmen dan laporan yang sudah dipublikasikan. Data pribadi siswa lain tidak ditampilkan.</p></HomePanel>
            </div>
          </div>
        </> : <HomePanel title="Hubungkan akun dengan anak"><HomeEmpty>Belum ada anak yang terhubung. Hubungi sekolah untuk meminta kode undangan Wali Murid.</HomeEmpty></HomePanel>}
      </div>
    </DashboardLayout>
  );
}

export default function WaliMuridDashboardPage() {
  const [pageData, setPageData] = React.useState<any>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
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

  // Fetch parent's verified students
  const { data: parentStudents, error: parentStudentsError } = await supabase
    .from('parent_students')
    .select(`
      student_id,
      verification_status,
      students!inner(
        id, full_name, nis, class_id, avatar_url,
        classes!inner(name, grade, schools!inner(name))
      )
    `)
    .eq('parent_id', user.id)
    .eq('verification_status', 'verified');

  // A broken join or RLS policy must never masquerade as an unlinked child.
  if (parentStudentsError) {
    console.error('Parent children query failed:', {
      code: parentStudentsError.code,
      message: parentStudentsError.message,
    });
    throw new Error('Data anak gagal dibaca. Periksa izin akses kelas/siswa (migrasi 024).');
  }
  if (!parentStudents?.length) {
    const { data: links, error: linksError } = await supabase
      .from('parent_students')
      .select('student_id, verification_status')
      .eq('parent_id', user.id);
    if (linksError) {
      console.error('Parent link lookup failed:', { code: linksError.code, message: linksError.message });
      throw new Error('Status undangan anak tidak dapat diperiksa. Periksa izin parent_students.');
    }
    if (links?.some((link) => link.verification_status === 'verified')) {
      throw new Error('Akun sudah tertaut dengan anak, tetapi detail kelas belum terbaca. Jalankan migrasi 024.');
    }
    if (links?.some((link) => link.verification_status === 'pending')) {
      throw new Error('Hubungan akun dan anak masih menunggu verifikasi dari sekolah.');
    }
  }

  // Type assertion to help TypeScript understand the nested structure
  type StudentWithRelations = {
    id: string;
    full_name: string;
    nis: string;
    class_id: string;
    avatar_url?: string;
    classes: {
      name: string;
      grade: string;
      schools: {
        name: string;
      };
    };
  };

  type ParentStudentRow = {
    student_id: string;
    verification_status: string;
    students: StudentWithRelations;
  };

  const typedParentStudents = (parentStudents || []) as unknown as ParentStudentRow[];

  const children = typedParentStudents.map(ps => ({
    id: ps.students.id,
    full_name: ps.students.full_name,
    nis: ps.students.nis,
    class_name: ps.students.classes.name,
    grade: ps.students.classes.grade,
    school_name: ps.students.classes.schools.name,
    avatar_url: ps.students.avatar_url,
  }));

  const selectedChildId = children[0]?.id;

  let selectedChild: ParentDashboardData['selectedChild'] = undefined;

  if (selectedChildId) {
    // Use the same verified-parent endpoints as the working Asesmen and Laporan pages.
    // Do not query publication tables through extra client-side inner joins: RLS on
    // nested assessment_results can otherwise turn real published records into [].
    const [assessmentsResponse, reportsResponse] = await Promise.all([
      fetch('/api/parent/assessments', { cache: 'no-store' }),
      fetch('/api/parent/reports', { cache: 'no-store' }),
    ]);
    if (!assessmentsResponse.ok || !reportsResponse.ok) {
      const failed = !assessmentsResponse.ok ? assessmentsResponse : reportsResponse;
      const payload = await failed.json().catch(() => ({}));
      throw new Error(typeof payload?.error === 'string' ? payload.error : 'Data publikasi Wali Murid gagal dimuat.');
    }
    const [assessmentPayload, reportPayload] = await Promise.all([
      assessmentsResponse.json(), reportsResponse.json(),
    ]);

    type PublishedAssessment = {
      id: string; student_id: string; title: string; subject_name: string;
      date: string; score: number; max_score: number; type: string;
    };
    type PublishedReport = {
      id: string; student_id: string; report_snapshot: Record<string, unknown> | null;
      published_at: string;
      learning_sessions: { topic: string; date: string; subjects: { name: string } | null } | null;
    };
    const publishedAssessments = ((assessmentPayload.items || []) as PublishedAssessment[])
      .filter(item => item.student_id === selectedChildId);
    const publishedReports = ((reportPayload.reports || []) as PublishedReport[])
      .filter(item => item.student_id === selectedChildId);

    const recentProgress = publishedReports.flatMap(report => {
      const snapshot = report.report_snapshot || {};
      const indicators = Array.isArray(snapshot.indicator_progress) ? snapshot.indicator_progress as Array<Record<string, unknown>> : [];
      if (!indicators.length) return [];
      const achievedCount = indicators.filter(item => item.status === 'meets_criterion').length;
      const evidenceCount = indicators.filter(item => {
        const teacherAssessment = item.teacher_assessment as Record<string, unknown> | undefined;
        return (Array.isArray(item.evidence) && item.evidence.length > 0) ||
          (typeof teacherAssessment?.note === 'string' && teacherAssessment.note.trim().length > 0);
      }).length;
      // An assessment score is not a TP attainment percentage. Only expose a
      // percentage if it was explicitly computed and persisted in the report.
      const metrics = (snapshot.deterministic_metrics || snapshot.metrics || {}) as Record<string, unknown>;
      const candidate = metrics.achievement_percentage ?? snapshot.achievement_percentage;
      return [{
        subject_name: report.learning_sessions?.subjects?.name || 'Mata pelajaran',
        topic: report.learning_sessions?.topic || 'Pembelajaran',
        date: report.learning_sessions?.date || report.published_at,
        achievement_percentage: typeof candidate === 'number' && Number.isFinite(candidate) ? candidate : null,
        status: 'published',
        achieved_count: achievedCount,
        indicator_count: indicators.length,
        evidence_count: evidenceCount,
      }];
    });

    selectedChild = {
      ...children[0],
      recentProgress,
      recentAssessments: publishedAssessments.map(item => ({
        id: item.id,
        title: item.title,
        subject_name: item.subject_name,
        date: item.date,
        score: item.score,
        max_score: item.max_score,
        type: item.type,
      })),
      recentReports: publishedReports.map(report => ({
        id: report.id,
        title: String(report.report_snapshot?.title || report.learning_sessions?.topic || 'Laporan Pembelajaran'),
        period: report.learning_sessions?.date || report.published_at,
        published_at: report.published_at,
      })),
    };
  }

  const dashboardData: ParentDashboardData = {
    children,
    selectedChild,
    user: {
      full_name: profile?.full_name || 'Wali Murid',
      role: profile?.role || 'wali_murid',
      avatar_url: profile?.avatar_url,
      email: user.email || undefined,
    },
  };

  if (!cancelled) setPageData(dashboardData);

    };

    load().catch((error) => {
      console.error('LENTERA page load failed:', error);
      if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Gagal memuat data anak.');
    });

    return () => { cancelled = true; };
  }, [attempt]);

  if (loadError) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 rounded-2xl bg-rose-50 p-4 text-rose-600">{loadError}</div>
        <button type="button" onClick={() => { setLoadError(null); setAttempt((value) => value + 1); }} className="rounded-xl bg-[#17324D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#245B7A]">Coba lagi</button>
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

  return <WaliMuridDashboardContent data={pageData} />;
}