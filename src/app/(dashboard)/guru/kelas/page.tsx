'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Users, School, BookOpen, ClipboardList, BarChart2, GraduationCap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface KelasPageData {
  classes: {
    id: string;
    name: string;
    grade: string;
    academic_year: string;
    student_count: number;
    subject_count: number;
    homeroom_teacher?: string;
  }[];
  user: {
    full_name: string;
    role: string;
    avatar_url?: string;
    email?: string;
  };
}

export default function GuruKelasPage() {
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
  const { data: teacherClasses } = await supabase
    .from('teacher_classes')
    .select('class_id, subject_id')
    .eq('teacher_id', user.id);

  const classIds = teacherClasses?.map(tc => tc.class_id) || [];

  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select(`
      id, name, grade, academic_year,
      profiles!classes_homeroom_teacher_id_fkey(full_name),
      students(id)
    `)
    .in('id', classIds)
    .returns<Array<{
      id: string;
      name: string;
      grade: string;
      academic_year: string;
      profiles: { full_name: string } | null;
      students: { id: string }[];
    }>>();

  if (classesError) throw new Error(`Gagal memuat kelas: ${classesError.message}`);

  const pageData: KelasPageData = {
    classes: classes?.map(c => ({
      id: c.id,
      name: c.name,
      grade: c.grade,
      academic_year: c.academic_year,
      student_count: c.students?.length || 0,
      subject_count: new Set((teacherClasses || []).filter((tc) => tc.class_id === c.id && tc.subject_id).map((tc) => tc.subject_id)).size,
      homeroom_teacher: c.profiles?.full_name,
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

  return <GuruKelasContent data={pageData} />;
}

function GuruKelasContent({ data }: { data: KelasPageData }) {
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
        { label: 'Kelas Saya' },
      ]}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="heading-2">Kelas Saya</h1>
            <p className="body mt-1">Kelola kelas yang Anda ampu dan lihat ringkasan aktivitas</p>
          </div>
        </div>

        {/* Classes Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
          {data.classes.length === 0 ? (
            <div className="col-span-full">
              <div className="card-hover text-center p-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-navy-100 text-navy-400 mx-auto mb-4">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="heading-5 mb-2">Belum ada kelas</h3>
                <p className="body-sm mb-4">Anda belum ditugaskan ke kelas manapun. Hubungi kepala sekolah.</p>
              </div>
            </div>
          ) : (
            data.classes.map(cls => (
              <div key={cls.id} className="block">
                <div className="card-hover h-full">
                  <div className="card-content">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="heading-5">{cls.name}</h3>
                        <p className="body-sm text-navy-500">{cls.grade} • {cls.academic_year}</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                        <Users className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-navy-50 rounded-lg">
                      <div className="text-center">
                        <p className="metric-value text-2xl">{cls.student_count}</p>
                        <p className="caption">Siswa</p>
                      </div>
                      <div className="text-center">
                        <p className="metric-value text-2xl">{cls.subject_count}</p>
                        <p className="caption">Mata Pelajaran</p>
                      </div>
                      <div className="text-center">
                        <p className="metric-value text-2xl">{cls.homeroom_teacher ? 'Wali' : '-'}</p>
                        <p className="caption">Wali Kelas</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/guru/analisis?class=${cls.id}`} className="btn btn-outline btn-sm flex-1 gap-1" style={{ padding: '0.5rem' }}>
                        <BookOpen className="h-3 w-3" />
                        Pembelajaran
                      </Link>
                      <Link href={`/guru/siswa?class=${cls.id}`} className="btn btn-outline btn-sm flex-1 gap-1" style={{ padding: '0.5rem' }}>
                        <GraduationCap className="h-3 w-3" />
                        Siswa
                      </Link>
                      <Link href={`/guru/asesmen?class=${cls.id}`} className="btn btn-outline btn-sm flex-1 gap-1" style={{ padding: '0.5rem' }}>
                        <ClipboardList className="h-3 w-3" />
                        Asesmen
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {data.classes.length > 0 && (
          <div className="card animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="card-header">
              <h3 className="card-title">Ringkasan Cepat</h3>
            </div>
            <div className="card-content">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="text-center p-4 bg-teal-50 rounded-lg">
                  <p className="metric-value text-3xl text-teal-600">
                    {data.classes.reduce((sum, c) => sum + c.student_count, 0)}
                  </p>
                  <p className="caption">Total Siswa</p>
                </div>
                <div className="text-center p-4 bg-navy-50 rounded-lg">
                  <p className="metric-value text-3xl text-navy-600">
                    {data.classes.length}
                  </p>
                  <p className="caption">Total Kelas</p>
                </div>
                <div className="text-center p-4 bg-teal-50 rounded-lg">
                  <p className="metric-value text-3xl text-teal-600">
                    {data.classes.reduce((sum, c) => sum + c.subject_count, 0)}
                  </p>
                  <p className="caption">Total Mapel</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}