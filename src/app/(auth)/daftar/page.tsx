'use client';

import * as React from 'react';
import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound,
  Loader2, LockKeyhole, Mail, Phone, ShieldCheck, UserRound, Users,
  AlertCircle, BookOpenCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BrandMark } from '@/components/brand/brand-mark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

type FormValues = {
  full_name: string;
  email: string;
  phone: string;
  child_nis: string;
  invitation_code: string;
};

type FieldConfig = {
  name: keyof FormValues;
  label: string;
  placeholder: string;
  icon: LucideIcon;
  required?: boolean;
  type?: string;
  hint?: string;
};

const parentFields: FieldConfig[] = [
  { name: 'full_name', label: 'Nama lengkap', placeholder: 'Contoh: Rizky Jayanto', icon: UserRound, required: true },
  { name: 'email', label: 'Alamat email', placeholder: 'nama@email.com', icon: Mail, required: true, type: 'email', hint: 'Gunakan email aktif untuk menerima tautan verifikasi.' },
  { name: 'phone', label: 'Nomor telepon', placeholder: '08xxxxxxxxxx', icon: Phone, type: 'tel', hint: 'Opsional, untuk memudahkan komunikasi sekolah.' },
  { name: 'invitation_code', label: 'Kode undangan sekolah', placeholder: 'Masukkan kode dari sekolah', icon: ShieldCheck, required: true, hint: 'Kode ini menghubungkan akun dengan data anak yang benar.' },
  { name: 'child_nis', label: 'NIS anak', placeholder: 'Masukkan NIS anak (opsional)', icon: Users, hint: 'Isi apabila NIS dicantumkan pada undangan sekolah.' },
];

const initialValues: FormValues = {
  full_name: '', email: '', phone: '', child_nis: '', invitation_code: '',
};

function RegisterPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = searchParams.get('role') || 'wali_murid';
  const isParent = role === 'wali_murid';
  const [values, setValues] = useState<FormValues>(initialValues);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');

  const heading = useMemo(() => {
    if (role === 'guru') return 'Akun Guru Kelas';
    if (role === 'kepala_sekolah') return 'Akun Kepala Sekolah';
    return 'Akun Wali Murid';
  }, [role]);

  const updateField = (name: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: '' }));
    setError('');
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (values.full_name.trim().length < 2) next.full_name = 'Nama lengkap minimal 2 karakter.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = 'Masukkan alamat email yang valid.';
    if (!values.invitation_code.trim()) next.invitation_code = 'Kode undangan dari sekolah wajib diisi.';
    if (password.length < 8) next.password = 'Password minimal 8 karakter.';
    if (confirmPassword !== password) next.confirmPassword = 'Konfirmasi password belum sama.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!validate()) return;
    setIsLoading(true);

    try {
      // Validate the invitation before creating an Auth user. Invalid codes must
      // never leave an orphan account that prevents the same email from retrying.
      const preflightResponse = await fetch('/api/auth/register/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitation_code: values.invitation_code.trim(),
          child_nis: values.child_nis.trim() || undefined,
        }),
      });
      const preflight = await preflightResponse.json();
      if (!preflightResponse.ok) {
        setError(preflight.error || 'Kode undangan belum dapat diverifikasi.');
        setIsLoading(false);
        return;
      }

      const supabase = createClient();
      const normalizedEmail = values.email.trim().toLowerCase();
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { full_name: values.full_name.trim(), registration_role: 'wali_murid' },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/wali-murid`,
        },
      });

      if (signUpError || !authData.user) {
        setError(signUpError?.message || 'Akun belum dapat dibuat. Periksa konfigurasi Supabase Auth.');
        return;
      }

      // Supabase may return a user without an identity when the email already exists.
      if (Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
        setError('Email ini sudah terdaftar. Silakan masuk atau gunakan alamat email lain.');
        return;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: authData.user.id,
          full_name: values.full_name.trim(),
          email: normalizedEmail,
          role: 'wali_murid',
          phone: values.phone.trim() || null,
          invitation_code: values.invitation_code.trim(),
          child_nis: values.child_nis.trim() || null,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Profil belum berhasil disimpan. Silakan coba kembali.');
        return;
      }

      setEmailAddress(normalizedEmail);
      setSuccess(true);
      if (authData.session) {
        router.replace('/wali-murid');
        router.refresh();
      }
    } catch (submissionError) {
      console.error('Signup failed:', submissionError);
      setError('Tidak dapat terhubung ke server. Periksa koneksi internet dan konfigurasi Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isParent) {
    return (
      <main className="auth-page flex min-h-screen items-center justify-center px-4 py-10">
        <section className="auth-notice w-full max-w-xl rounded-3xl p-8 text-center sm:p-10">
          <BrandMark size="lg" showTagline className="mb-7 justify-center" />
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-[#FFF4DC] text-[#94651D]"><LockKeyhole className="h-7 w-7" /></div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#98702C]">Akses terverifikasi</p>
          <h1 className="text-2xl font-bold tracking-tight text-[#17324D]">{heading} diterbitkan sekolah</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#526579]">Untuk menjaga keamanan data pembelajaran, akun Guru dan Kepala Sekolah dibuat oleh pengelola sekolah. Hubungi administrator untuk mendapatkan akses.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={`/masuk?role=${role}`}><Button className="w-full bg-[#17324D] text-white hover:bg-[#245B7A] sm:w-auto">Saya sudah punya akun</Button></Link>
            <Link href="/pilih-peran?register=true"><Button variant="outline" className="w-full border-[#CBD7E1] bg-white text-[#29445A] hover:bg-[#F3F7FA] sm:w-auto">Kembali</Button></Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="auth-page min-h-screen">
      <header className="auth-topbar">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="LENTERA beranda"><BrandMark size="sm" showTagline /></Link>
          <Link href="/pilih-peran?register=true" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#526579] transition hover:bg-white hover:text-[#17324D]">
            <ArrowLeft className="h-4 w-4" /> Pilih peran
          </Link>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:px-8 lg:py-12">
        <aside className="auth-story relative hidden min-h-[660px] overflow-hidden rounded-[32px] bg-[#17324D] p-10 text-white shadow-[0_24px_70px_rgba(23,50,77,0.16)] lg:flex lg:flex-col">
          <div className="pointer-events-none absolute -right-20 -top-16 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full border border-white/10" />
          <div className="relative z-10 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#CDEDE8]">
            <BookOpenCheck className="h-4 w-4" /> RUANG BELAJAR YANG TERHUBUNG
          </div>
          <div className="relative z-10 mt-12">
            <h1 className="max-w-md text-4xl font-bold leading-[1.12] tracking-tight">Pantau proses belajar dengan lebih tenang.</h1>
            <p className="mt-5 max-w-md text-base leading-8 text-[#D5E0E9]">Satu akun untuk melihat perkembangan anak, membaca laporan guru, dan mendampingi proses belajar dari rumah.</p>
          </div>
          <div className="relative z-10 mt-auto flex items-end justify-between gap-3">
            <div className="max-w-[230px] rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-sm font-semibold text-white">Sahabat LENTERA</p>
              <p className="mt-1 text-xs leading-5 text-[#D5E0E9]">Menerangi langkah kecil dalam perjalanan belajar.</p>
            </div>
            <Image src="/images/lentera-mascot.png" alt="Maskot lentera LENTERA membawa buku" width={310} height={274} priority className="-mb-4 w-[250px] object-contain drop-shadow-2xl" />
          </div>
        </aside>

        <section className="mx-auto w-full max-w-[590px]">
          <div className="mb-6 lg:hidden"><BrandMark size="md" showTagline /></div>
          <div className="mb-7">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E8F5F3] px-3 py-1.5 text-xs font-bold text-[#1C6862]">
              <Users className="h-3.5 w-3.5" /> PENDAFTARAN WALI MURID
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-[#17324D] sm:text-[34px]">Buat akun LENTERA</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[#607387]">Isi data di bawah ini. Kode undangan dari sekolah diperlukan untuk menghubungkan akun dengan profil anak.</p>
          </div>

          {success ? (
            <div className="rounded-3xl border border-[#D8E8E4] bg-white p-7 shadow-[0_12px_36px_rgba(23,50,77,0.07)] sm:p-9">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#E7F6EF] text-[#147A58]"><CheckCircle2 className="h-7 w-7" /></div>
              <h3 className="mt-5 text-center text-2xl font-bold text-[#17324D]">Periksa email Anda</h3>
              <p className="mx-auto mt-2 max-w-md text-center text-sm leading-7 text-[#526579]">Pendaftaran untuk <strong className="text-[#17324D]">{emailAddress}</strong> sudah disiapkan. Buka email verifikasi dari Supabase untuk mengaktifkan akun, kemudian masuk ke LENTERA.</p>
              <Link href="/masuk?role=wali_murid" className="mt-7 block"><Button className="h-11 w-full bg-[#17324D] font-semibold text-white hover:bg-[#245B7A]">Ke halaman masuk <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="rounded-3xl border border-[#E1E8EE] bg-white p-5 shadow-[0_12px_36px_rgba(23,50,77,0.07)] sm:p-8">
              {error && (
                <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-[#F2D2D0] bg-[#FFF3F2] p-4 text-sm leading-6 text-[#A33C37]">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><span>{error}</span>
                </div>
              )}

              <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                {parentFields.map((field) => {
                  const Icon = field.icon;
                  const isWide = field.name === 'full_name' || field.name === 'invitation_code';
                  return (
                    <div key={field.name} className={isWide ? 'sm:col-span-2' : ''}>
                      <Label htmlFor={field.name} className="mb-2 block text-[13px] font-semibold text-[#26384A]">
                        {field.label}{field.required && <span className="ml-1 text-[#C44943]">*</span>}
                      </Label>
                      <div className="relative">
                        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#75879A]" />
                        <Input
                          id={field.name}
                          type={field.type || 'text'}
                          value={values[field.name]}
                          onChange={(event) => updateField(field.name, event.target.value)}
                          placeholder={field.placeholder}
                          required={field.required}
                          autoComplete={field.name === 'email' ? 'email' : field.name === 'phone' ? 'tel' : 'off'}
                          disabled={isLoading}
                          aria-invalid={Boolean(fieldErrors[field.name])}
                          className={`h-12 rounded-xl border-[#D6E0E8] bg-white pl-11 pr-4 text-sm font-medium text-[#243447] placeholder:font-normal placeholder:text-[#8795A3] focus-visible:border-[#299C96] focus-visible:ring-[#299C96]/20 ${fieldErrors[field.name] ? 'border-[#D9534F] focus-visible:ring-[#D9534F]/20' : ''}`}
                        />
                      </div>
                      {fieldErrors[field.name] && <p className="mt-1.5 text-xs font-medium text-[#C3443E]">{fieldErrors[field.name]}</p>}
                      {!fieldErrors[field.name] && field.hint && <p className="mt-1.5 text-xs leading-5 text-[#718096]">{field.hint}</p>}
                    </div>
                  );
                })}
              </div>

              <div className="my-6 border-t border-[#E8EDF1]" />
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="password" className="mb-2 block text-[13px] font-semibold text-[#26384A]">Password <span className="text-[#C44943]">*</span></Label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#75879A]" />
                    <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => { setPassword(event.target.value); setFieldErrors((current) => ({ ...current, password: '' })); }} placeholder="Minimal 8 karakter" autoComplete="new-password" disabled={isLoading} className="h-12 rounded-xl border-[#D6E0E8] bg-white pl-11 pr-11 text-sm text-[#243447] placeholder:text-[#8795A3] focus-visible:border-[#299C96] focus-visible:ring-[#299C96]/20" />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-[#718096] hover:bg-[#F1F5F8] hover:text-[#17324D]" aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                  {fieldErrors.password ? <p className="mt-1.5 text-xs font-medium text-[#C3443E]">{fieldErrors.password}</p> : <p className="mt-1.5 text-xs text-[#718096]">Gunakan minimal 8 karakter.</p>}
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="mb-2 block text-[13px] font-semibold text-[#26384A]">Ulangi password <span className="text-[#C44943]">*</span></Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#75879A]" />
                    <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setFieldErrors((current) => ({ ...current, confirmPassword: '' })); }} placeholder="Ulangi password" autoComplete="new-password" disabled={isLoading} className="h-12 rounded-xl border-[#D6E0E8] bg-white pl-11 pr-4 text-sm text-[#243447] placeholder:text-[#8795A3] focus-visible:border-[#299C96] focus-visible:ring-[#299C96]/20" />
                  </div>
                  {fieldErrors.confirmPassword && <p className="mt-1.5 text-xs font-medium text-[#C3443E]">{fieldErrors.confirmPassword}</p>}
                </div>
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#F5F8FA] p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#25847D]" />
                <p className="text-xs leading-5 text-[#586B7C]">Data akun hanya digunakan untuk menghubungkan wali murid dengan anak yang tercantum dalam undangan sekolah. Jangan bagikan kode undangan kepada orang lain.</p>
              </div>

              <Button type="submit" disabled={isLoading} className="mt-6 h-12 w-full rounded-xl bg-[#17324D] text-sm font-bold text-white shadow-sm hover:bg-[#245B7A] focus-visible:ring-2 focus-visible:ring-[#299C96] focus-visible:ring-offset-2">
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memeriksa dan membuat akun...</> : <>Buat akun wali murid <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
              <p className="mt-5 text-center text-sm text-[#68798A]">Sudah memiliki akun? <Link href="/masuk?role=wali_murid" className="font-bold text-[#1D716B] underline-offset-4 hover:underline">Masuk di sini</Link></p>
            </form>
          )}
          <p className="mt-6 text-center text-xs leading-5 text-[#7C8A98]">Dengan mendaftar, Anda menyetujui ketentuan penggunaan dan kebijakan privasi LENTERA.</p>
        </section>
      </main>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="auth-page flex min-h-screen items-center justify-center text-sm font-medium text-[#526579]">Memuat formulir pendaftaran...</div>}>
      <RegisterPageContent />
    </Suspense>
  );
}
