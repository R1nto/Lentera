'use client';
import { IllustratedIcon } from '@/components/ui/illustrated-icon';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { ListFilterToolbar } from '@/components/ui/list-filter-toolbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, BarChart2, ArrowRight, Download } from 'lucide-react';
import Link from 'next/link';

interface AnalisisPageData {
  sessions: {
    id: string;
    title: string;
    topic: string;
    date: string;
    subject_name: string;
    class_name: string;
    phase: string;
    status: string;
    analysis_status: string | null;
    module_title?: string;
  }[];
  user: {
    full_name: string;
    role: string;
    avatar_url?: string;
    email?: string;
  };
}

export default function GuruAnalisisPage() {
  const [pageData, setPageData] = React.useState<any>(null);
  const [loadError, setLoadError] = React.useState<string | false>(false);
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

  const { data: sessions, error: sessionsError } = await supabase
    .from('learning_sessions')
    .select(`
      id, title, topic, date, phase, status, module_id,
      subjects!inner(name),
      classes!inner(name)
    `)
    .eq('teacher_id', user.id)
    .order('date', { ascending: false })
    .returns<Array<{ id: string; title: string; topic: string; date: string; phase: string; status: string; module_id: string | null; subjects: { name: string }; classes: { name: string } }>>();

  if (sessionsError) throw new Error(`Gagal memuat pembelajaran: ${sessionsError.message}`);
  const moduleIds = [...new Set((sessions || []).map(s => s.module_id).filter((id): id is string => Boolean(id)))];
  const { data: linkedModules } = moduleIds.length
    ? await supabase.from('teaching_modules').select('id,title').in('id', moduleIds).eq('teacher_id', user.id)
    : { data: [] as { id: string; title: string }[] };
  const moduleTitles = new Map((linkedModules || []).map(m => [m.id, m.title]));
  const sessionIds = sessions?.map(s => s.id) || [];
  const { data: analyses, error: analysesError } = sessionIds.length
    ? await supabase.from('ai_analyses').select('learning_session_id, status').in('learning_session_id', sessionIds)
    : { data: [], error: null };

  if (analysesError && sessionIds.length) console.warn('Gagal memuat status analisis:', analysesError.message);
  const analysisMap = new Map(analyses?.map(a => [a.learning_session_id, a.status]) || []);

  const pageData: AnalisisPageData = {
    sessions: sessions?.map(s => ({
      id: s.id,
      title: s.title,
      topic: s.topic,
      date: s.date,
      subject_name: s.subjects.name,
      class_name: s.classes.name,
      phase: s.phase,
      status: s.status,
      analysis_status: analysisMap.get(s.id) || null,
      module_title: s.module_id ? moduleTitles.get(s.module_id) || undefined : undefined,
    })) || [],
    user: {
      full_name: profile?.full_name || 'Guru',
      role: profile?.role || 'guru',
      avatar_url: profile?.avatar_url,
      email: user.email || undefined,
    },
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

  return <GuruAnalisisContent data={pageData} />;
}

function GuruAnalisisContent({ data }: { data: AnalisisPageData }) {
  const [sessions, setSessions] = React.useState(data.sessions);
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState('semua');
  const [selected,setSelected] = React.useState<AnalisisPageData['sessions'][number] | null>(null);
  const [editing,setEditing] = React.useState(false);
  const [title,setTitle] = React.useState('');
  const [topic,setTopic] = React.useState('');
  const [date,setDate] = React.useState('');
  const [error,setError] = React.useState('');
  const [saving,setSaving] = React.useState(false);
  const visible = sessions.filter(s=>(filter==='semua'||s.status===filter)&&[s.title,s.topic,s.class_name,s.subject_name].some(v=>v.toLowerCase().includes(search.toLowerCase())));
  const handleLogout=async()=>{await createClient().auth.signOut(); window.location.href='/pilih-peran';};
  const show=(s:AnalisisPageData['sessions'][number],edit=false)=>{setSelected(s);setTitle(s.title);setTopic(s.topic);setDate(s.date);setEditing(edit);setError('');};
  const exportCsv=()=>{
    const rows=[['Judul','Topik','Mata pelajaran','Kelas','Tanggal','Fase','Status','Analisis'],...visible.map(s=>[s.title,s.topic,s.subject_name,s.class_name,s.date,s.phase,s.status,s.analysis_status||'Belum'])];
    const content='\uFEFF'+rows.map(row=>row.map(value=>'"'+String(value).replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='lentera-pembelajaran.csv';a.click();URL.revokeObjectURL(url);
  };
  const save=async()=>{
    if(!selected||!title.trim()||!topic.trim()||!date){setError('Judul, topik dan tanggal wajib diisi.');return;}
    setSaving(true);setError('');
    try{const client=createClient();const {data:{user}}=await client.auth.getUser();if(!user)throw new Error('Sesi login berakhir.');
      const {error}=await client.from('learning_sessions').update({title:title.trim(),topic:topic.trim(),date}).eq('id',selected.id).eq('teacher_id',user.id);
      if(error)throw error;setSessions(prev=>prev.map(s=>s.id===selected.id?{...s,title:title.trim(),topic:topic.trim(),date}:s));setSelected(null);
    }catch(e){setError(e instanceof Error?e.message:'Gagal menyimpan pembelajaran.');}finally{setSaving(false);}
  };
  return <DashboardLayout role="guru" user={data.user} onLogout={handleLogout} breadcrumbs={[{label:'Beranda',href:'/guru'},{label:'Pembelajaran'}]}>
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="heading-2">Pembelajaran & Analisis</h1><p className="body-sm mt-1">Kelola sesi pembelajaran, lihat analisis, dan perbarui informasi sesi.</p></div><Link href="/guru/analisis/buat"><Button><Plus className="mr-2 h-4 w-4"/>Buat pembelajaran baru</Button></Link></div>
      <ListFilterToolbar
        title="Cari pembelajaran"
        query={search}
        onQueryChange={setSearch}
        placeholder="Cari topik, sesi, atau kelas..."
        status={filter}
        onStatusChange={setFilter}
        options={[{value:'semua',label:'Semua status'},{value:'draft',label:'Draf'},{value:'planned',label:'Direncanakan'},{value:'completed',label:'Selesai'}]}
        count={visible.length}
        total={sessions.length}
        onExport={exportCsv}
      />
      <Card><div className="card-content p-0">{visible.length===0?<div className="empty-state p-10"><IllustratedIcon icon={FileText} label="Pembelajaran" size="lg" /><h2 className="heading-5">{sessions.length?'Tidak ada sesi yang cocok':'Belum ada pembelajaran'}</h2><p className="empty-state-description">{sessions.length?'Coba kata pencarian atau filter lain.':'Mulai dengan membuat sesi pembelajaran pertama.'}</p><Link href="/guru/analisis/buat"><Button className="mt-3">Buat pembelajaran</Button></Link></div>:<div className="overflow-x-auto"><table className="table"><thead><tr><th>Pembelajaran</th><th>Pelajaran</th><th>Kelas</th><th>Tanggal</th><th>Fase</th><th>Status</th><th>Analisis</th><th>Aksi</th></tr></thead><tbody>{visible.map(s=><tr key={s.id}><td><p className="font-semibold">{s.title}</p><p className="text-sm text-[#526b7e]">{s.topic}</p>{s.module_title && <p className="text-xs text-teal-700">Modul: {s.module_title}</p>}</td><td>{s.subject_name}</td><td>{s.class_name}</td><td>{new Date(s.date).toLocaleDateString('id-ID')}</td><td>{s.phase}</td><td><Badge variant={s.status==='completed'?'success':'default'}>{s.status}</Badge></td><td>{s.analysis_status||'Belum ada'}</td><td><div className="flex gap-1"><button className="btn btn-ghost btn-icon" type="button" onClick={()=>show(s)} title="Lihat rincian" aria-label={`Lihat ${s.title}`}><BarChart2 className="h-4 w-4"/></button><button className="btn btn-ghost btn-icon" type="button" onClick={()=>show(s,true)} title="Edit" aria-label={`Edit ${s.title}`}><FileText className="h-4 w-4"/></button></div></td></tr>)}</tbody></table></div>}</div></Card>
    </div>
    {selected&&<div className="page-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><section role="dialog" aria-modal="true" aria-label="Rincian pembelajaran" className="page-modal space-y-4"><div className="flex justify-between items-start gap-3"><h2 className="heading-4">{editing?'Edit pembelajaran':'Rincian pembelajaran'}</h2><button type="button" className="btn btn-ghost" onClick={()=>setSelected(null)}>Tutup</button></div>{error&&<div className="page-error" role="alert">{error}</div>}
      <label className="block text-sm font-semibold">Judul<input className="input mt-2" disabled={!editing} maxLength={200} value={title} onChange={e=>setTitle(e.target.value)}/></label>
      <label className="block text-sm font-semibold">Topik<input className="input mt-2" disabled={!editing} value={topic} onChange={e=>setTopic(e.target.value)}/></label>
      <label className="block text-sm font-semibold">Tanggal<input className="input mt-2" disabled={!editing} type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
      <p className="text-sm text-[#506779]">{selected.class_name} · {selected.subject_name} · Fase {selected.phase} · {selected.status}</p>
      <p className="text-sm">Modul Ajar: <strong>{selected.module_title || 'Tanpa modul'}</strong></p>
      <p className="text-sm">Status analisis: <strong>{selected.analysis_status||'Belum dianalisis'}</strong></p>
      <p className="text-sm text-[#506779]">Detail nilai dan hasil AI hanya ditampilkan jika sudah dihitung dari data asesmen; halaman ini tidak membuat analisis fiktif.</p>
      <div className="flex justify-end gap-2">{editing?<Button disabled={saving} onClick={save}>{saving?'Menyimpan...':'Simpan perubahan'}</Button>:<Button onClick={()=>setEditing(true)}>Edit informasi</Button>}</div></section></div>}
  </DashboardLayout>;
}
