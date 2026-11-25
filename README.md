> Patch V12.10.10: lihat `PERBAIKAN_V12_10_10.md` untuk koreksi indikator terbit vs indikator total dan status bukti.

# LENTERA — Platform Evaluasi, Refleksi, dan Pengembangan Pembelajaran

> **Tagline:** Terangi Pembelajaran, Tumbuhkan Potensi.

LENTERA adalah platform pendidikan berbasis teknologi Artificial Intelligence yang dirancang untuk membantu guru merencanakan, mengevaluasi, dan meningkatkan kualitas pembelajaran. Platform ini mengintegrasikan data Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), hasil asesmen peserta didik, serta refleksi guru untuk menghasilkan analisis ketercapaian pembelajaran secara terstruktur.

## ✨ Fitur Utama

### 👨‍🏫 Dashboard Guru
- **Manajemen Kelas & Siswa** — CRUD data kelas, import/export Excel siswa
- **Input CP & TP** — Kelola Capaian Pembelajaran dan Tujuan Pembelajaran sesuai Kurikulum Merdeka
- **Asesmen Formatif & Sumatif** — Buat kegiatan asesmen, tetapkan skor minimum dan target kelas, lalu input nilai per siswa
- **Refleksi AI** — Generate pertanyaan refleksi kontekstual, analisis jawaban guru
- **Analisis Ketercapaian** — Perhitungan deterministik + interpretasi AI, rekomendasi tindak lanjut
- **Generator Modul Ajar** — Modul lengkap dengan kegiatan, asesmen, diferensiasi, export PDF
- **Riwayat Pembelajaran** — Tracking dan pencarian sesi pembelajaran

### 🏫 Dashboard Kepala Sekolah
- **Monitoring Sekolah** — Overview guru, kelas, siswa, aktivitas pembelajaran
- **Monitoring Kelas** — Detail per kelas, perkembangan TP, hasil asesmen
- **Laporan Guru** — Aktivitas dan kualitas pembelajaran per guru
- **Analisis Sekolah** — Tren ketercapaian, distribusi asesmen, indikator perhatian
- **Laporan Sekolah** — Rekapitulasi periodik, export PDF

### 👨‍👩‍👧 Dashboard Wali Murid
- **Profil Anak** — Identitas, kelas, ringkasan perkembangan
- **Perkembangan Belajar** — Status ketercapaian TP, grafik perkembangan
- **Hasil Asesmen** — Nilai yang dipublikasikan guru
- **Laporan Pembelajaran** — Laporan per siswa yang telah ditinjau dan dipublikasikan guru
- **Notifikasi** — Alert laporan/asesmen baru

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **UI Components** | shadcn/ui + Radix UI |
| **Database** | Supabase PostgreSQL |
| **Auth** | Supabase Auth (SSR) |
| **Authorization** | RLS + Role-Based Access Control |
| **AI** | LLM API (Anthropic/OpenAI) via backend |
| **Charts** | Recharts |
| **File Processing** | SheetJS (Excel), jsPDF (PDF) |
| **Deployment** | Vercel |
| **Version Control** | GitHub |

## 📁 Struktur Project

```
lentera-app/
├── src/
│   ├── app/
│   │   ├── (auth)/                 # Auth pages (login, role selection)
│   │   ├── (dashboard)/
│   │   │   ├── guru/               # Teacher dashboard & pages
│   │   │   ├── kepala-sekolah/     # Principal dashboard & pages
│   │   │   └── wali-murid/         # Parent dashboard & pages
│   │   ├── api/
│   │   │   ├── ai/                 # AI endpoints
│   │   │   └── auth/               # Auth endpoints
│   │   ├── globals.css             # Global styles & design tokens
│   │   ├── layout.tsx              # Root layout with providers
│   │   └── page.tsx                # Landing page
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── layout/                 # Sidebar, Header, DashboardLayout
│   │   ├── landing/                # Landing page sections
│   │   ├── auth/                   # Auth components
│   │   └── dashboard/              # Dashboard-specific components
│   ├── lib/
│   │   ├── supabase/               # Supabase clients (client & server)
│   │   └── utils.ts                # Utility functions
│   ├── hooks/                      # Custom React hooks
│   ├── types/                      # TypeScript types
│   └── services/
│       └── ai/                     # AI services & providers
├── supabase/
│   └── migrations/                 # SQL migrations
├── public/                         # Static assets
├── .env.example                    # Environment template
├── SUPABASE_SETUP.md               # Supabase setup guide
└── package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm/pnpm/yarn
- Supabase account

### Installation

```bash
# Clone repository
git clone <repository-url>
cd lentera-app

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
# SUPABASE_SECRET_KEY=...
```

### Database Setup

Ikuti panduan lengkap di [SUPABASE_SETUP.md](./SUPABASE_SETUP.md):

1. Buat project Supabase
2. Dapatkan credential API
3. Jalankan migrasi SQL `001` sampai `007` secara berurutan untuk project baru. Untuk project lama, jalankan hanya migrasi yang belum diterapkan (lihat `SUPABASE_SETUP.md`).
4. Aktifkan email confirmation dan konfigurasi redirect `/auth/callback`
5. Kepala Sekolah menerbitkan kode undangan wali murid dari dashboard.
6. (Opsional) Setup Storage buckets

### Development

```bash
# Run development server
npm run dev

# Run linting
npm run lint

# Type checking
npx tsc --noEmit

# Build for production
npm run build
```

Buka [http://localhost:3000](http://localhost:3000)

## 🔐 Role-Based Access Control

| Fitur | Guru | Kepala Sekolah | Wali Murid |
|-------|------|----------------|------------|
| Dashboard | ✅ | ✅ | ✅ |
| Data Siswa | Kelola | Lihat (sekolah) | Anak sendiri |
| Input CP/TP | ✅ | ❌ | ❌ |
| Input Asesmen | ✅ | ❌ | ❌ |
| Analisis AI | ✅ | Ringkasan | Ringkasan publik |
| Modul Ajar | ✅ | ❌ | ❌ |
| Riwayat | ✅ | Monitoring | Laporan anak |
| Monitoring Sekolah | ❌ | ✅ | ❌ |

**Keamanan:**
- Validasi role di backend (middleware + API)
- Row Level Security (RLS) di Supabase
- Token service role HANYA di server
- Verifikasi hubungan wali murid-anak

## 🤖 AI Integration

LENTERA menggunakan 3 layanan AI terpisah:

1. **Reflection Question Generator** — Pertanyaan refleksi kontekstual
2. **Learning Analysis Engine** — Analisis asesmen + refleksi → rekomendasi
3. **Module Generator** — Modul ajar lengkap dari input guru

### Arsitektur AI
- Provider abstraction (mudah ganti model)
- Dipanggil via backend (API routes) — **tidak dari browser**
- Structured output dengan validasi Zod
- Demo mode tersedia (label "SIMULASI")

### Environment Variables AI
```env
AI_API_KEY=your-api-key
AI_PROVIDER=anthropic|openai|mock
AI_MODEL=claude-3-5-sonnet|gpt-4o|mock
```

## 📊 Database Schema

Tabel utama (lihat `supabase/migrations/001_initial_schema.sql`):

- `profiles` — Data user & role
- `schools` — Identitas sekolah
- `classes` — Data kelas
- `teacher_classes` — Relasi guru-kelas
- `subjects` — Mata pelajaran
- `students` — Data siswa
- `parent_students` — Relasi wali murid-anak
- `learning_outcomes` — CP
- `learning_objectives` — TP
- `learning_indicators` — Indikator TP
- `learning_sessions` — Sesi pembelajaran
- `assessment_activities` — Kegiatan asesmen
- `assessment_results` — Hasil asesmen per siswa
- `reflection_questions/answers` — Refleksi guru
- `ai_analyses` — Hasil analisis AI
- `teaching_modules` — Modul ajar
- `published_reports/assessments` — Data untuk wali murid

## 🚀 Deployment

### Vercel (Recommended)

1. Push ke GitHub
2. Import di Vercel
3. Tambah Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
   - `AI_API_KEY` (opsional)
4. Deploy

### Supabase Production Config
- Update **Site URL** & **Redirect URLs** di Auth Settings
- Enable **Point-in-Time Recovery**
- Set **Maintenance Window**

## 📝 Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npx tsc --noEmit     # TypeScript check
```

## 🔒 Security

- [x] Supabase Auth dengan SSR
- [x] Row Level Security di semua tabel
- [x] Role validation di middleware & API
- [x] Service role key hanya server-side
- [x] Input validation (Zod)
- [x] Audit logging aktivitas sensitif
- [x] Verifikasi relasi wali murid-anak

## 📚 Dokumentasi

- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [PRD LENTERA](./PRD.md) (jika tersedia)
- [Master Prompt](./MASTER_PROMPT.md) (jika tersedia)

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/nama-fitur`)
3. Commit changes (`git commit -m 'Add: nama fitur'`)
4. Push branch (`git push origin feature/nama-fitur`)
5. Buat Pull Request

## 📄 License

Proprietary — LENTERA Team

## 📞 Support

- Email: hello@lentera.id
- Docs: https://docs.lentera.id
- Issues: GitHub Issues

---

**LENTERA** — *Terangi Pembelajaran, Tumbuhkan Potensi.*
## Catatan implementasi

- Akun Guru dan Kepala Sekolah harus diprovisikan oleh pengelola sekolah; pendaftaran mandiri hanya untuk Wali Murid dengan kode undangan.
- Orang tua hanya membaca laporan dan asesmen yang telah dipublikasikan, bukan refleksi internal atau analisis mentah guru.
- Jalankan `npm run lint`, `npx tsc --noEmit`, dan `npm run build` setelah konfigurasi dependency dan Supabase selesai.
- Jangan pernah membagikan `.env.local` atau mengunggah secret key ke repository.


## Panel admin internal (pengelolaan API AI)

Panel admin sengaja tidak ditautkan ke navbar atau landing page. URL internal:

- Login admin: `/lentera-system-access`
- Panel admin: `/panel-internal-lentera`

URL yang tidak ditautkan **bukan** mekanisme keamanan. Setiap halaman dan API admin memverifikasi keanggotaan pada tabel `platform_admins` melalui RPC `is_platform_admin()` di server. Akun admin platform terpisah dari tiga role sekolah (Guru, Kepala Sekolah, dan Wali Murid), sehingga tidak perlu menambah enum role sekolah.

### Menyiapkan akun admin Supabase

1. Jalankan migration `008_platform_admin_and_settings.sql` setelah migration `001`–`007`.
2. Buka Supabase Dashboard → Authentication → Users → Add user. Buat akun dengan email admin yang dikelola organisasi dan set password awal yang kuat. Tandai email terverifikasi sesuai kebijakan organisasi.
3. Buka SQL Editor. Salin `supabase/ADMIN_SETUP.sql`, ganti email contoh dengan email admin yang baru dibuat, lalu jalankan.
4. Buka `/lentera-system-access`, masuk dengan email/password tadi. Akun ini tidak memerlukan baris di `profiles`.
5. Jika admin tambahan diperlukan, ulangi langkah provisioning untuk setiap akun. Jangan membuat endpoint pendaftaran admin publik.

Akun Supabase tidak dapat dibuat otomatis oleh aplikasi tanpa akses tepercaya ke project Supabase. Karena itu akun pertama dibuat melalui Dashboard, lalu diberi hak admin menggunakan SQL setup tersebut.

### Konfigurasi rahasia API

Tambahkan `APP_ENCRYPTION_KEY` pada environment server (Vercel Project Settings → Environment Variables dan `.env.local` untuk lokal). Buat nilainya dengan:

```bash
openssl rand -base64 32
```

Jangan awali nilainya dengan `NEXT_PUBLIC_`, jangan commit ke Git, dan simpan cadangan di password manager organisasi. Kehilangan key enkripsi berarti API key yang disimpan di database tidak dapat didekripsi lagi.

Setelah itu buka panel admin → Konfigurasi layanan AI. Pilih OpenAI atau Anthropic, isi model dan API key, lalu simpan. API key dienkripsi AES-256-GCM sebelum disimpan ke tabel `platform_settings`. GET API admin hanya mengembalikan status terkonfigurasi, bukan nilai secret. Kunci `SUPABASE_SECRET_KEY` dan `APP_ENCRYPTION_KEY` tetap harus dikelola melalui environment server, bukan melalui formulir panel.

Jika sebelumnya AI memakai `AI_PROVIDER`, `AI_MODEL`, dan `AI_API_KEY` dari environment, nilai itu tetap menjadi fallback saat konfigurasi database belum dibuat. Konfigurasi yang disimpan melalui panel akan menjadi sumber utama untuk provider/model dan API key terenkripsi.
