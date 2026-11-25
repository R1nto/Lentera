export type Totals = { sessions:number; assessments:number; results:number; scoreSum:number; scoreCount:number; met:number; notMet:number; unassessed:number; students:number; modules:number; analyses:number };
export type Group = Totals & { id:string; name:string };
export type Filters = { start:string; end:string; classId:string; subjectId:string; teacherId:string; year:string };
export type Snapshot = { version:1; schoolName:string; filters:Filters; total:Totals; classes:Group[]; subjects:Group[]; teachers:Group[]; generatedAt:string };
export const reportTypes = {learning_summary:'Evaluasi Pembelajaran', assessment_summary:'Rekap Asesmen',tp_progress:'Ketercapaian Indikator',teacher_activity:'Aktivitas Guru',class_progress:'Perkembangan Kelas'} as const;
export type ReportType = keyof typeof reportTypes;
export const blank = ():Totals => ({sessions:0,assessments:0,results:0,scoreSum:0,scoreCount:0,met:0,notMet:0,unassessed:0,students:0,modules:0,analyses:0});
export function attainment(t:Totals) { return t.met+t.notMet ? Math.round(1000*t.met/(t.met+t.notMet))/10 : null; }
export function average(t:Totals) { return t.scoreCount ? Math.round(10*t.scoreSum/t.scoreCount)/10 : null; }
export function decision(value:unknown):'met'|'notMet'|'unassessed' {
  if (!value || typeof value !== 'object') return 'unassessed';
  const item=value as {status?:string;teacher_assessment?:{decision?:string}|null};
  if(item.status==='meets_criterion' && item.teacher_assessment?.decision==='met') return 'met';
  if(item.status==='needs_follow_up' && item.teacher_assessment?.decision==='not_met') return 'notMet';
  return 'unassessed';
}
export function validDate(s:string) { return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0,10)===s; }
