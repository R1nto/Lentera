'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calendar, Clock, Save, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface CreateSessionPageData {
  classes: { id: string; name: string; grade: string }[];
  subjects: { id: string; name: string; phase: string[] }[];
  user: {
    full_name: string;
    role: string;
    avatar_url?: string;
    email?: string;
  };
}

export default function GuruAnalisisBuatPage() {
  const [pageData, setPageData] = React.useState<any>(null);
  const [loadError, setLoadError] = React.useState<string | false>(false);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {

  const response = await fetch('/api/teacher/setup', { cache: 'no-store' });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Tidak dapat memuat kelas dan mata pelajaran.');
  }
  const pageData: CreateSessionPageData = {
    classes: result.classes || [],
    subjects: result.subjects || [],
    user: result.profile || { full_name: 'Guru', role: 'guru' },
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

  return <CreateSessionContent data={pageData} />;
}

type ModuleCurriculumText = { cp: { code: string; description: string }[]; tp: { code: string; description: string; indicators: { code: string; description: string }[] }[] };

// AI-generated module text is not automatically a curriculum UUID. Keep the
// visible CP/TP as a snapshot, rather than inventing matching database IDs.
function extractModuleCurriculum(content: unknown): ModuleCurriculumText {
  const empty: ModuleCurriculumText = { cp: [], tp: [] };
  if (!content || typeof content !== 'object' || Array.isArray(content)) return empty;
  const source = content as Record<string, unknown>;
  const readRows = (a: string, b: string) => {
    const value = source[a] ?? source[b];
    return Array.isArray(value) ? value : [];
  };
  const toRecord = (item: unknown): Record<string, unknown> | null =>
    item && typeof item === 'object' && !Array.isArray(item) ? item as Record<string, unknown> : null;
  const stringValue = (item: unknown) => typeof item === 'string' ? item.trim() : '';
  const cp = readRows('learningOutcomes', 'learning_outcomes').flatMap((value, i) => {
    const row = toRecord(value);
    const description = row ? stringValue(row.description) : stringValue(value);
    return description ? [{ code: row ? stringValue(row.code) || `CP-${i + 1}` : `CP-${i + 1}`, description }] : [];
  });
  const tp = readRows('learningObjectives', 'learning_objectives').flatMap((value, i) => {
    const row = toRecord(value);
    const description = row ? stringValue(row.description) : stringValue(value);
    if (!description) return [];
    const indicators = (row && Array.isArray(row.indicators) ? row.indicators : []).flatMap((value, j) => {
      const indicator = toRecord(value);
      const description = indicator ? stringValue(indicator.description) : stringValue(value);
      return description ? [{ code: indicator ? stringValue(indicator.code) || `IND-${j + 1}` : `IND-${j + 1}`, description }] : [];
    });
    return [{ code: row ? stringValue(row.code) || `TP-${i + 1}` : `TP-${i + 1}`, description, indicators }];
  });
  return { cp, tp };
}

// Use the same AI module content saved in teaching_modules.content to prepare
// an editable learning-session plan. Never invent missing module details.
type ModuleSessionDetails = {
  description: string;
  materials: string;
  learning_methods: string;
  learning_models: string;
  media: string;
  assessment_plan: string;
};

function extractModuleSessionDetails(content: unknown): ModuleSessionDetails {
  const empty: ModuleSessionDetails = {
    description: '', materials: '', learning_methods: '',
    learning_models: '', media: '', assessment_plan: '',
  };
  if (!content || typeof content !== 'object' || Array.isArray(content)) return empty;
  const c = content as Record<string, unknown>;
  const read = (...keys: string[]) => {
    for (const key of keys) if (c[key] !== undefined && c[key] !== null) return c[key];
    return undefined;
  };
  const text = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
  const textItems = (value: unknown): string[] => {
    if (typeof value === 'string') return value.trim() ? [value.trim()] : [];
    if (!Array.isArray(value)) return [];
    return value.flatMap(item => {
      if (typeof item === 'string') return item.trim() ? [item.trim()] : [];
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const row = item as Record<string, unknown>;
        const label = text(row.description) || text(row.name) || text(row.title);
        return label ? [label] : [];
      }
      return [];
    });
  };
  const activities = read('learningActivities', 'learning_activities');
  const activityParts = activities && typeof activities === 'object' && !Array.isArray(activities)
    ? activities as Record<string, unknown> : {};
  const activitySummary = (key: string, fallback: string) => {
    const raw = activityParts[key] ?? activityParts[fallback];
    const steps = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return steps.flatMap(step => {
      if (typeof step === 'string') return step.trim() ? [step.trim()] : [];
      if (!step || typeof step !== 'object' || Array.isArray(step)) return [];
      const row = step as Record<string, unknown>;
      const brief = text(row.description);
      return brief ? [brief] : [];
    }).join('; ');
  };
  const topic = text((c.identity && typeof c.identity === 'object' && !Array.isArray(c.identity)
    ? (c.identity as Record<string, unknown>).topic : undefined));
  const understanding = textItems(read('meaningfulUnderstanding', 'meaningful_understanding'));
  const summary = [topic && `Topik: ${topic}`, understanding.length ? understanding.join(' ') : '',
    ...(['introduction', 'main', 'closing'] as const).map((part, i) => {
      const value = activitySummary(part, part === 'introduction' ? 'pendahuluan' : part === 'main' ? 'inti' : 'penutup');
      return value ? `${['Pendahuluan', 'Inti', 'Penutup'][i]}: ${value}` : '';
    }),
  ].filter(Boolean).join('\n');
  const rawAssessments = read('assessments', 'assessment');
  const assessments: string[] = [];
  const addAssessment = (label: string, raw: unknown) => {
    const rows = Array.isArray(raw) ? raw : raw ? [raw] : [];
    rows.forEach(row => {
      if (typeof row === 'string' && row.trim()) { assessments.push(`${label}: ${row.trim()}`); return; }
      if (!row || typeof row !== 'object' || Array.isArray(row)) return;
      const item = row as Record<string, unknown>;
      const name = text(item.name);
      const type = text(item.type);
      const technique = text(item.technique);
      const instrument = text(item.instrument);
      const rubric = text(item.rubric);
      const indicators = textItems(item.relatedIndicatorIds ?? item.related_indicator_ids);
      const details = [name, type, technique && `Teknik: ${technique}`,
        instrument && `Instrumen: ${instrument}`, rubric && `Rubrik: ${rubric}`,
        indicators.length && `Indikator: ${indicators.join(', ')}`].filter(Boolean).join(' — ');
      if (details) assessments.push(`${label}: ${details}`);
    });
  };
  if (Array.isArray(rawAssessments)) addAssessment('Asesmen', rawAssessments);
  else if (rawAssessments && typeof rawAssessments === 'object') {
    const sections = rawAssessments as Record<string, unknown>;
    addAssessment('Diagnostik', sections.diagnostic ?? sections.diagnostik);
    addAssessment('Formatif', sections.formative ?? sections.formatif);
    addAssessment('Sumatif', sections.summative ?? sections.sumatif);
  }
  return {
    description: summary.slice(0, 1800),
    materials: textItems(read('learningMaterials', 'learning_materials')).join('\n').slice(0, 1800),
    learning_methods: textItems(read('learningMethods', 'learning_methods')).join(', ').slice(0, 800),
    learning_models: text(read('learningModel', 'learning_model')).slice(0, 800),
    media: textItems(read('learningMedia', 'learning_media', 'media')).join(', ').slice(0, 800),
    assessment_plan: assessments.join('\n').slice(0, 2900),
  };
}

function CreateSessionContent({ data }: { data: CreateSessionPageData }) {
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/pilih-peran';
  };

  const [modules, setModules] = useState<{ id: string; title: string; class_id: string | null; subject_id: string; learning_outcome_ids: string[]; learning_objective_ids: string[]; content?: unknown }[]>([]);
  const [moduleError, setModuleError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    class_id: '',
    subject_id: '',
    module_id: '',
    phase: 'A',
    date: new Date().toISOString().split('T')[0],
    duration_minutes: 90,
    learning_outcome_ids: [] as string[],
    learning_objective_ids: [] as string[],
    description: '',
    materials: '',
    learning_methods: '',
    learning_models: '',
    media: '',
    assessment_plan: '',
  });

  React.useEffect(() => {
    let active = true;
    const loadModules = async () => {
      const db = createClient();
      const { data: { user } } = await db.auth.getUser();
      if (!user) return;
      const { data, error } = await db.from('teaching_modules')
        .select('id,title,class_id,subject_id,learning_outcome_ids,learning_objective_ids,content')
        .eq('teacher_id', user.id).order('created_at', { ascending: false });
      if (!active) return;
      if (error) setModuleError('Daftar Modul Ajar tidak dapat dimuat. ' + error.message);
      else setModules(data || []);
    };
    void loadModules();
    return () => { active = false; };
  }, []);
  const matchingModules = modules.filter(module => module.class_id === formData.class_id && module.subject_id === formData.subject_id);
  const selectedModule = modules.find(module => module.id === formData.module_id);
  const moduleCurriculum = extractModuleCurriculum(selectedModule?.content);
  const chooseModule = (moduleId: string) => {
    const module = matchingModules.find(item => item.id === moduleId);
    // Only populate valid curriculum UUIDs; generated module CP/TP is shown separately.
    const validCpIds = (module?.learning_outcome_ids || []).filter(id => outcomes.some(cp => cp.id === id));
    const validTpIds = (module?.learning_objective_ids || []).filter(id => objectives.some(tp => tp.id === id && validCpIds.includes(tp.learning_outcome_id)));
    // Prefill once on selection, rather than inside an effect: no render/fetch loop.
    // Guru can edit every field after the values have been copied.
    const details = module ? extractModuleSessionDetails(module.content) : {
      description: '', materials: '', learning_methods: '',
      learning_models: '', media: '', assessment_plan: '',
    };
    setFormData(prev => ({ ...prev, module_id: moduleId,
      learning_outcome_ids: validCpIds, learning_objective_ids: validTpIds,
      ...details,
    }));
  };

  const [outcomes, setOutcomes] = useState<{ id: string; code: string; description: string }[]>([]);
  const [objectives, setObjectives] = useState<{ id: string; code: string; description: string; learning_outcome_id: string }[]>([]);
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [curriculumError, setCurriculumError] = useState('');
  const [newCpCode, setNewCpCode] = useState('');
  const [newCpDescription, setNewCpDescription] = useState('');
  const [newTpCode, setNewTpCode] = useState('');
  const [newTpDescription, setNewTpDescription] = useState('');
  const [selectedCpForTp, setSelectedCpForTp] = useState('');
  const [savingCurriculum, setSavingCurriculum] = useState(false);
  const [curriculumRevision, setCurriculumRevision] = useState(0);

  React.useEffect(() => {
    let active = true;
    setOutcomes([]);
    setObjectives([]);
    setCurriculumError('');
    if (!formData.class_id || !formData.subject_id) return () => { active = false; };
    setCurriculumLoading(true);
    const params = new URLSearchParams({ class_id: formData.class_id, subject_id: formData.subject_id });
    fetch(`/api/teacher/curriculum?${params.toString()}`, { cache: 'no-store' })
      .then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gagal mengambil data kurikulum.');
        return result;
      })
      .then(result => {
        if (!active) return;
        setOutcomes(result.outcomes || []);
        setObjectives(result.objectives || []);
      })
      .catch(error => {
        if (active) setCurriculumError(error instanceof Error ? error.message : 'Gagal mengambil CP/TP.');
      })
      .finally(() => { if (active) setCurriculumLoading(false); });
    return () => { active = false; };
  }, [formData.class_id, formData.subject_id, curriculumRevision]);

  async function saveCurriculum(kind: 'cp' | 'tp') {
    setCurriculumError('');
    setSavingCurriculum(true);
    try {
      const payload = kind === 'cp'
        ? { kind, class_id: formData.class_id, subject_id: formData.subject_id, code: newCpCode, description: newCpDescription }
        : { kind, class_id: formData.class_id, subject_id: formData.subject_id, learning_outcome_id: selectedCpForTp, code: newTpCode, description: newTpDescription };
      const response = await fetch('/api/teacher/curriculum', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), cache: 'no-store',
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menyimpan data kurikulum.');
      if (kind === 'cp') { setNewCpCode(''); setNewCpDescription(''); }
      else { setNewTpCode(''); setNewTpDescription(''); }
      setCurriculumRevision(value => value + 1);
    } catch (error) {
      setCurriculumError(error instanceof Error ? error.message : 'Gagal menyimpan CP/TP.');
    } finally { setSavingCurriculum(false); }
  }

  const phaseForGrade = (grade: string) => grade === '1' || grade === '2' ? 'A' : grade === '3' || grade === '4' ? 'B' : 'C';
  const onClassChange = (classId: string) => {
    const selected = data.classes.find(c => c.id === classId);
    setFormData(prev => ({ ...prev, class_id: classId,
      phase: selected ? phaseForGrade(String(selected.grade)) : 'A',
      subject_id: '', module_id: '', learning_outcome_ids: [], learning_objective_ids: [] }));
    setSelectedCpForTp('');
  };
  const onSubjectChange = (subjectId: string) => {
    setFormData(prev => ({ ...prev, subject_id: subjectId,
      module_id: '', learning_outcome_ids: [], learning_objective_ids: [] }));
    setSelectedCpForTp('');
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.module_id && !selectedModule) {
      setSubmitError('Modul Ajar yang dipilih tidak tersedia. Pilih kembali.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const notes = [
        formData.description && `Deskripsi: ${formData.description}`,
        formData.materials && `Materi: ${formData.materials}`,
        formData.learning_methods && `Metode: ${formData.learning_methods}`,
        formData.learning_models && `Model: ${formData.learning_models}`,
        formData.media && `Media: ${formData.media}`,
        formData.assessment_plan && `Rencana asesmen: ${formData.assessment_plan}`,
      ].filter(Boolean).join('\n\n');
      const response = await fetch('/api/teacher/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, notes }),
        cache: 'no-store',
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menyimpan pembelajaran.');

      window.location.href = '/guru/analisis';
    } catch (error) {
      console.error('Error creating session:', error);
      setSubmitError(error instanceof Error ? error.message : 'Gagal membuat pembelajaran. Periksa data dan izin database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredObjectives = objectives.filter(
    obj => formData.learning_outcome_ids.includes(obj.learning_outcome_id)
  );

  return (
    <DashboardLayout
      role="guru"
      user={data.user}
      onLogout={handleLogout}
      breadcrumbs={[
        { label: 'Beranda', href: '/guru' },
        { label: 'Analisis Ketercapaian', href: '/guru/analisis' },
        { label: 'Buat Pembelajaran Baru' },
      ]}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-4 animate-fade-in">
          <Link href="/guru/analisis" className="btn btn-ghost btn-icon" aria-label="Kembali">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="heading-2">Buat Pembelajaran Baru</h1>
            <p className="body mt-1">Isi identitas pembelajaran dan pilih CP/TP yang akan diajarkan</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {submitError && <div role="alert" className="page-error">{submitError}</div>}
          {/* Identitas Pembelajaran */}
          <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="card-header">
              <h2 className="card-title">Identitas Pembelajaran</h2>
            </div>
            <div className="card-content space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="title">Judul Pembelajaran *</Label>
                  <Input
                    id="title"
                    placeholder="Contoh: Pembelajaran Pecahan - Penjumlahan dan Pengurangan"
                    value={formData.title}
                    onChange={e => handleChange('title', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="topic">Topik / Materi *</Label>
                  <Input
                    id="topic"
                    placeholder="Contoh: Penjumlahan dan Pengurangan Pecahan"
                    value={formData.topic}
                    onChange={e => handleChange('topic', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <Label htmlFor="class_id">Kelas *</Label>
                  <Select value={formData.class_id} onValueChange={onClassChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} ({cls.grade})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subject_id">Mata Pelajaran *</Label>
                  <Select value={formData.subject_id} onValueChange={onSubjectChange} disabled={!formData.class_id || !data.subjects.length}>
                    <SelectTrigger>
                      <SelectValue placeholder={data.subjects.length === 0 ? 'Belum ada mata pelajaran' : !formData.class_id ? 'Pilih kelas dahulu' : 'Pilih mata pelajaran'} />
                    </SelectTrigger>
                    <SelectContent>
                      {data.subjects.filter(sub => sub.phase.includes(formData.phase)).map(sub => (
                        <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {data.subjects.length === 0 && (
                    <p role="status" className="mt-2 text-sm text-amber-800">
                      Belum ada mata pelajaran. Minta pengelola database menjalankan migrasi 020 (katalog mata pelajaran SD), lalu klik Coba lagi.
                    </p>
                  )}
                  {formData.class_id && data.subjects.length > 0 &&
                   !data.subjects.some(sub => sub.phase.includes(formData.phase)) && (
                    <p role="status" className="mt-2 text-sm text-amber-800">Belum ada mata pelajaran untuk fase kelas ini. Periksa katalog sekolah.</p>
                  )}
                </div>
                <div className="sm:col-span-2 rounded-xl border border-teal-200 bg-teal-50/50 p-4 space-y-2">
                  <Label htmlFor="module_id">Gunakan Modul Ajar (opsional)</Label>
                  <select id="module_id" className="input w-full" value={formData.module_id} onChange={e => chooseModule(e.target.value)}>
                    <option value="">Pembelajaran mandiri — tanpa modul</option>
                    {matchingModules.map(module => <option key={module.id} value={module.id}>{module.title}</option>)}
                  </select>
                  {moduleError && <p className="text-sm text-rose-700">{moduleError}</p>}
                  <p className="text-xs text-slate-600">Jika memilih Modul Ajar, CP dan TP akan otomatis diambil dari isi modul. Tanpa modul, Guru dapat memilih CP/TP kurikulum secara manual.</p>
                </div>
                <div>
                  <Label htmlFor="phase">Fase SD *</Label>
                  <Input id="phase" value={`Fase ${formData.phase} (${formData.phase === 'A' ? 'Kelas 1–2' : formData.phase === 'B' ? 'Kelas 3–4' : 'Kelas 5–6'})`} readOnly aria-readonly="true" />
                </div>
                <div>
                  <Label htmlFor="date">Tanggal *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={e => handleChange('date', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="duration_minutes">Durasi (Menit) *</Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    min="1"
                    value={formData.duration_minutes}
                    onChange={e => handleChange('duration_minutes', parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>
            </div>
          </Card>

          {formData.module_id ? (
            <>
              <Card className="animate-fade-in">
                <div className="card-header">
                  <h2 className="card-title">Capaian Pembelajaran (CP) dari Modul Ajar</h2>
                  <p className="caption">Otomatis dari modul terpilih, tanpa memilih CP ulang</p>
                </div>
                <div className="card-content space-y-3">
                  {moduleCurriculum.cp.length ? moduleCurriculum.cp.map((cp, i) => (
                    <div key={`${cp.code}-${i}`} className="rounded-xl border border-teal-200 bg-teal-50/50 p-3">
                      <p className="font-semibold text-navy-950">{cp.code}</p>
                      <p className="mt-1 text-sm text-navy-700">{cp.description}</p>
                    </div>
                  )) : <p className="text-sm text-amber-800">Modul ini belum menyimpan uraian CP. Periksa Modul Ajar sebelum membuat analisis.</p>}
                </div>
              </Card>
              <Card className="animate-fade-in">
                <div className="card-header">
                  <h2 className="card-title">Tujuan Pembelajaran (TP) dari Modul Ajar</h2>
                  <p className="caption">Indikator juga ditampilkan otomatis</p>
                </div>
                <div className="card-content space-y-3">
                  {moduleCurriculum.tp.length ? moduleCurriculum.tp.map((tp, i) => (
                    <div key={`${tp.code}-${i}`} className="rounded-xl border border-sky-200 bg-sky-50/50 p-3 space-y-2">
                      <p className="font-semibold text-navy-950">{tp.code}: {tp.description}</p>
                      {tp.indicators.length > 0 && <ul className="list-disc pl-5 space-y-1 text-sm text-navy-700">
                        {tp.indicators.map((indicator, j) => <li key={`${indicator.code}-${j}`}>{indicator.code}: {indicator.description}</li>)}
                      </ul>}
                    </div>
                  )) : <p className="text-sm text-amber-800">Modul ini belum menyimpan TP. Periksa Modul Ajar sebelum membuat analisis.</p>}
                  <p className="text-xs text-slate-600">CP, TP, dan indikator disimpan sebagai salinan pada sesi pembelajaran. ID kurikulum hanya digunakan apabila benar-benar cocok; tidak dipasangkan berdasarkan kemiripan teks.</p>
                </div>
              </Card>
            </>
          ) : (
            <>
          {/* Capaian Pembelajaran (CP) */}
          <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="card-header flex flex-row items-center justify-between">
              <h2 className="card-title">Capaian Pembelajaran (CP)</h2>
              <p className="caption">Pilih satu atau lebih CP yang relevan</p>
            </div>
            <div className="card-content space-y-3">
              {!formData.class_id || !formData.subject_id ? (
                <p className="text-sm text-navy-600">Pilih kelas dan mata pelajaran untuk menampilkan CP sesuai sekolah dan fase.</p>
              ) : curriculumLoading ? <p className="text-sm text-navy-600">Memuat CP/TP...</p> : null}
              {curriculumError && <p role="alert" className="page-error">{curriculumError}</p>}
              {outcomes.map(cp => (
                <label key={cp.id} className="flex items-center gap-3 p-3 rounded-lg border border-navy-200 hover:bg-navy-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.learning_outcome_ids.includes(cp.id)}
                    onChange={e => setFormData(prev => ({ ...prev,
                      learning_outcome_ids: e.target.checked ? [...prev.learning_outcome_ids, cp.id] : prev.learning_outcome_ids.filter(id => id !== cp.id),
                      learning_objective_ids: e.target.checked ? prev.learning_objective_ids : prev.learning_objective_ids.filter(id => !objectives.some(tp => tp.id === id && tp.learning_outcome_id === cp.id)),
                    }))}
                    className="h-4 w-4 rounded border-navy-300 text-teal-600 focus:ring-teal-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-navy-950">{cp.code}</p>
                    <p className="text-sm text-navy-600">{cp.description}</p>
                  </div>
                </label>
              ))}
              {outcomes.length === 0 && !curriculumLoading && !curriculumError && formData.class_id && formData.subject_id && (
                <p className="text-navy-600 py-2">Belum ada CP untuk mata pelajaran dan fase ini. Masukkan CP dari dokumen kurikulum yang berlaku; tidak ada CP yang dibuat otomatis.</p>
              )}
              {formData.class_id && formData.subject_id && (
                <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 space-y-3">
                  <h3 className="font-semibold text-navy-950">Tambah Capaian Pembelajaran (CP)</h3>
                  <p className="text-xs text-navy-600">Hanya untuk kelas dan mata pelajaran yang kamu ampu. Gunakan rumusan CP yang sudah disahkan sekolah.</p>
                  <Input aria-label="Kode CP baru" placeholder="Kode CP, misalnya CP-B-01" value={newCpCode} onChange={e => setNewCpCode(e.target.value)} />
                  <Textarea aria-label="Deskripsi CP baru" placeholder="Rumusan lengkap CP sesuai dokumen kurikulum..." value={newCpDescription} onChange={e => setNewCpDescription(e.target.value)} rows={2} />
                  <Button type="button" disabled={savingCurriculum || !newCpCode.trim() || !newCpDescription.trim()} onClick={() => void saveCurriculum('cp')}>Simpan CP</Button>
                </div>
              )}
            </div>
          </Card>

          {/* Tujuan Pembelajaran (TP) */}
          <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="card-header flex flex-row items-center justify-between">
              <h2 className="card-title">Tujuan Pembelajaran (TP)</h2>
              <p className="caption">Pilih TP yang terkait dengan CP yang dipilih</p>
            </div>
            <div className="card-content space-y-3">
              {filteredObjectives.length > 0 ? (
                filteredObjectives.map(tp => (
                  <label key={tp.id} className="flex items-center gap-3 p-3 rounded-lg border border-navy-200 hover:bg-navy-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.learning_objective_ids.includes(tp.id)}
                      onChange={e => handleChange('learning_objective_ids',
                        e.target.checked
                          ? [...formData.learning_objective_ids, tp.id]
                          : formData.learning_objective_ids.filter(id => id !== tp.id)
                      )}
                      className="h-4 w-4 rounded border-navy-300 text-teal-600 focus:ring-teal-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-navy-950">{tp.code}</p>
                      <p className="text-sm text-navy-600">{tp.description}</p>
                    </div>
                  </label>
                ))
              ) : (
                <p className="text-navy-500 text-center py-4">{formData.learning_outcome_ids.length ? 'Belum ada TP untuk CP terpilih. Tambahkan TP menggunakan formulir di bawah.' : 'Pilih CP terlebih dahulu untuk menampilkan TP yang relevan.'}</p>
              )}
              {formData.learning_outcome_ids.length > 0 && (
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 space-y-3">
                  <h3 className="font-semibold text-navy-950">Tambah Tujuan Pembelajaran (TP)</h3>
                  <p className="text-xs text-navy-600">TP harus mengacu pada CP yang dipilih dan dirumuskan oleh Guru sesuai dokumen kurikulum.</p>
                  <select aria-label="CP untuk tujuan pembelajaran baru" className="w-full rounded-xl border border-slate-300 bg-white p-3" value={selectedCpForTp} onChange={e => setSelectedCpForTp(e.target.value)}>
                    <option value="">Pilih CP induk</option>
                    {outcomes.filter(cp => formData.learning_outcome_ids.includes(cp.id)).map(cp => <option value={cp.id} key={cp.id}>{cp.code}</option>)}
                  </select>
                  <Input aria-label="Kode TP baru" placeholder="Kode TP, misalnya TP-B-01" value={newTpCode} onChange={e => setNewTpCode(e.target.value)} />
                  <Textarea aria-label="Deskripsi TP baru" placeholder="Rumusan tujuan pembelajaran..." value={newTpDescription} onChange={e => setNewTpDescription(e.target.value)} rows={2} />
                  <Button type="button" disabled={savingCurriculum || !selectedCpForTp || !newTpCode.trim() || !newTpDescription.trim()} onClick={() => void saveCurriculum('tp')}>Simpan TP</Button>
                </div>
              )}
            </div>
          </Card>

            </>
          )}

          {/* Deskripsi & Detail */}
          <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
            <div className="card-header">
              <h2 className="card-title">Deskripsi & Detail Pembelajaran</h2>
              {formData.module_id && <p className="caption">Terisi otomatis dari Modul Ajar terpilih. Guru boleh mengubah seluruh kolom sebelum menyimpan. Data yang tidak ada di modul dibiarkan kosong.</p>}
            </div>
            <div className="card-content space-y-4">
              <div>
                <Label htmlFor="description">Deskripsi Singkat</Label>
                <Textarea
                  id="description"
                  placeholder="Jelaskan tujuan dan gambaran umum pembelajaran ini..."
                  value={formData.description}
                  onChange={e => handleChange('description', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="materials">Materi & Sumber Belajar</Label>
                <Textarea
                  id="materials"
                  placeholder="Daftar materi, buku teks, LKPD, media, dan sumber belajar lainnya..."
                  value={formData.materials}
                  onChange={e => handleChange('materials', e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="learning_methods">Metode Pembelajaran</Label>
                  <Textarea
                    id="learning_methods"
                    placeholder="Contoh: Penemuan Terbimbing, Diskusi Kelompok, Demonstrasi..."
                    value={formData.learning_methods}
                    onChange={e => handleChange('learning_methods', e.target.value)}
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="learning_models">Model Pembelajaran</Label>
                  <Textarea
                    id="learning_models"
                    placeholder="Contoh: Problem Based Learning, Project Based Learning, Inquiry..."
                    value={formData.learning_models}
                    onChange={e => handleChange('learning_models', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="media">Media & Alat Bantu</Label>
                <Textarea
                  id="media"
                  placeholder="Contoh: Laptop, Proyektor, Manipulatif Pecahan, LKPD Digital..."
                  value={formData.media}
                  onChange={e => handleChange('media', e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="assessment_plan">Rencana Asesmen</Label>
                <Textarea
                  id="assessment_plan"
                  placeholder="Jelaskan jenis asesmen (formatif/sumatif), indikator yang dinilai, dan kriteria ketuntasan..."
                  value={formData.assessment_plan}
                  onChange={e => handleChange('assessment_plan', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 animate-fade-in" style={{ animationDelay: '500ms' }}>
            <Link href="/guru/analisis">
              <Button variant="outline" type="button">
                <X className="mr-2 h-4 w-4" />
                Batal
              </Button>
            </Link>
            <Button type="submit" loading={isSubmitting} className="gap-2">
              <Save className="h-4 w-4" />
              Simpan Pembelajaran
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}