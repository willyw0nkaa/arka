# ARKA — AI-powered Road for Knowledge & Advancement

Platform web yang menghubungkan **siswa SMA/SMK**, **guru BK**, dan **kepala sekolah**: asesmen minat–kepribadian–bakat–nilai karier, profil potensi diri, Career Roadmap, AI Career Companion, dashboard guru BK, dan laporan agregat sekolah.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (PostgreSQL + Auth + RLS) · Vercel

---

## Daftar isi
1. [Persiapan Mac M1](#1-persiapan-mac-m1-sekali-saja)
2. [Menjalankan di komputer sendiri](#2-menjalankan-di-komputer-sendiri)
3. [Menyiapkan Supabase](#3-menyiapkan-supabase)
4. [Mengisi `.env.local`](#4-mengisi-envlocal)
5. [Membuat akun admin pertama](#5-membuat-akun-admin-pertama)
6. [Upload ke GitHub](#6-upload-ke-github)
7. [Deploy ke Vercel](#7-deploy-ke-vercel)
8. [Opsional: AI & email](#8-opsional-mengaktifkan-ai-dan-email)
9. [Skenario uji coba (demo)](#9-skenario-uji-coba-demo)
10. [Pemetaan PRD → fitur](#10-pemetaan-prd--fitur)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Persiapan Mac M1 (sekali saja)

Buka **Terminal** (Cmd + Spasi → ketik "Terminal").

```bash
# a. Homebrew (pengelola paket untuk Mac). Lewati bila `brew -v` sudah jalan.
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
# Setelah selesai, jalankan 2 baris yang ditampilkan installer, biasanya:
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# b. Node.js 22 (LTS), Git, dan GitHub CLI
brew install node@22 git gh
brew link --overwrite node@22

# c. Cek versi
node -v   # harus v20 atau lebih baru
npm -v
git --version
```

> M1 (Apple Silicon) didukung penuh; tidak ada dependensi native yang perlu dikompilasi.

---

## 2. Menjalankan di komputer sendiri

```bash
# ekstrak zip, lalu masuk ke folder proyek
cd ~/Downloads/arka        # sesuaikan lokasi folder
npm install                # ±1 menit
cp .env.example .env.local # lalu isi (lihat langkah 3 & 4)
npm run dev
```
Buka **http://localhost:3000**.

---

## 3. Menyiapkan Supabase

1. Buka **https://supabase.com** → *Start your project* → masuk dengan GitHub.
2. **New project**
   - Name: `arka`
   - Database Password: klik *Generate*, **simpan** di tempat aman
   - Region: **Southeast Asia (Singapore)** (paling dekat dengan Indonesia)
   - Klik *Create new project*, tunggu ±2 menit.
3. **Buat tabel:** menu kiri **SQL Editor** → *New query* → buka file `supabase/schema.sql` di VS Code/TextEdit, salin **seluruh** isinya, tempel → **Run**. Harus muncul *Success. No rows returned*.
4. **Isi data awal:** *New query* lagi → salin seluruh isi `supabase/seed.sql` → **Run**. (Berisi database karier draf + 2 sekolah contoh: kode `MLG001` dan `SBY001`.)
5. **Ambil kunci API:** **Project Settings** (ikon gerigi) → **API Keys**.
   - Bila ada tab **Legacy API keys**: salin `anon` dan `service_role`.
   - Bila tidak: salin **Publishable key** (`sb_publishable_…`) dan buat/salin **Secret key** (`sb_secret_…`).
   - **Project URL** ada di **Project Settings → Data API** (bentuknya `https://xxxx.supabase.co`).

> ⚠️ `service_role` / secret key = kunci master database. Jangan pernah ditaruh di kode, di-commit ke GitHub, atau dibagikan.

> Catatan: akun dibuat lewat server ARKA (bukan lewat email konfirmasi Supabase), jadi pengaturan *Confirm email* di Supabase tidak perlu diubah.

---

## 4. Mengisi `.env.local`

Buka `.env.local` dan isi:

| Variabel | Isi |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL dari langkah 3.5 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` key / Publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key / Secret key |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` (lokal) · URL Vercel (produksi) |
| `APP_SECRET` | string acak — buat dengan `openssl rand -base64 32` |
| `CRON_SECRET` | string acak lain — `openssl rand -base64 32` |
| `DEMO_MODE` | `true` = kode verifikasi & tautan persetujuan tampil di layar (untuk demo tanpa layanan email) |
| `OPENAI_API_KEY`, `GEMINI_API_KEY` | opsional (lihat langkah 8) |
| `RESEND_API_KEY`, `EMAIL_FROM` | opsional (lihat langkah 8) |

Simpan, lalu hentikan (`Ctrl + C`) dan jalankan ulang `npm run dev`.

---

## 5. Membuat akun admin pertama

Peran admin tidak bisa dipilih saat mendaftar (demi keamanan). Caranya:

1. Di aplikasi, **Daftar** → tab **Kepala Sekolah** (atau Guru BK) → isi dengan email Anda.
2. Di Supabase → **SQL Editor** → jalankan:
   ```sql
   update public.profiles set role = 'admin', verified = true where email = 'email-anda@contoh.com';
   ```
3. **Keluar** lalu **Masuk** lagi → Anda diarahkan ke halaman **Admin**.

Dari halaman Admin Anda bisa: memverifikasi akun guru BK/kepala sekolah, menambah sekolah (kode undangan dibuat otomatis), meninjau jawaban AI bertanda "Tidak akurat", dan memantau metrik.

---

## 6. Upload ke GitHub

```bash
cd ~/Downloads/arka
gh auth login            # pilih: GitHub.com → HTTPS → Login with a web browser
git init
git add .
git commit -m "ARKA V1"
gh repo create arka --private --source=. --push
```
Cek di https://github.com/USERNAME/arka. Pastikan file `.env.local` **tidak** ikut terunggah (sudah diatur di `.gitignore`).

<details><summary>Tanpa GitHub CLI</summary>

Buat repo kosong `arka` di github.com (Private, tanpa README), lalu:
```bash
git branch -M main
git remote add origin https://github.com/USERNAME/arka.git
git push -u origin main   # password = Personal Access Token (Settings → Developer settings → Tokens)
```
</details>

---

## 7. Deploy ke Vercel

1. Buka **https://vercel.com** → *Sign Up* → **Continue with GitHub**.
2. **Add New… → Project** → pilih repo `arka` → **Import**.
3. Framework terdeteksi otomatis sebagai **Next.js**. Jangan ubah Build Command.
4. Buka **Environment Variables**, masukkan semua variabel dari `.env.local` (cara cepat: salin seluruh isi `.env.local`, lalu tempel ke kolom *Key* pertama — Vercel memecahnya otomatis).
   - Untuk `NEXT_PUBLIC_APP_URL` isi sementara `https://arka.vercel.app`.
5. Klik **Deploy** (±2 menit).
6. Setelah selesai, salin domain yang diberikan (mis. `https://arka-xxxx.vercel.app`). Bila berbeda dari isian langkah 4: **Settings → Environment Variables** → ubah `NEXT_PUBLIC_APP_URL` → **Deployments** → titik tiga di deployment teratas → **Redeploy**.
7. (Disarankan) Supabase → **Authentication → URL Configuration** → *Site URL* = domain Vercel Anda.

**Otomatis setelah deploy:**
- Setiap `git push` ke `main` memicu deploy ulang.
- **Vercel Cron** (diatur di `vercel.json`) memanggil `/api/cron/purge` setiap hari pukul 02.00 WIB untuk menghapus permanen akun yang diminta dihapus/ditolak orang tua lebih dari 30 hari (FR-010). Vercel otomatis mengirim `CRON_SECRET` sebagai header otorisasi.

---

## 8. Opsional: mengaktifkan AI dan email

**AI Companion.** Tanpa kunci, Companion berjalan dalam *mode lokal*: jawaban dari aturan + database karier (cukup untuk demo). Untuk model AI sungguhan:
- `OPENAI_API_KEY` dari https://platform.openai.com/api-keys (model utama `gpt-4o`, sesuai PRD)
- `GEMINI_API_KEY` dari https://aistudio.google.com/apikey (cadangan)

Jika penyedia utama tidak merespons dalam 10 detik, sistem otomatis pindah ke cadangan; jika keduanya gagal, siswa melihat "Coba lagi nanti" dan pertanyaannya tetap ada di kolom input.

**Email (tautan persetujuan ortu & kode hapus akun).** Daftar di https://resend.com → buat API key → isi `RESEND_API_KEY`. Tanpa domain terverifikasi, Resend hanya mengirim ke email pemilik akun Resend; untuk pilot, verifikasi domain lalu ubah `EMAIL_FROM`. Setelah email berjalan, set `DEMO_MODE=false`.

Setelah mengubah variabel di Vercel, lakukan **Redeploy**.

---

## 9. Skenario uji coba (demo)

1. **Admin** (langkah 5) → tab *Sekolah* → lihat kode undangan.
2. **Guru BK:** daftar tab *Guru BK*, pilih sekolah → admin klik **Verifikasi** → guru masuk → dashboard kosong menampilkan tautan undangan.
3. **Siswa < 18 tahun:** buka tautan undangan (`/daftar?sekolah=MLG001`) → daftar → karena `DEMO_MODE=true`, tautan & kode persetujuan tampil → buka tautan, masukkan kode, klik **Setuju** → akun aktif.
4. **Siswa:** kerjakan 2 asesmen (bisa keluar di tengah, jawaban tersimpan) → **Profil** (sementara) → **Career Roadmap** → *Simpan* → tandai langkah → **Companion** (coba juga kalimat seperti "aku capek hidup" untuk melihat layar bantuan krisis).
5. **Guru BK:** refresh dashboard → siswa muncul dengan skor & tag → *Detail* → *Buat ringkasan* → simpan catatan.
6. **Kepala sekolah:** daftar → diverifikasi admin → **Laporan** → angka tampil setelah ≥ 10 siswa per kelompok → *Unduh PDF* (dialog cetak → *Save as PDF*).

---

## 10. Pemetaan PRD → fitur

| PRD | Status | Di mana |
|---|---|---|
| FR-001 Pendaftaran | ✅ | `/daftar`, `api/auth/register` — email ganda ditolak + tombol Masuk; "Sekolah belum terdaftar"; draf formulir tersimpan bila koneksi putus |
| FR-002 Persetujuan ortu | ✅ | `/persetujuan/[token]` — kode 6 digit, catat waktu/versi kebijakan/nama/kontak, kedaluwarsa 7 hari + kirim ulang, Tolak → hapus 30 hari, fitur terkunci |
| FR-003 Empat asesmen 60/40/48/36 | ✅ | `/asesmen/[key]` — simpan & lanjut, antrean offline, tombol Selesai nonaktif + item kosong ditandai |
| FR-004 Profil | ✅ | `/profil` — sementara (≥2) / lengkap (4), label indikasi, riwayat hasil |
| FR-005 Career Roadmap | ✅ | `/roadmap` — ≥3 jurusan & profesi + alasan, keterampilan, timeline, penjelasan bila data kurang |
| FR-006 Companion | ✅ | `/companion` — memori, rujuk profil, sumber, tolak di luar topik, fallback 10 dtk |
| FR-007 Bantuan krisis | ✅ | layar bantuan tak bisa ditutup 3 dtk, tanpa saran karier, event tanpa isi pesan, `/bantuan` bisa dibuka offline |
| FR-008 Dashboard guru BK | ✅ | `/guru` — skor, tag, filter, siswa tanpa persetujuan disembunyikan, ajakan undang |
| FR-009 Pembatasan akses | ✅ | lintas sekolah → 403 + audit log; isi chat tidak tampil; nonaktif → akses hilang seketika |
| FR-010 Hapus akun | ✅ | `/pengaturan` — kode konfirmasi (ke ortu bila < 18), nonaktif seketika, cron hapus 30 hari |
| FR-011, 013, 014, 015, 018, 019, 020 (P1) | ✅ | Progres, Directory, ringkasan AI, catatan konseling, laporan agregat, PDF, umpan balik AI |
| FR-012, 016, 017 (P1 notifikasi & impor) | ⏳ | Ditunda sesuai PRD (P1 setelah closed beta) |
| FR-021–026 (P2) | ❌ | Di luar cakupan V1 (non-goals Bab 6) |
| Instrumentasi Bab 7 | ✅ | 15 event, hanya ID pseudonim + jenis + waktu |

**Penyesuaian yang disengaja**
- **Vector DB:** retrieval memakai PostgreSQL (kata kunci + kecocokan profil) alih-alih Pinecone, agar closed beta bisa berjalan dengan biaya nol. Mudah ditingkatkan ke `pgvector` bila database karier sudah besar.
- **Kontak orang tua:** email (bukan WhatsApp/SMS) agar tidak perlu gateway berbayar.
- **Unduh PDF:** memakai dialog cetak peramban dengan tata letak khusus cetak.
- **Asesmen kepribadian:** memakai 5 dimensi umum dengan item orisinal, **bukan MBTI** (risiko lisensi, R6).
- **Isi asesmen, aturan skor kesiapan, dan pola deteksi krisis adalah DRAF** — wajib ditinjau psikolog mitra (D1, OQ-4/5/6) sebelum closed beta. Semua ada di satu tempat: `src/lib/assessments.ts`, `src/lib/readiness.ts`, `src/lib/crisis.ts`.

---

## 11. Troubleshooting

| Gejala | Solusi |
|---|---|
| Halaman error "Variabel lingkungan … belum diisi" | Cek `.env.local` (lokal) atau Environment Variables (Vercel), lalu restart/redeploy |
| "Gagal memuat data sekolah … school_student_overview" | `schema.sql` belum dijalankan penuh. Jalankan ulang (aman dijalankan berkali-kali) |
| Daftar sekolah kosong di halaman daftar | `seed.sql` belum dijalankan, atau tambah sekolah dari halaman Admin |
| Guru BK diarahkan ke "Menunggu verifikasi" | Admin belum menekan **Verifikasi** |
| Tautan persetujuan mengarah ke `localhost` di produksi | `NEXT_PUBLIC_APP_URL` di Vercel belum diganti → ubah lalu Redeploy |
| `npm install` gagal di Mac | `brew upgrade node@22`, hapus `node_modules` + `package-lock.json`, ulangi |

---

## Struktur folder

```
supabase/          schema.sql (tabel + RLS + fungsi), seed.sql (data karier & sekolah contoh)
src/proxy.ts       penyegar sesi & perlindungan rute
src/lib/           logika inti: asesmen, profil & roadmap, skor kesiapan, krisis, AI, auth, email
src/components/    UI (glass card, tombol ber-shadow, sidebar, radar, modal krisis)
src/app/           halaman & API (route handlers)
public/sw.js       service worker untuk halaman bantuan offline
```

© 2026 Kelompok 5 — Siti Rahma Nurhaibah, Rizki Amalia, Naila Rania Shofa · Universitas Brawijaya
