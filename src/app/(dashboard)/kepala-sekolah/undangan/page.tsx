'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle, Check, ClipboardCopy, Clock3, KeyRound, Loader2,
  RefreshCw, ShieldCheck, Users, UserRoundPlus,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

type StudentOption = { id: string; nis: string; full_name: string; class_name: string };
type InvitationRow = {
  id: string;
  student_id: string;
  status: string;
  expires_at: string;
  created_at: string;
  student_name: string;
  student_nis: string;
};
type PrincipalUser = { full_name: string; role: string; avatar_url?: string; email?: string };

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function PrincipalInvitationsPage() {
  const router = useRouter();
  const [user, setUser] = React.useState<PrincipalUser | null>(null);
  const [students, setStudents] = React.useState<StudentOption[]>([]);
  const [invitations, setInvitations] = React.useState<InvitationRow[]>([]);
  const [selectedStudent, setSelectedStudent] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [loadError, setLoadError] = React.useState('');
  const [pageMessage, setPageMessage] = React.useState('');
  const [generatedCode, setGeneratedCode] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await fetch('/api/kepala-sekolah/undangan', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          router.replace('/masuk?role=kepala_sekolah');
          return;
        }
        throw new Error(result.error || 'Undangan gagal dimuat.');
      }
      const available = (result.students || []) as StudentOption[];
      setUser(result.user);
      setStudents(available);
      setInvitations(result.invitations || []);
      setSelectedStudent((current) => available.some((student) => student.id === current) ? current : available[0]?.id || '');
    } catch (error) {
      console.error('Load parent invitations failed:', error);
      setLoadError(error instanceof Error ? error.message : 'Data undangan tidak dapat dimuat.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedStudent) {
      setPageMessage('Pilih siswa terlebih dahulu.');
      return;
    }

    setSaving(true);
    setPageMessage('');
    setGeneratedCode('');
    setCopied(false);
    try {
      const response = await fetch('/api/kepala-sekolah/undangan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: selectedStudent }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Kode undangan belum berhasil dibuat.');
      const invitationCode: string = result.code;
      setGeneratedCode(invitationCode);
      setPageMessage('Kode berhasil dibuat. Salin dan berikan hanya kepada wali murid yang sesuai.');
      await loadData();
    } catch (error) {
      console.error('Create parent invitation failed:', error);
      setPageMessage(error instanceof Error ? error.message : 'Kode undangan belum berhasil dibuat.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
    } catch {
      setPageMessage('Salin otomatis tidak tersedia di browser ini. Blok kode lalu salin secara manual.');
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/pilih-peran');
  };

  if (loading) {
    return <div className="flex min-h-[65vh] items-center justify-center gap-3 text-sm font-medium text-[#526579]"><Loader2 className="h-5 w-5 animate-spin text-[#299C96]" /> Memuat data sekolah...</div>;
  }
  if (!user) return (
    <main className="mx-auto mt-14 max-w-xl rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-800" role="alert">
      <h1 className="mb-2 text-lg font-bold">Undangan belum dapat dibuka</h1>
      <p>{loadError || 'Profil Kepala Sekolah belum tersedia.'}</p>
      <button type="button" className="mt-4 rounded-lg bg-[#17324D] px-4 py-2 font-semibold text-white" onClick={() => void loadData()}>Coba lagi</button>
    </main>
  );

  return (
    <DashboardLayout role="kepala_sekolah" user={user} onLogout={handleLogout} breadcrumbs={[
      { label: 'Beranda', href: '/kepala-sekolah' },
      { label: 'Undangan Wali Murid' },
    ]}>
      <div className="mx-auto max-w-6xl space-y-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#217D77]">Hubungan keluarga dan sekolah</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#17324D] sm:text-3xl">Undangan Wali Murid</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#607387]">Buat kode undangan khusus untuk menghubungkan akun wali murid dengan data anak yang benar. Kode hanya ditampilkan sekali setelah dibuat.</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#DCEBE7] bg-white px-3 py-2 text-xs font-semibold text-[#286F6B]"><ShieldCheck className="h-4 w-4" /> Terkait sekolah Anda</div>
        </div>

        {loadError && <div role="alert" className="flex items-start gap-3 rounded-xl border border-[#F2D2D0] bg-[#FFF3F2] p-4 text-sm text-[#A33C37]"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{loadError}</div>}

        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-[#E8EDF1] bg-[#FBFCFD]">
              <CardTitle className="flex items-center gap-2 text-lg text-[#17324D]"><UserRoundPlus className="h-5 w-5 text-[#217D77]" /> Buat kode baru</CardTitle>
              <CardDescription className="text-[#607387]">Pilih siswa yang akan dihubungkan ke akun wali murid.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student" className="text-sm font-semibold text-[#26384A]">Nama peserta didik</Label>
                  <select id="student" value={selectedStudent} onChange={(event) => setSelectedStudent(event.target.value)} disabled={saving || students.length === 0} className="h-12 w-full rounded-xl border border-[#D6E0E8] bg-white px-3 text-sm font-medium text-[#243447] outline-none focus:border-[#299C96] focus:ring-2 focus:ring-[#299C96]/15">
                    {students.length === 0 ? <option value="">Belum ada siswa aktif</option> : students.map((student) => <option key={student.id} value={student.id}>{student.full_name} — {student.class_name} (NIS {student.nis})</option>)}
                  </select>
                </div>
                <div className="rounded-xl border border-[#E5EBEF] bg-[#F6F9FB] p-4 text-sm leading-6 text-[#526579]">
                  Kode berlaku selama <strong className="text-[#26384A]">7 hari</strong> dan hanya dapat digunakan satu kali. Wali murid memasukkan kode ini pada halaman pendaftaran.
                </div>
                <Button type="submit" disabled={saving || students.length === 0} className="h-11 w-full rounded-xl bg-[#17324D] font-semibold text-white hover:bg-[#245B7A]">
                  {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Membuat kode...</> : <><KeyRound className="mr-2 h-4 w-4" /> Buat kode undangan</>}
                </Button>
              </form>

              {pageMessage && <p role="status" className={`rounded-xl border px-4 py-3 text-sm leading-6 ${generatedCode ? 'border-[#DCEBE7] bg-[#F2F8F7] text-[#286F6B]' : 'border-red-200 bg-red-50 text-red-800'}`}>{pageMessage}</p>}

              {generatedCode && (
                <div className="rounded-2xl border border-[#CFE4E0] bg-[#F3FAF8] p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#175F5A]"><Check className="h-4 w-4" /> Kode undangan siap dibagikan</div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <code className="min-w-0 flex-1 break-all rounded-xl border border-[#DCEBE7] bg-white px-3 py-3 text-sm font-bold tracking-wide text-[#17324D]">{generatedCode}</code>
                    <Button type="button" onClick={handleCopy} variant="outline" className="h-11 border-[#BED8D2] bg-white text-[#175F5A] hover:bg-[#E8F5F3]">
                      {copied ? <Check className="mr-2 h-4 w-4" /> : <ClipboardCopy className="mr-2 h-4 w-4" />}{copied ? 'Tersalin' : 'Salin kode'}
                    </Button>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#607387]">Kode mentah tidak disimpan dan tidak dapat ditampilkan kembali. Buat kode baru apabila kode ini hilang.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-[#17324D]"><Clock3 className="h-5 w-5 text-[#217D77]" /> Alur penggunaan</CardTitle>
              <CardDescription className="text-[#607387]">Cara menghubungkan akun wali murid dengan anak.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ['01', 'Pilih peserta didik', 'Pilih siswa aktif yang sudah terdaftar di sekolah.'],
                ['02', 'Buat dan bagikan kode', 'Sampaikan kode melalui kanal komunikasi resmi sekolah.'],
                ['03', 'Wali murid mendaftar', 'Wali murid mengisi email, password, dan kode undangan.'],
                ['04', 'Akses terhubung', 'Relasi diverifikasi otomatis setelah kode valid digunakan.'],
              ].map(([number, title, description]) => (
                <div key={number} className="flex gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#E8F5F3] text-xs font-extrabold text-[#217D77]">{number}</span>
                  <div><p className="text-sm font-bold text-[#26384A]">{title}</p><p className="mt-1 text-xs leading-5 text-[#718096]">{description}</p></div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div><CardTitle className="text-lg text-[#17324D]">Riwayat undangan</CardTitle><CardDescription className="mt-1 text-[#607387]">Kode ditampilkan sebagai status saja untuk menjaga kerahasiaan.</CardDescription></div>
            <Button type="button" variant="outline" onClick={() => loadData()} className="h-9 shrink-0 border-[#D6E0E8] bg-white text-[#405568] hover:bg-[#F3F7F9]"><RefreshCw className="mr-2 h-4 w-4" />Muat ulang</Button>
          </CardHeader>
          <CardContent>
            {invitations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#DCE5EB] bg-[#FAFCFD] px-6 py-10 text-center"><Users className="mx-auto h-8 w-8 text-[#9BAAB7]" /><p className="mt-3 text-sm font-semibold text-[#405568]">Belum ada undangan</p><p className="mt-1 text-xs text-[#718096]">Undangan yang dibuat akan muncul di sini.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead><tr className="border-b border-[#E5EBEF] text-xs font-semibold uppercase tracking-wide text-[#718096]"><th className="px-3 py-3">Peserta didik</th><th className="px-3 py-3">Dibuat</th><th className="px-3 py-3">Berlaku sampai</th><th className="px-3 py-3">Status</th></tr></thead>
                  <tbody>{invitations.map((invitation) => {
                    const status = invitation.status === 'expired' || (invitation.status === 'pending' && new Date(invitation.expires_at) < new Date()) ? 'Kedaluwarsa' : invitation.status === 'used' ? 'Digunakan' : invitation.status === 'revoked' ? 'Dicabut' : 'Menunggu';
                    const statusClass = status === 'Digunakan' ? 'bg-[#E7F6EF] text-[#147A58]' : status === 'Menunggu' ? 'bg-[#FFF5E5] text-[#94651D]' : 'bg-[#F0F3F6] text-[#607387]';
                    return <tr key={invitation.id} className="border-b border-[#EDF1F4] last:border-0"><td className="px-3 py-3"><p className="font-semibold text-[#26384A]">{invitation.student_name}</p><p className="mt-0.5 text-xs text-[#718096]">NIS {invitation.student_nis}</p></td><td className="px-3 py-3 text-[#526579]">{formatDate(invitation.created_at)}</td><td className="px-3 py-3 text-[#526579]">{formatDate(invitation.expires_at)}</td><td className="px-3 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusClass}`}>{status}</span></td></tr>;
                  })}</tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
