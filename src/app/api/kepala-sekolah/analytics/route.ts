import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { blank, decision, validDate, reportTypes, type Filters, type Group, type Snapshot, type Totals } from '@/lib/school/analytics';
export const dynamic = 'force-dynamic';
const json = (body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
class HttpError extends Error { constructor(message:string, public status:number){super(message);} }
type Row = Record<string, any>;
type Result = {data:unknown;error:unknown};
async function all(query:(from:number,to:number)=>PromiseLike<Result>):Promise<Row[]> {
  const rows:Row[]=[];
  for(let offset=0;;offset+=500){
    const result=await query(offset,offset+499);
    if(result.error) throw result.error;
    const page=(result.data||[]) as Row[]; rows.push(...page);
    if(page.length<500) return rows;
  }
}
async function context(){
  const auth=await createClient(); const {data:{user},error}=await auth.auth.getUser();
  if(error||!user) throw new HttpError('Silakan login kembali.',401);
  const db=await createServiceClient();
  const p=await db.from('profiles').select('id,full_name,role,school_id').eq('id',user.id).maybeSingle();
  if(p.error) throw p.error;
  if(p.data?.role!=='kepala_sekolah'||!p.data.school_id) throw new HttpError('Akses khusus Kepala Sekolah.',403);
  return {db,principal:p.data,schoolId:String(p.data.school_id)};
}
async function calculate(ctx:Awaited<ReturnType<typeof context>>, f:Filters){
  const {db,schoolId}=ctx;
  if(!validDate(f.start)||!validDate(f.end)||f.start>f.end) throw new HttpError('Periode tanggal tidak valid.',400);
  const [school, classes, subjects, teachers, students]=await Promise.all([
    db.from('schools').select('name').eq('id',schoolId).single(),
    all((a,b)=>db.from('classes').select('id,name,grade,academic_year').eq('school_id',schoolId).order('id').range(a,b)),
    all((a,b)=>db.from('subjects').select('id,name').order('id').range(a,b)),
    all((a,b)=>db.from('profiles').select('id,full_name').eq('school_id',schoolId).eq('role','guru').order('id').range(a,b)),
    all((a,b)=>db.from('students').select('id,class_id').eq('school_id',schoolId).order('id').range(a,b)),
  ]);
  if(school.error) throw school.error;
  if(f.classId&&!classes.some(x=>x.id===f.classId)||f.teacherId&&!teachers.some(x=>x.id===f.teacherId)||f.subjectId&&!subjects.some(x=>x.id===f.subjectId)) throw new HttpError('Filter tidak valid.',400);
  const chosen=classes.filter(x=>(!f.classId||x.id===f.classId)&&(!f.year||x.academic_year===f.year));
  const studentIds=new Set(students.map(x=>x.id));
  const total=blank(); const classGroups=new Map<string,Group>(); const subjectGroups=new Map<string,Group>(); const teacherGroups=new Map<string,Group>();
  const seen=new Map<Totals,Set<string>>();
  function group(map:Map<string,Group>,id:string,name:string){let g=map.get(id);if(!g){g={id,name,...blank()};map.set(id,g);}return g;}
  function targets(row:Row){return [total,group(classGroups,row.class_id, String(classes.find(x=>x.id===row.class_id)?.name||'Kelas')+' ('+String(classes.find(x=>x.id===row.class_id)?.academic_year||'')+')'),group(subjectGroups,row.subject_id,String(subjects.find(x=>x.id===row.subject_id)?.name||'Mapel')),group(teacherGroups,row.teacher_id,String(teachers.find(x=>x.id===row.teacher_id)?.full_name||'Guru'))];}
  function student(t:Totals,id:string){let s=seen.get(t);if(!s){s=new Set();seen.set(t,s);}s.add(id);t.students=s.size;}
  const match=(r:Row)=>(!f.subjectId||r.subject_id===f.subjectId)&&(!f.teacherId||r.teacher_id===f.teacherId);
  async function batched(ids:string[], query:(ids:string[],lo:number,hi:number)=>PromiseLike<Result>){
    const result:Row[]=[];for(let i=0;i<ids.length;i+=80)result.push(...await all((lo,hi)=>query(ids.slice(i,i+80),lo,hi)));return result;
  }
  function byKey(rows:Row[],key:string){const map=new Map<string,Row[]>();for(const row of rows){const k=String(row[key]);const group=map.get(k)||[];group.push(row);map.set(k,group);}return map;}
  for(const c of chosen){
    group(classGroups,c.id,`${c.name} (${c.academic_year})`);
    const [sessions,activities,modules]=await Promise.all([
      all((a,b)=>db.from('learning_sessions').select('id,class_id,subject_id,teacher_id').eq('class_id',c.id).gte('date',f.start).lte('date',f.end).order('id').range(a,b)),
      all((a,b)=>db.from('assessment_activities').select('id,class_id,subject_id,teacher_id,max_score').eq('class_id',c.id).gte('date',f.start).lte('date',f.end).order('id').range(a,b)),
      all((a,b)=>db.from('teaching_modules').select('id,class_id,subject_id,teacher_id').eq('school_id',schoolId).eq('class_id',c.id).gte('created_at',f.start+'T00:00:00+07:00').lte('created_at',f.end+'T23:59:59.999+07:00').order('id').range(a,b)),
    ]);
    for(const m of modules.filter(match)) for(const t of targets(m)) t.modules++;
    const selectedActivities=activities.filter(match),selectedSessions=sessions.filter(match);
    const [resultRows,analysisRows,reportRows]=await Promise.all([
      batched(selectedActivities.map(a=>String(a.id)),(ids,lo,hi)=>db.from('assessment_results').select('id,assessment_activity_id,student_id,score').in('assessment_activity_id',ids).order('id').range(lo,hi)),
      batched(selectedSessions.map(a=>String(a.id)),(ids,lo,hi)=>db.from('ai_analyses').select('id,learning_session_id,teacher_id,status').in('learning_session_id',ids).order('id').range(lo,hi)),
      batched(selectedSessions.map(a=>String(a.id)),(ids,lo,hi)=>db.from('published_reports').select('id,learning_session_id,teacher_id,student_id,report_snapshot,published_at').in('learning_session_id',ids).eq('publication_status','published').order('published_at',{ascending:false,nullsFirst:false}).order('id').range(lo,hi)),
    ]);
    const resultsByActivity=byKey(resultRows,'assessment_activity_id'),analysesBySession=byKey(analysisRows,'learning_session_id'),reportsBySession=byKey(reportRows,'learning_session_id');
    for(const a of selectedActivities){
      const ts=targets(a); ts.forEach(t=>t.assessments++);
      const results=resultsByActivity.get(a.id)||[];
      for(const r of results){if(!studentIds.has(r.student_id))continue; for(const t of ts){t.results++;student(t,r.student_id);if(typeof r.score==='number'&&a.max_score>0&&r.score>=0&&r.score<=a.max_score){t.scoreSum+=100*r.score/a.max_score;t.scoreCount++;}}}
    }
    for(const s of selectedSessions){
      const ts=targets(s);ts.forEach(t=>t.sessions++);
      const analyses=(analysesBySession.get(s.id)||[]).filter(a=>a.teacher_id===s.teacher_id);
      const reports=(reportsBySession.get(s.id)||[]).filter(r=>r.teacher_id===s.teacher_id);
      if(analyses.some(a=>a.status==='completed')) ts.forEach(t=>t.analyses++);
      const seenStudents=new Set<string>();
      for(const r of reports){if(!studentIds.has(r.student_id)||seenStudents.has(r.student_id))continue;seenStudents.add(r.student_id);
        const indicators=r.report_snapshot?.indicator_progress;if(!Array.isArray(indicators))continue;
        const ids=new Set<string>();
        for(const i of indicators){if(!i||typeof i!=='object')continue;const key=String(i.id||i.description||i.code||'').trim();if(!key||ids.has(key))continue;ids.add(key);for(const t of ts){t[decision(i)]++;student(t,r.student_id);}}
      }
    }
  }
  const snapshot:Snapshot={version:1,schoolName:String(school.data?.name||'Sekolah'),filters:f,total,classes:[...classGroups.values()],subjects:[...subjectGroups.values()],teachers:[...teacherGroups.values()],generatedAt:new Date().toISOString()};
  return {snapshot,options:{classes,subjects,teachers}};
}
function filters(p:Record<string,unknown>):Filters { const str=(k:string)=>typeof p[k]==='string'?String(p[k]):'';return {start:str('start'),end:str('end'),classId:str('classId'),subjectId:str('subjectId'),teacherId:str('teacherId'),year:str('year')}; }
async function history(ctx:Awaited<ReturnType<typeof context>>){const r=await ctx.db.from('school_reports').select('id,report_type,period_start,period_end,created_at,report_snapshot').eq('school_id',ctx.schoolId).order('created_at',{ascending:false}).limit(100);if(r.error)throw r.error;return r.data||[];}
function failure(e:unknown){if(e instanceof HttpError)return json({error:e.message},e.status);console.error('School analytics:',e);return json({error:'Data sekolah gagal dimuat. Pastikan migrasi 029 sudah dijalankan. Periksa log server.'},500);}
export async function GET(req:NextRequest){try{const ctx=await context();if(req.nextUrl.searchParams.get('history')==='1')return json({reports:await history(ctx)});return json({...await calculate(ctx,filters(Object.fromEntries(req.nextUrl.searchParams))),principalName:ctx.principal.full_name});}catch(e){return failure(e);}}
export async function POST(req:NextRequest){try{const ctx=await context();const p=await req.json() as Record<string,unknown>;const type=String(p.reportType||'');if(!Object.prototype.hasOwnProperty.call(reportTypes,type))throw new HttpError('Jenis laporan tidak valid.',400);const {snapshot}=await calculate(ctx,filters(p));const r=await ctx.db.from('school_reports').insert({school_id:ctx.schoolId,created_by:ctx.principal.id,report_type:type,period_start:snapshot.filters.start,period_end:snapshot.filters.end,report_snapshot:snapshot}).select('id,report_type,period_start,period_end,created_at,report_snapshot').single();if(r.error)throw r.error;return json({report:r.data},201);}catch(e){return failure(e);}}
