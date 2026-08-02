# 📋 Laporan Issue: Penerapan Restriksi UX & Disable Action Berdasarkan Role Pengguna (Owner, Editor, Viewer)

Dokumen ini berisi spesifikasi tugas, batasan setiap role, serta laporan temuan kendala **User Experience (UX)** pada aplikasi **GeoVertex SaaS** di mana tombol aksi masih belum di-disable sesuai hak akses role pengguna.

---

## 1. ⚠️ Kendala Saat Ini (Current UX Issue)

### 📌 Judul Kendala:
**Tombol Aksi (Delete, Edit, Add Feature, Manage Team) Belum Di-disable di Level UI Berdasarkan Role Pengguna (Owner, Editor, Viewer)**

### 🔍 Detail Permasalahan:
1. **Penegakan Hak Akses Baru Sebatas Backend (RLS Supabase)**:
   - Saat ini validasi role telah berjalan di Supabase RLS (*Row Level Security*). Namun di antarmuka frontend (UI), kontrol akses belum diterapkan secara konsisten.
2. **Poor User Experience pada Role Viewer & Editor**:
   - Pengguna dengan role **`Viewer`** masih dapat melihat dan menekan tombol aksi sensitif seperti **Delete Feature**, **Edit Properties**, **Tambah Titik UTM**, dan **Import Data**.
   - Ketika tombol diklik, aksi pada akhirnya gagal atau ditolak oleh backend, namun antarmuka tidak memberikan indikasi visual (*disabled state*) bahwa role tersebut tidak memiliki izin.
   - Pengguna dengan role **`Editor`** masih dapat melihat aksi manajemen tingkat tinggi seperti hapus proyek atau ubah anggota tim tanpa petunjuk UI bahwa fitur tersebut terbatas untuk `Owner`.

---

## 2. 🔐 Matriks Tugas, Hak Akses, & Batasan Setiap Role

Berikut adalah daftar tugas resmi dan batasan elemen UI yang **wajib di-disable/disembunyikan** untuk setiap role:

| Role | Deskripsi & Tugas Utama | Hak Akses (Enabled Actions) | Batasan UI (Disabled Actions) |
| :--- | :--- | :--- | :--- |
| **👑 Owner** | Pemilik proyek. Mengontrol penuh seluruh aspek teknis, data spasial, tim, dan siklus hidup proyek. | • CRUD Seluruh Data Spasial<br>• Edit Metadata & Judul Proyek<br>• Kelola Anggota Tim (Invite/Role/Remove)<br>• Hapus Proyek secara Permanen | *Tidak Ada (Full Access)* |
| **✏️ Editor** | Penyunting data spasial. Berfokus pada pengerjaan pemetaan, pengeditan atribut, dan penambahan fitur GIS. | • CRUD Seluruh Data Spasial<br>• Edit Metadata & Judul Proyek<br>• Melihat Anggota Tim | 🚫 **Disabled:** Hapus Proyek (`Delete Project`)<br>🚫 **Disabled:** Mengundang/Mengubah/Mengeluarkan Anggota Tim |
| **👁️ Viewer** | Pengamat / Read-Only. Hanya bertugas meninjau, melakukan inspeksi koordinat, dan melihat visualisasi peta. | • Read-Only Peta & Fitur Spasial<br>• Navigasi, Zoom, Pan, & Inspeksi Koordinat<br>• Melihat Daftar Anggota Tim<br>• Ekspor Visual Peta (jika diizinkan) | 🚫 **Disabled:** Tambah/Draw/Import Feature<br>🚫 **Disabled:** Edit Feature Properties<br>🚫 **Disabled:** Hapus Feature (`Delete Feature`)<br>🚫 **Disabled:** Edit Judul Proyek<br>🚫 **Disabled:** Kelola Anggota Tim & Hapus Proyek |

---

## 3. 🎯 Temuan Komponen UI yang Perlu Penyesuaian

Berdasarkan inspeksi codebase, berikut komponen-komponen yang perlu ditambahkan kontrol `disabled` atau penyembunyian berdasarkan `currentRole` / `isReadOnly`:

1. **`EditorSidebar.tsx` & `SidebarFeatureItem.tsx`**:
   - Tombol Hapus Fitur (*Delete*) dan Edit Atribut harus ditambahkan `disabled={isReadOnly}` dengan visual `opacity-50 cursor-not-allowed`.
2. **`MapUtmToolbar.tsx` / `FeatureActionButtons.tsx`**:
   - Tombol Aksi "Tambah Titik UTM", "Gambar Poligon/Line", dan "Import Data" wajib di-disable jika `currentRole === 'viewer'`.
3. **`ProjectTitleBar.tsx` / `EditorHeader.tsx`**:
   - Input/Tombol Ubah Judul Proyek di-disable untuk `Viewer`.
4. **`ShareModal.tsx` & `ProjectCard.tsx`**:
   - Aksi pengubahan role anggota dan pengeluaran anggota tim hanya aktif jika `currentRole === 'owner'`.
   - Tombol Hapus Proyek (*Delete Project*) pada Dashboard Card wajib di-disable / disembunyikan untuk `Editor` dan `Viewer`.

---

## 4. 🛠️ Rencana Solusi Implementasi

1. **Propagasi State Role dari Store (`useProjectStore`)**:
   - Memastikan `currentRole` atau helper `isReadOnly = currentRole === 'viewer'` dan `isOwner = currentRole === 'owner'` disebarkan secara proporsional ke seluruh sub-komponen header, sidebar, toolbar, dan modal.
2. **Penambahan Disabled State & Styling UI**:
   - Menambahkan atribut `disabled` pada elemen `<button>` atau `className` interaktif.
   - Memberikan kelas styling konsisten (misal: `disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none`).
3. **Penyampaian Feedback Tooltip (UX Enhancement)**:
   - Menambahkan *Tooltip* penjelasan saat tombol di-hover dalam kondisi disabled, contoh:
     > *"Aksi ini tidak tersedia untuk peran Viewer"* atau *"Hanya Owner yang dapat mengelola anggota tim"*.

---

*Status Issue: Open / Proposed UX Improvement*
