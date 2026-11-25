import { hasDetailedRubric } from '@/lib/module-rubric';
import { jsPDF } from 'jspdf';
import { moduleDocumentSections } from '@/lib/module-document';

export interface ModulePdfData {
  id: string;
  title: string;
  grade: string;
  phase: string;
  subject_name: string;
  class_name: string;
  meetings_count: number;
  content: unknown;
}

type RecordValue = Record<string, unknown>;
const isObject = (value: unknown): value is RecordValue => value !== null && typeof value === 'object' && !Array.isArray(value);
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const get = (value: unknown, key: string): unknown => isObject(value) ? value[key] : undefined;
const asText = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join('; ');
  if (isObject(value)) return Object.values(value).map(asText).filter(Boolean).join('; ');
  return '';
};
const label = (value: unknown, key: string) => asText(get(value, key));
const joined = (value: unknown) => (Array.isArray(value) ? value : value === undefined || value === null ? [] : [value]).map(asText).filter(Boolean).join(', ');
// Gemini can return a single object instead of a one-element array. The preview
// already handled both shapes; PDF must not silently discard the object variant.
const items = (value: unknown): unknown[] => value === null || value === undefined || value === '' ? [] : Array.isArray(value) ? value : [value];
const firstField = (value: unknown, ...keys: string[]): unknown => {
  for (const key of keys) { const found = get(value, key); if (found !== undefined && found !== null) return found; }
  return undefined;
};
const printable = (value: unknown): string => asText(value);


/**
 * LENTERA teacher-facing teaching module (A4).
 * Uses the stored structured AI result, not its internal JSON representation.
 * Intentionally does not print audit data, internal IDs, or fictional LKPD content.
 */
export function downloadModulePdf(module: ModulePdfData): void {
  if (!isObject(module.content) || moduleDocumentSections(module.content).length === 0) {
    throw new Error('Konten Modul Ajar belum tersimpan. PDF lengkap tidak dapat dibuat dari metadata saja.');
  }
  const data = module.content;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageWidth = 210, left = 19, right = 19, top = 21, bottom = 276;
  const bodyWidth = pageWidth - left - right;
  const navy = [29, 62, 78] as const;
  const muted = [83, 99, 109] as const;
  const mint = [224, 241, 235] as const;
  const border = [196, 211, 214] as const;
  let y = top;
  const color = (c: readonly number[]) => pdf.setTextColor(c[0], c[1], c[2]);
  const nextPage = () => { pdf.addPage(); y = top; };
  const ensureSpace = (height: number) => { if (y + height > bottom) nextPage(); };
  const lines = (text: string, width = bodyWidth, size = 9.5): string[] => {
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(size);
    return pdf.splitTextToSize(text, Math.max(12, width)) as string[];
  };
  const paragraph = (value: string, indent = 0) => {
    if (!value) return;
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9.4); color(navy);
    for (const line of lines(value, bodyWidth - indent, 9.4)) {
      ensureSpace(5.4); pdf.text(line, left + indent, y); y += 5.4;
    }
    y += 1.8;
  };
  const section = (name: string, major = false) => {
    ensureSpace(17); y += major ? 7 : 5;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(major ? 12 : 10.2); color(navy);
    pdf.text(name, left, y);
    y += major ? 8 : 7;
    if (major) { pdf.setDrawColor(...border); pdf.line(left, y - 4, pageWidth - right, y - 4); }
  };
  const bulletList = (value: unknown) => {
    const values = items(value).map(asText).filter(Boolean);
    values.forEach((item, i) => {
      const prefix = `${i + 1}. `;
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9.4);
      const wrapped = lines(item, bodyWidth - 9, 9.4);
      wrapped.forEach((line, k) => {
        ensureSpace(5.4);
        pdf.setFont('helvetica', 'normal'); color(navy);
        if (k === 0) pdf.text(prefix, left + 1, y);
        pdf.text(line, left + 9, y); y += 5.4;
      });
      y += 1.6;
    });
  };
  const table = (headers: string[], values: string[][], widths?: number[]) => {
    if (!values.length) return;
    const sizes = widths ?? headers.map(() => bodyWidth / headers.length);
    const pad = 2.5, lineHeight = 4.7, fontSize = 8.8;
    const headerLines = headers.map((h, i) => lines(h, sizes[i] - pad * 2, fontSize));
    const headerHeight = Math.max(9, ...headerLines.map(x => x.length * lineHeight + pad * 2));
    const header = () => {
      ensureSpace(headerHeight + 7);
      let x = left;
      headers.forEach((_, i) => {
        pdf.setFillColor(...mint); pdf.setDrawColor(...border); pdf.rect(x, y, sizes[i], headerHeight, 'FD');
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(fontSize); color(navy);
        headerLines[i].forEach((line, k) => pdf.text(line, x + pad, y + pad + 3.4 + k * lineHeight));
        x += sizes[i];
      });
      y += headerHeight;
    };
    header();
    values.forEach((record, index) => {
      const wrapped = headers.map((_, i) => lines(record[i] || '-', sizes[i] - pad * 2, fontSize));
      const max = Math.max(1, ...wrapped.map(x => x.length));
      let first = 0;
      while (first < max) {
        if (y + pad * 2 + lineHeight > bottom) { nextPage(); header(); }
        const capacity = Math.max(1, Math.floor((bottom - y - pad * 2) / lineHeight));
        const n = Math.min(capacity, max - first);
        const h = n * lineHeight + pad * 2;
        let x = left;
        headers.forEach((_, i) => {
          pdf.setFillColor(index % 2 ? 249 : 255, index % 2 ? 252 : 255, index % 2 ? 251 : 255);
          pdf.setDrawColor(...border); pdf.setLineWidth(0.16); pdf.rect(x, y, sizes[i], h, 'FD');
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(fontSize); color(navy);
          wrapped[i].slice(first, first + n).forEach((line, k) => pdf.text(line, x + pad, y + pad + 3.4 + k * lineHeight));
          x += sizes[i];
        });
        y += h; first += n;
        if (first < max) { nextPage(); header(); }
      }
    });
    y += 3;
  };

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); color(navy);
  pdf.text('MODUL AJAR', pageWidth / 2, y, { align: 'center' }); y += 9;
  pdf.setFontSize(14);
  for (const line of lines(module.title || label(data, 'moduleTitle') || 'Modul Ajar', bodyWidth, 14)) {
    ensureSpace(7); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(14);
    pdf.text(line, pageWidth / 2, y, { align: 'center' }); y += 7;
  }
  y += 6;
  section('INFORMASI UMUM', true);
  section('A. Identitas Modul');
  const identity = get(data, 'identity');
  const identityRows = [
    ['Jenjang', 'Sekolah Dasar'],
    ['Mata pelajaran', module.subject_name],
    ['Kelas / Fase', `${module.grade} / ${module.phase}`],
    ['Rombel', module.class_name],
    ['Materi / Topik', label(identity, 'topic')],
    ['Alokasi waktu', label(identity, 'duration')],
    ['Jumlah pertemuan', String(module.meetings_count || label(identity, 'meetingsCount') || '')],
  ].filter(row => row[1]);
  table(['Komponen', 'Keterangan'], identityRows, [49, bodyWidth - 49]);

  const simple = (name: string, value: unknown) => {
    const values = items(value).map(asText).filter(Boolean);
    if (values.length) { section(name); bulletList(values); }
  };
  simple('B. Kompetensi Awal', get(data, 'initialCompetencies'));
  const model = label(data, 'learningModel');
  const methods = list(get(data, 'learningMethods')).map(asText).filter(Boolean);
  const media = list(get(data, 'learningMedia')).map(asText).filter(Boolean);
  if (model || methods.length || media.length) {
    section('C. Model, Metode dan Media Pembelajaran');
    table(['Komponen', 'Uraian'], [
      ...(model ? [['Model pembelajaran', model]] : []),
      ...(methods.length ? [['Metode pembelajaran', methods.join(', ')]] : []),
      ...(media.length ? [['Media / alat', media.join(', ')]] : []),
    ], [49, bodyWidth - 49]);
  }
  // Modul lama tidak memiliki metadata model/metode; jangan mengarangnya pada PDF.
  // Only render information the generator actually supplied.
  section('KOMPONEN INTI', true);
  const outcomes = items(firstField(data, 'learningOutcomes', 'learning_outcomes')).map(item => [label(item, 'code') || label(item, 'id'), label(item, 'description')]).filter(row => row[1]);
  const schoolDevelopment = label(get(data, "curriculumReference"), "referenceKind").startsWith("Pengembangan sekolah");
  if (outcomes.length) { section(schoolDevelopment ? "A. Acuan Pengembangan Sekolah (bukan CP nasional)" : "A. Capaian Pembelajaran"); table(["Kode", schoolDevelopment ? "Acuan pengembangan" : "Capaian Pembelajaran"], outcomes, [33, bodyWidth - 33]); }
  const objectives = items(firstField(data, 'learningObjectives', 'learning_objectives'));
  if (objectives.length) {
    section('B. Tujuan Pembelajaran dan Indikator');
    objectives.forEach((item, index) => {
      const description = label(item, 'description');
      if (description) paragraph(`${index + 1}. ${description}`);
      const indicators = items(get(item, 'indicators')).map(ind => {
        const desc = label(ind, 'description') || asText(ind);
        const criteria = label(ind, 'criteria');
        return criteria ? `${desc} (Kriteria: ${criteria})` : desc;
      }).filter(Boolean);
      if (indicators.length) {
        paragraph('Indikator pencapaian:', 3);
        indicators.forEach((indicator, i) => paragraph(`${i + 1}. ${indicator}`, 8));
      }
    });
  }
  simple('C. Pemahaman Bermakna', get(data, 'meaningfulUnderstanding'));
  simple('D. Pertanyaan Pemantik', get(data, 'triggerQuestions'));
  simple('E. Materi dan Sumber Pembelajaran', get(data, 'learningMaterials'));

  // Gemini responses are not always strictly shaped like the prompt schema.
  // Accept both {introduction: [{...}]} and {introduction: {...}}, including
  // Indonesian stage labels, instead of dropping all teaching activities.
  const activities = firstField(data, 'learningActivities', 'learning_activities');
  const stages = [
    { name: 'Pendahuluan', keys: ['introduction', 'pendahuluan'] },
    { name: 'Kegiatan Inti', keys: ['main', 'inti', 'kegiatanInti'] },
    { name: 'Penutup', keys: ['closing', 'penutup'] },
  ];
  const activityGroups = stages.map(stage => ({ ...stage, entries: items(firstField(activities, ...stage.keys)) }));
  // Some providers return a flat list with a stage/type on each entry.
  const flatActivities = Array.isArray(activities) ? activities : [];
  if (activityGroups.some(group => group.entries.length) || flatActivities.length || (isObject(activities) && Object.keys(activities).length)) {
    section('F. Langkah-Langkah Pembelajaran');
    const activityRow = (item: unknown, index: number): string[] => {
      const description = label(item, 'description') || label(item, 'deskripsi') || (!isObject(item) ? printable(item) : '');
      const teacher = asText(firstField(item, 'teacherActivity', 'teacher_activity', 'aktivitasGuru'));
      const student = asText(firstField(item, 'studentActivity', 'student_activity', 'aktivitasSiswa'));
      const duration = asText(firstField(item, 'durationMinutes', 'duration_minutes', 'durasiMenit'));
      const refs = joined(firstField(item, 'relatedObjectiveIds', 'related_objective_ids', 'referensiTP'));
      const activityText = [description, teacher ? `Aktivitas Guru: ${teacher}` : '', student ? `Aktivitas Siswa: ${student}` : '', refs ? `TP terkait: ${refs}` : ''].filter(Boolean).join('\n');
      return [String(index + 1), activityText || printable(item), duration ? `${duration} menit` : '-'];
    };
    for (const stage of activityGroups) {
      if (!stage.entries.length) continue;
      section(stage.name);
      table(['No.', 'Uraian Kegiatan', 'Waktu'], stage.entries.map(activityRow), [14, bodyWidth - 42, 28]);
    }
    if (flatActivities.length) {
      section('Rincian Kegiatan');
      table(['No.', 'Uraian Kegiatan', 'Waktu'], flatActivities.map(activityRow), [14, bodyWidth - 42, 28]);
    }
    // Preserve unrecognized stage names too: don't silently omit AI content.
    if (isObject(activities)) {
      for (const [key, value] of Object.entries(activities)) {
        if (stages.some(stage => stage.keys.includes(key)) || value === null || value === undefined) continue;
        section(key.replace(/([a-z])([A-Z])/g, '$1 $2'));
        table(['No.', 'Uraian Kegiatan', 'Waktu'], items(value).map(activityRow), [14, bodyWidth - 42, 28]);
      }
    }
  }

  const assessment = firstField(data, 'assessments', 'asesmen');
  const assessmentKinds = [
    { name: 'Diagnostik', keys: ['diagnostic', 'diagnostik'] },
    { name: 'Formatif', keys: ['formative', 'formatif'] },
    { name: 'Sumatif', keys: ['summative', 'sumatif'] },
  ];
  const groupedAssessments = assessmentKinds.map(kind => ({ ...kind, entries: items(firstField(assessment, ...kind.keys)) }));
  const flatAssessments = Array.isArray(assessment) ? assessment : [];
  if (groupedAssessments.some(group => group.entries.length) || flatAssessments.length || (isObject(assessment) && Object.keys(assessment).length)) {
    section('G. Asesmen / Penilaian');
    const assessmentRow = (item: unknown, fallback: string): string[] => {
      if (!isObject(item)) return [fallback, printable(item), '-'];
      const kind = label(item, 'name') || label(item, 'nama') || fallback;
      const detail = [
        label(item, 'type') ? `Jenis: ${label(item, 'type')}` : '',
        label(item, 'technique') ? `Teknik: ${label(item, 'technique')}` : '',
        label(item, 'instrument') ? `Instrumen: ${label(item, 'instrument')}` : '',
      ].filter(Boolean).join('\n');
      const criteria = [
        label(item, 'rubric') ? `Rubrik: ${label(item, 'rubric')}` : '',
        joined(firstField(item, 'relatedIndicatorIds', 'related_indicator_ids')) ? `Indikator: ${joined(firstField(item, 'relatedIndicatorIds', 'related_indicator_ids'))}` : '',
      ].filter(Boolean).join('\n');
      return [kind, detail || '-', criteria || '-'];
    };
    for (const kind of groupedAssessments) {
      if (!kind.entries.length) continue;
      section(`Asesmen ${kind.name}`);
      table(['Aspek / Bentuk', 'Teknik dan Instrumen', 'Rubrik / Indikator'], kind.entries.map(item => assessmentRow(item, kind.name)), [42, 63, bodyWidth - 105]);
    }
    if (flatAssessments.length) {
      table(['Aspek / Bentuk', 'Teknik dan Instrumen', 'Rubrik / Indikator'], flatAssessments.map(item => assessmentRow(item, 'Asesmen')), [42, 63, bodyWidth - 105]);
    }
    if (isObject(assessment)) {
      for (const [key, value] of Object.entries(assessment)) {
        if (assessmentKinds.some(kind => kind.keys.includes(key)) || value === null || value === undefined) continue;
        section(`Asesmen ${key}`);
        table(['Aspek / Bentuk', 'Teknik dan Instrumen', 'Rubrik / Indikator'], items(value).map(item => assessmentRow(item, key)), [42, 63, bodyWidth - 105]);
      }
    }
  }
  const diff = firstField(data, 'differentiation', 'diferensiasi');
  const diffRows = [
    ['Konten', joined(firstField(diff, 'content', 'konten'))],
    ['Proses', joined(firstField(diff, 'process', 'proses'))],
    ['Produk', joined(firstField(diff, 'product', 'produk'))],
  ].filter(row => row[1]);
  if (diffRows.length) { section('H. Pembelajaran Berdiferensiasi'); table(['Aspek', 'Strategi'], diffRows, [39, bodyWidth - 39]); }
  else if (diff && !isObject(diff)) { section('H. Pembelajaran Berdiferensiasi'); paragraph(printable(diff)); }
  simple('I. Remedial', get(data, 'remedial'));
  simple('J. Pengayaan', get(data, 'enrichment'));
  simple('K. Refleksi Pendidik', get(data, 'teacherReflection'));
  simple('L. Refleksi Peserta Didik', get(data, 'studentReflection'));

  // Ekspor lampiran dari konten AI yang benar-benar tersimpan; tidak membuat soal palsu saat ekspor.
  const curriculumRef = get(data, 'curriculumReference');
  const notes = items(get(data, 'curriculumAlignmentNotes')).map(asText).filter(Boolean);
  if (isObject(curriculumRef) && (label(curriculumRef, 'cpText') || label(curriculumRef, 'source'))) {
    section(schoolDevelopment ? 'M. Referensi Pengembangan Sekolah' : 'M. Referensi dan Pemeriksaan CP');
    table(['Komponen', 'Keterangan'], [
      [schoolDevelopment ? 'Acuan pengembangan sekolah' : 'Rumusan CP', label(curriculumRef, 'cpText') || 'Belum diisi'],
      ['Jenis referensi', label(curriculumRef, 'referenceKind') || 'Referensi CP'],
      ['Sumber referensi', label(curriculumRef, 'source') || 'Belum diisi'],
      ['Verifikasi Guru', 'Perlu diperiksa sebelum modul digunakan'],
    ], [45, bodyWidth - 45]);
  }
  if (notes.length) { section('N. Catatan Kesesuaian Kurikulum'); bulletList(notes); }
  else if (!outcomes.length) { section('N. Catatan Kesesuaian Kurikulum'); paragraph('Rumusan CP resmi belum tercantum. Guru perlu memeriksa dokumen kurikulum sekolah sebelum menggunakan modul.'); }

  const deep = get(data, 'deepLearning');
  const deepRows: string[][] = [
    ['Berkesadaran', joined(get(deep, 'mindful'))],
    ['Bermakna', joined(get(deep, 'meaningful'))],
    ['Menggembirakan', joined(get(deep, 'joyful'))],
    ['Memahami', joined(get(deep, 'understand'))],
    ['Mengaplikasi', joined(get(deep, 'apply'))],
    ['Merefleksi', joined(get(deep, 'reflect'))],
  ].filter(row => row[1]);
  if (deepRows.length) { section('O. Desain Pembelajaran Mendalam', true); table(['Prinsip / Pengalaman', 'Aktivitas yang Direncanakan'], deepRows, [52, bodyWidth - 52]); }
  const resources = items(get(data, 'lessonResources'));
  if (resources.length) {
    section('P. Bahan Ajar dan Referensi');
    table(['Bahan / Sumber', 'Uraian'], resources.map(r => [label(r, 'title') || 'Bahan ajar', [label(r, 'description'), label(r, 'source')].filter(Boolean).join(' — ')]), [48, bodyWidth - 48]);
  }
  const worksheets = items(get(data, 'worksheets'));
  if (worksheets.length) {
    section('LAMPIRAN 1 — LEMBAR KERJA PESERTA DIDIK', true);
    worksheets.forEach((sheet, index) => {
      section(`${index + 1}. ${label(sheet, 'title') || 'LKPD'}`);
      simple('Petunjuk Pengerjaan', get(sheet, 'instructions'));
      const tasks = items(get(sheet, 'tasks'));
      if (tasks.length) table(['No.', 'Pertanyaan / Aktivitas', 'Indikator'], tasks.map((task, i) => [String(i + 1), label(task, 'question') || printable(task), joined(get(task, 'relatedIndicatorCodes')) || '-']), [14, bodyWidth - 58, 44]);
    });
    section('LAMPIRAN 2 — KUNCI LKPD (UNTUK GURU)', true);
    worksheets.forEach((sheet, index) => {
      const key = items(get(sheet, 'teacherKey'));
      if (key.length) {
        section(`${index + 1}. ${label(sheet, 'title') || 'LKPD'}`);
        table(['No.', 'Jawaban dan pembahasan'], key.map((item, i) => [String(i + 1), [label(item, 'answer'), label(item, 'explanation')].filter(Boolean).join(' — ')]), [18, bodyWidth - 18]);
      }
    });
  }
  const instruments = items(get(data, 'assessmentInstruments'));
  if (instruments.length) {
    section('LAMPIRAN 3 — INSTRUMEN ASESMEN', true);
    instruments.forEach((instrument, index) => {
      section(`${index + 1}. ${label(instrument, 'title') || label(instrument, 'category') || 'Asesmen'}`);
      paragraph(label(instrument, 'instructions'));
      const questions = items(get(instrument, 'questions'));
      if (questions.length) {
        table(['No.', 'Soal', 'Indikator'], questions.map((question, i) => [label(question, 'number') || String(i + 1), label(question, 'question'), joined(get(question, 'relatedIndicatorCodes')) || '-']), [14, bodyWidth - 58, 44]);
      }
    });
    section('LAMPIRAN 4 — KUNCI DAN PEDOMAN PENSKORAN (GURU)', true);
    instruments.forEach((instrument, index) => {
      const questions = items(get(instrument, 'questions'));
      if (questions.length) {
        section(`${index + 1}. ${label(instrument, 'title') || 'Asesmen'}`);
        table(['No.', 'Kunci / Jawaban', 'Penskoran'], questions.map((q, i) => [label(q, 'number') || String(i + 1), label(q, 'answerKey') || 'Perlu dilengkapi Guru', label(q, 'scoringGuide') || 'Perlu dilengkapi Guru']), [14, 75, bodyWidth - 89]);
      }
    });
  }
  const rubrics = items(get(data, 'scoringRubrics'));
  if (rubrics.length) {
    section('LAMPIRAN 5 — RUBRIK PENILAIAN', true);
    rubrics.forEach((rubric, i) => {
      section(`${i + 1}. ${label(rubric, 'title') || 'Rubrik'}`);
      const details = [
        ['Kriteria penilaian', label(rubric, 'criterion')],
        ['Indikator terkait', joined(get(rubric, 'relatedIndicators'))],
        ['Tugas yang dinilai', label(rubric, 'assessmentTask')],
        ['Bukti yang diamati', label(rubric, 'evidence')],
        ['Usulan kriteria ketercapaian', label(rubric, 'attainmentCriterion')],
        ['Tindak lanjut', label(rubric, 'followUp')],
      ].filter(row => row[1]);
      table(['Komponen', 'Uraian'], details, [48, bodyWidth - 48]);
      const levels = items(get(rubric, 'levels'));
      if (levels.length) table(['Tingkat', 'Deskriptor', 'Skor'], levels.map(level => [label(level, 'label'), label(level, 'description'), label(level, 'score')]), [43, bodyWidth - 68, 25]);
    });
    if (rubrics.every(r => hasDetailedRubric(r))) {
      section('Pedoman penggunaan rubrik');
      paragraph('Beri skor 1–4 per kriteria berdasarkan bukti yang benar-benar diamati. Jika belum ada bukti, tandai belum dinilai, bukan skor 1 atau 0.');
      paragraph('Dengan bobot sama dan seluruh kriteria sudah dinilai: nilai skala 100 = jumlah skor diperoleh / (4 x jumlah kriteria) x 100. Jika belum semua dinilai, jangan menyatakan nilai akhir. Guru meninjau kriteria ketercapaian tiap indikator secara terpisah; nilai total bukan bukti otomatis seluruh indikator tercapai.');
    } else {
      paragraph('Rubrik belum memenuhi format terperinci. Guru perlu memeriksa dan melengkapi deskriptor, keterkaitan indikator dan pedoman penilaian.');
    }
  }
  // Jika output lengkap tidak memuat lampiran, beri catatan jujur alih-alih PDF tampak lengkap.
  if (label(data, 'detailLevel') === 'lengkap') {
    const missing = [!worksheets.length ? 'LKPD' : '', !instruments.length ? 'Instrumen asesmen' : '', !rubrics.length ? 'Rubrik penilaian' : ''].filter(Boolean);
    if (missing.length) { section('Bagian yang perlu dilengkapi Guru'); paragraph(`Keluaran AI belum menyediakan: ${missing.join(', ')}. Periksa dan lengkapi sebelum modul dipakai.`); }
  }
  const total = pdf.getNumberOfPages();
  for (let page = 1; page <= total; page++) {
    pdf.setPage(page); pdf.setDrawColor(...border); pdf.line(left, 283, pageWidth - right, 283);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); color(muted);
    pdf.text(`${module.subject_name} | Kelas ${module.grade}`, left, 290);
    pdf.text(`LENTERA  |  ${page} / ${total}`, pageWidth - right, 290, { align: 'right' });
  }
  pdf.save(`modul-ajar-${module.id.slice(0, 8)}.pdf`);
}
