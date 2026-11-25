'use client';
import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

type Setup = { profile: { full_name: string; role: string; avatar_url?: string; email?: string }; classes: { id: string; name: string }[] };
export default function TambahSiswaPage() {
  const router = useRouter();
  const [setup, setSetup] = React.useState<Setup | null>(null);
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ full_name: '', nis: '', class_id: '', gender: '' });
  React.useEffect(() => {
    let mounted = true;
    void fetch('/api/teacher/setup', { cache: 'no-store' }).then(async (r) => {
      const result = await r.json();
      if (r.status === 401) { router.replace('/masuk?role=guru'); return; }
      if (!r.ok) throw new Error(result.error);
      if (mounted) { setSetup(result); setForm((old) => ({ ...old, class_id: result.classes[0]?.id || '' })); }
    }).catch((cause) => { if (mounted) setError(cause.message || 'Gagal memuat kelas.'); });
    return () => { mounted = false; };
  }, [router]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const response = await fetch('/api/teacher/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      router.push('/guru/siswa'); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Gagal menyimpan siswa.'); }
    finally { setSaving(false); }
  };
  if (!setup && !error) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin" /></div>;
  return <DashboardLayout role="guru" user={setup?.profile || { full_name: 'Guru', role: 'guru' }} onLogout={async () => { await createClient().auth.signOut(); router.replace('/pilih-peran'); }} breadcrumbs={[{ label: 'Beranda', href: '/guru' }, { label: 'Siswa', href: '/guru/siswa' }, { label: 'Tambah Siswa' }]}>
    <div className="mx-auto max-w-2xl space-y-5"><h1 className="text-3xl font-extrabold text-[#17324D]">Tambah Siswa</h1>
    <p className="text-sm text-[#4d6579]">Daftarkan siswa hanya pada kelas yang ditugaskan kepada akun Guru ini.</p>
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}
    <Card><CardHeader><CardTitle>Data siswa baru</CardTitle><CardDescription>NIS harus unik dalam satu sekolah.</CardDescription></CardHeader>
      <CardContent><form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-semibold">Nama lengkap *<input required minLength={2} maxLength={150} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-2 w-full px-3" /></label>
        <label className="block text-sm font-semibold">NIS *<input required maxLength={32} value={form.nis} onChange={(e) => setForm({ ...form, nis: e.target.value })} className="mt-2 w-full px-3" /></label>
        <label className="block text-sm font-semibold">Kelas *<select required value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })} className="mt-2 w-full px-3"><option value="">Pilih kelas</option>{setup?.classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="block text-sm font-semibold">Jenis kelamin<select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="mt-2 w-full px-3"><option value="">Tidak diisi</option><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></label>
        <div className="flex flex-wrap justify-end gap-3"><Link href="/guru/siswa"><Button type="button" variant="outline">Batal</Button></Link><Button disabled={saving || !setup?.classes.length}><UserPlus className="mr-2 h-4 w-4" />{saving ? 'Menyimpan…' : 'Tambah siswa'}</Button></div>
      </form></CardContent></Card>
    </div>
  </DashboardLayout>;
}
