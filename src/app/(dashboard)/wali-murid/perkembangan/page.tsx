'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, TrendingUp, Calendar, Award, ArrowRight, Filter, Download, BarChart2, GraduationCap, Home, ClipboardCheck, FileText, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface PerkembanganPageData {
  children: {
    id: string;
    full_name: string;
    nis: string;
    class_name: string;
    grade: string;
    school_name: string;
    avatar_url?: string;
  }[];
  progressData: {
    subject_name: string;
    topic: string;
    date: string;
    achievement_percentage: number | null;
    status: string;
    total_module_indicators: number;
    teacher_note?: string | null;
    assessment_results?: { title: string; type: string; date: string; score: number; max_score: number }[];
    indicators: {
      code: string;
      description: string;
      criteria: string;
      achievement: number | null;
      status: string;
      evidence_count: number;
      teacher_note?: string | null;
      teacher_criterion?: string | null;
    }[];
  }[];
  selectedChildId?: string;
  publishedAssessments: { id: string; student_id: string; title: string; type: string; subject_name: string; score: number; max_score: number; date: string }[];
  user: {
    full_name: string;
    role: string;
    avatar_url?: string;
    email?: string;
  };
}

export default function WaliMuridPerkembanganPage() {
  const [pageData, setPageData] = React.useState<any>(null);
  const [loadError, setLoadError] = React.useState(false);
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

  // The server endpoint verifies the parent-child link independently of join RLS.
  const publishedResponse = await fetch('/api/parent/assessments', { cache: 'no-store' });
  const publication = await publishedResponse.json();
  if (!publishedResponse.ok) throw new Error(publication.error || 'Gagal membaca hasil publikasi.');
  const children = (publication.children || []) as PerkembanganPageData['children'];

  const selectedChildId = children[0]?.id;

  let progressData: PerkembanganPageData['progressData'] = [];

  if (selectedChildId) {
    const reportResponse = await fetch('/api/parent/reports', { cache: 'no-store' });
    const reportResult = await reportResponse.json();
    if (!reportResponse.ok) throw new Error(reportResult.error || 'Gagal membaca laporan perkembangan.');
    const reports = (reportResult.reports || []).filter((report: { student_id: string }) => report.student_id === selectedChildId);

    type PublishedReportRow = {
      id: string;
      report_snapshot: Record<string, any> | null;
      published_at: string;
      learning_sessions: {
        topic: string;
        date: string;
        subjects: { name: string };
      };
    };

    const typedReports = (reports || []) as unknown as PublishedReportRow[];
    progressData = typedReports.map((report) => {
      const snapshot = report.report_snapshot || {};
      const metrics = snapshot.deterministic_metrics || snapshot.metrics || snapshot.analysis?.deterministic_metrics || {};
      const candidate = metrics.achievement_percentage ?? snapshot.achievement_percentage;
      const percentage = typeof candidate === 'number' && Number.isFinite(candidate) ? candidate : null;
      const rawIndicators = snapshot.indicator_progress || metrics.indicator_analysis || snapshot.indicators || [];
      const selectedCount = Array.isArray(rawIndicators) ? rawIndicators.length : 0;
      const declaredTotal = Number(snapshot.total_module_indicators);
      // Laporan lama belum memiliki metadata total. Jangan menebak jumlah dari modul yang
      // tidak termasuk snapshot; tampilkan minimal jumlah indikator yang dibagikan.
      const totalModuleIndicators = Number.isInteger(declaredTotal) && declaredTotal >= selectedCount
        ? declaredTotal : selectedCount;

      return {
        subject_name: report.learning_sessions.subjects?.name || '',
        topic: report.learning_sessions.topic,
        date: report.learning_sessions.date,
        achievement_percentage: percentage,
        status: percentage === null ? 'insufficient_data' : 'published',
        total_module_indicators: totalModuleIndicators,
        teacher_note: typeof snapshot.teacher_note === 'string' ? snapshot.teacher_note : null,
        assessment_results: Array.isArray(snapshot.assessment_results) ? snapshot.assessment_results : [],
        indicators: Array.isArray(rawIndicators) ? rawIndicators.map((indicator: any) => ({
          code: String(indicator.indicator_code || indicator.code || '-'),
          description: String(indicator.indicator_description || indicator.description || ''),
          criteria: String(indicator.criteria || ''),
          achievement: typeof indicator.percentage === 'number' ? indicator.percentage : null,
          evidence_count: Math.max(Array.isArray(indicator.evidence) ? indicator.evidence.length : 0,
            typeof indicator.teacher_assessment?.note === 'string' && indicator.teacher_assessment.note.trim() ? 1 : 0),
          teacher_note: typeof indicator.teacher_assessment?.note === 'string' ? indicator.teacher_assessment.note : null,
          teacher_criterion: typeof indicator.teacher_assessment?.criterion === 'string' ? indicator.teacher_assessment.criterion : null,
          status: indicator.status === 'meets_criterion' ? 'achieved' : indicator.status === 'needs_follow_up' ? 'needs_improvement' : indicator.status === 'evidence_only' ? 'evidence_only' : 'insufficient_data',
        })) : [],
      };
    });
  }

  const publishedAssessments = ((publication.items || []) as PerkembanganPageData['publishedAssessments'])
    .filter(row => row.student_id === selectedChildId);

  const pageData: PerkembanganPageData = {
    publishedAssessments,
    children,
    progressData,
    selectedChildId,
    user: {
      full_name: profile?.full_name || 'Wali Murid',
      role: profile?.role || 'wali_murid',
      avatar_url: profile?.avatar_url,
      email: user.email || undefined,
    },
  };

  if (!cancelled) setPageData(pageData);

    };

    load().catch((error) => {
      console.error('LENTERA page load failed:', error);
      if (!cancelled) setLoadError(true);
    });

    return () => { cancelled = true; };
  }, [attempt]);

  if (loadError) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 rounded-2xl bg-rose-50 p-4 text-rose-600">Terjadi kendala saat memuat data.</div>
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

  return <WaliMuridPerkembanganContent data={pageData} />;
}

function WaliMuridPerkembanganContent({ data }: { data: PerkembanganPageData }) {
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/pilih-peran';
  };

  const selectedChild = data.children.find(c => c.id === data.selectedChildId);
  const publishedIndicatorCount = data.progressData.reduce((sum, report) => sum + report.indicators.length, 0);
  const achievedIndicatorCount = data.progressData.reduce((sum, report) => sum + report.indicators.filter((indicator) => indicator.status === 'achieved').length, 0);
  const evidenceIndicatorCount = data.progressData.reduce((sum, report) => sum + report.indicators.filter((indicator) => indicator.evidence_count > 0).length, 0);
  const latestAssessment = [...data.publishedAssessments].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
  const latestReport = [...data.progressData].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
  const subjectCount = new Set(data.progressData.map((report) => report.subject_name).filter(Boolean)).size;
  const getStatusColor = (percentage: number | null) => {
    if (percentage === null) return 'text-navy-500 bg-navy-100';
    if (percentage >= 80) return 'text-success-600 bg-success-100';
    if (percentage >= 60) return 'text-warning-600 bg-warning-100';
    return 'text-error-600 bg-error-100';
  };

  const indicatorStatusColors: Record<string, string> = {
    achieved: 'badge-success',
    needs_improvement: 'badge-warning',
    evidence_only: 'badge-default',
    insufficient_data: 'badge-default',
  };

  return (
    <DashboardLayout
      role="wali_murid"
      user={data.user}
      onLogout={handleLogout}
      breadcrumbs={[
        { label: 'Beranda', href: '/wali-murid' },
        { label: 'Perkembangan Belajar' },
      ]}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="heading-2">Perkembangan Belajar</h1>
            <p className="body mt-1">Pantau ketercapaian pembelajaran per mata pelajaran dan indikator</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Child Selector */}
        {data.children.length > 1 && (
          <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="card-content">
              <label className="label mb-2">Pilih Anak</label>
              <div className="flex flex-wrap gap-3">
                {data.children.map(child => (
                  <button
                    key={child.id}
                    className={`relative p-4 rounded-xl border-2 transition-colors ${
                      data.selectedChildId === child.id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-navy-200 hover:border-teal-300'
                    }`}
                  >
                    {data.selectedChildId === child.id && (
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
                ))}
              </div>
            </div>
          </Card>
        )}

        {selectedChild && (
          <>
            {/* Ringkasan identitas dan kemajuan anak — seluruh angka bersumber dari publikasi Guru. */}
            <section className="animate-fade-in overflow-hidden rounded-[26px] border border-[#C5E4E2] bg-white shadow-[0_12px_30px_rgba(23,50,77,0.06)]" style={{ animationDelay: '200ms' }} aria-label="Ringkasan perkembangan anak">
              <div className="relative overflow-hidden bg-gradient-to-r from-[#E4F8F1] via-[#E6F6F9] to-[#EDF3FF] px-5 py-6 sm:px-7 sm:py-7">
                <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-48 w-48 rounded-full border-[28px] border-white/30" />
                <div aria-hidden="true" className="pointer-events-none absolute right-20 bottom-[-90px] h-40 w-40 rounded-full bg-[#A5E0CB]/35 blur-xl" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4 sm:gap-5">
                    <div className="relative shrink-0">
                      <div className="flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-[22px] border-[3px] border-white bg-[#C4EAE1] text-3xl font-extrabold uppercase text-[#176D6B] shadow-md sm:h-[88px] sm:w-[88px]">
                        {selectedChild.avatar_url ? (
                          <img src={selectedChild.avatar_url} alt={`Foto ${selectedChild.full_name}`} className="h-full w-full object-cover" />
                        ) : (
                          selectedChild.full_name.charAt(0)
                        )}
                      </div>
                      <span className="absolute -bottom-1 -right-2 rounded-full border-2 border-white bg-[#218D7C] px-2 py-1 text-[10px] font-bold text-white">SD</span>
                    </div>
                    <div className="min-w-0">
                      <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#287C80]"><Sparkles className="h-3.5 w-3.5" /> Perjalanan Belajar</p>
                      <h2 className="break-words text-2xl font-extrabold tracking-tight text-[#17324D] sm:text-3xl">{selectedChild.full_name}</h2>
                      <p className="mt-1 text-sm font-semibold text-[#34516A]">Kelas {selectedChild.class_name} · {selectedChild.school_name}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-[#34516A]">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/90 bg-white/75 px-3 py-1.5"><Award className="h-3.5 w-3.5 text-[#238A81]" /> NIS {selectedChild.nis || 'Belum tersedia'}</span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/90 bg-white/75 px-3 py-1.5"><GraduationCap className="h-3.5 w-3.5 text-[#238A81]" /> Kelas {selectedChild.class_name} · Tingkat {selectedChild.grade}</span>
                      </div>
                    </div>
                  </div>
                  <Link href="/wali-murid/profil-anak" className="shrink-0 self-start lg:self-center">
                    <span className="inline-flex items-center gap-2 rounded-xl border border-[#B5D5E0] bg-white px-4 py-2.5 text-sm font-semibold text-[#17324D] shadow-sm transition hover:bg-[#F8FFFD]">Lihat Profil Lengkap <ArrowRight className="h-4 w-4" /></span>
                  </Link>
                </div>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
                <div className="rounded-2xl border border-[#D8EBE5] bg-[#F5FCF8] p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#496B69]"><BookOpen className="h-4 w-4" /> Mata pelajaran</div>
                  <p className="mt-2 text-2xl font-extrabold text-[#17324D]">{subjectCount}</p>
                  <p className="mt-1 text-xs text-[#637989]">Dengan laporan terbit</p>
                </div>
                <div className="rounded-2xl border border-[#D8E7F6] bg-[#F3F9FF] p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#49667B]"><ClipboardCheck className="h-4 w-4" /> Asesmen dibagikan</div>
                  <p className="mt-2 text-2xl font-extrabold text-[#17324D]">{data.publishedAssessments.length}</p>
                  <p className="mt-1 truncate text-xs text-[#637989]">{latestAssessment ? `${latestAssessment.title} · ${latestAssessment.score}/${latestAssessment.max_score}` : 'Belum ada asesmen terbit'}</p>
                </div>
                <div className="rounded-2xl border border-[#F2E4CB] bg-[#FFF9EC] p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#88724B]"><TrendingUp className="h-4 w-4" /> Indikator dengan bukti</div>
                  <p className="mt-2 text-2xl font-extrabold text-[#17324D]">{evidenceIndicatorCount}</p>
                  <p className="mt-1 text-xs text-[#637989]">Dari {publishedIndicatorCount} indikator dibagikan</p>
                </div>
                <div className="rounded-2xl border border-[#D7EBDD] bg-[#F0FAF1] p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#42745D]"><CheckCircle2 className="h-4 w-4" /> Indikator tercapai</div>
                  <p className="mt-2 text-2xl font-extrabold text-[#176F58]">{achievedIndicatorCount}<span className="ml-1 text-base font-semibold text-[#648074]">/ {publishedIndicatorCount}</span></p>
                  <p className="mt-1 text-xs text-[#637989]">Ditetapkan Guru pada laporan</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 border-t border-[#E3EEEE] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="flex items-start gap-2 text-xs leading-5 text-[#526D7B]"><FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#268B83]" /> {data.progressData.length > 0 ? `${data.progressData.length} laporan diterbitkan${latestReport ? ` · Terbaru: ${latestReport.subject_name} — ${latestReport.topic}` : ''}. Status ketercapaian mengikuti keputusan Guru, bukan nilai asesmen otomatis.` : 'Belum ada laporan pembelajaran diterbitkan untuk anak ini.'}</p>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link href="/wali-murid/asesmen" className="rounded-lg bg-[#E8F4FF] px-3 py-2 text-xs font-bold text-[#244B72] transition hover:bg-[#D7ECFF]">Lihat asesmen</Link>
                  <Link href="/wali-murid/laporan" className="rounded-lg bg-[#DDF4E9] px-3 py-2 text-xs font-bold text-[#176B5B] transition hover:bg-[#C8EBDA]">Buka laporan</Link>
                </div>
              </div>
            </section>

            {/* Progress Detail */}
            <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
              <div className="card-header flex flex-row items-center justify-between">
                <h3 className="card-title">Detail Perkembangan per Mata Pelajaran</h3>
              </div>
              <div className="card-content">
                {data.progressData.length === 0 ? (
                  <div className="empty-state py-12">
                    <BarChart2 className="empty-state-icon h-16 w-16" />
                    <h3 className="empty-state-title">Belum ada data perkembangan</h3>
                    <p className="empty-state-description">Guru perlu menerbitkan Laporan Pembelajaran dari sesi dan modul yang sama setelah nilai asesmen dipublikasikan</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {data.progressData.map((progress, index) => (
                      <div key={index} className="border border-navy-200 rounded-xl overflow-hidden">
                        <div className="p-4 bg-navy-50 border-b border-navy-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                              <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-medium text-navy-950">{progress.subject_name}</h4>
                              <p className="text-sm text-navy-500">{progress.topic}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className={`text-lg font-bold ${getStatusColor(progress.achievement_percentage)}`}>
                              {progress.indicators.length} dari {progress.total_module_indicators} indikator dibagikan
                            </div>
                            <Badge variant="outline" className="bg-teal-50 text-teal-700">
                              {progress.date ? new Date(progress.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''}
                            </Badge>
                          </div>
                        </div>
                        {progress.indicators.length > 0 && (
                          <div className="p-4">
                            <h5 className="label mb-3">Indikator Ketercapaian</h5>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {progress.indicators.map((ind, i) => (
                                <div key={i} className="p-3 rounded-lg bg-white border border-navy-100">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-navy-950 text-sm">{ind.code}</span>
                                    <Badge variant={indicatorStatusColors[ind.status] as any}>
                                      {ind.status === 'achieved' ? 'Tercapai' : ind.status === 'needs_improvement' ? 'Perlu Perbaikan' : ind.status === 'evidence_only' ? 'Ada Bukti' : 'Data Kurang'}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-navy-600">{ind.description}</p>
                                  {ind.achievement !== null && (
                                    <div className="mt-2 h-2 bg-navy-100 rounded-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                          width: `${Math.max(0, Math.min(100, ind.achievement))}%`,
                                          backgroundColor: ind.status === 'achieved' ? '#16876D' : ind.status === 'needs_improvement' ? '#D99A35' : '#CBD5E1'
                                        }}
                                      />
                                    </div>
                                  )}
                                  <p className="text-xs text-navy-500 mt-1 text-right">{ind.status === 'achieved' ? 'Dinyatakan tercapai berdasarkan kriteria Guru' : ind.status === 'needs_improvement' ? 'Belum tercapai; perlu tindak lanjut' : ind.status === 'evidence_only' ? 'Ada asesmen terkait; belum ditetapkan tercapai' : 'Belum ada bukti cukup'}</p>
                                  {ind.teacher_note && <div className="mt-2 rounded-md bg-[#F2F8F7] p-2 text-xs text-[#29445A]">
                                    {ind.teacher_criterion && <p><strong>Kriteria:</strong> {ind.teacher_criterion}</p>}
                                    <p><strong>Catatan Guru:</strong> {ind.teacher_note}</p>
                                  </div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}