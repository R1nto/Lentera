'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, ClipboardList, Loader2, BookOpen } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

type UserInfo = { full_name: string; role: string; avatar_url?: string; email?: string };
type AssessmentItem = { id: string; student_id: string; student_name: string; nis: string; published_at: string | null;
  title: string; type: string; date: string; max_score: number; subject_name: string; score: number; };

export default function WaliMuridAsesmenPage() {
  const router = useRouter();
  const [user, setUser] = React.useState<UserInfo | null>(null);
  const [items, setItems] = React.useState<AssessmentItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.replace('/pilih-peran'); return; }

      const { data: profile, error: profileError } = await supabase.from('profiles')
        .select('full_name, role, avatar_url').eq('id', auth.user.id).maybeSingle();
      if (profileError) throw profileError;

      const published = await fetch('/api/parent/assessments', { cache: 'no-store' });
      const publishedData = await published.json();
      if (!published.ok) throw new Error(publishedData.error || 'Data publikasi gagal dimuat.');
      const mapped = (publishedData.items || []) as AssessmentItem[];

      if (!active) return;
      setUser({
        full_name: profile?.full_name || 'Wali Murid', role: profile?.role || 'wali_murid',
        avatar_url: profile?.avatar_url || undefined, email: auth.user.email || undefined,
      });
      setItems(mapped);
    };

    load().catch((loadError) => {
      console.error('Load published assessments failed:', loadError);
      if (active) setError('Hasil asesmen belum dapat dimuat. Coba lagi beberapa saat.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [router]);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/pilih-peran');
  };

  if (loading) return <div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#217D77]" /></div>;
  if (!user) return null;

  return (
    <DashboardLayout role="wali_murid" user={user} onLogout={logout} breadcrumbs={[{ label: 'Beranda', href: '/wali-murid' }, { label: 'Hasil Asesmen' }]}>
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#217D77]">Hasil yang dibagikan guru</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#17324D] sm:text-3xl">Hasil asesmen</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#607387]">Halaman ini hanya menampilkan hasil asesmen yang sudah dipublikasikan dan diizinkan untuk dilihat wali murid.</p>
        </header>
        {error && <div role="alert" className="rounded-xl border border-[#F2D2D0] bg-[#FFF3F2] px-4 py-3 text-sm text-[#A33C37]">{error}</div>}
        {items.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#E8F5F3] text-[#217D77]"><ClipboardList className="h-7 w-7" /></span>
            <h2 className="text-lg font-bold text-[#17324D]">Belum ada hasil asesmen</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#607387]">Hasil akan ditampilkan setelah guru memublikasikannya untuk anak yang terhubung dengan akun ini.</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const activity = item;
              const percent = typeof item.score === 'number' && activity.max_score > 0 ? Math.round((item.score / activity.max_score) * 100) : null;
              return (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant={activity.type === 'formatif' ? 'info' : 'warning'}>{activity.type === 'formatif' ? 'Formatif' : 'Sumatif'}</Badge>
                        <span className="text-xs text-[#718096]">{new Date(activity.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                      <h2 className="text-base font-bold text-[#26384A]">{activity.title}</h2>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#607387]">
                        <span>{item.student_name}</span><span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{item.subject_name}</span><span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />NIS {item.nis}</span>
                      </p>
                    </div>
                    <div className="shrink-0 rounded-xl bg-[#F3F8F7] px-5 py-3 sm:min-w-32 sm:text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#607387]">Nilai</p>
                      <p className="mt-1 text-xl font-extrabold tabular-nums text-[#17324D]">{typeof item.score === 'number' ? `${item.score}/${activity.max_score}` : '—'}</p>
                      <p className="text-xs font-semibold text-[#217D77]">{percent === null ? 'Belum tersedia' : `${percent}%`}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
