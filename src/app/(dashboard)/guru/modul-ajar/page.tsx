'use client';
import { IllustratedIcon } from '@/components/ui/illustrated-icon';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { ListFilterToolbar } from '@/components/ui/list-filter-toolbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, BookOpen, FileText, Edit, Download, Trash2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { downloadModulePdf } from '@/lib/module-pdf';
import { moduleDocumentSections } from '@/lib/module-document';

interface ModulAjarPageData {
  modules: {
    id: string;
    title: string;
    grade: string;
    phase: string;
    subject_name: string;
    class_name: string;
    status: string;
    meetings_count: number;
    created_at: string;
    updated_at: string;
    content: unknown;
  }[];
  user: {
    full_name: string;
    role: string;
    avatar_url?: string;
    email?: string;
  };
}

export default function GuruModulAjarPage() {
  const [pageData, setPageData] = React.useState<any>(null);
  const [loadError, setLoadError] = React.useState<string | false>(false);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      if (!cancelled) setLoadError('Permintaan data Modul Ajar terlalu lama. Periksa koneksi atau coba kembali.');
    }, 18000);
    const load = async () => {

  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Sesi Guru tidak tersedia. Silakan masuk kembali melalui halaman login.');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, avatar_url')
    .eq('id', user.id)
    .single();

  const { data: modules, error: modulesError } = await supabase
    .from('teaching_modules')
    .select(`
      id, title, grade, phase, meetings_count, status, created_at, updated_at, content,
      subjects(name),
      classes(name)
    `)
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })
    .returns<Array<{ id: string; title: string; grade: string; phase: string; meetings_count: number; status: string; created_at: string; updated_at: string; content: unknown; subjects: { name: string } | null; classes: { name: string } | null }>>();

  if (modulesError) throw new Error(`Gagal memuat modul ajar: ${modulesError.message}`);

  const pageData: ModulAjarPageData = {
    modules: modules?.map(m => ({
      id: m.id,
      title: m.title,
      grade: m.grade,
      phase: m.phase,
      subject_name: m.subjects?.name || 'Tidak diketahui',
      class_name: m.classes?.name || 'Tanpa kelas',
      status: m.status,
      meetings_count: m.meetings_count,
      created_at: m.created_at,
      updated_at: m.updated_at,
      content: m.content,
    })) || [],
    user: {
      full_name: profile?.full_name || 'Guru',
      role: profile?.role || 'guru',
      avatar_url: profile?.avatar_url,
      email: user.email || undefined,
    },
  };

  if (!cancelled && !timedOut) setPageData(pageData);

    };

    load().catch((error) => {
      console.error('LENTERA page load failed:', error);
      if (!cancelled && !timedOut) setLoadError(error instanceof Error ? error.message : 'Data tidak dapat dimuat.');
    }).finally(() => clearTimeout(timer));

    return () => { cancelled = true; clearTimeout(timer); };
  }, [attempt]);

  if (loadError) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 rounded-2xl bg-rose-50 p-4 text-rose-600">Terjadi kendala saat memuat data: {loadError}</div>
        <a href="/masuk?role=guru" className="mb-3 text-sm font-semibold text-teal-700 underline">Masuk sebagai Guru</a>
        <button type="button" onClick={() => { setPageData(null); setLoadError(false); setAttempt((value) => value + 1); }} className="rounded-xl bg-[#17324D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#245B7A]">Coba lagi</button>
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

  return <GuruModulAjarContent data={pageData} />;
}

function GuruModulAjarContent({ data }: { data: ModulAjarPageData }) {
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState('semua');
  const [selected, setSelected] = React.useState<ModulAjarPageData['modules'][number] | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [status, setStatus] = React.useState('draft');
  const [learningModel, setLearningModel] = React.useState('');
  const [learningMethodsText, setLearningMethodsText] = React.useState('');
  const [learningMediaText, setLearningMediaText] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [modules, setModules] = React.useState(data.modules);
  const visible = modules.filter(m => (filter === 'semua' || m.status === filter) &&
    [m.title, m.class_name, m.subject_name, m.grade].some(v => v.toLowerCase().includes(search.toLowerCase())));
  const handleLogout = async () => { await createClient().auth.signOut(); window.location.href = '/pilih-peran'; };
  const exportPdf = (module: ModulAjarPageData['modules'][number]) => {
    const sections = moduleDocumentSections(module.content);
    if (sections.length === 0) {
      setMessage('Isi modul belum tersimpan. PDF lengkap tidak dapat dibuat dari metadata saja.');
      setSelected(module);
      return;
    }
    try {
      downloadModulePdf(module);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'PDF modul ajar gagal dibuat.');
      setSelected(module);
    }
  };
  const exportCsv = () => {
    const rows = [['Judul','Mata pelajaran','Kelas','Tingkat','Fase','Pertemuan','Status','Diperbarui'],...visible.map(m=>[m.title,m.subject_name,m.class_name,m.grade,m.phase,String(m.meetings_count),m.status,m.updated_at])];
    const csv = '\uFEFF' + rows.map(row=>row.map(cell=>'"'+String(cell).replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
    const a=document.createElement('a');a.href=url;a.download='lentera-modul-ajar.csv';a.click(); URL.revokeObjectURL(url);
  };
  const open = (m: ModulAjarPageData['modules'][number], edit=false) => {
    const content = m.content && typeof m.content === 'object' && !Array.isArray(m.content)
      ? m.content as Record<string, unknown> : {};
    setSelected(m); setTitle(m.title); setStatus(m.status); setEditing(edit); setMessage('');
    setLearningModel(typeof content.learningModel === 'string' ? content.learningModel : '');
    setLearningMethodsText(Array.isArray(content.learningMethods) ? content.learningMethods.join(', ') : '');
    setLearningMediaText(Array.isArray(content.learningMedia) ? content.learningMedia.join(', ') : '');
  };
  const save = async () => {
    if(!selected || !title.trim()){setMessage('Judul wajib diisi.');return;}
    setBusy(true); setMessage('');
    try {
      const client=createClient(); const {data:{user}}=await client.auth.getUser();
      if(!user) throw new Error('Sesi berakhir. Masuk kembali.');
      const previousContent = selected.content && typeof selected.content === 'object' && !Array.isArray(selected.content)
        ? selected.content as Record<string, unknown> : {};
      const updatedContent = {
        ...previousContent,
        learningModel: learningModel.trim(),
        learningMethods: learningMethodsText.split(',').map(v => v.trim()).filter(Boolean),
        learningMedia: learningMediaText.split(',').map(v => v.trim()).filter(Boolean),
      };
      const {error}=await client.from('teaching_modules').update({title:title.trim(),status,content:updatedContent}).eq('id',selected.id).eq('teacher_id',user.id);
      if(error) throw error;
      setModules(prev=>prev.map(m=>m.id===selected.id?{...m,title:title.trim(),status,content:updatedContent}:m)); setSelected(null);setEditing(false);
    }catch(e){setMessage(e instanceof Error?e.message:'Perubahan tidak berhasil disimpan.');}finally{setBusy(false);}
  };
  return <DashboardLayout role="guru" user={data.user} onLogout={handleLogout} breadcrumbs={[{label:'Beranda',href:'/guru'},{label:'Modul Ajar'}]}>
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="heading-2">Modul Ajar</h1><p className="body-sm mt-1">Cari, tinjau isi, edit metadata, dan ekspor modul ajar lengkap.</p></div>
        <Link href="/guru/modul-ajar/buat"><Button><Plus className="mr-2 h-4 w-4"/>Buat modul baru</Button></Link></div>
      <ListFilterToolbar
        title="Cari modul ajar"
        query={search}
        onQueryChange={setSearch}
        placeholder="Cari judul, mata pelajaran, atau kelas..."
        status={filter}
        onStatusChange={setFilter}
        options={[{value:'semua',label:'Semua status'},{value:'draft',label:'Draf'},{value:'completed',label:'Selesai'},{value:'archived',label:'Arsip'}]}
        count={visible.length}
        total={modules.length}
        onExport={exportCsv}
      />
      <Card><div className="card-content p-0">
        {!visible.length?<div className="empty-state p-10"><IllustratedIcon icon={BookOpen} label="Modul Ajar" size="lg" /><h2 className="heading-5">{modules.length?'Tidak ada modul yang cocok':'Belum ada modul ajar'}</h2><p className="empty-state-description">{modules.length?'Ubah kata pencarian atau filter.':'Buat modul ajar pertama untuk memulai.'}</p><Link href="/guru/modul-ajar/buat"><Button className="mt-3">Buat modul ajar</Button></Link></div>:
        <div className="overflow-x-auto"><table className="table"><thead><tr><th>Modul</th><th>Pelajaran</th><th>Kelas</th><th>Fase</th><th>Pertemuan</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{visible.map(m=><tr key={m.id}><td className="font-semibold">{m.title}</td><td>{m.subject_name}</td><td>{m.class_name}</td><td>{m.grade} / {m.phase}</td><td>{m.meetings_count}</td><td><Badge variant={m.status==='completed'?'success':'default'}>{m.status}</Badge></td><td><div className="flex gap-1"><button type="button" className="btn btn-ghost btn-icon" onClick={()=>open(m)} title="Lihat detail" aria-label={`Lihat ${m.title}`}><FileText className="h-4 w-4"/></button><button type="button" className="btn btn-ghost btn-icon" onClick={()=>open(m,true)} title="Edit metadata" aria-label={`Edit ${m.title}`}><Edit className="h-4 w-4"/></button><button type="button" className="btn btn-ghost btn-icon" onClick={()=>exportPdf(m)} title="Unduh PDF modul lengkap" aria-label={`Unduh modul lengkap ${m.title}`}><Download className="h-4 w-4"/></button></div></td></tr>)}</tbody></table></div>}
      </div></Card>
    </div>
    {selected&&<div className="page-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><section role="dialog" aria-modal="true" aria-label="Detail modul ajar" className="page-modal space-y-4">
      <div className="flex justify-between gap-2"><h2 className="heading-4">{editing?'Edit metadata modul':'Detail modul ajar'}</h2><button type="button" className="btn btn-ghost" onClick={()=>setSelected(null)}>Tutup</button></div>
      {message&&<div role="alert" className="page-error">{message}</div>}
      <label className="block text-sm font-semibold">Judul modul<input value={title} disabled={!editing} onChange={e=>setTitle(e.target.value)} className="input mt-2" maxLength={200}/></label>
      <div className="grid grid-cols-2 gap-3 text-sm"><div><strong>Kelas</strong><p>{selected.class_name}</p></div><div><strong>Mata pelajaran</strong><p>{selected.subject_name}</p></div><div><strong>Fase</strong><p>{selected.phase}</p></div><div><strong>Pertemuan</strong><p>{selected.meetings_count}</p></div></div>
      {editing && <div className="space-y-3 rounded-xl border border-teal-100 bg-teal-50/40 p-3">
        <p className="text-sm font-semibold text-[#17324D]">Pelengkap Modul Ajar (termasuk modul lama)</p>
        <label className="block text-sm font-semibold">Model pembelajaran
          <input className="input mt-2" value={learningModel} onChange={e => setLearningModel(e.target.value)} maxLength={150} placeholder="Contoh: Problem Based Learning (PBL)" />
        </label>
        <label className="block text-sm font-semibold">Metode (pisahkan dengan koma)
          <input className="input mt-2" value={learningMethodsText} onChange={e => setLearningMethodsText(e.target.value)} maxLength={300} placeholder="Diskusi, demonstrasi, latihan" />
        </label>
        <label className="block text-sm font-semibold">Media (pisahkan dengan koma)
          <input className="input mt-2" value={learningMediaText} onChange={e => setLearningMediaText(e.target.value)} maxLength={300} placeholder="Papan tulis, kartu angka" />
        </label>
      </div>}
      {editing?<label className="block text-sm font-semibold">Status<select className="input mt-2" value={status} onChange={e=>setStatus(e.target.value)}><option value="draft">Draf</option><option value="completed">Selesai</option><option value="archived">Arsip</option></select></label>:<p className="text-sm">Status: {selected.status}</p>}
      <div className="max-h-[50vh] space-y-4 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4">
        {moduleDocumentSections(selected.content).length ? moduleDocumentSections(selected.content).map(section => (
          <section key={section.title} className="space-y-2">
            <h3 className="font-bold text-[#17324D]">{section.title}</h3>
            <div className="space-y-1 text-sm leading-relaxed text-[#304659]">{section.lines.map((line, index) => <p key={index} className="whitespace-pre-wrap">{line}</p>)}</div>
          </section>
        )) : <p className="text-sm text-amber-700">Konten AI tidak tersedia untuk modul ini. Hanya metadata yang tersimpan; PDF lengkap tidak bisa diunduh.</p>}
      </div>
      <div className="flex flex-wrap gap-2 justify-end"><Button variant="outline" onClick={()=>exportPdf(selected)}><Download className="mr-2 h-4 w-4"/>Unduh PDF lengkap</Button>{editing?<Button disabled={busy} onClick={save}>{busy?'Menyimpan...':'Simpan'}</Button>:<Button onClick={()=>setEditing(true)}>Edit metadata</Button>}</div>
    </section></div>}
  </DashboardLayout>;
}
