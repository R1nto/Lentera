/** Transform the stored AI result into readable sections for preview and PDF. */
export interface ModuleSection { title: string; lines: string[] }

type AnyRecord = Record<string, unknown>;
const object = (value: unknown): value is AnyRecord => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const labels: Record<string, string> = {
  title: 'Judul', criterion: 'Kriteria penilaian', relatedIndicators: 'Indikator terkait', assessmentTask: 'Tugas yang dinilai', evidence: 'Bukti yang diamati', attainmentCriterion: 'Usulan kriteria ketercapaian', followUp: 'Tindak lanjut', label: 'Tingkat', score: 'Skor',
  detailLevel: 'Jenis modul', curriculumReference: 'Referensi pembelajaran (perlu ditinjau)', referenceKind: 'Jenis referensi', cpText: 'Rumusan CP', source: 'Sumber', verifiedByTeacher: 'Status verifikasi', deepLearning: 'Desain Pembelajaran Mendalam', mindful: 'Berkesadaran', meaningful: 'Bermakna', joyful: 'Menggembirakan', understand: 'Memahami', apply: 'Mengaplikasi', reflect: 'Merefleksi', lessonResources: 'Bahan Ajar dan Sumber', worksheets: 'Lampiran LKPD', tasks: 'Tugas LKPD', teacherKey: 'Kunci LKPD untuk Guru', assessmentInstruments: 'Lampiran Instrumen Asesmen', questions: 'Soal Asesmen', question: 'Pertanyaan', answerKey: 'Kunci Jawaban', scoringGuide: 'Pedoman Penskoran', scoringRubrics: 'Rubrik Penilaian', levels: 'Tingkat Pencapaian', curriculumAlignmentNotes: 'Catatan Kesesuaian Kurikulum', generationWarnings: 'Bagian yang perlu dilengkapi Guru',
  moduleTitle: 'Judul modul', identity: 'Identitas modul', grade: 'Kelas', phase: 'Fase', subject: 'Mata pelajaran',
  topic: 'Topik', duration: 'Alokasi waktu', meetingsCount: 'Jumlah pertemuan', learningOutcomes: 'Capaian pembelajaran (CP)',
  learningObjectives: 'Tujuan pembelajaran (TP)', indicators: 'Indikator', criteria: 'Kriteria',
  initialCompetencies: 'Kompetensi awal', meaningfulUnderstanding: 'Pemahaman bermakna',
  triggerQuestions: 'Pertanyaan pemantik', learningMaterials: 'Materi pembelajaran',
  learningActivities: 'Langkah kegiatan pembelajaran', introduction: 'Pendahuluan', main: 'Kegiatan inti', closing: 'Penutup',
  description: 'Deskripsi', teacherActivity: 'Aktivitas guru', studentActivity: 'Aktivitas siswa',
  durationMinutes: 'Durasi (menit)', assessments: 'Asesmen', diagnostic: 'Diagnostik', formative: 'Formatif',
  summative: 'Sumatif', name: 'Nama', type: 'Jenis', technique: 'Teknik', instrument: 'Instrumen',
  rubric: 'Rubrik', differentiation: 'Diferensiasi', content: 'Konten', process: 'Proses', product: 'Produk',
  remedial: 'Remedial', enrichment: 'Pengayaan', teacherReflection: 'Refleksi guru',
  studentReflection: 'Refleksi siswa', learningModel: 'Model pembelajaran', learningMethods: 'Metode pembelajaran', learningMedia: 'Media pembelajaran', code: 'Kode', relatedObjectiveIds: 'Referensi TP', relatedIndicatorIds: 'Referensi indikator',
};
const hidden = new Set(['id', 'moduleTitle']);
const pretty = (key: string) => labels[key] || key.replace(/([a-z])([A-Z])/g, '$1 $2');
function linesFor(value: unknown, depth = 0): string[] {
  if (value === null || value === undefined || value === '') return [];
  if (Array.isArray(value)) {
    return value.flatMap((part, index) => {
      if (object(part)) return [`${index + 1}.`, ...linesFor(part, depth + 1).map(line => `   ${line}`)];
      if (Array.isArray(part)) return linesFor(part, depth + 1);
      return [`${index + 1}. ${String(part)}`];
    });
  }
  if (object(value)) {
    return Object.entries(value).flatMap(([key, part]) => {
      if (hidden.has(key) || part === null || part === undefined || part === '') return [];
      if (Array.isArray(part) && part.length === 0) return [];
      if (object(part) || Array.isArray(part)) return [`${pretty(key)}:`, ...linesFor(part, depth + 1).map(line => `  ${line}`)];
      return [`${pretty(key)}: ${String(part)}`];
    });
  }
  return [String(value)];
}
export function moduleDocumentSections(content: unknown): ModuleSection[] {
  if (!object(content)) return [];
  const order = ['identity','learningModel','learningMethods','learningMedia','learningOutcomes','learningObjectives','initialCompetencies','meaningfulUnderstanding','triggerQuestions','learningMaterials','learningActivities','deepLearning','lessonResources','assessments','assessmentInstruments','scoringRubrics','worksheets','curriculumAlignmentNotes','differentiation','remedial','enrichment','teacherReflection','studentReflection'];
  const keys = [...order, ...Object.keys(content).filter(k => !order.includes(k) && !hidden.has(k))];
  return keys.flatMap(key => {
    const lines = linesFor(content[key]);
    return lines.length ? [{ title: key === "learningOutcomes" && object(content.curriculumReference) && String(content.curriculumReference.referenceKind || "").startsWith("Pengembangan sekolah") ? "Acuan pengembangan sekolah (bukan CP nasional)" : pretty(key), lines }] : [];
  });
}
