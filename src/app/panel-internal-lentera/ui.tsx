'use client';
import { SearchField } from '@/components/ui/search-field';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle2, CircleAlert, KeyRound, Loader2,
  LogOut, RefreshCw, ServerCog, ShieldCheck, Sparkles, Users, School, UserPlus, Eye, EyeOff,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { HomeHero, HomePanel, HomeQuickAction } from '@/components/dashboard/home-kit';
import { IllustratedIcon } from '@/components/ui/illustrated-icon';

type Config = {
  provider: 'anthropic' | 'openai' | 'gemini' | 'mock';
  model: string;
  keyConfigured: boolean;
  source: 'database' | 'environment' | 'mock';
  mockMode: boolean;
};

export function AdminConsole() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  // Ref updates immediately; React state alone cannot guard rapid repeated clicks.
  const testInFlight = useRef(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadConfig() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/ai-config', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Konfigurasi tidak dapat dibaca.');
      setConfig(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat konfigurasi.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadConfig(); }, []);

  async function testConnection() {
    if (testInFlight.current) return;
    testInFlight.current = true;
    setTesting(true);
    setError('');
    setSuccess('');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 40_000);
    try {
      const response = await fetch('/api/admin/ai-config/test', {
        method: 'POST',
        cache: 'no-store',
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Uji koneksi gagal.');
      setSuccess(result.message || 'Koneksi AI berhasil.');
    } catch (testError) {
      setError(controller.signal.aborted
        ? 'Uji koneksi dihentikan setelah 40 detik. Tidak ada percobaan ulang otomatis.'
        : testError instanceof Error ? testError.message : 'Uji koneksi gagal.');
    } finally {
      clearTimeout(timeout);
      testInFlight.current = false;
      setTesting(false);
    }
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/lentera-system-access';
  }

  return (
    <main className="lentera-admin-console lentera-design-system min-h-screen bg-[#F4F7FA] text-[#203449]">
      <header className="border-b border-[#DFE7EE] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#17324D] text-[#F6C86A]"><ServerCog className="h-5 w-5" /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#648094]">LENTERA / INTERNAL</p>
              <h1 className="text-lg font-bold text-[#17324D]">Panel Administrasi</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#526579] hover:bg-[#F0F4F7] sm:inline-flex"><ArrowLeft className="h-4 w-4" /> Beranda</Link>
            <button onClick={signOut} className="inline-flex items-center gap-2 rounded-xl border border-[#DCE5EC] bg-white px-3 py-2 text-sm font-semibold text-[#526579] transition hover:border-[#C8D5E0] hover:bg-[#F7F9FB]"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Keluar</span></button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 sm:py-10">
        <div className="lentera-home space-y-5 mb-7">
          <HomeHero variant="admin" name="Admin" eyebrow="ADMIN PLATFORM" description="Kelola sekolah, akun Guru dan Kepala Sekolah, serta status layanan AI yang dikonfigurasi secara aman di server." href="#kelola-akun" action="Kelola akun sekolah" />
          <div className="grid gap-4 lg:grid-cols-2">
            <HomePanel title="Aksi cepat Admin">
              <div className="grid gap-2 sm:grid-cols-2">
                <HomeQuickAction title="Tambah sekolah" icon={School} href="#kelola-akun" color="mint"/>
                <HomeQuickAction title="Buat akun Guru" icon={UserPlus} href="#kelola-akun" color="blue"/>
                <HomeQuickAction title="Buat akun Kepala Sekolah" icon={Users} href="#kelola-akun" color="lilac"/>
                <HomeQuickAction title="Status Gemini AI" icon={Sparkles} href="#konfigurasi-ai" color="cream"/>
              </div>
            </HomePanel>
            <HomePanel title="Keamanan & pengaturan">
              <p className="text-sm leading-6 text-[#415e70]">Akun dibuat setelah otorisasi administrator. Kunci Gemini hanya dibaca di server dari environment dan tidak ditampilkan di browser.</p>
              <div className="mt-4 flex gap-2 rounded-2xl bg-[#e7f7ef] p-3 text-sm font-semibold text-[#1b715d]"><ShieldCheck size={20}/> Akses panel dibatasi untuk Admin terverifikasi</div>
            </HomePanel>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatusCard icon={<IllustratedIcon icon={Sparkles} label="Provider AI" size="md" />} label="Provider AI" value={loading ? 'Memuat…' : 'Google Gemini'} />
          <StatusCard icon={<IllustratedIcon icon={KeyRound} label="API Key" size="md" />} label="API Key" value={loading ? 'Memuat…' : config?.keyConfigured ? 'Terkonfigurasi' : 'Belum tersedia'} />
          <StatusCard icon={<IllustratedIcon icon={ServerCog} label="Sumber konfigurasi" size="md" />} label="Sumber konfigurasi" value={loading ? 'Memuat…' : 'Environment server'} />
        </div>

        <section id="konfigurasi-ai" className="rounded-[26px] border border-[#E0E7ED] bg-white p-5 shadow-[0_8px_28px_rgba(23,50,77,0.045)] sm:p-7">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-bold text-[#17324D]">Konfigurasi layanan AI</h3>
              <p className="mt-1 text-sm text-[#687D90]">Digunakan oleh generator refleksi, analisis pembelajaran, dan modul ajar.</p>
            </div>
            <button onClick={() => void loadConfig()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCE5EC] px-3 py-2 text-sm font-semibold text-[#526579] hover:bg-[#F6F8FA] disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Muat ulang</button>
          </div>

          {error && <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-[#F2D2D0] bg-[#FFF4F3] p-3 text-sm text-[#A33C37]"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
          {success && <div role="status" className="mb-5 flex items-start gap-2 rounded-xl border border-[#CBE8DC] bg-[#F0FAF5] p-3 text-sm text-[#216B50]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{success}</div>}

          <div className="rounded-2xl border border-[#D8E8E5] bg-[#F2FAF7] p-4 sm:p-5">
            <p className="text-sm font-bold text-[#225F58]">Google Gemini — konfigurasi server</p>
            <p className="mt-2 text-sm leading-6 text-[#385C5B]">Admin tidak perlu mengisi API key, memilih provider atau mengambil daftar model. Pengelola server menetapkan <code>GEMINI_API_KEY</code> dan <code>GEMINI_MODEL</code> di <code>.env.local</code> (atau environment hosting), lalu restart aplikasi.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#D8E8E5] bg-white p-3">
                <p className="text-xs font-semibold text-[#687D90]">Model aktif</p>
                <p className="mt-1 break-all text-sm font-bold text-[#17324D]">{config?.model || 'Belum dikonfigurasi'}</p>
              </div>
              <div className="rounded-xl border border-[#D8E8E5] bg-white p-3">
                <p className="text-xs font-semibold text-[#687D90]">Status API key</p>
                <p className="mt-1 text-sm font-bold text-[#17324D]">{config?.keyConfigured ? 'Tersedia di server' : 'Belum tersedia di server'}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => void testConnection()} disabled={loading || testing || !config?.keyConfigured || !config?.model} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#17324D] px-5 text-sm font-bold text-white transition hover:bg-[#245B7A] disabled:cursor-not-allowed disabled:opacity-50">
                {testing ? <><Loader2 className="h-4 w-4 animate-spin" /> Menguji…</> : <><RefreshCw className="h-4 w-4" /> Uji koneksi Gemini</>}
              </button>
              <span className="text-xs leading-5 text-[#526579]">Uji koneksi hanya dikirim ketika tombol diklik; tidak ada fetch daftar model otomatis.</span>
            </div>
          </div>
        </section>

        <div id="kelola-akun" className="scroll-mt-8"><StaffManagement /></div>

        <section className="mt-6 rounded-2xl border border-[#DCE6EC] bg-[#F9FBFC] p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#268477]" />
            <div>
              <h4 className="text-sm font-bold text-[#294156]">Catatan keamanan</h4>
              <p className="mt-1 text-xs leading-5 text-[#718396]">Halaman ini tidak ditautkan dari landing page dan menggunakan metadata noindex. Namun URL tersembunyi bukan pengganti keamanan: setiap permintaan tetap diverifikasi sebagai platform admin pada server. Jangan pernah memasukkan SUPABASE_SECRET_KEY atau APP_ENCRYPTION_KEY ke formulir ini.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-[#E0E7ED] bg-white p-4 shadow-[0_6px_20px_rgba(23,50,77,0.035)]">
    <div className="mb-3 inline-flex items-center justify-center">{icon}</div>
    <p className="text-xs font-semibold text-[#718396]">{label}</p>
    <p className="mt-1 text-base font-bold text-[#17324D]">{value}</p>
  </div>;
}


type SchoolRow = { id: string; name: string; address: string | null; academic_year: string };
type StaffRow = { id: string; full_name: string; role: 'guru' | 'kepala_sekolah'; identifier: string; school_id: string };

function StaffManagement() {
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [year, setYear] = useState('2026/2027');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [role, setRole] = useState<'guru' | 'kepala_sekolah'>('guru');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function reload() {
    setLoading(true);
    try {
      const [schoolsResponse, staffResponse] = await Promise.all([
        fetch('/api/admin/schools', { cache: 'no-store' }),
        fetch('/api/admin/staff', { cache: 'no-store' }),
      ]);
      const schoolsData = await schoolsResponse.json();
      const staffData = await staffResponse.json();
      if (!schoolsResponse.ok) throw new Error(schoolsData.error || 'Gagal memuat sekolah.');
      if (!staffResponse.ok) throw new Error(staffData.error || 'Gagal memuat akun.');
      setSchools(schoolsData.schools || []);
      setStaff(staffData.staff || []);
      setSchoolId((current) => current && (schoolsData.schools as SchoolRow[]).some((s) => s.id === current)
        ? current : schoolsData.schools[0]?.id || '');
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memuat data.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void reload(); }, []);

  async function submitSchool(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const res = await fetch('/api/admin/schools', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: schoolName, academic_year: year, address: schoolAddress }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sekolah gagal dibuat.');
      setSchoolName(''); setSchoolAddress('');
      await reload(); setSchoolId(data.school.id); setMessage(data.message);
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal menambahkan sekolah.'); }
    finally { setBusy(false); }
  }

  async function submitStaff(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, full_name: fullName, email, identifier, school_id: schoolId, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Akun gagal dibuat.');
      setFullName(''); setEmail(''); setIdentifier(''); setPassword('');
      await reload(); setMessage(data.message);
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal membuat akun.'); }
    finally { setBusy(false); }
  }

  const staffResults = staff.filter((person) => {
    const school = schools.find((item) => item.id === person.school_id)?.name || '';
    return `${person.full_name} ${person.identifier} ${person.role === 'guru' ? 'Guru' : 'Kepala Sekolah'} ${school}`
      .toLocaleLowerCase('id-ID').includes(staffSearch.trim().toLocaleLowerCase('id-ID'));
  });

  const input = 'h-11 w-full rounded-xl border border-[#D6E0E8] bg-white px-3 text-sm text-[#203449] outline-none focus:border-[#299C96] focus:ring-4 focus:ring-[#299C96]/10';
  return <section id="kelola-akun" className="mt-7 space-y-5 scroll-mt-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h3 className="flex items-center gap-2 text-xl font-bold text-[#17324D]"><Users className="h-5 w-5 text-[#278477]" /> Kelola akun sekolah</h3>
        <p className="mt-1 text-sm text-[#60788C]">Admin dapat mendaftarkan Guru dan Kepala Sekolah langsung ke Supabase.</p></div>
      <button type="button" onClick={() => void reload()} disabled={busy || loading} className="inline-flex items-center gap-2 rounded-xl border border-[#D6E0E8] bg-white px-4 py-2 text-sm font-semibold hover:bg-[#F5F9FA] disabled:opacity-50"><RefreshCw className="h-4 w-4" /> Muat ulang</button>
    </div>
    {error && <div role="alert" className="rounded-xl border border-[#F2D2D0] bg-[#FFF4F3] p-3 text-sm text-[#A33C37]">{error}</div>}
    {message && <div role="status" className="rounded-xl border border-[#CBE8DC] bg-[#F0FAF5] p-3 text-sm text-[#216B50]">{message}</div>}
    <div className="grid gap-5 lg:grid-cols-2">
      <form onSubmit={submitSchool} className="space-y-4 rounded-[24px] border border-[#DFE7EE] bg-white p-5 shadow-sm sm:p-6">
        <h4 className="flex items-center gap-2 font-bold text-[#17324D]"><School className="h-5 w-5 text-[#278477]" /> Tambah sekolah</h4>
        <p className="text-xs leading-5 text-[#687D90]">Buat data sekolah terlebih dahulu agar akun staf memiliki sekolah yang valid.</p>
        <label className="block text-sm font-semibold">Nama sekolah<input className={`${input} mt-1.5`} required minLength={3} maxLength={160} value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="Contoh: SD Negeri 1 Semarang" /></label>
        <div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-semibold">Tahun ajaran<input className={`${input} mt-1.5`} required pattern="[0-9]{4}/[0-9]{4}" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2026/2027" /></label>
        <label className="block text-sm font-semibold">Alamat (opsional)<input className={`${input} mt-1.5`} maxLength={500} value={schoolAddress} onChange={(e) => setSchoolAddress(e.target.value)} /></label></div>
        <button type="submit" disabled={busy || loading} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#236F67] px-5 text-sm font-bold text-white transition hover:bg-[#19564F] disabled:opacity-50"><School className="h-4 w-4" /> Tambah sekolah</button>
      </form>
      <form onSubmit={submitStaff} className="space-y-4 rounded-[24px] border border-[#DFE7EE] bg-white p-5 shadow-sm sm:p-6">
        <h4 className="flex items-center gap-2 font-bold text-[#17324D]"><UserPlus className="h-5 w-5 text-[#278477]" /> Daftarkan akun</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">Peran<select className={`${input} mt-1.5`} value={role} onChange={(e) => setRole(e.target.value as 'guru' | 'kepala_sekolah')}><option value="guru">Guru</option><option value="kepala_sekolah">Kepala Sekolah</option></select></label>
          <label className="block text-sm font-semibold">Sekolah<select className={`${input} mt-1.5`} required value={schoolId} onChange={(e) => setSchoolId(e.target.value)}><option value="">Pilih sekolah</option>{schools.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.academic_year}</option>)}</select></label>
        </div>
        <label className="block text-sm font-semibold">Nama lengkap<input className={`${input} mt-1.5`} required minLength={3} maxLength={120} value={fullName} onChange={(e) => setFullName(e.target.value)} /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">Email akun<input className={`${input} mt-1.5`} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@sekolah.sch.id" /></label>
          <label className="block text-sm font-semibold">{role === 'guru' ? 'NIP / ID Guru' : 'ID akun Kepala Sekolah'}<input className={`${input} mt-1.5`} required minLength={3} maxLength={80} value={identifier} onChange={(e) => setIdentifier(e.target.value)} /></label>
        </div>
        <label className="block text-sm font-semibold">Password awal (min. 12 karakter, huruf + angka)
          <div className="relative mt-1.5"><input className={`${input} pr-12`} type={showPassword ? 'text' : 'password'} required minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-2 rounded-lg p-1.5 text-[#526579] hover:bg-[#EFF5F6]" aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
        </label>
        <p className="text-xs leading-5 text-[#687D90]">Akun dibuat di Supabase Auth dan tabel profiles. Berikan password awal melalui saluran aman dan minta pengguna segera menggantinya.</p>
        <button type="submit" disabled={busy || loading || !schoolId} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#17324D] px-5 text-sm font-bold text-white transition hover:bg-[#245B7A] disabled:opacity-50"><UserPlus className="h-4 w-4" /> Buat akun {role === 'guru' ? 'Guru' : 'Kepala Sekolah'}</button>
      </form>
    </div>
    <div className="overflow-hidden rounded-[24px] border border-[#DFE7EE] bg-white shadow-sm">
      <div className="border-b border-[#E4EBF0] p-5"><h4 className="font-bold text-[#17324D]">Daftar akun staf terbaru</h4><p className="text-xs text-[#75879A]">Menampilkan maksimal 100 akun terakhir. Tidak menampilkan password.</p><div className="mt-4 max-w-xl"><SearchField value={staffSearch} onChange={setStaffSearch} placeholder="Cari nama, NIP, peran, atau sekolah..." label="Cari akun staf" /></div><p aria-live="polite" className="mt-2 text-xs text-[#60788C]">{staffResults.length} dari {staff.length} akun</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-[#F5F9FA] text-[#536C7C]"><tr><th className="px-5 py-3">Nama</th><th className="px-5 py-3">Peran</th><th className="px-5 py-3">NIP / ID Akun</th><th className="px-5 py-3">Sekolah</th></tr></thead><tbody>
        {staffResults.length === 0 ? <tr><td colSpan={4} className="px-5 py-7 text-center text-[#718396]">{loading ? 'Memuat akun…' : staff.length === 0 ? 'Belum ada akun Guru atau Kepala Sekolah.' : 'Akun tidak ditemukan. Ubah kata kunci pencarian.'}</td></tr> : staffResults.map((person) => <tr key={person.id} className="border-t border-[#EDF1F4]"><td className="px-5 py-3 font-semibold text-[#203449]">{person.full_name}</td><td className="px-5 py-3">{person.role === 'guru' ? 'Guru' : 'Kepala Sekolah'}</td><td className="px-5 py-3">{person.identifier}</td><td className="px-5 py-3">{schools.find((s) => s.id === person.school_id)?.name || '—'}</td></tr>)}
      </tbody></table></div>
    </div>
  </section>;
}
