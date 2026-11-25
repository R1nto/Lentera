'use client';
import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Loader2, Sparkles } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

type CatalogCP = { id: string; reference_code: string; subject_name: string; phase: string; element: string; cp_excerpt: string; source_title: string; source_url: string; source_version: string };

const isSchoolReference = (cp?: CatalogCP) => cp?.source_version.startsWith("SEKOLAH-") === true;

type Setup = {
  profile: { full_name: string; role: string; avatar_url?: string; email?: string };
  classes: { id: string; name: string; grade: string; phase: string }[];
  subjects: { id: string; name: string }[];
};
export default function BuatModulPage() {
  const router = useRouter();
  const [setup, setSetup] = React.useState<Setup | null>(null);
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const submittingRef = React.useRef(false);
  const [retry, setRetry] = React.useState(0);
  const [catalogRetry, setCatalogRetry] = React.useState(0);
  const [catalog, setCatalog] = React.useState<CatalogCP[]>([]);
  const [catalogLoading, setCatalogLoading] = React.useState(false);
  const [catalogError, setCatalogError] = React.useState('');
  const [catalogReason, setCatalogReason] = React.useState('');
  const [catalogSubjects, setCatalogSubjects] = React.useState<string[]>([]);
  const [selectedCpId, setSelectedCpId] = React.useState('');
  const [cpEdited, setCpEdited] = React.useState(false);
  const [form, setForm] = React.useState({ class_id: '', subject_id: '', topic: '', duration: '2 x 35 menit', meetings_count: 1, student_characteristics: '', additional_instructions: '', detail_level: 'lengkap', official_cp_text: '', official_cp_source: '', learning_model: '', learning_methods_text: '', media_text: '' });
  React.useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 18000);
    setError('');
    void (async () => {
      try {
        const response = await fetch('/api/teacher/setup', {
          cache: 'no-store', signal: controller.signal,
        });
        const result = await response.json().catch(() => ({}));
        if (response.status === 401) throw new Error('Sesi Guru berakhir. Silakan masuk kembali.');
        if (!response.ok) throw new Error(result.error || 'Data kelas tidak dapat dimuat.');
        if (active) {
          setSetup(result);
          setForm((previous) => ({
            ...previous,
            class_id: result.classes?.[0]?.id || '',
            subject_id: result.subjects?.[0]?.id || '',
          }));
        }
      } catch (cause) {
        if (active) setError(controller.signal.aborted
          ? 'Memuat data kelas terlalu lama. Coba lagi.'
          : cause instanceof Error ? cause.message : 'Data kelas tidak dapat dimuat.');
      } finally { clearTimeout(timer); }
    })();
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [retry]);
  const currentClass = setup?.classes.find((item) => item.id === form.class_id);
  // Fetch only when class/subject changes; no polling and no automatic AI requests.
  React.useEffect(() => {
    if (!setup || !form.class_id || !form.subject_id) { setCatalog([]); setSelectedCpId(''); return; }
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    setCatalogLoading(true); setCatalogError(''); setCatalogReason(''); setCatalogSubjects([]); setCatalog([]); setSelectedCpId(''); setCpEdited(false);
    void (async () => {
      try {
        const query = new URLSearchParams({class_id: form.class_id, subject_id: form.subject_id});
        const response = await fetch(`/api/teacher/cp-catalog?${query.toString()}`, { cache:'no-store', signal:controller.signal });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Katalog CP tidak dapat dibaca.');
        if (active) {
          setCatalog(Array.isArray(data.items) ? data.items : []);
          setCatalogReason(typeof data.reason === 'string' ? data.reason : 'unknown');
          setCatalogSubjects(Array.isArray(data.curated_subjects) ? data.curated_subjects : []);
        }
      } catch (cause) {
        if (active) setCatalogError(controller.signal.aborted ? 'Permintaan katalog CP terlalu lama.' : cause instanceof Error ? cause.message : 'Katalog CP tidak tersedia.');
      } finally { clearTimeout(timer); if (active) setCatalogLoading(false); }
    })();
    return () => {active = false; clearTimeout(timer); controller.abort();};
  }, [setup, form.class_id, form.subject_id, catalogRetry]);
  React.useEffect(() => {
    // Suggest the most relevant element using topic keywords; teacher may override.
    if (cpEdited || !catalog.length) return;
    const topic = form.topic.toLowerCase();
    if (new Set(catalog.map(cp => cp.subject_name)).size !== 1) { setSelectedCpId(''); return; }
    const schoolMatch = catalog.find(cp => isSchoolReference(cp) && ((/tubuh|indra/.test(topic) && cp.element === "Tubuh dan indra") || (/hewan|tumbuhan/.test(topic) && cp.element === "Hewan dan tumbuhan") || (/bersih|sehat/.test(topic) && cp.element === "Kebersihan dan kesehatan") || (/keluarga|lingkungan sosial/.test(topic) && cp.element === "Keluarga dan lingkungan sosial") || (/kebutuhan|makhluk hidup/.test(topic) && cp.element === "Kebutuhan makhluk hidup") || (/greeting|sapaan|perkenalan|hello/.test(topic) && cp.element === "Greetings and introductions") || (/number|colour|color|warna|angka/.test(topic) && cp.element === "Numbers and colours") || (/animal|plant|hewan|tumbuhan/.test(topic) && cp.element === "Animals and plants") || (/family|body|keluarga|tubuh/.test(topic) && cp.element === "Family and body parts") || (/classroom|instruction|benda kelas/.test(topic) && cp.element === "Classroom objects and instructions")));
    const match = schoolMatch || catalog.find(cp => {
      const e = cp.element.toLowerCase();
      return (!!topic.trim() && topic.includes(e)) ||
        (e === 'menulis' && /menulis|karangan|surat|puisi/.test(topic)) ||
        (e === 'membaca dan memirsa' && /membaca|ide pokok|gagasan utama/.test(topic)) ||
        (e === 'pemahaman ipas' && /energi|ekosistem|organ|pancaindra|gaya|cahaya|bunyi|zat/.test(topic)) ||
        (e === 'terampil bergerak' && /gerak dasar|lokomotor|senam/.test(topic)) ||
        (e === 'aljabar' && /aljabar|persamaan|pola|bilangan yang (hilang|belum)/.test(topic)) ||
        (e === 'bilangan' && /bilangan|pecahan|perkalian|penjumlahan|pengurangan/.test(topic)) ||
        (e === 'pengukuran' && /ukur|luas|keliling|volume/.test(topic)) ||
        (e === 'geometri' && /bangun|geometri|sudut/.test(topic));
    });
    // Suggest only when the topic clearly matches the element; never guess a CP.
    setSelectedCpId(match?.id || '');
  }, [catalog, form.topic, cpEdited]);
  const selectedCp = catalog.find(cp => cp.id === selectedCpId);
  const schoolReference = isSchoolReference(selectedCp);
  const chooseCp = (id: string) => {
    setCpEdited(true); setSelectedCpId(id);

  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSaving(true); setError('');
    try {
      if (catalogLoading) throw new Error("Tunggu katalog referensi selesai dimuat.");
      if (!currentClass) throw new Error('Pilih kelas yang terdaftar.');
      const response = await fetch('/api/ai/module-generator', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(75000),
        body: JSON.stringify({
          class_id: form.class_id, subject_id: form.subject_id, topic: form.topic,
          duration: form.duration, meetings_count: form.meetings_count,
          student_characteristics: form.student_characteristics, additional_instructions: form.additional_instructions, detail_level: form.detail_level, official_cp_text: selectedCpId ? (catalog.find(cp => cp.id === selectedCpId)?.cp_excerpt || '') : form.official_cp_text, official_cp_source: selectedCpId ? (catalog.find(cp => cp.id === selectedCpId)?.source_title || '') : form.official_cp_source, catalog_cp_id: selectedCpId || null,
          grade: currentClass.grade, phase: currentClass.phase,
          cp_ids: [], tp_ids: [], learning_model: form.learning_model, learning_methods: form.learning_methods_text.split(',').map(x => x.trim()).filter(Boolean), media: form.media_text.split(',').map(x => x.trim()).filter(Boolean),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(`${result.error || 'Gagal membuat modul ajar.'}${result.code ? ` (Kode: ${result.code})` : ''}`);
      router.push('/guru/modul-ajar'); router.refresh();
    } catch (cause) {
      const timeout = cause instanceof Error && (cause.name === 'TimeoutError' || cause.name === 'AbortError');
      setError(timeout ? 'Pembuatan modul melebihi 75 detik. Periksa daftar modul sebelum mencoba lagi agar tidak membuat duplikat.' : cause instanceof Error ? cause.message : 'Gagal membuat modul ajar.');
    } finally { setSaving(false); submittingRef.current = false; }
  };
  if (!setup && !error) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin" /></div>;
  return <DashboardLayout role="guru" user={setup?.profile || { full_name: 'Guru', role: 'guru' }} onLogout={async () => { await createClient().auth.signOut(); router.replace('/pilih-peran'); }} breadcrumbs={[{ label: 'Beranda', href: '/guru' }, { label: 'Modul Ajar', href: '/guru/modul-ajar' }, { label: 'Buat Modul' }]}>
    <div className="mx-auto max-w-3xl space-y-5"><div><p className="text-xs font-bold uppercase tracking-wider text-teal-700">Generator modul ajar</p><h1 className="mt-1 text-3xl font-extrabold text-[#17324D]">Buat Modul Ajar</h1><p className="mt-2 text-sm text-[#4d6579]">Modul disimpan sebagai draf. Tinjau isi hasil AI sebelum digunakan untuk mengajar.</p></div>
      {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        <p>{error}</p>
        {!setup && <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" onClick={() => setRetry((value) => value + 1)} className="rounded-lg bg-teal-700 px-3 py-2 font-semibold text-white">Coba muat ulang</button>
          <Link href="/masuk?role=guru" className="rounded-lg border border-rose-300 px-3 py-2 font-semibold">Masuk ulang</Link>
        </div>}
      </div>}
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-teal-600"/> Informasi pembelajaran</CardTitle><CardDescription>Isi konteks pembelajaran dan gunakan kelas yang sudah ditugaskan.</CardDescription></CardHeader><CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
          <label className="block text-sm font-semibold">Kelas *<select required className="mt-2 w-full px-3" value={form.class_id} onChange={(e) => { setSelectedCpId(''); setCatalog([]); setCpEdited(false); setForm({ ...form, class_id: e.target.value, official_cp_text:'', official_cp_source:'' }); }}><option value="">Pilih kelas</option>{setup?.classes.map((c) => <option key={c.id} value={c.id}>{c.name} · Fase {c.phase}</option>)}</select></label>
          <label className="block text-sm font-semibold">Mata pelajaran *<select required className="mt-2 w-full px-3" value={form.subject_id} onChange={(e) => { setSelectedCpId(''); setCatalog([]); setCpEdited(false); setForm({ ...form, subject_id: e.target.value, official_cp_text:'', official_cp_source:'' }); }}><option value="">Pilih mata pelajaran</option>{setup?.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <label className="block text-sm font-semibold sm:col-span-2">Topik pembelajaran *<input required minLength={3} maxLength={200} className="mt-2 w-full px-3" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="Contoh: Ekosistem di sekitar sekolah" /></label>
          <label className="block text-sm font-semibold">Durasi *<input required className="mt-2 w-full px-3" maxLength={100} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></label>
          <label className="block text-sm font-semibold">Jumlah pertemuan *<input type="number" min={1} max={20} required className="mt-2 w-full px-3" value={form.meetings_count} onChange={(e) => setForm({ ...form, meetings_count: Number(e.target.value) })}/></label>
          <label className="block text-sm font-semibold sm:col-span-2">Jenis Modul Ajar<select className="mt-2 w-full px-3" value={form.detail_level} onChange={e => setForm({ ...form, detail_level: e.target.value })}><option value="lengkap">Lengkap — kegiatan terperinci, LKPD, soal, kunci dan rubrik</option><option value="ringkas">Ringkas — rencana pembelajaran inti</option></select><span className="mt-1 block text-xs font-normal text-slate-600">Modul lengkap memerlukan respons AI lebih banyak dan tetap harus ditinjau Guru.</span></label>
          <div className="sm:col-span-2 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm text-[#183b47] space-y-2">
            <p className="font-bold">Referensi pembelajaran dari katalog</p>
            <p className="text-xs">Fase mengikuti kelas. Pilih elemen CP yang sesuai topik; beberapa CP dapat belum tersedia karena katalog masih dikurasi. CP nasional ditampilkan sebagai ringkasan. Untuk IPAS dan Bahasa Inggris Fase A tersedia usulan pengembangan sekolah, bukan CP nasional.</p>
            {catalogLoading ? <p className="text-xs">Memuat katalog CP…</p> : null}
            {catalogError ? <p role="alert" className="text-rose-700">{catalogError}</p> : null}
            {!catalogLoading && !catalog.length && !catalogError ? <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
              {catalogReason === 'no_seed_for_phase' ? <p><strong>Data katalog belum terisi untuk fase {currentClass?.phase}.</strong> Jalankan migrasi <code>026_verified_cp_catalog.sql</code> sampai selesai di Supabase project LENTERA, kemudian muat ulang halaman. Jika sudah dijalankan, periksa apakah entri katalog masih aktif.</p> :
                catalogReason === 'subject_not_curated' ? <p><strong>Katalog untuk mata pelajaran {setup?.subjects.find(x=>x.id===form.subject_id)?.name} belum tersedia.</strong> Pastikan migrasi 027 dan 028 telah dijalankan. Sebagian elemen, fase, atau muatan lokal belum tersedia. Gunakan CP resmi yang diverifikasi sekolah, bukan rumusan otomatis AI.</p> :
                <p>Belum ada CP yang cocok. Periksa mata pelajaran, fase, dan migrasi katalog.</p>}
              {catalogSubjects.length > 0 ? <p>Mapel yang tersedia untuk fase ini: <strong>{catalogSubjects.join(', ')}</strong>.</p> : null}
              <button type="button" className="rounded-lg border border-amber-400 px-3 py-2 font-semibold hover:bg-amber-100" onClick={() => setCatalogRetry(x => x + 1)}>Muat ulang katalog</button>
            </div> : null}
            {catalog.length ? <label className="block font-semibold">Referensi yang akan digunakan {selectedCpId ? (cpEdited ? '· pilihan Guru' : '· saran sesuai topik') : '· pilih sesuai topik'}
              <select className="mt-2 w-full rounded-lg border border-teal-200 bg-white p-3" value={selectedCpId} onChange={e=>chooseCp(e.target.value)}>
                <option value="">Pilih CP dari katalog (opsional)</option>
                {catalog.map(cp => <option key={cp.id} value={cp.id}>{isSchoolReference(cp) ? "Pengembangan sekolah (draf)" : "CP nasional (ringkasan)"} · {cp.subject_name} · {cp.element}</option>)}
              </select>
            </label> : null}
            {selectedCpId && catalog.some(cp=>cp.id===selectedCpId) ? <div className="space-y-2 rounded-xl border border-teal-100 bg-white p-3">
              <p className="font-semibold">{catalog.find(cp=>cp.id===selectedCpId)?.subject_name} · {catalog.find(cp=>cp.id===selectedCpId)?.element} · Fase {currentClass?.phase}</p>
              <p className="text-sm">{catalog.find(cp=>cp.id===selectedCpId)?.cp_excerpt}</p>
              {schoolReference ? <p className="rounded-md bg-amber-50 p-2 font-semibold text-amber-900">Pengembangan sekolah — bukan CP nasional. Usulan LENTERA, perlu persetujuan sekolah.</p> : <a className="text-xs font-semibold text-teal-800 underline" href={selectedCp?.source_url} target="_blank" rel="noopener noreferrer">Lihat dokumen sumber CP</a>}
              <p className="text-xs text-amber-800">{schoolReference ? "Guru perlu menyesuaikan usulan ini dengan kurikulum sekolah sebelum digunakan." : "Ringkasan CP ini perlu dicocokkan Guru dengan rumusan utuh dalam dokumen sumber."}</p>
            </div> : null}
          </div>
          <label className="block text-sm font-semibold sm:col-span-2">{schoolReference ? "Acuan pengembangan sekolah (bukan CP nasional)" : "Rumusan CP dari sumber sekolah (opsional jika belum memilih katalog)"}<textarea rows={4} maxLength={3000} className="mt-2 w-full p-3" value={selectedCpId ? (catalog.find(cp=>cp.id===selectedCpId)?.cp_excerpt || "") : form.official_cp_text} disabled={!!selectedCpId} onChange={e=>setForm({...form,official_cp_text:e.target.value})} placeholder="Rumusan CP sesuai fase dan mata pelajaran. Jangan tulis data pribadi siswa."/></label>
          <label className="block text-sm font-semibold sm:col-span-2">Sumber CP (opsional)<input maxLength={300} className="mt-2 w-full px-3" value={selectedCpId ? (catalog.find(cp=>cp.id===selectedCpId)?.source_title || "") : form.official_cp_source} disabled={!!selectedCpId} onChange={e=>setForm({...form,official_cp_source:e.target.value})} placeholder="Contoh: Dokumen CP Matematika Fase C yang diverifikasi sekolah"/></label>
          <label className="block text-sm font-semibold">Model pembelajaran<select className="mt-2 w-full px-3" value={form.learning_model} onChange={e => setForm({ ...form, learning_model: e.target.value })}><option value="">Belum ditentukan (Guru memilih)</option><option value="Problem Based Learning (PBL)">Problem Based Learning (PBL)</option><option value="Project Based Learning (PjBL)">Project Based Learning (PjBL)</option><option value="Discovery Learning">Discovery Learning</option><option value="Inquiry Learning">Inquiry Learning</option><option value="Pembelajaran Langsung">Pembelajaran Langsung</option><option value="Cooperative Learning">Cooperative Learning</option></select></label>
          <label className="block text-sm font-semibold">Metode pembelajaran (pisahkan koma)<input className="mt-2 w-full px-3" value={form.learning_methods_text} onChange={e => setForm({ ...form, learning_methods_text: e.target.value })} placeholder="Diskusi, demonstrasi, latihan terbimbing" maxLength={300}/></label>
          <label className="block text-sm font-semibold sm:col-span-2">Media pembelajaran (pisahkan koma)<input className="mt-2 w-full px-3" value={form.media_text} onChange={e => setForm({ ...form, media_text: e.target.value })} placeholder="Papan tulis, kartu bilangan" maxLength={300}/></label>
          <label className="block text-sm font-semibold sm:col-span-2">Karakteristik peserta didik<textarea rows={3} maxLength={1000} className="mt-2 w-full p-3" value={form.student_characteristics} onChange={(e) => setForm({ ...form, student_characteristics: e.target.value })} placeholder="Kebutuhan dan karakteristik yang relevan" /></label>
          <label className="block text-sm font-semibold sm:col-span-2">Instruksi tambahan<textarea rows={3} maxLength={1000} className="mt-2 w-full p-3" value={form.additional_instructions} onChange={(e) => setForm({ ...form, additional_instructions: e.target.value })} placeholder="Opsional" /></label>
          <div className="flex flex-wrap justify-end gap-3 sm:col-span-2"><Link href="/guru/modul-ajar"><Button variant="outline" type="button">Batal</Button></Link><Button disabled={saving || catalogLoading || !setup?.classes.length || !setup?.subjects.length}><Sparkles className="mr-2 h-4 w-4"/>{saving ? 'Membuat modul…' : 'Buat draf modul'}</Button></div>
        </form>
      </CardContent></Card>
    </div>
  </DashboardLayout>;
}
