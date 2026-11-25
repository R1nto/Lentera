'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Building2, Shield, Calendar, Save, Loader2, Camera } from 'lucide-react';
import { useState } from 'react';

interface ProfilPageData {
  user: {
    full_name: string;
    role: string;
    avatar_url?: string;
    email?: string;
    nip?: string;
    phone?: string;
    school_id?: string;
    created_at?: string;
  };
}

export default function GuruProfilPage() {
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
    .select('full_name, role, avatar_url, identifier, phone, school_id, created_at')
    .eq('id', user.id)
    .single();

  const pageData: ProfilPageData = {
    user: {
      full_name: profile?.full_name || 'Guru',
      role: profile?.role || 'guru',
      avatar_url: profile?.avatar_url,
      email: user.email || undefined,
      nip: profile?.identifier,
      phone: (profile as any)?.phone,
      school_id: (profile as any)?.school_id,
      created_at: (profile as any)?.created_at,
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

  return <GuruProfilContent data={pageData} />;
}

function GuruProfilContent({ data }: { data: ProfilPageData }) {
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/pilih-peran';
  };

  const [formData, setFormData] = useState({
    full_name: data.user.full_name,
    email: data.user.email || '',
    nip: data.user.nip || '',
    phone: data.user.phone || '',
    school_id: data.user.school_id || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profil berhasil diperbarui' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal memperbarui profil' });
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DashboardLayout
      role="guru"
      user={data.user}
      onLogout={handleLogout}
      breadcrumbs={[
        { label: 'Beranda', href: '/guru' },
        { label: 'Profil' },
      ]}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="animate-fade-in">
          <h1 className="heading-2">Profil Saya</h1>
          <p className="body mt-1">Kelola informasi pribadi dan akun Anda</p>
        </div>

        {/* Avatar & Basic Info */}
        <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="card-content">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-teal-100 text-teal-600 text-2xl font-bold">
                  {data.user.avatar_url ? (
                    <img src={data.user.avatar_url} alt={data.user.full_name} className="h-24 w-24 rounded-full" />
                  ) : (
                    getInitials(data.user.full_name)
                  )}
                </div>
                <label className="absolute bottom-0 right-0 btn btn-ghost btn-icon btn-sm bg-white rounded-full shadow" aria-label="Ganti foto">
                  <Camera className="h-4 w-4" />
                  <input type="file" accept="image/*" className="sr-only" />
                </label>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="heading-4">{formData.full_name}</h2>
                <p className="body-sm text-navy-500 mt-1">{data.user.email}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                  <Badge variant="outline" className="bg-teal-50 text-teal-700">
                    Guru Kelas
                  </Badge>
                  {data.user.nip && (
                    <Badge variant="outline" className="bg-teal-50 text-teal-700">
                      NIP: {data.user.nip}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* Personal Info */}
          <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Pribadi
              </h3>
            </div>
            <div className="card-content space-y-4">
              <div>
                <Label htmlFor="full_name">Nama Lengkap *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={e => handleChange('full_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  required
                  disabled
                />
                <p className="helper-text">Email tidak dapat diubah. Hubungi admin untuk perubahan email.</p>
              </div>
              <div>
                <Label htmlFor="nip">NIP</Label>
                <div className="relative">
                  <Input
                    id="nip"
                    placeholder="Masukkan NIP Anda"
                    value={formData.nip}
                    disabled
                    aria-describedby="identifier-help"
                  />
                  <Shield className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-navy-400" />
                </div>
                <p id="identifier-help" className="helper-text">Identitas login dikelola oleh pengelola sekolah.</p>
              </div>
              <div>
                <Label htmlFor="phone">Nomor Telepon</Label>
                <div className="relative">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Masukkan nomor telepon"
                    value={formData.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                  />
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-navy-400" />
                </div>
              </div>
            </div>
          </Card>

          {/* School Info */}
          <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informasi Sekolah
              </h3>
            </div>
            <div className="card-content space-y-4">
              <div>
                <Label htmlFor="school_id">ID Sekolah</Label>
                <div className="relative">
                  <Input
                    id="school_id"
                    placeholder="Masukkan ID sekolah"
                    value={formData.school_id}
                    disabled
                  />
                  <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-navy-400" />
                </div>
              </div>
              <div>
                <Label>Role</Label>
                <Input value="Guru Kelas" disabled />
              </div>
              <div>
                <Label>Bergabung Sejak</Label>
                <Input
                  value={data.user.created_at ? new Date(data.user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  disabled
                />
              </div>
            </div>
          </Card>

          {/* Security */}
          <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Keamanan Akun
              </h3>
            </div>
            <div className="card-content space-y-4">
              <div className="flex items-center justify-between p-4 bg-navy-50 rounded-lg">
                <div>
                  <p className="font-medium text-navy-950">Ubah Password</p>
                  <p className="text-sm text-navy-500">Perbarui password akun Anda secara berkala</p>
                </div>
                <Button variant="outline" size="sm">Ubah Password</Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-navy-50 rounded-lg">
                <div>
                  <p className="font-medium text-navy-950">Verifikasi Dua Faktor</p>
                  <p className="text-sm text-navy-500">Tambahkan lapisan keamanan tambahan</p>
                </div>
                <Button variant="outline" size="sm">Aktifkan</Button>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 animate-fade-in" style={{ animationDelay: '500ms' }}>
            <Button type="button" variant="outline" onClick={() => window.location.reload()}>
              Batal
            </Button>
            <Button type="submit" loading={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              Simpan Perubahan
            </Button>
          </div>
        </form>

        {message && (
          <div className={`animate-fade-in p-4 rounded-lg ${message.type === 'success' ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700'}`}>
            {message.text}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}