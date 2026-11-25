'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Calendar, School, GraduationCap, Award, TrendingUp, BookOpen, ClipboardList, Home } from 'lucide-react';
import Link from 'next/link';

interface ProfilAnakPageData {
  children: {
    id: string;
    full_name: string;
    nis: string;
    gender: string;
    birth_date: string;
    birth_place: string;
    class_name: string;
    grade: string;
    school_name: string;
    avatar_url?: string;
    address?: string;
    parent_name?: string;
    parent_phone?: string;
  }[];
  user: {
    full_name: string;
    role: string;
    avatar_url?: string;
    email?: string;
  };
}

export default function WaliMuridProfilAnakPage() {
  const [pageData, setPageData] = React.useState<any>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
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

  // Fetch parent's verified students
  const { data: parentStudents, error: parentStudentsError } = await supabase
    .from('parent_students')
    .select(`
      student_id,
      verification_status,
      students!inner(
        id, full_name, nis, gender, birth_date, birth_place, class_id, avatar_url, address,
        classes!inner(name, grade, schools!inner(name)),
        parent_students(profiles!parent_students_parent_id_fkey(full_name, phone))
      )
    `)
    .eq('parent_id', user.id)
    .eq('verification_status', 'verified');

  // A broken join or RLS policy must never masquerade as an unlinked child.
  if (parentStudentsError) {
    console.error('Parent children query failed:', {
      code: parentStudentsError.code,
      message: parentStudentsError.message,
    });
    throw new Error('Data anak gagal dibaca. Periksa izin akses kelas/siswa (migrasi 024).');
  }
  if (!parentStudents?.length) {
    const { data: links, error: linksError } = await supabase
      .from('parent_students')
      .select('student_id, verification_status')
      .eq('parent_id', user.id);
    if (linksError) {
      console.error('Parent link lookup failed:', { code: linksError.code, message: linksError.message });
      throw new Error('Status undangan anak tidak dapat diperiksa. Periksa izin parent_students.');
    }
    if (links?.some((link) => link.verification_status === 'verified')) {
      throw new Error('Akun sudah tertaut dengan anak, tetapi detail kelas belum terbaca. Jalankan migrasi 024.');
    }
    if (links?.some((link) => link.verification_status === 'pending')) {
      throw new Error('Hubungan akun dan anak masih menunggu verifikasi dari sekolah.');
    }
  }

  type StudentWithRelations = {
    id: string;
    full_name: string;
    nis: string;
    gender: string;
    birth_date: string;
    birth_place: string;
    class_id: string;
    avatar_url?: string;
    address?: string;
    classes: {
      name: string;
      grade: string;
      schools: {
        name: string;
      };
    };
    parent_students: { profiles: { full_name: string; phone: string } }[];
  };

  type ParentStudentRow = {
    student_id: string;
    verification_status: string;
    students: StudentWithRelations;
  };

  const typedParentStudents = (parentStudents || []) as unknown as ParentStudentRow[];

  const children = typedParentStudents.map(ps => ({
    id: ps.students.id,
    full_name: ps.students.full_name,
    nis: ps.students.nis,
    gender: ps.students.gender,
    birth_date: ps.students.birth_date,
    birth_place: ps.students.birth_place,
    class_name: ps.students.classes.name,
    grade: ps.students.classes.grade,
    school_name: ps.students.classes.schools.name,
    avatar_url: ps.students.avatar_url,
    address: ps.students.address,
    parent_name: ps.students.parent_students[0]?.profiles?.full_name,
    parent_phone: ps.students.parent_students[0]?.profiles?.phone,
  }));

  const pageData: ProfilAnakPageData = {
    children,
    user: {
      full_name: profile?.full_name || 'Wali Murid',
      role: profile?.role || 'wali_murid',
      avatar_url: profile?.avatar_url,
      email: user.email || undefined,
    },
  };

  if (!cancelled) setPageData(pageData);

    };

    load().catch((error) => {
      console.error('LENTERA page load failed:', error);
      if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Gagal memuat data anak.');
    });

    return () => { cancelled = true; };
  }, [attempt]);

  if (loadError) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 rounded-2xl bg-rose-50 p-4 text-rose-600">{loadError}</div>
        <button type="button" onClick={() => { setLoadError(null); setAttempt((value) => value + 1); }} className="rounded-xl bg-[#17324D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#245B7A]">Coba lagi</button>
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

  return <WaliMuridProfilAnakContent data={pageData} />;
}

function WaliMuridProfilAnakContent({ data }: { data: ProfilAnakPageData }) {
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/pilih-peran';
  };

  return (
    <DashboardLayout
      role="wali_murid"
      user={data.user}
      onLogout={handleLogout}
      breadcrumbs={[
        { label: 'Beranda', href: '/wali-murid' },
        { label: 'Profil Anak' },
      ]}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="animate-fade-in">
          <h1 className="heading-2">Profil Anak</h1>
          <p className="body mt-1">Lihat informasi lengkap profil anak Anda</p>
        </div>

        {data.children.length === 0 ? (
          <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="card-content p-8 text-center">
              <User className="h-16 w-16 mx-auto mb-4 text-navy-200" />
              <h3 className="heading-5 mb-2">Belum ada anak terhubung</h3>
              <p className="body mb-4">
                Hubungi sekolah untuk mendapatkan kode undangan dan menghubungkan akun dengan data anak Anda.
              </p>
              <Button variant="outline">Minta Kode Undangan</Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {data.children.map((child, index) => (
              <Card key={child.id} className="animate-fade-in" style={{ animationDelay: `${100 + index * 100}ms` }}>
                <div className="card-header">
                  <h3 className="card-title flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profil {child.full_name}
                  </h3>
                </div>
                <div className="card-content">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-shrink-0 sm:w-32">
                      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-teal-100 text-teal-600 text-3xl font-bold mx-auto sm:mx-0">
                        {child.avatar_url ? (
                          <img src={child.avatar_url} alt={child.full_name} className="h-32 w-32 rounded-full" />
                        ) : (
                          child.full_name.charAt(0)
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="heading-4">{child.full_name}</h4>
                      <div className="grid gap-3 sm:grid-cols-2 mt-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={child.gender === 'L' ? 'bg-teal-50 text-teal-700' : 'bg-success-50 text-success-700'}>
                            {child.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-navy-400" />
                          <span>{new Date(child.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-navy-400" />
                          <span>{child.birth_place}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <School className="h-4 w-4 text-navy-400" />
                          <span>{child.school_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-navy-400" />
                          <span>Kelas {child.class_name} ({child.grade})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-navy-400" />
                          <span>NIS: {child.nis}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {child.address && (
                    <div className="mt-6 p-4 bg-navy-50 rounded-lg">
                      <h5 className="label mb-2 flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Alamat
                      </h5>
                      <p className="text-sm text-navy-600">{child.address}</p>
                    </div>
                  )}

                  {child.parent_name && (
                    <div className="mt-4 p-4 bg-teal-50 rounded-lg border border-teal-100">
                      <h5 className="label mb-2 flex items-center gap-2">
                        <User className="h-4 w-4 text-teal-600" />
                        Informasi Orang Tua / Wali
                      </h5>
                      <div className="flex flex-wrap gap-4 text-sm text-navy-600">
                        <span>{child.parent_name}</span>
                        {child.parent_phone && <span>{child.parent_phone}</span>}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex gap-3">
                    <Link href={`/wali-murid/perkembangan?child=${child.id}`} className="btn btn-outline flex-1 gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Perkembangan Belajar
                    </Link>
                    <Link href={`/wali-murid/asesmen?child=${child.id}`} className="btn btn-outline flex-1 gap-2">
                      <ClipboardList className="h-4 w-4" />
                      Hasil Asesmen
                    </Link>
                    <Link href={`/wali-murid/laporan?child=${child.id}`} className="btn btn-outline flex-1 gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Laporan
                    </Link>
                  </div>
                </div>
              </Card>
          ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}