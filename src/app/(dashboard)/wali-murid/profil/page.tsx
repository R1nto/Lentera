'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Phone, Save, UserRound } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

type Profile = { full_name: string; role: string; phone: string | null; avatar_url: string | null };

export default function WaliMuridProfilPage() {
  const router = useRouter();
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [email, setEmail] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.replace('/pilih-peran'); return; }
      const { data, error: profileError } = await supabase.from('profiles').select('full_name, role, phone, avatar_url').eq('id', auth.user.id).single();
      if (profileError) throw profileError;
      if (!active) return;
      setProfile(data as Profile);
      setFullName(data.full_name || '');
      setPhone(data.phone || '');
      setEmail(auth.user.email || '');
    };
    load().catch((loadError) => { console.error('Load parent profile failed:', loadError); if (active) setError('Profil belum dapat dimuat.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [router]);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/pilih-peran');
  };

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true); setMessage(''); setError('');
    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error('Sesi login sudah berakhir.');
      const { error: updateError } = await supabase.from('profiles').update({ full_name: fullName.trim(), phone: phone.trim() || null, updated_at: new Date().toISOString() }).eq('id', auth.user.id);
      if (updateError) throw updateError;
      setMessage('Profil berhasil diperbarui.');
    } catch (saveError) {
      console.error('Save parent profile failed:', saveError);
      setError('Profil belum berhasil disimpan. Coba lagi.');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#217D77]" /></div>;
  if (!profile) return null;

  return (
    <DashboardLayout role="wali_murid" user={{ full_name: profile.full_name, role: profile.role, avatar_url: profile.avatar_url || undefined, email }} onLogout={logout} breadcrumbs={[{ label: 'Beranda', href: '/wali-murid' }, { label: 'Profil Saya' }]}>
      <div className="mx-auto max-w-3xl space-y-6">
        <header><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#217D77]">Pengaturan akun</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-[#17324D] sm:text-3xl">Profil saya</h1><p className="mt-2 text-sm leading-6 text-[#607387]">Perbarui informasi kontak yang digunakan pada akun LENTERA.</p></header>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg text-[#17324D]"><UserRound className="h-5 w-5 text-[#217D77]" />Informasi akun</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-5">
              {message && <div role="status" className="rounded-xl border border-[#CFE7D9] bg-[#F0FAF4] px-4 py-3 text-sm font-medium text-[#18734F]">{message}</div>}
              {error && <div role="alert" className="rounded-xl border border-[#F2D2D0] bg-[#FFF3F2] px-4 py-3 text-sm text-[#A33C37]">{error}</div>}
              <div><Label htmlFor="fullName" className="mb-2 block text-sm font-semibold text-[#26384A]">Nama lengkap</Label><Input id="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} required minLength={2} className="h-11 border-[#D6E0E8] bg-white text-[#243447]" /></div>
              <div><Label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#26384A]">Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718096]" /><Input id="email" value={email} disabled className="h-11 border-[#E2E8ED] bg-[#F3F6F8] pl-10 text-[#607387]" /></div><p className="mt-1.5 text-xs text-[#718096]">Email dikelola melalui sistem autentikasi dan tidak dapat diubah di halaman ini.</p></div>
              <div><Label htmlFor="phone" className="mb-2 block text-sm font-semibold text-[#26384A]">Nomor telepon</Label><div className="relative"><Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718096]" /><Input id="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="08xxxxxxxxxx" className="h-11 border-[#D6E0E8] bg-white pl-10 text-[#243447]" /></div></div>
              <div className="flex justify-end border-t border-[#E8EDF1] pt-5"><Button type="submit" disabled={saving || fullName.trim().length < 2} className="h-11 rounded-xl bg-[#17324D] px-5 text-white hover:bg-[#245B7A]">{saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : <><Save className="mr-2 h-4 w-4" />Simpan perubahan</>}</Button></div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
