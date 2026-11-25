// Check structure, not pedagogical validity; teacher review remains required.
const record = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
const text = (v: unknown) => typeof v === 'string' && v.trim().length > 0;
export function hasDetailedRubric(value: unknown): boolean {
  const r = record(value);
  if (!['title','criterion','assessmentTask','evidence','attainmentCriterion','followUp'].every(k => text(r[k]))) return false;
  if (!Array.isArray(r.relatedIndicators) || !r.relatedIndicators.length || !r.relatedIndicators.every(text)) return false;
  if (!Array.isArray(r.levels) || r.levels.length !== 4) return false;
  const levels = r.levels.map(record);
  return levels.every(l => text(l.label) && text(l.description) && typeof l.score === 'number' && [1,2,3,4].includes(l.score)) && new Set(levels.map(l => l.score)).size === 4 && new Set(levels.map(l => String(l.description).trim().toLowerCase())).size === 4;
}
export function rubricWarnings(value: unknown): string[] {
  if (!Array.isArray(value) || value.length < 3) return ['Rubrik analitik belum memiliki minimal tiga kriteria; lengkapi sebelum digunakan.'];
  return value.every(hasDetailedRubric) ? [] : ['Sebagian rubrik belum memiliki empat tingkat skor berbeda atau rincian tugas, bukti, indikator, kriteria ketercapaian dan tindak lanjut. Guru perlu melengkapi.'];
}
