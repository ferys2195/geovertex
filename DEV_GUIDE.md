# 🛠️ Panduan Pengembang (DEV_GUIDE.md) — GeoVertex SaaS

Dokumen ini adalah panduan khusus untuk **pengembang (Developer)** agar dapat menjalankan, menguji, dan mengembangkan seluruh fitur **GeoVertex SaaS** secara lokal **TANPA harus membuat akun Supabase Cloud atau Google OAuth 2.0**.

---

## 💡 Konsep Offline Demo Engine & Fallback Architecture

GeoVertex SaaS dirancang dengan arsitektur **Offline-First Fallback Engine**. Ketika environment variables Supabase belum dikonfigurasi atau tidak terhubung ke cloud, aplikasi secara otomatis beralih ke **Mode Demo Lokal / Mock Data Store**.

### 🌟 Keuntungan Mode Pengembang:
1. **Zero External Dependency**: Tidak perlu koneksi internet atau registrasi akun di layanan pihak ketiga.
2. **Instant Local Testing**: Langsung bisa menguji 100% fitur SaaS (Dashboard, Canvas Digitasi, Pengukuran Luas, Kolaborasi Tim, dan Cetak PDF Kartografi).
3. **Persiapan Produksi Tanpa Refactoring**: Saat Anda siap mendeploy ke cloud nantinya, seluruh struktur data dan komponen sudah 100% kompatibel dengan Supabase PostGIS dan Google OAuth.

---

## 🚀 1. Cara Mengorientasikan & Jalankan Server Lokal

### Langkah 1: Install Dependensi
Buka terminal pada direktori utama proyek `geovertex` dan jalankan:
```bash
npm install
```

### Langkah 2: Jalankan Server Next.js Dev
```bash
npm run dev
```
Server akan berjalan di: **`http://localhost:3000`**

---

## 🗺️ 2. Cara Menguji Seluruh Alur SaaS di Mode Pengembang

### A. Halaman Beranda (`/`) & Sandbox Interaktif
- Buka `http://localhost:3000` di browser.
- Gunakan **Live Interactive Sandbox** di bagian depan tanpa perlu login untuk mencoba menggambar polygon/garis lahan dan melihat pembacaan koordinat UTM.

### B. Mode Login Pengembang (`/login`)
- Klik tombol **Masuk** di pojok kanan atas atau buka `http://localhost:3000/login`.
- Pada kartu login, klik tombol **"Masuk Mode Pengembang (Demo tanpa Login)"**.
- Anda akan langsung diantar ke **Dashboard Proyek** tanpa perlu autentikasi Google.

### C. Dashboard Proyek (`/dashboard`)
- Di halaman `/dashboard`, Anda akan melihat daftar proyek demo pre-populated (seperti *Proyek Pemetaan Lahan Perkebunan Blok A*).
- **Uji Buat Proyek Baru**: Klik **Proyek Pemetaan Baru**, isi judul & koordinat pusat, lalu klik **Buat & Buka Canvas**.
- Proyek baru akan langsung terbuat di memori lokal dan membuka editor.

### D. Editor Peta Spasial & Auto-Save Indicator (`/project/[id]`)
- Di halaman editor `/project/[id]`:
  - **Digitasi Lahan**: Gambar Polygon, Garis, Waypoint, atau Lingkaran menggunakan toolbar Geoman di sebelah kiri peta.
  - **Precision Vertex Inspector**: Buka sidebar untuk melihat tabel koordinat $X/Y$ dan Lat/Lng setiap titik sudut.
  - **Indikator Cloud Auto-Save**: Amati badge status di navbar atas. Setiap kali Anda menggambar atau menggeser titik vertex, indikator akan berubah menjadi `Menyimpan ke Cloud...` lalu kembali ke `Tersimpan di Cloud` (Hijau).
  - **Uji Kolaborasi Tim**: Klik tombol **Kolaborasi Tim** di navbar untuk melihat modal *ShareModal* (simulasi peran Owner, Editor, Viewer).

### E. Ekspor PDF Kartografi & Multi-Format
- Klik tombol **Ekspor PDF & Data** di navbar editor.
- Pilih tab **Laporan PDF Kartografi**:
  - Isi Judul Peta, Pembuat, dan Orientasi Kertas (A4 Portrait/Landscape).
  - Klik **Unduh PDF Kartografi**.
  - Aplikasi akan menghasilkan PDF peta lengkap dengan **Border Grid UTM ($X/Y$)**, Jarum Arah Utara, Legenda, Skala Bar, dan **Tabel Koordinat Vertex**.
- Pilih tab **Data Spasial Digital** untuk mengunduh berkas GeoJSON, GPX, KML, atau CSV.

---

## ⚡ 3. Perintah CLI Pengembang yang Berguna

| Command | Fungsi |
| :--- | :--- |
| `npm run dev` | Menjalankan Next.js Development Server (`http://localhost:3000`) |
| `npm run typecheck` | Memeriksa validasi TypeScript di seluruh file (`tsc --noEmit`) |
| `npm run build` | Pengujian kompilasi Next.js App Router ke versi produksi |
| `npm run format` | Merapikan format kode TSX/TS menggunakan Prettier |
| `npm run lint` | Menjalankan linter ESLint |

---

## 🔄 4. Transisi ke Production Deployment (Opsional di Masa Depan)

Jika di kemudian hari Anda sudah siap mempublikasikan aplikasi ini ke pengguna umum dan menghubungkan akun Supabase/Google resmi:
1. Buka file panduan [DEPLOY_GUIDE.md](file:///e:/Personal/Website/showcases/geovertex/DEPLOY_GUIDE.md).
2. Ikuti 5 langkah mudah untuk menyiapkan skema database `supabase/schema.sql`, kredensial Google OAuth, dan variabel lingkungan Vercel.

---

&copy; {new Date().getFullYear()} GeoVertex SaaS — Local Developer Workspace Guide.
