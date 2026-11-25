'use client';
import { IllustratedIcon } from '@/components/ui/illustrated-icon';
import { SearchField } from '@/components/ui/search-field';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Users, UserPlus, Download, Edit, MoreVertical, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { downloadCsv } from '@/lib/export-csv';

interface SiswaPageData {
  students: {
    id: string;
    nis: string;
    full_name: string;
    gender: string;
    birth_date: string;
    class_name: string;
    grade: string;
    is_active: boolean;
    parent_name?: string;
    parent_phone?: string;
  }[];
  classes: { id: string; name: string; grade: string }[];
  user: {
    full_name: string;
    role: string;
    avatar_url?: string;
    email?: string;
  };
}

export default function GuruSiswaPage() {
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

  // Fetch teacher's classes
  const { data: teacherClasses, error: teacherClassesError } = await supabase
    .from('teacher_classes')
    .select('class_id')
    .eq('teacher_id', user.id);

  if (teacherClassesError) throw new Error(`Tidak dapat membaca kelas yang diampu: ${teacherClassesError.message}`);
  const classIds = teacherClasses?.map(tc => tc.class_id) || [];

  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('id, name, grade')
    .in('id', classIds);

  if (classesError) throw new Error(`Tidak dapat membaca kelas: ${classesError.message}`);
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select(`
      id, nis, full_name, gender, birth_date, is_active,
      classes!inner(name, grade),
      parent_students(profiles!parent_students_parent_id_fkey(full_name, phone))
    `)
    .in('class_id', classIds)
    .order('full_name')
    .returns<Array<{
      id: string;
      nis: string;
      full_name: string;
      gender: string;
      birth_date: string;
      is_active: boolean;
      classes: { name: string; grade: string };
      parent_students: { profiles: { full_name: string; phone: string } }[];
    }>>();

  if (studentsError) throw new Error(`Tidak dapat membaca siswa: ${studentsError.message}`);
  const pageData: SiswaPageData = {
    students: students?.map(s => ({
      id: s.id,
      nis: s.nis,
      full_name: s.full_name,
      gender: s.gender,
      birth_date: s.birth_date,
      class_name: s.classes.name,
      grade: s.classes.grade,
      is_active: s.is_active,
      parent_name: s.parent_students[0]?.profiles?.full_name,
      parent_phone: s.parent_students[0]?.profiles?.phone,
    })) || [],
    classes: classes || [],
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

  return <GuruSiswaContent data={pageData} />;
}

function GuruSiswaContent({ data }: { data: SiswaPageData }) {
  const [query,setQuery]=React.useState('');
  const [classFilter,setClassFilter]=React.useState('');
  const [selected,setSelected]=React.useState<SiswaPageData['students'][number] | null>(null);
  const visible=data.students.filter(s=>(!classFilter||s.class_name===classFilter)&&[s.full_name,s.nis,s.class_name].some(x=>x.toLowerCase().includes(query.toLowerCase())));
  const exportRows=()=>downloadCsv('lentera-siswa.csv', [['NIS','Nama','Kelas','Tingkat','Jenis Kelamin','Tanggal Lahir','Status'],...visible.map(s=>[s.nis,s.full_name,s.class_name,s.grade,s.gender,s.birth_date,s.is_active?'Aktif':'Tidak Aktif'])]);
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/pilih-peran';
  };

  return (
    <DashboardLayout
      role="guru"
      user={data.user}
      onLogout={handleLogout}
      breadcrumbs={[
        { label: 'Beranda', href: '/guru' },
        { label: 'Data Siswa' },
      ]}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="heading-2">Data Siswa</h1>
            <p className="body mt-1">Kelola data peserta didik di kelas yang Anda ampu</p>
          </div>
          <div className="flex gap-2">
<span className="text-xs text-[#506779]">Impor massal belum tersedia</span>
            <Link href="/guru/siswa/tambah">
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Tambah Siswa
              </Button>
            </Link>
          </div>
        </div>

        {/* Toolbar */}
        <div className="card animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="card-content">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <SearchField value={query} onChange={setQuery} placeholder="Cari siswa (nama, NIS)..." label="Cari daftar" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select aria-label="Filter kelas siswa" value={classFilter} onChange={e=>setClassFilter(e.target.value)} className="input" style={{ width: 'auto' }}>
                  <option value="">Semua Kelas</option>
                  {data.classes.map(cls => (
                    <option key={cls.id} value={cls.name}>{cls.name} ({cls.grade})</option>
                  ))}
                </select>

                <Button variant="outline" className="gap-2" disabled={!visible.length} onClick={exportRows}>
                  <Download className="h-4 w-4" />Ekspor CSV
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="card animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="card-content p-0">
            {visible.length === 0 ? (
              <div className="empty-state p-12">
                <IllustratedIcon icon={Users} label="Siswa" size="lg" />
                <h3 className="empty-state-title">Belum ada data siswa</h3>
                <p className="empty-state-description">Tambahkan data siswa untuk memulai</p>
                <Link href="/guru/siswa/tambah" className="mt-4 inline-block">
                  <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Tambah Siswa Pertama
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>NIS</th>
                      <th>Nama Lengkap</th>
                      <th>Kelas</th>
                      <th>Jenis Kelamin</th>
                      <th>Tanggal Lahir</th>
                      <th>Orang Tua / Wali</th>
                      <th>Status</th>
                      <th className="w-32">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map(student => (
                      <tr key={student.id}>
                        <td className="font-mono text-navy-900">{student.nis}</td>
                        <td>
                          <p className="font-medium text-navy-950">{student.full_name}</p>
                        </td>
                        <td>{student.class_name} ({student.grade})</td>
                        <td>
                          <Badge variant="outline" className={student.gender === 'L' ? 'bg-teal-50 text-teal-700' : 'bg-success-50 text-success-700'}>
                            {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                          </Badge>
                        </td>
                        <td className="text-navy-600">
                          {student.birth_date ? new Date(student.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belum diisi'}
                        </td>
                        <td className="text-navy-600">
                          {student.parent_name || '-'}
                          {student.parent_phone && <span className="text-xs text-navy-400 ml-1">({student.parent_phone})</span>}
                        </td>
                        <td>
                          <Badge variant={student.is_active ? 'success' : 'default'}>
                            {student.is_active ? 'Aktif' : 'Tidak Aktif'}
                          </Badge>
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={()=>setSelected(student)} title="Rincian siswa" aria-label={`Detail ${student.full_name}`}><GraduationCap className="h-4 w-4" /></button>
                            <span className="text-xs text-[#607387]">Edit oleh pengelola</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      {selected&&<div className="page-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><section role="dialog" aria-modal="true" aria-label="Detail siswa" className="page-modal space-y-4"><div className="flex items-center justify-between gap-2"><h2 className="heading-4">Detail siswa</h2><button className="btn btn-ghost" onClick={()=>setSelected(null)}>Tutup</button></div><dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm"><div><dt className="font-semibold">Nama</dt><dd>{selected.full_name}</dd></div><div><dt className="font-semibold">NIS</dt><dd>{selected.nis}</dd></div><div><dt className="font-semibold">Kelas</dt><dd>{selected.class_name}</dd></div><div><dt className="font-semibold">Tanggal lahir</dt><dd>{selected.birth_date}</dd></div><div><dt className="font-semibold">Status</dt><dd>{selected.is_active?'Aktif':'Tidak aktif'}</dd></div></dl><p className="text-xs text-[#607387]">Perubahan biodata siswa belum tersedia di halaman ini.</p></section></div>}
    </DashboardLayout>
  );
}