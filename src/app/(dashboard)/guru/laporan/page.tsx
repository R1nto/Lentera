'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileCheck2, Loader2, RefreshCw, Send, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

type UserInfo = { full_name: string; role: string; avatar_url?: string; email?: string };
type ReportStudent = { id: string; full_name: string };
type ReportIndicator = { id: string; code: string; description: string; criteria: string | null };
type TeacherDecision = { status: '' | 'unassessed' | 'met' | 'not_met'; criterion: string; note: string };
type ReportChoices = {
  students: ReportStudent[]; indicators: ReportIndicator[];
  evidence: Record<string, string[]>; publishedStudents: string[];
  previousDecisions?: Record<string, Record<string, TeacherDecision>>;
};
type SessionOption = {
  id: string;
  title: string;
  topic: string;
  date: string;
  phase: string;
  classes: { name: string };
  subjects: { name: string };
  published_count: number;
  ready_assessments: number;
  last_published_at: string | null;
};

export default function GuruLaporanPage() {
  const router = useRouter();
  const [user, setUser] = React.useState<UserInfo | null>(null);
  const [sessions, setSessions] = React.useState<SessionOption[]>([]);
  const [selectedSessionId, setSelectedSessionId] = React.useState('');
  const [choices, setChoices] = React.useState<ReportChoices | null>(null);
  const [selectedStudents, setSelectedStudents] = React.useState<string[]>([]);
  const [selectedIndicators, setSelectedIndicators] = React.useState<string[]>([]);
  const [decisions, setDecisions] = React.useState<Record<string, Record<string, TeacherDecision>>>({});
  const [loadingChoices, setLoadingChoices] = React.useState(false);
  const [choicesError, setChoicesError] = React.useState('');
  const [teacherNote, setTeacherNote] = React.useState('');
  const [includeAssessments, setIncludeAssessments] = React.useState(true);
  const [includeIndicators, setIncludeIndicators] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [publishing, setPublishing] = React.useState(false);
  const publishLock = React.useRef(false);
  const [publishedSummary, setPublishedSummary] = React.useState<{ students: number; met: number; notMet: number; unassessed: number } | null>(null);
  const [error, setError] = React.useState('');
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      const response = await fetch('/api/reports/publish', { cache: 'no-store' });
      const result = await response.json();
      if (response.status === 401) { router.replace('/masuk?role=guru'); return; }
      if (!response.ok) throw new Error(result.error || 'Gagal memuat sesi pembelajaran.');
      if (!active) return;
      setUser(result.profile);
      const available = (result.sessions || []) as SessionOption[];
      setSessions(available);
      setSelectedSessionId((previous) => available.find((item) => item.id === previous)?.id || available[0]?.id || '');
    };
    void load().catch((cause) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Gagal memuat laporan.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [router, attempt]);

  React.useEffect(() => {
    const controller = new AbortController();
    setChoices(null);
    setSelectedStudents([]);
    setSelectedIndicators([]);
    setDecisions({});
    setChoicesError('');
    setPublishedSummary(null);
    if (!selectedSessionId) return () => controller.abort();
    setLoadingChoices(true);
    void (async () => {
      const response = await fetch(`/api/reports/publish?session_id=${encodeURIComponent(selectedSessionId)}`, {
        cache: 'no-store', signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal memuat siswa dan indikator.');
      if (controller.signal.aborted) return;
      const next = result as ReportChoices;
      setChoices(next);
      setDecisions(next.previousDecisions || {});
      // No students are selected by default to prevent inadvertent mass publication.
      setSelectedStudents([]);
      setSelectedIndicators(next.indicators.map(item => item.id));
    })().catch((issue) => {
      if (!controller.signal.aborted) setChoicesError(issue instanceof Error ? issue.message : 'Data pilihan gagal dimuat.');
    }).finally(() => { if (!controller.signal.aborted) setLoadingChoices(false); });
    return () => controller.abort();
  }, [selectedSessionId, attempt]);

  const updateDecision = (studentId: string, indicatorId: string, patch: Partial<TeacherDecision>) => {
    setDecisions(previous => ({ ...previous, [studentId]: {
      ...previous[studentId],
      [indicatorId]: { status: '', criterion: '', note: '', ...previous[studentId]?.[indicatorId], ...patch },
    } }));
  };
  const selectedSession = sessions.find((session) => session.id === selectedSessionId);
  const selectedDecisionRows = includeIndicators ? selectedStudents.flatMap(studentId => selectedIndicators.map(indicatorId =>
    ({ studentId, indicatorId, decision: decisions[studentId]?.[indicatorId] }))) : [];
  const pendingDecisionCount = selectedDecisionRows.filter(row => !row.decision?.status).length;
  const decisionCounts = {
    met: selectedDecisionRows.filter(row => row.decision?.status === 'met').length,
    notMet: selectedDecisionRows.filter(row => row.decision?.status === 'not_met').length,
    unassessed: selectedDecisionRows.filter(row => row.decision?.status === 'unassessed').length,
  };
  const toggleStudent = (id: string, checked: boolean) => setSelectedStudents((previous) =>
    checked ? [...previous.filter(value => value !== id), id] : previous.filter(value => value !== id));
  const toggleIndicator = (id: string, checked: boolean) => setSelectedIndicators((previous) =>
    checked ? [...previous.filter(value => value !== id), id] : previous.filter(value => value !== id));
  const selectedEvidence = choices ? selectedStudents.reduce((count, studentId) =>
    count + selectedIndicators.filter(indicatorId => choices.evidence[studentId]?.includes(indicatorId)).length, 0) : 0;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/pilih-peran');
  };

  const handlePublish = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (publishLock.current) return;
    if (!selectedSessionId) {
      toast.error('Pilih sesi pembelajaran terlebih dahulu.');
      return;
    }
    if (loadingChoices || !choices) { toast.error('Data siswa dan indikator belum siap.'); return; }
    if (!selectedStudents.length) { toast.error('Pilih minimal satu siswa.'); return; }
    if (includeIndicators && !selectedIndicators.length) { toast.error('Pilih minimal satu indikator.'); return; }
    if (!includeAssessments && !includeIndicators && !teacherNote.trim()) {
      toast.error('Pilih setidaknya satu bagian laporan untuk dibagikan.');
      return;
    }
    if (includeIndicators && pendingDecisionCount > 0) {
      toast.error(`Masih ada ${pendingDecisionCount} keputusan indikator yang belum dipilih. Centang hanya memilih untuk dibagikan, bukan menetapkan tercapai.`);
      return;
    }
    if (includeIndicators && selectedStudents.some(studentId => selectedIndicators.some(indicatorId => {
      const decision = decisions[studentId]?.[indicatorId];
      return decision && decision.status !== 'unassessed' &&
        (decision.criterion.trim().length < 5 || decision.note.trim().length < 8);
    }))) {
      toast.error('Untuk indikator Tercapai/Belum Tercapai, isi kriteria (minimal 5 karakter) dan catatan bukti (minimal 8 karakter).');
      return;
    }
    const confirmed = window.confirm(
      `Periksa keputusan Guru sebelum menerbitkan:\n` +
      `${selectedStudents.length} siswa, ${includeIndicators ? selectedIndicators.length : 0} indikator dipilih.\n` +
      `TERCAPAI: ${decisionCounts.met} | BELUM TERCAPAI: ${decisionCounts.notMet} | BELUM DINILAI: ${decisionCounts.unassessed}.\n\n` +
      `Centang indikator BUKAN penetapan Tercapai. Terbitkan keputusan ini kepada Wali Murid?`
    );
    if (!confirmed) return;

    publishLock.current = true;
    setPublishing(true);
    setPublishedSummary(null);
    try {
      const response = await fetch('/api/reports/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learning_session_id: selectedSessionId,
          student_ids: selectedStudents,
          indicator_ids: includeIndicators ? selectedIndicators : [],
          indicator_decisions: includeIndicators ? Object.fromEntries(selectedStudents.map(studentId => [studentId,
            Object.fromEntries(selectedIndicators.map(indicatorId => [indicatorId, decisions[studentId]?.[indicatorId]]))])) : {},
          include_assessments: includeAssessments,
          include_indicator_progress: includeIndicators,
          teacher_note: teacherNote,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Laporan gagal diterbitkan.');
      const saved = result.decision_counts as typeof decisionCounts | undefined;
      setPublishedSummary({ students: result.published_count, met: saved?.met ?? decisionCounts.met,
        notMet: saved?.notMet ?? decisionCounts.notMet, unassessed: saved?.unassessed ?? decisionCounts.unassessed });
      toast.success(`Tersimpan: ${saved?.met ?? decisionCounts.met} keputusan Tercapai, ${saved?.notMet ?? decisionCounts.notMet} Belum Tercapai.`);
      setTeacherNote('');
      setAttempt((value) => value + 1);
    } catch (publishError) {
      toast.error(publishError instanceof Error ? publishError.message : 'Laporan gagal diterbitkan.');
    } finally {
      publishLock.current = false;
      setPublishing(false);
    }
  };

  if (loading) return <div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#299C96]" /></div>;
  if (!user) return null;

  return (
    <DashboardLayout role="guru" user={user} onLogout={handleLogout} breadcrumbs={[{ label: 'Beranda', href: '/guru' }, { label: 'Laporan Pembelajaran' }]}>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#299C96]">Publikasi informasi belajar</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#17324D] sm:text-3xl">Laporan untuk wali murid</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#718096]">Tinjau informasi yang akan dibagikan. Laporan dibuat per siswa dan hanya dapat dibaca oleh wali murid yang telah terverifikasi.</p>
        </div>

        {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><span>{error}</span><Button type="button" variant="outline" onClick={() => setAttempt((value) => value + 1)}><RefreshCw className="mr-2 h-4 w-4"/>Coba lagi</Button></div>}
        <form onSubmit={handlePublish} className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-[#17324D]"><FileCheck2 className="h-5 w-5 text-[#299C96]" /> Pilih pembelajaran</CardTitle>
              <CardDescription>Pilih sesi yang memakai Modul Ajar yang sama dengan asesmen. Terbitkan nilai asesmen dari menu Asesmen terlebih dahulu, lalu tinjau laporan di sini.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="session">Sesi pembelajaran *</Label>
                <select id="session" required className="input w-full" value={selectedSessionId} onChange={(event) => setSelectedSessionId(event.target.value)}>
                  {sessions.length === 0 && <option value="">Belum ada sesi pembelajaran</option>}
                  {sessions.map((session) => <option key={session.id} value={session.id}>{session.date} · {session.classes.name} · {session.subjects.name} · {session.topic}</option>)}
                </select>
              </div>
              {selectedSession && (
                <p className="text-sm text-[#526C78]">Asesmen yang sudah diterbitkan dan terkait sesi/modul ini: <strong>{selectedSession.ready_assessments}</strong>. {selectedSession.ready_assessments === 0 ? 'Terbitkan hasil asesmen terlebih dahulu sebelum membuat laporan perkembangan.' : 'Tinjau hasil dan terbitkan laporan agar terlihat pada akun Wali Murid.'}</p>
              )}
              {selectedSession && selectedSession.published_count > 0 && (
                <div role="status" className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Sudah diterbitkan untuk <strong>{selectedSession.published_count} siswa</strong>{selectedSession.last_published_at ? ` · terakhir ${new Date(selectedSession.last_published_at).toLocaleString('id-ID')}` : ''}. Menerbitkan ulang akan memperbarui laporan siswa pada sesi ini.</span>
                </div>
              )}
              {selectedSession && (
                <div className="grid gap-3 rounded-xl border border-[#E4ECEF] bg-[#F8FBFC] p-4 sm:grid-cols-2">
                  <div><p className="text-[11px] font-semibold uppercase tracking-wide text-[#718096]">Kelas</p><p className="mt-1 text-sm font-bold text-[#17324D]">{selectedSession.classes.name}</p></div>
                  <div><p className="text-[11px] font-semibold uppercase tracking-wide text-[#718096]">Mata pelajaran</p><p className="mt-1 text-sm font-bold text-[#17324D]">{selectedSession.subjects.name}</p></div>
                  <div><p className="text-[11px] font-semibold uppercase tracking-wide text-[#718096]">Materi</p><p className="mt-1 text-sm font-bold text-[#17324D]">{selectedSession.topic}</p></div>
                  <div><p className="text-[11px] font-semibold uppercase tracking-wide text-[#718096]">Fase</p><p className="mt-1 text-sm font-bold text-[#17324D]">Fase {selectedSession.phase}</p></div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-[#17324D]">1. Pilih siswa penerima laporan</CardTitle>
              <CardDescription>Hanya laporan siswa yang dicentang yang akan diterbitkan atau diperbarui. Laporan siswa lain tidak berubah.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingChoices && <p className="text-sm text-[#526C78]">Memuat siswa dan indikator modul...</p>}
              {choicesError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{choicesError}</p>}
              {choices && <>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#17324D]">
                  <input type="checkbox" checked={choices.students.length > 0 && selectedStudents.length === choices.students.length}
                    onChange={(event) => setSelectedStudents(event.target.checked ? choices.students.map(item => item.id) : [])} />
                  Pilih semua siswa ({choices.students.length})
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {choices.students.map(student => <label key={student.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#E4ECEF] p-3 hover:border-[#B9DCD6]">
                    <input type="checkbox" className="mt-1" checked={selectedStudents.includes(student.id)} onChange={event => toggleStudent(student.id, event.target.checked)} />
                    <span className="text-sm text-[#29445A]">{student.full_name}
                      {choices.publishedStudents.includes(student.id) && <span className="ml-2 text-xs text-[#299C96]">Sudah pernah terbit</span>}
                    </span>
                  </label>)}
                </div>
                <p className="text-xs text-[#587286]">{selectedStudents.length} siswa dipilih.</p>
              </>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-[#17324D]">2. Pilih indikator dari Modul Ajar</CardTitle>
              <CardDescription>Indikator diambil dari CP/TP sesi atau Modul Ajar. Pilihan ini tidak otomatis menyatakan indikator tercapai.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {choices && choices.indicators.length === 0 && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Tidak ada indikator pada sesi atau Modul Ajar. Periksa isi modul sebelum menerbitkan perkembangan indikator.</p>}
              {choices && choices.indicators.length > 0 && <>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#17324D]">
                  <input type="checkbox" checked={selectedIndicators.length === choices.indicators.length}
                    onChange={event => setSelectedIndicators(event.target.checked ? choices.indicators.map(item => item.id) : [])} />
                  Pilih semua indikator ({choices.indicators.length})
                </label>
                {choices.indicators.map(indicator => {
                  const withEvidence = selectedStudents.filter(studentId => choices.evidence[studentId]?.includes(indicator.id)).length;
                  return <label key={indicator.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#E4ECEF] p-3 hover:border-[#B9DCD6]">
                    <input type="checkbox" checked={selectedIndicators.includes(indicator.id)} onChange={event => toggleIndicator(indicator.id, event.target.checked)} className="mt-1" />
                    <span className="space-y-1 text-sm text-[#29445A]">
                      <span className="block font-bold">{indicator.code} — {indicator.description}</span>
                      <span className="block text-xs text-[#718096]">Bukti asesmen yang dipetakan: {withEvidence} dari {selectedStudents.length} siswa terpilih. {withEvidence === 0 ? 'Belum cukup bukti.' : 'Tetap perlu peninjauan Guru.'}</span>
                    </span>
                  </label>;
                })}
              </>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-[#17324D]">3. Tinjau ketercapaian per siswa dan indikator</CardTitle>
              <CardDescription>WAJIB: Setelah mencentang indikator pada langkah 2, pilih keputusan untuk SETIAP siswa dan indikator di sini. Centang hanya memilih yang dibagikan, bukan menyatakan tercapai. Nilai 100/100 tidak otomatis menetapkan ketercapaian.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedStudents.length && <p className="text-sm text-[#587286]">Pilih siswa pada langkah 1 untuk menilai indikator.</p>}
              {includeIndicators && choices && selectedStudents.map(studentId => {
                const student = choices.students.find(item => item.id === studentId);
                return <div key={studentId} className="space-y-3 rounded-xl border border-[#DCEBE8] bg-[#F8FBFC] p-4">
                  <h3 className="font-bold text-[#17324D]">{student?.full_name || 'Siswa'}</h3>
                  {choices.indicators.filter(item => selectedIndicators.includes(item.id)).map(indicator => {
                    const current = decisions[studentId]?.[indicator.id] || { status: '' as const, criterion: '', note: '' };
                    const hasMappedEvidence = choices.evidence[studentId]?.includes(indicator.id);
                    return <div key={indicator.id} className={`space-y-2 rounded-lg border p-3 ${current.status ? 'border-[#B9DCD6] bg-white' : 'border-amber-300 bg-amber-50'}`}>
                      <p className="text-sm font-semibold text-[#17324D]">{indicator.code} — {indicator.description}</p>
                      <p className="text-xs text-[#587286]">{hasMappedEvidence ? 'Ada asesmen terbit yang dipetakan ke indikator ini.' : 'Belum ada asesmen terbit yang dipetakan khusus ke indikator ini. Guru dapat menggunakan bukti pengamatan tertulis.'}</p>
                      <label className="block text-xs font-semibold text-[#29445A]">Keputusan ketercapaian (wajib dipilih)
                        <select className="mt-1 w-full rounded-lg border border-[#C9DCE5] bg-white px-3 py-2 text-sm" value={current.status}
                          onChange={event => updateDecision(studentId, indicator.id, { status: event.target.value as TeacherDecision['status'] })}>
                          <option value="" disabled>— Pilih keputusan Guru —</option>
                          <option value="unassessed">Belum Dinilai — bukti belum cukup</option>
                          <option value="met">Tercapai</option>
                          <option value="not_met">Belum Tercapai</option>
                        </select>
                      </label>
                      {current.status !== '' && current.status !== 'unassessed' && <>
                        <label className="block text-xs font-semibold text-[#29445A]">Kriteria ketercapaian
                          <Input className="mt-1" maxLength={500} value={current.criterion} placeholder={indicator.criteria || 'Contoh: mampu menyelesaikan 4 dari 5 soal sesuai indikator'}
                            onChange={event => updateDecision(studentId, indicator.id, { criterion: event.target.value })}/>
                        </label>
                        <label className="block text-xs font-semibold text-[#29445A]">Catatan bukti / alasan penilaian
                          <Textarea className="mt-1" maxLength={1000} rows={2} value={current.note} placeholder="Tuliskan hasil pekerjaan, observasi, atau bukti yang mendasari keputusan Guru."
                            onChange={event => updateDecision(studentId, indicator.id, { note: event.target.value })}/>
                        </label>
                      </>}
                    </div>;
                  })}
                </div>;
              })}
              {includeIndicators && selectedDecisionRows.length > 0 && (
                <div role="status" className={`rounded-xl border p-4 text-sm ${pendingDecisionCount ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
                  <strong>Rekap keputusan Guru:</strong> {decisionCounts.met} Tercapai · {decisionCounts.notMet} Belum Tercapai · {decisionCounts.unassessed} Belum Dinilai
                  {pendingDecisionCount > 0 && <p className="mt-1 font-semibold">Masih {pendingDecisionCount} keputusan belum dipilih. Laporan belum bisa diterbitkan.</p>}
                </div>
              )}
              {!includeIndicators && <p className="text-sm text-[#587286]">Aktifkan Perkembangan indikator TP di bagian laporan jika ingin menerbitkan keputusan ketercapaian.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-[#17324D]">4. Bagian laporan</CardTitle>
              <CardDescription>Centang informasi yang sudah ditinjau dan boleh dibagikan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#E4ECEF] p-4 hover:border-[#B9DCD6]">
                <input type="checkbox" checked={includeAssessments} onChange={(event) => setIncludeAssessments(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-[#299C96] focus:ring-[#299C96]" />
                <span><span className="block text-sm font-bold text-[#29445A]">Hasil asesmen siswa</span><span className="mt-1 block text-xs leading-5 text-[#718096]">Hanya menampilkan nilai asesmen yang sudah dipublikasikan Guru dan terhubung ke modul/sesi yang dipilih.</span></span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#E4ECEF] p-4 hover:border-[#B9DCD6]">
                <input type="checkbox" checked={includeIndicators} onChange={(event) => setIncludeIndicators(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-[#299C96] focus:ring-[#299C96]" />
                <span><span className="block text-sm font-bold text-[#29445A]">Perkembangan indikator TP</span><span className="mt-1 block text-xs leading-5 text-[#718096]">Memakai indikator dari CP/TP kurikulum atau snapshot Modul Ajar. Indikator belum dinyatakan tercapai tanpa kriteria penilaian yang jelas.</span></span>
              </label>
              <div className="space-y-2 pt-2">
                <Label htmlFor="teacher_note">Catatan guru untuk wali murid (opsional)</Label>
                <Textarea id="teacher_note" value={teacherNote} onChange={(event) => setTeacherNote(event.target.value)} rows={4} maxLength={1500} placeholder="Tulis catatan yang jelas, konstruktif, dan membantu pendampingan belajar di rumah." />
                <p className="text-right text-[11px] text-[#8A9AA8]">{teacherNote.length}/1500 karakter</p>
              </div>
            </CardContent>
          </Card>

          {publishedSummary && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <strong>Keputusan berhasil diterbitkan untuk {publishedSummary.students} siswa.</strong>
            <p className="mt-1">Tercapai: {publishedSummary.met} · Belum Tercapai: {publishedSummary.notMet} · Belum Dinilai: {publishedSummary.unassessed}.</p>
            <p className="mt-1">Cek akun Wali Murid → Perkembangan Belajar. Jika ingin mengubah keputusan, pilih siswa lagi, tinjau status yang tersimpan, kemudian terbitkan ulang.</p>
          </div>}
          <div className="rounded-xl border border-[#DCEBE8] bg-[#F7FAF9] p-4 text-sm text-[#29445A]">
            <strong>Pratinjau cakupan:</strong> {selectedStudents.length} siswa · {includeIndicators ? selectedIndicators.length : 0} indikator · {selectedEvidence} pasangan siswa–indikator memiliki bukti asesmen yang dipetakan.
            <p className="mt-1 text-xs text-[#718096]">Tidak adanya bukti tidak akan disulap menjadi status tercapai. Periksa centang sebelum menerbitkan.</p>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-[#DCEBE8] bg-[#F2F8F7] p-4 text-sm leading-6 text-[#526C78]">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#299C96]" />
            <p>LENTERA tidak menerbitkan refleksi internal guru atau keluaran AI mentah. Laporan hanya berisi hasil asesmen, bukti indikator per siswa, dan catatan guru yang kamu pilih.</p>
          </div>

          {sessions.length === 0 && !error && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Belum ada sesi pembelajaran yang bisa diterbitkan. Buat sesi terlebih dahulu pada menu Analisis, lalu kembali ke halaman ini.</div>}
          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <Link href="/guru"><Button type="button" variant="outline" className="w-full sm:w-auto">Kembali ke beranda</Button></Link>
            <Button type="submit" disabled={publishing || sessions.length === 0 || loadingChoices || !choices || selectedStudents.length === 0 || (includeIndicators && (selectedIndicators.length === 0 || pendingDecisionCount > 0))} className="w-full gap-2 bg-[#17324D] hover:bg-[#245B7A] sm:w-auto">
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Terbitkan laporan
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
