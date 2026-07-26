# 📘 Product Requirement Document (PRD)
## GeoVertex SaaS — Collaborative GIS Platform (V2.1 - Direct Project & Selective PDF Export)

---

## 1. 📌 Informasi Dokumen & Ringkasan Eksekutif

| Parameter | Detail |
| :--- | :--- |
| **Nama Produk** | **GeoVertex SaaS** |
| **Versi PRD** | 2.1 (Revisi Direct Project & Ekspor Spasial Global vs PDF Selektif) |
| **Status Dokumen** | Approved & Ready for Execution |
| **Platform Target** | Web Application (Desktop & Mobile Responsive) |
| **Core Architecture** | Next.js 15 (App Router), Supabase (PostGIS + Auth), Leaflet/Geoman, jsPDF |

### 🎯 Pernyataan Masalah (*Problem Statement*)
Pada pemetaan pertanahan dan GIS wilayah, satu proyek (misal: area satu Kecamatan) memuat banyak bidang tanah (Desa/Persil). Pengguna membutuhkan struktur yang sederhana **langsung ke level Project** tanpa kerumitan layer Workspace. Selain itu, untuk ekspor **Data Spasial Digital** (GeoJSON, GPX, KML, CSV) pengguna ingin dapat mengekspor **seluruh bidang sekaligus**, sedangkan untuk **Laporan PDF Kartografi** harus bersifat **selektif per bidang terpilih** (dipilih dari sidebar atau diklik di peta).

### 💡 Solusi Produk (*Product Solution*)
Mengembangkan **GeoVertex SaaS** dengan hirarki sederhana:
- **Project**: Wilayah pemetaan utama yang langsung dikelola oleh pengguna (misal: Kecamatan / Area Kawasan).
- **Bidang (Polygon Feature)**: Sub-wilayah di dalam proyek (Desa / Persil Lahan).

Metode Ekspor Fleksibel:
1. **Ekspor Data Spasial Digital (GeoJSON, GPX, KML, CSV)**: Dapat mengekspor **seluruh bidang** dalam proyek secara sekaligus.
2. **Laporan PDF Kartografi**: Ekspor khusus secara **selektif per bidang terpilih** (dengan memilih di sidebar atau mengklik polygon bidang pada peta).

---

## 2. 🏗️ Model Hirarki Data Spasial Simple

```
[ 📁 PROJECT ]  ➔  Wilayah Kerja Utama (Misal: Kecamatan Cibinong)
       │
       ├── [ 🔷 BIDANG 1 ] ➔ Desa / Persil A (Batas, Luas, & Vertex)
       ├── [ 🔷 BIDANG 2 ] ➔ Desa / Persil B (Batas, Luas, & Vertex)
       └── [ 🔷 BIDANG 3 ] ➔ Desa / Persil C (Batas, Luas, & Vertex)
```

---

## 3. 🛠️ Tech Stack & Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GEOVERTEX SAAS STACK                              │
└─────────────────────────────────────────────────────────────────────────────┘
  [Frontend]  : Next.js 15 (App Router) + React 19 + Tailwind CSS v4 + Shadcn UI
  [GIS Engine]: Leaflet.js + Geoman IO + Turf.js
  [Backend]   : Supabase Cloud (PostgreSQL + PostGIS Spatial Extension)
  [Auth]      : Supabase Auth (Google OAuth 2.0 & Mode Pengembang Offline)
  [PDF Engine]: jsPDF + jsPDF-AutoTable (Selective Parcel UTM Cartographic PDF)
  [Security]  : Row Level Security (RLS) pada PostgreSQL
```

---

## 4. 🚀 Kebutuhan Fitur Fungsional (Functional Requirements)

### 🌐 Modul 0: Landing Page Utama (`/`)
- **F0.1 Hero Section**: Tagline *"Collaborative GIS Digitizing & Map Reporting Platform in the Cloud"*.
- **F0.2 Live Interactive Sandbox Demo (Tanpa Login)**: Kanvas peta langsung di halaman muka untuk mencoba menggambar bidang tanah.
- **F0.3 Feature Showcase & Comparison**: Menyoroti keunggulan dibanding GIS Desktop tradisional (QGIS/AutoCAD).
- **F0.4 Pricing Section**: Transparansi paket **Free Tier** vs **Pro Tier**.

---

### 🔑 Modul 1: Authentication & User Profile
- **F1.1 Google OAuth 2.0 Login**: Registrasi & masuk 1-klik via Google Account.
- **F1.2 Developer Offline Fallback**: Pengujian lokal tanpa perlu login cloud (`process.env.NODE_ENV !== 'production'`).
- **F1.3 Session Persistence**: Supabase Auth SSR Cookies.

---

### 📁 Modul 2: Direct Project Management (Level Proyek / Kecamatan)
- **F2.1 Dashboard Proyek (`/dashboard`)**: Menampilkan seluruh proyek pemetaan (Kecamatan) langsung milik pengguna.
- **F2.2 Management Proyek**: Create, Rename, Duplicate, & Delete Project.
- **F2.3 Multi-Bidang Layer System**: Satu proyek mendukung banyak bidang (Desa/Persil Lahan) dengan warna dan atribut berbeda.
- **F2.4 Cloud Auto-Save Engine**: Perubahan geometri bidang disimpan otomatis ke Supabase (debounced 3 detik).

---

### 🗺️ Modul 3: GIS Digitizing & Interactive Canvas (`/project/[id]`)
- **F3.1 Digitizing Toolbar (Geoman)**: Menggambar Polygon Bidang, Polyline Jalan, Marker Waypoint, dan Edit Vertex.
- **F3.2 Live UTM & Lat/Lng Switcher**: Toggle instan format koordinat (Lat/Lng ↔ UTM Easting/Northing Zone).
- **F3.3 Interactive Vertex Table Inspector**: Sidebar tabel koordinat titik sudut (*vertex*) untuk setiap bidang.
- **F3.4 Geometric Measurement Metrics**: Kalkulasi otomatis Luas Bidang ($m^2$, Ha, $km^2$), Keliling, dan Centroid.

---

### 🎯 Modul 4: Seleksi Bidang Interaktif (Feature Polygon Selection)
- **F4.1 Seleksi via Sidebar Checklist**:
  - Di sidebar panel layer, setiap Bidang (Desa/Persil) memiliki checkbox seleksi.
  - Pengguna dapat mencentang 1 bidang spesifik atau beberapa bidang.
- **F4.2 Seleksi via Klik Bidang pada Peta**:
  - Mengklik polygon bidang langsung di kanvas peta akan menyoroti (*highlight*) bidang tersebut.
  - Menampilkan popup interaktif: **"Pilih Bidang Ini untuk Cetak PDF"**.
- **F4.3 Visual Highlight Selection**:
  - Bidang yang sedang dipilih untuk cetak PDF akan mendapatkan garis batas (*glowing outline*) pembeda di peta.

---

### 📄 Modul 5: Export Engine Dual-Mode (Global Spasial & PDF Selektif)

- **F5.1 Cartographic PDF Generator (Selektif Khusus Bidang Terpilih)**:
  - Laporan PDF Kartografi **khusus merender bidang yang dipilih** (dari sidebar atau klik peta).
  - Frame Peta otomatis memfokuskan (*auto-fit bounds*) pada bidang terpilih dengan **UTM Grid Border ($X/Y$)**.
  - Jarum Arah Utara (North Arrow), Skala Bar, dan Legenda Peta menyesuaikan bidang terpilih.
  - **Halaman Tabel Koordinat Vertex**: Menampilkan daftar titik sudut (Point #, Easting, Northing, Lat, Lng) milik bidang terpilih.

- **F5.2 Ekspor Data Spasial Digital Global (Seluruh Bidang)**:
  - **GeoJSON (.geojson)**: Mengekspor **seluruh bidang** dalam proyek sekaligus (atau opsi bidang terpilih).
  - **GPX (.gpx)**: Mengkonversi **seluruh bidang** menjadi track/route GPS.
  - **KML (.kml)**: Mengekspor **seluruh bidang** untuk Google Earth.
  - **CSV Vertex Table (.csv)**: Tabel koordinat titik sudut **seluruh bidang** di dalam proyek.

---

### 👥 Modul 6: Team Collaboration (RBAC) & Freemium Limits
- **F6.1 Role-Based Access Control (RBAC)**:
  - **Owner**: Akses penuh (kelola tim, hapus proyek, ubah role).
  - **Editor**: Menggambar bidang, mengedit vertex, memilih & mengekspor data.
  - **Viewer**: Read-only (hanya melihat bidang dan mengekspor PDF/Data).
- **F6.2 Freemium Quota Limits**:
  - **Free Tier**: Maksimal 3 Proyek aktif, 2 Anggota tim per proyek, PDF dengan watermark.
  - **Pro Tier**: Proyek tanpa batas, anggota tim tanpa batas, PDF tanpa watermark resolusi tinggi.

---

## 5. 🗄️ Skema Database (PostgreSQL + PostGIS ERD)

```sql
-- 1. TABEL PROFIL PENGGUNA
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL PROYEK (LANGSUNG PROYEK / LEVEL KECAMATAN)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL KOLABORASI TIM
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- 4. TABEL BIDANG / FEATURE SPASIAL (DESA / PERSIL)
CREATE TABLE map_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  layer_name TEXT DEFAULT 'Bidang Lahan', -- Nama Desa / Nomor Persil
  feature_type TEXT NOT NULL, -- 'Polygon', 'Polyline', 'Marker', 'Circle', 'Rectangle'
  geometry GEOMETRY(Geometry, 4326) NOT NULL, -- PostGIS WGS84 Geometry
  properties JSONB DEFAULT '{}'::jsonb, -- Simpan areaSqm, perimeterMeters, color
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. 🔒 Keamanan Data (Row Level Security - RLS)

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_features ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS: Pengguna hanya dapat mengakses proyek jika Owner atau Member
CREATE POLICY "Users can view assigned projects" ON projects
FOR SELECT USING (
  auth.uid() = owner_id OR 
  EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_members.project_id = projects.id 
    AND project_members.user_id = auth.uid()
  )
);
```

---

## 7. 🗓️ Roadmap Implementasi Ekspor Dual-Mode

### 🟢 Fase 1: Sistem Seleksi Bidang untuk PDF (Est. 1 Hari)
1. Tambahkan state `selectedPdfFeatureId` pada editor `app/project/[id]/page.tsx`.
2. Tambahkan tombol / radio seleksi bidang di `Sidebar.tsx` dan popup klik polygon di `MapContainer.tsx`.

### 🔵 Fase 2: Selective PDF Exporter & Global Spatial Exporter (Est. 1 Hari)
1. Perbarui `lib/export/pdfExporter.ts` untuk memfokuskan PDF Kartografi secara selektif pada bidang terpilih.
2. Perbarui `lib/export/gisExporter.ts` agar mendukung ekspor **seluruh bidang spasial sekaligus** ke GeoJSON, GPX, KML, dan CSV.

---

## 8. ✅ Kriteria Kelayakan (Acceptance Criteria)

- [ ] Aplikasi berjalan langsung di level **Project** tanpa perantara layer Workspace.
- [ ] Ekspor Data Spasial Digital (GeoJSON, GPX, KML, CSV) mengunduh **seluruh bidang** di dalam proyek.
- [ ] Pengguna dapat memilih 1 bidang spesifik di sidebar atau dengan mengklik polygon di peta untuk dicetak ke PDF.
- [ ] Ekspor PDF Kartografi memfokuskan skala peta (*fit bounds*) dan merender **UTM Grid Border** serta **Tabel Vertex** khusus untuk bidang terpilih tersebut.

---

&copy; {new Date().getFullYear()} GeoVertex SaaS Platform — Product Requirement Document V2.1.
