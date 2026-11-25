'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, Users } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

type UserInfo = { full_name: string; role: string; avatar_url?: string; email?: string };
type StudentScore = { student_id: string; nis: string; full_name: string; score: string; notes: string };
type ActivityInfo = {
  id: string;
  title: string;
  type: string;
  date: string;
  max_score: number;
  minimum_score: number | null;
  achievement_threshold: number | null;
  class_id: string;
};

export default function GuruAssessmentScoreInputPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const assessmentId = params.id;
  const [user, setUser] = React.useState<UserInfo | null>(null);
  const [activity, setActivity] = React.useState<ActivityInfo | null>(null);
  const [rows, setRows] = React.useState<StudentScore[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [loadError, setLoadError] = React.useState('');

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.replace('/pilih-peran');
        return;
      }

      const [{ data: profile }, { data: activityData, error: activityError }] = await Promise.all([
        supabase.from('profiles').select('full_name, role, avatar_url').eq('id', authData.user.id).maybeSingle(),
        supabase.from('assessment_activities')
          .select('id, title, type, date, max_score, minimum_score, achievement_threshold, class_id')
          .eq('id', assessmentId)
          .eq('teacher_id', authData.user.id)
          .maybeSingle(),
      ]);

      if (activityError || !activityData) throw new Error('Asesmen tidak ditemukan atau bukan milik akun ini.');

      const [{ data: students, error: studentsError }, { data: results, error: resultsError }] = await Promise.all([
        supabase.from('students').select('id, nis, full_name').eq('class_id', activityData.class_id).eq('is_active', true).order('full_name'),
        supabase.from('assessment_results').select('student_id, score, notes').eq('assessment_activity_id', assessmentId),
      ]);
      if (studentsError || resultsError) throw studentsError || resultsError;

      const existing = new Map<string, { score: number; notes: string | null }>((results || []).map((result) => [result.student_id, { score: result.score, notes: result.notes }]));
      if (!active) return;
      setUser({
        full_name: profile?.full_name || 'Guru',
        role: profile?.role || 'guru',
        avatar_url: profile?.avatar_url || undefined,
        email: authData.user.email || undefined,
      });
      setActivity(activityData as ActivityInfo);
      setRows((students || []).map((student) => {
        const result = existing.get(student.id);
        return {
          student_id: student.id,
          nis: student.nis,
          full_name: student.full_name,
          score: result ? String(result.score) : '',
          notes: result?.notes || '',
        };
      }));
    };

    load()
      .catch((error) => {
        console.error('Load assessment scores failed:', error);
        if (active) setLoadError(error instanceof Error ? error.message : 'Nilai peserta didik gagal dimuat.');
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [assessmentId, router]);

  const updateRow = (studentId: string, field: 'score' | 'notes', value: string) => {
    setRows((current) => current.map((row) => row.student_id === studentId ? { ...row, [field]: value } : row));
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/pilih-peran');
  };

  const handleSave = async () => {
    if (!activity) return;
    const filledRows = rows.filter((row) => row.score.trim() !== '');
    for (const row of filledRows) {
      const score = Number(row.score);
      if (!Number.isFinite(score) || score < 0 || score > activity.max_score) {
        toast.error(`Periksa nilai ${row.full_name}. Nilai harus berada di antara 0 dan ${activity.max_score}.`);
        return;
      }
    }
    if (filledRows.length === 0) {
      toast.error('Masukkan minimal satu nilai sebelum menyimpan.');
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const payload = filledRows.map((row) => ({
        assessment_activity_id: activity.id,
        student_id: row.student_id,
        score: Number(row.score),
        notes: row.notes.trim() || null,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase.from('assessment_results').upsert(payload, {
        onConflict: 'assessment_activity_id,student_id',
      });
      if (error) throw error;
      toast.success(`${payload.length} nilai berhasil disimpan.`);
      router.push('/guru/asesmen');
      router.refresh();
    } catch (error) {
      console.error('Save assessment scores failed:', error);
      toast.error(error instanceof Error ? error.message : 'Nilai gagal disimpan.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#299C96]" /></div>;
  if (!user) return null;

  return (
    <DashboardLayout
      role="guru"
      user={user}
      onLogout={handleLogout}
      breadcrumbs={[
        { label: 'Beranda', href: '/guru' },
        { label: 'Asesmen', href: '/guru/asesmen' },
        { label: 'Input Nilai' },
      ]}
    >
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/guru/asesmen" aria-label="Kembali" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#E1E9ED] bg-white text-[#476175] hover:border-[#299C96] hover:text-[#217D77]">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#299C96]">Daftar nilai</p>
            <h1 className="mt-1 text-2xl font-extrabold text-[#17324D]">Input hasil asesmen</h1>
          </div>
        </div>

        {loadError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError}</div>}
        {activity && (
          <Card>
            <CardHeader>
              <CardTitle className="text-[#17324D]">{activity.title}</CardTitle>
              <CardDescription>{activity.type === 'formatif' ? 'Formatif' : 'Sumatif'} · {new Date(activity.date).toLocaleDateString('id-ID')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3 text-sm text-[#607487]">
              <span className="rounded-lg bg-[#F4F8FA] px-3 py-2">Skor maksimum: <strong className="text-[#17324D]">{activity.max_score}</strong></span>
              <span className="rounded-lg bg-[#F4F8FA] px-3 py-2">Skor minimum: <strong className="text-[#17324D]">{activity.minimum_score ?? 'Belum diatur'}</strong></span>
              <span className="rounded-lg bg-[#F4F8FA] px-3 py-2">Target siswa: <strong className="text-[#17324D]">{activity.achievement_threshold === null ? 'Belum diatur' : `${activity.achievement_threshold}%`}</strong></span>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg text-[#17324D]"><Users className="h-5 w-5 text-[#299C96]" /> Nilai peserta didik</CardTitle>
              <CardDescription>{rows.length} siswa aktif pada kelas ini. Kosongkan nilai bila belum ada bukti asesmen.</CardDescription>
            </div>
            <span className="rounded-full bg-[#E8F5F3] px-3 py-1 text-xs font-bold text-[#217D77]">{rows.filter((row) => row.score.trim() !== '').length}/{rows.length} terisi</span>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#DCE6EA] px-6 py-12 text-center text-sm text-[#718096]">Belum ada siswa aktif pada kelas ini.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead><tr className="border-b border-[#E7EEF1] text-left text-xs uppercase tracking-wide text-[#718096]"><th className="px-3 py-3">Peserta didik</th><th className="px-3 py-3">NIS</th><th className="w-36 px-3 py-3">Nilai / {activity?.max_score ?? '-'}</th><th className="px-3 py-3">Catatan (opsional)</th></tr></thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.student_id} className="border-b border-[#EEF2F4] last:border-0">
                        <td className="px-3 py-3 font-semibold text-[#29445A]">{row.full_name}</td>
                        <td className="px-3 py-3 text-[#718096]">{row.nis}</td>
                        <td className="px-3 py-3"><Input aria-label={`Nilai ${row.full_name}`} type="number" min="0" max={activity?.max_score} step="1" value={row.score} onChange={(event) => updateRow(row.student_id, 'score', event.target.value)} placeholder="-" /></td>
                        <td className="px-3 py-3"><Input aria-label={`Catatan ${row.full_name}`} value={row.notes} onChange={(event) => updateRow(row.student_id, 'notes', event.target.value)} placeholder="Catatan guru" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Link href="/guru/asesmen"><Button type="button" variant="outline" className="w-full sm:w-auto">Kembali</Button></Link>
          <Button type="button" onClick={handleSave} disabled={saving || !activity || rows.length === 0} className="w-full gap-2 bg-[#17324D] hover:bg-[#245B7A] sm:w-auto">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan nilai
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
