'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, KeyRound, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function InternalAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) throw new Error('Email atau password admin tidak sesuai.');

      const check = await fetch('/api/admin/session', { cache: 'no-store', credentials: 'same-origin' });
      const result = await check.json();
      if (!check.ok) {
        await supabase.auth.signOut();
        throw new Error(result.error || 'Akun ini belum memiliki akses platform admin.');
      }
      router.replace('/panel-internal-lentera');
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Tidak dapat memproses login admin.');
    } finally {
      setLoading(false);
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#F4F7FA] px-4 py-10 text-[#203449]">
    <div className="w-full max-w-[440px]">
      <div className="mb-7 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#17324D] text-[#F6C86A] shadow-lg"><ShieldCheck className="h-7 w-7" /></div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6C8294]">LENTERA · INTERNAL ACCESS</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#17324D]">Admin Console</h1>
        <p className="mt-2 text-sm text-[#718396]">Masuk menggunakan akun administrator platform.</p>
      </div>
      <form onSubmit={submit} className="rounded-[26px] border border-[#E0E7ED] bg-white p-6 shadow-[0_18px_50px_rgba(23,50,77,0.08)] sm:p-8">
        {error && <div role="alert" className="mb-5 rounded-xl border border-[#F2D2D0] bg-[#FFF4F3] p-3 text-sm leading-5 text-[#A33C37]">{error}</div>}
        <label htmlFor="admin-email" className="mb-2 block text-sm font-semibold text-[#2A4054]">Email administrator</label>
        <div className="relative mb-5"><KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8292A1]" /><input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required className="h-12 w-full rounded-xl border border-[#D6E0E8] bg-white pl-10 pr-3 text-sm text-[#243447] outline-none focus:border-[#299C96] focus:ring-4 focus:ring-[#299C96]/10" placeholder="admin@sekolah.id" /></div>
        <label htmlFor="admin-password" className="mb-2 block text-sm font-semibold text-[#2A4054]">Password</label>
        <div className="relative"><LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8292A1]" /><input id="admin-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required className="h-12 w-full rounded-xl border border-[#D6E0E8] bg-white pl-10 pr-12 text-sm text-[#243447] outline-none focus:border-[#299C96] focus:ring-4 focus:ring-[#299C96]/10" placeholder="Password" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-[#718396] hover:bg-[#F0F4F7]">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
        <button type="submit" disabled={loading} className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#17324D] text-sm font-bold text-white transition hover:bg-[#245B7A] disabled:opacity-50">{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Memverifikasi…</> : 'Masuk ke panel admin'}</button>
      </form>
      <p className="mt-5 text-center text-xs leading-5 text-[#81909E]">Halaman internal LENTERA. Akses dibatasi melalui daftar administrator pada database.</p>
      <div className="mt-5 text-center"><Link href="/" className="text-sm font-semibold text-[#287C74] hover:underline">Kembali ke halaman utama</Link></div>
    </div>
  </main>;
}
