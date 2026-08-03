# 📋 Laporan Issue & Proposal Perubahan Strategi Monetisasi: Transisi SaaS Paywall ke Model Support/Donasi (Trakteer & Saweria)

Dokumen ini berisi latar belakang, alasan rasional, rencana perubahan arsitektur & UI, serta langkah-langkah transisi dari sistem **SaaS Berbayar (Paywall/Subscription)** menjadi **100% Free Access dengan Platform Dukungan (Trakteer / Saweria)** pada aplikasi **GeoVertex**.

---

## 1. 📌 Latar Belakang & Permasalahan

### 1.1 Kondisi & Pertimbangan Saat Ini:
1. **Dogfooding / Focused on Personal Utility**:
   * GeoVertex awalnya dibangun dari kebutuhan pribadi *developer* untuk menyelesaikan permasalahan alur kerja pemetaan/GIS.
   * *Target user persona* dan *Product-Market Fit (PMF)* belum terpetakan secara utuh di pasar komersial.
2. **Hambatan Teknis & Mental (Keamanan Supabase vs Laravel)**:
   * Implementasi *paywall* dan pembatasan fitur berbayar membutuhkan tingkat keamanan tinggi (misal: *Row Level Security / RLS* Supabase yang ketat, sinkronisasi *billing webhook*, verifikasi transaksi).
   * Pemahaman mendalam tentang *RLS & Auth Logic* Supabase masih dalam tahap dipelajari (berbeda dengan pengalaman di Laravel), sehingga memaksa *paywall* saat ini menimbulkan kecemasan celah keamanan.
3. **Friction Pengguna Baru**:
   * Menutup fitur di balik *paywall* di tahap awal akan menghambat adopsi, feedback dari pengguna, serta penyebaran penggunaan platform.

---

## 2. 🎯 Tujuan & Keputusan Pivot

Mengubah model bisnis GeoVertex menjadi:
* **100% Core Features Accessible for Free**: Seluruh fitur pemetaan, impor/ekspor data GIS, inspeksi UTM, dan visualisasi dibuka secara bebas untuk pengguna.
* **Support / Donation-Based Monetization**: Memasang tombol & modal dukungan sukarela menggunakan platform lokal (**Trakteer.id** & **Saweria**) serta platform internasional (**Buy Me a Coffee / Ko-fi** jika diperlukan).
* **Minimal Friction & High Security Confidence**: Menghilangkan *logic paywall* yang kompleks, menyederhanakan *schema* Supabase, dan berfokus penuh pada penyempurnaan UI/UX serta keandalan fitur *core mapping*.

---

## 3. 🔄 Perubahan Arsitektur & Antarmuka (UI/UX)

### 3.1 Komponen UI yang Ditambahkan / Disesuaikan:
1. **Tombol Support di Header / Navbar (`EditorHeader.tsx`)**:
   * Menambahkan tombol aksen ramah *"Dukung GeoVertex"* atau *"Traktir Kopi ☕"* di bar navigasi utama.
2. **Modal Dukungan (`SupportModal.tsx`)**:
   * Modal interaktif yang menampilkan pilihan platform dukungan:
     * 🇮🇩 **Trakteer.id** (QRIS, GoPay, OVO, Dana)
     * 🇮🇩 **Saweria** (QRIS / E-Wallet)
     * 🌐 **Buy Me a Coffee** (Opsional untuk internasional)
   * Dilengkapi pesan apresiasi dan penjelasan bahwa dukungan pengguna membantu menjaga server tetap menyala.
3. **Integrasi di Modal Export & Share (`ShareModal.tsx` & `ExportModal.tsx`)**:
   * Menambahkan *banner* / ucapan terima kasih non-intrusif saat pengguna berhasil melakukan ekspor file atau membagikan proyek:
     > *"GeoVertex berguna untuk pekerjaan Anda? Pertimbangkan untuk mendukung pengembangan platform ini!"*
4. **Pembersihan Logika Paywall / Plan Gate**:
   * Menghapus atau mendisable *conditional check* terkait `userPlan === 'pro'` atau pembatasan kuota ekspor/fitur yang sebelumnya direncanakan.
5. **Penghapusan Watermark Ekspor PDF Kartografi**:
   * Menghapus logo/tulisan *watermark* pada hasil ekspor PDF peta kartografi sehingga seluruh pengguna dapat mengunduh peta berkualitas profesional secara gratis.

---

## 4. 🛠️ Rencana Aksi Implementasi (Task Checklist)

- [ ] **📌 Langkah Awal: GitHub Release & Tag Snapshot**
  - [ ] Buat tag & release baru di GitHub (misal: `v0.9.0-pre-pivot` atau `legacy-paywall-backup`) untuk mengamankan *source code* versi saat ini sebelum perubahan eksekusi dilakukan.
- [ ] **Pembersihan / Deprecated Plan Gate Logic**
  - [ ] Memastikan tidak ada fitur yang terkunci di balik status pembayaran di frontend maupun RLS Supabase.
- [ ] **Penghapusan Watermark PDF Kartografi**
  - [ ] Hapus *logic* & komponen render *watermark* pada modul/fungsi ekspor PDF kartografi.
- [ ] **Pembuatan Komponen Support UI**
  - [ ] Buat komponen `SupportModal.tsx` untuk menampilkan opsi platform Trakteer & Saweria.
  - [ ] Pasang tombol `SupportButton` di `EditorHeader.tsx` dan `Footer`.
- [ ] **Integrasi Link Trakteer / Saweria**
  - [ ] Siapkan tautan akun Trakteer & Saweria resmi GeoVertex.
  - [ ] Tambahkan konfigurasi URL dukungan di `lib/config.ts` atau `.env`.
- [ ] **Penyempurnaan Pesan Apresiasi (UX Enhancement)**
  - [ ] Tambahkan ucapan terima kasih pasca-ekspor/share.

---

*Status Issue: Approved / In Planning*
