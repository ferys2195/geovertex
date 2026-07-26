# 🚀 Panduan Deployment GeoVertex SaaS (V1.0)

Dokumen ini berisi panduan langkah-demi-langkah lengkap untuk mendeploy aplikasi **GeoVertex SaaS** ke lingkungan produksi (Production) menggunakan **Supabase**, **Google OAuth 2.0**, dan **Vercel**.

---

## 📌 Checklist Prasyarat Sebelum Deploy

Sebelum memulai, pastikan Anda telah menyiapkan akun-akun berikut:
- [x] **Repository GitHub**: Repository kode `geovertex` terbaru yang sudah di-push.
- [x] **Akun Supabase**: [supabase.com](https://supabase.com) (Gratis).
- [x] **Akun Google Cloud Platform**: [console.cloud.google.com](https://console.cloud.google.com) (Gratis).
- [x] **Akun Vercel**: [vercel.com](https://vercel.com) (Gratis).

---

## 🗄️ Langkah 1: Setup Database Supabase & Extension PostGIS

1. Login ke Dashboard [Supabase](https://supabase.com) dan buat proyek baru:
   - **Name**: `geovertex-saas`
   - **Database Password**: *(Simpan password Anda dengan aman)*
   - **Region**: Pilih lokasi terdekat (misal: `Singapore`).
2. Setelah proyek selesai dibuat (sekitar 1-2 menit), buka menu **SQL Editor** pada navigasi kiri.
3. Buka file [supabase/schema.sql](file:///e:/Personal/Website/showcases/geovertex/supabase/schema.sql) pada project Anda, salin seluruh isi teks SQL, dan tempelkan ke dalam **SQL Editor** Supabase.
4. Klik tombol **Run** untuk mengeksekusi SQL script:
   - Script ini otomatis mengaktifkan ekstensi `postgis`.
   - Membuat tabel `profiles`, `projects`, `project_members`, dan `map_features`.
   - Mengkonfigurasi keamanan **Row Level Security (RLS)**.
   - Membuat trigger otomatis registrasi profil pengguna baru.
5. Buka menu **Project Settings -> API** (ikon gerigi ⚙️ di pojok kiri bawah -> **API** / **Data API**):
   - Salin **Project URL** (contoh: `https://<project-ref>.supabase.co`).
     > 💡 *Tips:* Jika tidak melihat Project URL di tab API Keys UI baru, Anda bisa mengambil kode Reference ID dari address bar browser (`https://supabase.com/dashboard/project/<project-ref>/...`) lalu bentuk URL menjadi `https://<project-ref>.supabase.co`.
   - Salin **Publishable key** (`sb_publishable_...`) yang setara dengan **anon public key** (atau salin dari tab *Legacy anon, service_role API keys* jika menggunakan format lama `eyJhbGci...`).
   *(Simpan kedua nilai ini untuk konfigurasi Environment Variables).*

---

## 🔑 Langkah 2: Setup Google OAuth 2.0 di Google Cloud Console

1. Buka [Google Cloud Console](https://console.cloud.google.com).
2. Buat Proyek Baru (*Create Project*), beri nama **GeoVertex SaaS**.
3. Buka menu **APIs & Services -> OAuth consent screen**:
   - Pilih User Type: **External** -> Klik **Create**.
   - **App name**: `GeoVertex SaaS`
   - **User support email**: Email Google Anda.
   - **Developer contact information**: Email Google Anda.
   - Klik **Save and Continue** hingga selesai.
4. Buka menu **APIs & Services -> Credentials**:
   - Klik **+ Create Credentials** -> Pilih **OAuth client ID**.
   - **Application type**: Pilih **Web application**.
   - **Name**: `GeoVertex Web Client`
   - **Authorized JavaScript origins**:
     - `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co` (Ganti dengan Reference ID Supabase Anda).
     - `http://localhost:3000` (Untuk pengujian lokal).
   - **Authorized redirect URIs**:
     - `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
   - Klik **Create**.
5. Salin nilai **Client ID** dan **Client Secret** yang muncul di layar.

---

## 🔐 Langkah 3: Konfigurasi Provider Google di Supabase Auth

1. Kembali ke Dashboard **Supabase** proyek Anda.
2. Buka menu **Authentication -> Providers** -> Klik **Google**:
   - Toggle pilihan **Enable Google provider** menjadi AKTIF (*ON*).
   - Paste **Client ID** dari Google Cloud Console.
   - Paste **Client Secret** dari Google Cloud Console.
   - Klik **Save**.
3. Buka menu **Authentication -> URL Configuration**:
   - **Site URL**: Isikan domain produksi Vercel Anda (contoh: `https://geovertex.vercel.app`).
   - **Redirect URLs**: Tambahkan URI berikut:
     - `https://geovertex.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback`
   - Klik **Save**.

---

## ☁️ Langkah 4: Deployment Frontend ke Vercel

1. Buka Dashboard [Vercel](https://vercel.com) dan klik **Add New... -> Project**.
2. Pilih repository GitHub `geovertex` -> Klik **Import**.
3. Pada halaman **Configure Project**:
   - **Framework Preset**: Next.js.
   - **Root Directory**: `./` (Default).
   - Buka bagian **Environment Variables** dan tambahkan variabel berikut:

| Key | Value | Catatan |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` | Project URL Supabase Anda |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_...` (atau `eyJhbGci...`) | Publishable Key (atau Legacy Anon Key) |

4. Klik tombol **Deploy**.
5. Tunggu hingga proses build selesai (~1-2 menit). Vercel akan memberikan domain publik (misal: `https://geovertex.vercel.app`).

---

## ✅ Langkah 5: Verifikasi Deployment Produksi

Setelah deployment selesai, lakukan verifikasi fitur berikut:
1. **Login Google**: Buka `https://geovertex.vercel.app/login` -> Klik tombol **Lanjutkan dengan Akun Google** dan pastikan berhasil redirect ke Dashboard.
2. **Management Proyek**: Buat proyek baru di Dashboard dan pastikan proyek muncul di list.
3. **Canvas GIS & Auto-Save**: Buka proyek, gambar polygon/garis lahan, dan pastikan status di kanan atas menampilkan `Tersimpan di Cloud` (Warna Hijau).
4. **Cetak PDF Kartografi**: Klik **Ekspor PDF & Data** -> **Unduh PDF Kartografi** dan pastikan file PDF terunduh lengkap dengan Grid UTM border, Jarum Arah Utara, Legenda, dan Tabel Koordinat.

---

## 🛠️ Troubleshooting & Q&A

- **Masalah: Redirect Google OAuth Error 400 (`redirect_uri_mismatch`)**
  - *Solusi*: Pastikan `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback` sudah ditambahkan di **Authorized redirect URIs** pada Google Cloud Console.

- **Masalah: Fitur Auto-Save Gagal / Error 403 Forbidden**
  - *Solusi*: Pastikan Anda sudah menjalankan seluruh script `supabase/schema.sql` di Supabase SQL Editor agar kebijakan Row Level Security (RLS) aktif dengan benar.

---

&copy; {new Date().getFullYear()} GeoVertex SaaS Platform. Ready for Production Deployment.
