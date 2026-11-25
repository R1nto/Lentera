'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Loader2, CalendarDays, BookOpen, MessageCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { SearchField } from '@/components/ui/search-field';

type UserInfo = { full_name: string; role: string; avatar_url?: string; email?: string };
type ReportRow = {
  id: string;
  report_snapshot: Record<string, any> | null;
  published_at: string;
  students: { full_name: string; nis: string };
  learning_sessions: { topic: string; date: string; subjects: { name: string } };
};

export default function WaliMuridLaporanPage() {
  const router = useRouter();
  const [user, setUser] = React.useState<UserInfo | null>(null);
  const [reports, setReports] = React.useState<ReportRow[]>([]);
  const [reportSearch, setReportSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.replace('/pilih-peran');
        return;
      }
      const [profileResult, response] = await Promise.all([
        supabase.from('profiles').select('full_name, role, avatar_url').eq('id', authData.user.id).maybeSingle(),
        fetch('/api/parent/reports', { cache: 'no-store' }),
      ]);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal memuat laporan.');
      const profile = profileResult.data;
      const reportRows = result.reports || [];
      if (!active) return;
      setUser({
        full_name: profile?.full_name || 'Wali Murid',
        role: profile?.role || 'wali_murid',
        avatar_url: profile?.avatar_url || undefined,
        email: authData.user.email || undefined,
      });
      setReports(reportRows as ReportRow[]);
    };

    load().catch((loadError) => {
      console.error('Load parent reports failed:', loadError);
      if (active) setError('Laporan belum dapat dimuat. Silakan coba kembali.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [router]);

  const visibleReports = reports.filter((report) => {
    const snapshotTitle = String(report.report_snapshot?.title || '');
    const text = `${snapshotTitle} ${report.learning_sessions?.topic || ''} ${report.learning_sessions?.subjects?.name || ''} ${report.students?.full_name || ''}`;
    return text.toLocaleLowerCase('id-ID').includes(reportSearch.trim().toLocaleLowerCase('id-ID'));
  });

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/pilih-peran');
  };

  if (loading) return <div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#299C96]" /></div>;
  if (!user) return null;

  return (
    <DashboardLayout role="wali_murid" user={user} onLogout={handleLogout} breadcrumbs={[{ label: 'Beranda', href: '/wali-murid' }, { label: 'Laporan Pembelajaran' }]}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#299C96]">Informasi yang dibagikan guru</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#17324D] sm:text-3xl">Laporan pembelajaran</h1>
          <p className="mt-2 text-sm leading-6 text-[#718096]">Lihat catatan, bukti asesmen, dan perkembangan indikator yang telah dipublikasikan untuk anak yang terhubung dengan akun ini.</p>
        </div>

        {reports.length > 0 && <div className="rounded-2xl border border-[#DCE9F1] bg-white p-4"><div className="max-w-xl"><SearchField value={reportSearch} onChange={setReportSearch} placeholder="Cari laporan, mata pelajaran, atau nama anak..." label="Cari laporan anak" /></div><p aria-live="polite" className="mt-2 text-xs text-[#587286]">{visibleReports.length} dari {reports.length} laporan</p></div>}

        {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        {visibleReports.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center px-6 py-14 text-center">
              <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#E8F5F3] text-[#217D77]"><FileText className="h-7 w-7" /></div>
              <h2 className="text-lg font-bold text-[#17324D]">{reports.length === 0 ? 'Belum ada laporan yang diterbitkan' : 'Laporan tidak ditemukan'}</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#718096]">{reports.length === 0 ? 'Laporan akan muncul di sini setelah guru meninjau dan membagikannya kepada wali murid.' : 'Coba ubah atau hapus kata kunci pencarian.'}</p>
              <Link href="/wali-murid"><Button variant="outline" className="mt-5">Kembali ke beranda</Button></Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {visibleReports.map((report) => {
              const snapshot = report.report_snapshot || {};
              const indicators = Array.isArray(snapshot.indicator_progress) ? snapshot.indicator_progress : [];
              const assessments = Array.isArray(snapshot.assessment_results) ? snapshot.assessment_results : [];
              const indicatorsWithEvidence = indicators.filter((indicator: any) =>
                (Array.isArray(indicator.evidence) && indicator.evidence.length > 0) ||
                (typeof indicator.teacher_assessment?.note === 'string' && indicator.teacher_assessment.note.trim().length > 0)).length;
              const declaredTotal = Number(snapshot.total_module_indicators);
              const moduleIndicatorTotal = Number.isInteger(declaredTotal) && declaredTotal >= indicators.length
                ? declaredTotal : indicators.length;
              return (
                <Card key={report.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge variant="success">Dipublikasikan</Badge>
                          <span className="text-xs text-[#8A9AA8]">{new Date(report.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                        <CardTitle className="text-lg text-[#17324D]">{String(snapshot.title || `Laporan — ${report.learning_sessions.topic}`)}</CardTitle>
                        <CardDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>{report.students.full_name}</span>
                          <span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{report.learning_sessions.subjects.name}</span>
                          <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{new Date(report.learning_sessions.date).toLocaleDateString('id-ID')}</span>
                        </CardDescription>
                      </div>
                      <div className="rounded-xl bg-[#F4FAF9] px-4 py-3 sm:min-w-36">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#718096]">Indikator dibagikan</p>
                        <p className="mt-1 text-xl font-extrabold text-[#17324D]">{indicators.length}/{moduleIndicatorTotal}</p>
                        <p className="mt-1 text-xs text-[#607387]">{indicatorsWithEvidence} indikator memiliki bukti</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {snapshot.teacher_note && (
                      <div className="rounded-xl border border-[#DCEBE8] bg-[#F4FAF9] p-4">
                        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#217D77]"><MessageCircle className="h-3.5 w-3.5" />Catatan guru</p>
                        <p className="mt-2 text-sm leading-6 text-[#526C78]">{snapshot.teacher_note}</p>
                      </div>
                    )}
                    {indicators.length > 0 && (
                      <div>
                        {moduleIndicatorTotal > indicators.length && <p className="mb-2 text-sm text-[#607387]">Guru baru membagikan {indicators.length} dari {moduleIndicatorTotal} indikator pada modul ini. Indikator lainnya belum ditampilkan dalam laporan.</p>}
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#718096]">Perkembangan indikator</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {indicators.map((indicator: any) => (
                            <div key={indicator.id} className="rounded-xl border border-[#E6EDF0] p-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-[#299C96]">{indicator.code}</span>
                                <span className="text-[10px] font-semibold text-[#718096]">{indicator.status === 'meets_criterion' ? 'Tercapai' : indicator.status === 'needs_follow_up' ? 'Belum Tercapai' : indicator.status === 'evidence_only' ? 'Ada bukti; belum ditetapkan tercapai' : 'Belum ada bukti cukup'}</span>
                              </div>
                              <p className="mt-1 text-sm leading-5 text-[#526C78]">{indicator.description}</p>
                              {indicator.teacher_assessment && <div className="mt-2 rounded-lg bg-[#F2F8F7] p-2 text-xs leading-5 text-[#29445A]">
                                <p><strong>Kriteria Guru:</strong> {indicator.teacher_assessment.criterion}</p>
                                <p><strong>Bukti/catatan Guru:</strong> {indicator.teacher_assessment.note}</p>
                              </div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {assessments.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#718096]">Hasil asesmen yang dibagikan</p>
                        <div className="overflow-x-auto rounded-xl border border-[#E6EDF0]">
                          <table className="w-full min-w-[420px] text-sm">
                            <thead className="bg-[#F7F9FA] text-left text-xs text-[#718096]"><tr><th className="px-3 py-2.5">Asesmen</th><th className="px-3 py-2.5">Jenis</th><th className="px-3 py-2.5">Nilai</th></tr></thead>
                            <tbody>{assessments.map((item: any, index: number) => <tr key={`${item.title}-${index}`} className="border-t border-[#EEF2F4]"><td className="px-3 py-2.5 text-[#526C78]">{item.title}</td><td className="px-3 py-2.5 text-[#718096]">{item.type}</td><td className="px-3 py-2.5 font-semibold text-[#17324D]">{item.score}/{item.max_score}</td></tr>)}</tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
