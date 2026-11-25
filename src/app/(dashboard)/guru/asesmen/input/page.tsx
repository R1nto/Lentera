'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ClipboardCheck, Info, Loader2, Save } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

type UserProfile = { full_name: string; role: string; avatar_url?: string; email?: string };
type ClassOption = { id: string; name: string; grade: string };
type SubjectOption = { id: string; name: string };
type IndicatorOption = { id: string; code: string; description: string; criteria: string | null };
type ObjectiveOption = { id: string; code: string; description: string; learning_indicators: IndicatorOption[] };
type ModuleObjectiveSnapshot = { code: string; description: string; indicators: { code: string; description: string }[] };
type ModuleOption = { id: string; title: string; class_id: string | null; subject_id: string; learning_outcome_ids: string[]; learning_objective_ids: string[]; status: string; content?: unknown };

// Generated modules may contain TP/indicators as text (e.g. TP-01 / IND-01), not
// UUIDs in the school's curriculum catalog. Preserve these verbatim; never
// invent a curriculum UUID or silently match by vaguely similar descriptions.
function moduleTpSnapshot(content: unknown): ModuleObjectiveSnapshot[] {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return [];
  const root = content as Record<string, unknown>;
  const raw = root.learningObjectives;
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const row = item as Record<string, unknown>;
    const description = typeof row.description === 'string' ? row.description.trim() : '';
    if (!description) return [];
    const indicators = Array.isArray(row.indicators) ? row.indicators.flatMap((indicator, i) => {
      if (typeof indicator === 'string') return [{ code: `IND-${i + 1}`, description: indicator }];
      if (!indicator || typeof indicator !== 'object' || Array.isArray(indicator)) return [];
      const rec = indicator as Record<string, unknown>;
      const text = typeof rec.description === 'string' ? rec.description.trim() : '';
      return text ? [{ code: typeof rec.code === 'string' ? rec.code : `IND-${i + 1}`, description: text }] : [];
    }) : [];
    return [{ code: typeof row.code === 'string' ? row.code : `TP-${index + 1}`, description, indicators }];
  });
}
type SessionOption = { id: string; title: string; class_id: string; subject_id: string; module_id?: string | null };

export default function GuruAssessmentInputPage() {
  const router = useRouter();
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [classes, setClasses] = React.useState<ClassOption[]>([]);
  const [subjects, setSubjects] = React.useState<SubjectOption[]>([]);
  const [objectives, setObjectives] = React.useState<ObjectiveOption[]>([]);
  const [sessions, setSessions] = React.useState<SessionOption[]>([]);
  const [modules, setModules] = React.useState<ModuleOption[]>([]);
  const [assignments, setAssignments] = React.useState<{ class_id: string; subject_id: string | null }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [loadError, setLoadError] = React.useState('');
  const [form, setForm] = React.useState({
    title: '',
    description: '',
    class_id: '',
    subject_id: '',
    learning_session_id: '',
    module_id: '',
    learning_objective_id: '',
    type: 'formatif',
    date: (() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; })(),
    max_score: '100',
    minimum_score: '',
    achievement_threshold: '',
  });
  const [selectedIndicatorIds, setSelectedIndicatorIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setLoadError('');
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        router.replace('/pilih-peran');
        return;
      }

      const [{ data: profile }, { data: teacherClasses, error: assignmentError }, { data: allObjectives, error: objectiveError }, { data: teacherSessions }, { data: teacherModules, error: moduleError }] = await Promise.all([
        supabase.from('profiles').select('full_name, role, avatar_url').eq('id', authData.user.id).maybeSingle(),
        supabase.from('teacher_classes').select('class_id, subject_id').eq('teacher_id', authData.user.id),
        supabase.from('learning_objectives').select('id, code, description, learning_indicators(id, code, description, criteria)').order('code'),
        supabase.from('learning_sessions').select('id, title, class_id, subject_id, module_id').eq('teacher_id', authData.user.id).order('date', { ascending: false }),
        supabase.from('teaching_modules').select('id,title,class_id,subject_id,learning_outcome_ids,learning_objective_ids,status,content').eq('teacher_id', authData.user.id).order('created_at', { ascending: false }),
      ]);

      if (assignmentError || objectiveError || moduleError) {
        throw assignmentError || objectiveError || moduleError;
      }

      const classIds = Array.from(new Set((teacherClasses || []).map((row) => row.class_id).filter(Boolean)));
      const subjectIds = Array.from(new Set((teacherClasses || []).map((row) => row.subject_id).filter(Boolean)));
      // Homeroom assignments have subject_id = null and cover subjects in that class.
      const hasGeneralAssignment = (teacherClasses || []).some((row) => row.subject_id === null);
      const [{ data: classRows }, { data: subjectRows }] = await Promise.all([
        classIds.length
          ? supabase.from('classes').select('id, name, grade').in('id', classIds).order('name')
          : Promise.resolve({ data: [] as ClassOption[] }),
        hasGeneralAssignment
          ? supabase.from('subjects').select('id, name').order('name')
          : subjectIds.length
            ? supabase.from('subjects').select('id, name').in('id', subjectIds).order('name')
            : Promise.resolve({ data: [] as SubjectOption[] }),
      ]);

      if (!active) return;
      setUser({
        full_name: profile?.full_name || 'Guru',
        role: profile?.role || 'guru',
        avatar_url: profile?.avatar_url || undefined,
        email: authData.user.email || undefined,
      });
      setClasses((classRows || []) as ClassOption[]);
      setSubjects((subjectRows || []) as SubjectOption[]);
      setAssignments((teacherClasses || []) as { class_id: string; subject_id: string | null }[]);
      setObjectives((allObjectives || []) as unknown as ObjectiveOption[]);
      setSessions((teacherSessions || []) as SessionOption[]);
      setModules((teacherModules || []) as ModuleOption[]);
    };

    load()
      .catch((error) => {
        console.error('Load assessment form failed:', error);
        if (active) setLoadError('Data kelas atau mata pelajaran belum dapat dimuat. Periksa penugasan akun guru.');
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [router]);

  const selectedObjective = objectives.find((objective) => objective.id === form.learning_objective_id);
  const availableSubjects = subjects.filter((subject) => assignments.some((assignment) => assignment.class_id === form.class_id && (assignment.subject_id === null || assignment.subject_id === subject.id)));
  const matchingModules = modules.filter((module) => module.class_id === form.class_id && module.subject_id === form.subject_id);
  const selectedModule = modules.find((module) => module.id === form.module_id);
  const generatedModuleObjectives = selectedModule ? moduleTpSnapshot(selectedModule.content) : [];
  const linkedCurriculumObjectives = selectedModule?.learning_objective_ids?.length
    ? objectives.filter((objective) => selectedModule.learning_objective_ids.includes(objective.id))
    : [];
  // An assessment stores one curriculum TP UUID. Auto-attach only when unambiguous.
  const automaticObjective = form.module_id && linkedCurriculumObjectives.length === 1
    ? linkedCurriculumObjectives[0] : null;
  const effectiveIndicatorIds = form.module_id
    ? (automaticObjective?.learning_indicators || []).map((item) => item.id)
    : selectedIndicatorIds;
  const moduleHasTp = generatedModuleObjectives.length > 0 || linkedCurriculumObjectives.length > 0;
  const matchingSessions = sessions.filter((session) =>
    (!form.module_id || !session.module_id || session.module_id === form.module_id) &&
    (!form.class_id || session.class_id === form.class_id) &&
    (!form.subject_id || session.subject_id === form.subject_id),
  );

  const setField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === 'class_id') {
      setForm((current) => ({ ...current, class_id: value, subject_id: '', learning_session_id: '', module_id: '', learning_objective_id: '' }));
    } else if (field === 'subject_id') {
      setForm((current) => ({ ...current, subject_id: value, learning_session_id: '', module_id: '', learning_objective_id: '' }));
    }
    if (field === 'class_id' || field === 'subject_id') setSelectedIndicatorIds([]);
    if (field === 'module_id') {
      setSelectedIndicatorIds([]);
      setForm((current) => ({ ...current, module_id: value, learning_objective_id: '', learning_session_id: '' }));
    }
    if (field === 'learning_objective_id') {
      const objective = objectives.find((item) => item.id === value);
      setSelectedIndicatorIds(objective?.learning_indicators?.map((indicator) => indicator.id) || []);
    }
  };

  const toggleIndicator = (indicatorId: string) => {
    setSelectedIndicatorIds((current) => current.includes(indicatorId)
      ? current.filter((id) => id !== indicatorId)
      : [...current, indicatorId]);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/pilih-peran');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const maxScore = Number(form.max_score);
    const minimumScore = Number(form.minimum_score);
    const achievementThreshold = Number(form.achievement_threshold);

    if (form.module_id && !matchingModules.some((module) => module.id === form.module_id)) { toast.error('Modul tidak sesuai kelas atau mata pelajaran.'); return; }
    if (form.learning_session_id && sessions.find(session => session.id === form.learning_session_id)?.module_id && sessions.find(session => session.id === form.learning_session_id)?.module_id !== (form.module_id || null)) { toast.error('Sesi ini menggunakan Modul Ajar lain.'); return; }
    if (form.module_id && !moduleHasTp) { toast.error('Modul Ajar ini belum memiliki TP yang dapat digunakan. Lengkapi modul terlebih dahulu.'); return; }
    if (!form.class_id || !form.subject_id || (!form.module_id && (!form.learning_objective_id || selectedIndicatorIds.length === 0))) {
      toast.error('Lengkapi kelas dan mata pelajaran serta TP/indikator untuk asesmen mandiri.');
      return;
    }
    if (!Number.isFinite(maxScore) || maxScore <= 0 || !Number.isFinite(minimumScore) || minimumScore < 0 || minimumScore > maxScore) {
      toast.error('Nilai minimum harus berada di antara 0 dan skor maksimum.');
      return;
    }
    if (!Number.isFinite(achievementThreshold) || achievementThreshold < 0 || achievementThreshold > 100) {
      toast.error('Target persentase harus berada di antara 0 dan 100.');
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) throw new Error('Sesi login berakhir. Silakan masuk kembali.');

      const { error } = await supabase.from('assessment_activities').insert({
        teacher_id: authData.user.id,
        class_id: form.class_id,
        subject_id: form.subject_id,
        learning_session_id: form.learning_session_id || null,
        module_id: form.module_id || null,
        learning_objective_id: form.module_id ? (automaticObjective?.id || null) : form.learning_objective_id,
        learning_indicator_ids: effectiveIndicatorIds,
        module_tp_snapshot: form.module_id ? (generatedModuleObjectives.length ? generatedModuleObjectives : linkedCurriculumObjectives.map(tp => ({ code: tp.code, description: tp.description, indicators: tp.learning_indicators.map(ind => ({ code: ind.code, description: ind.description })) }))) : [],
        title: form.title.trim(),
        description: form.description.trim() || null,
        type: form.type,
        max_score: maxScore,
        minimum_score: minimumScore,
        achievement_threshold: achievementThreshold,
        date: form.date,
      });

      if (error) throw error;
      toast.success('Asesmen berhasil disimpan. Selanjutnya masukkan nilai peserta didik.');
      router.push('/guru/asesmen');
      router.refresh();
    } catch (error) {
      console.error('Save assessment failed:', error);
      toast.error(error instanceof Error ? error.message : 'Asesmen gagal disimpan.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#299C96]" /></div>;
  }
  if (!user) return null;

  return (
    <DashboardLayout
      role="guru"
      user={user}
      onLogout={handleLogout}
      breadcrumbs={[
        { label: 'Beranda', href: '/guru' },
        { label: 'Asesmen', href: '/guru/asesmen' },
        { label: 'Input Asesmen Baru' },
      ]}
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-start gap-3">
          <Link href="/guru/asesmen" aria-label="Kembali ke daftar asesmen" className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#E1E9ED] bg-white text-[#476175] transition hover:border-[#299C96] hover:text-[#217D77]">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#299C96]">Pengelolaan asesmen</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#17324D] sm:text-3xl">Buat asesmen baru</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#718096]">Hubungkan kegiatan asesmen dengan TP dan indikator yang dinilai. Kriteria angka harus ditentukan guru sebelum analisis ketercapaian dijalankan.</p>
          </div>
        </div>

        {loadError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError}</div>}
        {classes.length === 0 && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Akun ini belum memiliki penugasan kelas. Hubungi pengelola sekolah untuk mengatur kelas dan mata pelajaran.</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-[#17324D]"><ClipboardCheck className="h-5 w-5 text-[#299C96]" /> Identitas asesmen</CardTitle>
              <CardDescription>Informasi dasar kegiatan asesmen.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="title">Nama asesmen *</Label>
                <Input id="title" required maxLength={140} value={form.title} onChange={(event) => setField('title', event.target.value)} placeholder="Contoh: Kuis pemahaman pecahan" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Jenis asesmen *</Label>
                <select id="type" required className="input w-full" value={form.type} onChange={(event) => setField('type', event.target.value)}>
                  <option value="formatif">Formatif</option>
                  <option value="sumatif">Sumatif</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Tanggal *</Label>
                <Input id="date" type="date" required value={form.date} onChange={(event) => setField('date', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class_id">Kelas *</Label>
                <select id="class_id" required className="input w-full" value={form.class_id} onChange={(event) => setField('class_id', event.target.value)}>
                  <option value="">Pilih kelas</option>
                  {classes.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.grade}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject_id">Mata pelajaran *</Label>
                <select id="subject_id" required className="input w-full" value={form.subject_id} onChange={(event) => setField('subject_id', event.target.value)}>
                  <option value="">Pilih mata pelajaran</option>
                  {availableSubjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="module_id">Modul Ajar yang digunakan (pilihan Guru)</Label>
                <select id="module_id" className="input w-full" value={form.module_id} onChange={(event) => setField('module_id', event.target.value)}>
                  <option value="">Asesmen mandiri — tanpa Modul Ajar</option>
                  {matchingModules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}
                </select>
                {form.class_id && form.subject_id && matchingModules.length === 0 && <p className="text-xs text-amber-700">Belum ada Modul Ajar untuk kelas dan pelajaran ini. Asesmen mandiri tetap tersedia.</p>}
                {selectedModule && <p className="text-xs text-[#476175]">TP dan indikator diambil otomatis dari isi Modul Ajar. Tidak perlu memilih TP lagi.</p>}
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="learning_session_id">Sesi pembelajaran terkait</Label>
                <select id="learning_session_id" className="input w-full" value={form.learning_session_id} onChange={(event) => setField('learning_session_id', event.target.value)}>
                  <option value="">Tidak menghubungkan sesi tertentu</option>
                  {matchingSessions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="description">Deskripsi atau petunjuk (opsional)</Label>
                <Textarea id="description" rows={3} value={form.description} onChange={(event) => setField('description', event.target.value)} placeholder="Jelaskan cakupan materi atau petunjuk pelaksanaan asesmen." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-[#17324D]">Pemetaan tujuan dan indikator</CardTitle>
              <CardDescription>{form.module_id ? 'Otomatis mengikuti Modul Ajar yang dipilih.' : 'Pilih TP dan indikator untuk asesmen mandiri.'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.module_id ? (
                <div className="rounded-xl border border-[#CFE6DE] bg-[#F4FBF8] p-4 space-y-3">
                  <p className="text-sm font-bold text-[#17324D]">TP dan indikator dari Modul Ajar</p>
                  {generatedModuleObjectives.length > 0 ? generatedModuleObjectives.map((tp, index) => (
                    <div key={`${tp.code}-${index}`} className="rounded-lg border border-[#E0EDE9] bg-white p-3 space-y-2">
                      <p className="text-sm font-semibold text-[#17324D]">{tp.code} — {tp.description}</p>
                      {tp.indicators.length ? <ul className="list-disc pl-5 text-sm text-[#476175] space-y-1">{tp.indicators.map((ind, i) => <li key={i}>{ind.code}: {ind.description}</li>)}</ul> : <p className="text-xs text-amber-700">Belum ada indikator tertulis dalam modul ini.</p>}
                    </div>
                  )) : linkedCurriculumObjectives.map(tp => (
                    <div key={tp.id} className="rounded-lg border border-[#E0EDE9] bg-white p-3 space-y-2">
                      <p className="text-sm font-semibold text-[#17324D]">{tp.code} — {tp.description}</p>
                      <ul className="list-disc pl-5 text-sm text-[#476175]">{tp.learning_indicators.map(ind => <li key={ind.id}>{ind.code}: {ind.description}</li>)}</ul>
                    </div>
                  ))}
                  {!moduleHasTp && <p className="text-sm text-amber-800">TP belum tersedia pada modul ini. Tambahkan TP pada Modul Ajar terlebih dahulu.</p>}
                  {moduleHasTp && !automaticObjective && <p className="text-xs text-amber-800">TP dari modul tersimpan sebagai snapshot. TP ini belum tertaut ke ID TP kurikulum, sehingga analisis ketercapaian per TP belum dapat dihitung otomatis sampai dilakukan pemetaan kurikulum.</p>}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="learning_objective_id">Tujuan Pembelajaran (TP) *</Label>
                    <select id="learning_objective_id" required className="input w-full" value={form.learning_objective_id} onChange={(event) => setField('learning_objective_id', event.target.value)}>
                      <option value="">Pilih TP</option>
                      {objectives.map((item) => <option key={item.id} value={item.id}>{item.code} — {item.description}</option>)}
                    </select>
                  </div>
                  {selectedObjective && (
                    <div className="rounded-xl border border-[#E4ECEF] bg-[#F8FBFC] p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-[#17324D]">Indikator yang dinilai</p>
                        <span className="text-xs text-[#718096]">{selectedIndicatorIds.length} dipilih</span>
                      </div>
                      <div className="space-y-2">
                        {selectedObjective.learning_indicators.map((indicator) => (
                          <label key={indicator.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#E6EDF0] bg-white p-3 transition hover:border-[#B9DCD6]">
                            <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-[#299C96] focus:ring-[#299C96]" checked={selectedIndicatorIds.includes(indicator.id)} onChange={() => toggleIndicator(indicator.id)} />
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-[#29445A]">{indicator.code}</span>
                              <span className="mt-0.5 block text-sm text-[#607487]">{indicator.description}</span>
                              {indicator.criteria && <span className="mt-1 block text-xs text-[#718096]">Kriteria: {indicator.criteria}</span>}
                            </span>
                          </label>
                        ))}
                      </div>
                      {selectedObjective.learning_indicators.length === 0 && <p className="text-sm text-amber-700">TP ini belum memiliki indikator. Tambahkan indikator terlebih dahulu sebelum membuat asesmen.</p>}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-[#17324D]">Kriteria penilaian</CardTitle>
              <CardDescription>Nilai dan target berikut akan digunakan sebagai dasar perhitungan ketercapaian.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="max_score">Skor maksimum *</Label>
                <Input id="max_score" type="number" min="1" step="1" required value={form.max_score} onChange={(event) => setField('max_score', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimum_score">Skor minimum tercapai *</Label>
                <Input id="minimum_score" type="number" min="0" step="0.01" required value={form.minimum_score} onChange={(event) => setField('minimum_score', event.target.value)} placeholder="Contoh: 70" />
                <p className="text-xs text-[#718096]">Batas skor siswa yang memenuhi kriteria.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="achievement_threshold">Target siswa tercapai (%) *</Label>
                <Input id="achievement_threshold" type="number" min="0" max="100" step="0.01" required value={form.achievement_threshold} onChange={(event) => setField('achievement_threshold', event.target.value)} placeholder="Contoh: 75" />
                <p className="text-xs text-[#718096]">Target minimal persentase siswa yang memenuhi kriteria.</p>
              </div>
              <div className="sm:col-span-3 flex items-start gap-2 rounded-xl bg-[#F2F8F7] p-3 text-xs leading-5 text-[#526C78]">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#299C96]" />
                <p>Jika kriteria numerik belum diisi atau data asesmen tidak lengkap, LENTERA tidak akan membuat persentase ketercapaian secara otomatis. Guru tetap meninjau bukti dan menentukan tindak lanjut.</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <Link href="/guru/asesmen"><Button type="button" variant="outline" className="w-full sm:w-auto">Batal</Button></Link>
            <Button type="submit" disabled={saving || classes.length === 0} className="w-full gap-2 bg-[#17324D] hover:bg-[#245B7A] sm:w-auto">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan asesmen
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
