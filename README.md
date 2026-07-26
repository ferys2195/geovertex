# GeoVertex 🌍 (Public Beta V1.0)

> **Collaborative GIS & Spatial Digitizing SaaS Platform**  
> *Digitasi Peta Lahan, Edit Vertex Presisi, Konversi UTM Real-time, dan Generator Laporan PDF Kartografi Resmi di Cloud.*

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=flat-square&logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostGIS-emerald?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Status](https://img.shields.io/badge/Status-Public_Beta_V1.0-amber?style=flat-square)](#)

---

## 🌟 Tentan GeoVertex

**GeoVertex** adalah platform SaaS pemetaan spasial berbasis web modern yang dirancang khusus untuk **GIS Specialist, Surveyor Lapangan, Drafter Lahan, dan Tim Konsultan Pertanahan**. 

Dibangun tanpa perlu instalasi software desktop yang berat (seperti QGIS/AutoCAD), GeoVertex memungkinkan Anda menggambar polygon/jalur lahan, mengedit titik sudut (*vertex*) dengan presisi millimeter, mengkonversi koordinat Lat/Lng ↔ UTM secara real-time, berkolaborasi dengan tim, dan mencetak laporan peta PDF berskala kartografi instan.

---

## ✨ Fitur-Fitur Utama (Key Features)

### 🎯 1. Precision Vertex Inspector
- Tabel inspeksi titik sudut (*vertex*) interaktif.
- Edit koordinat angka ($X/Y$ atau Lat/Lng) secara langsung untuk menggeser posisi titik geometri lahan dengan presisi milimeter.

### 🗺️ 2. Interactive GIS Canvas & Multi-Basemap
- Engine peta interaktif berkinerja tinggi dengan optimasi pengeditan 60 FPS.
- Pilihan 4 *Basemap Tile Layer*: CartoDB Light, CartoDB Dark, OpenStreetMap, dan Esri World Imagery (Satelit HD).
- Dukungan *Max Zoom* hingga **level 24**.

### ⚡ 3. Real-time UTM ↔ Lat/Lng Converter
- Konversi koordinat instan antara **WGS84 (Latitude/Longitude)** dan **UTM (Universal Transverse Mercator - Easting/Northing)**.
- Form dialog konversi cepat untuk plot koordinat patok lapangan secara langsung ke kanvas peta.

### 📄 4. Cartographic PDF Report Generator
- Ekspor peta resmi berskala kartografi dengan:
  - **Border UTM Grid ($X/Y$)**
  - **Jarum Arah Utara (Compass)**
  - **Legenda Peta**
  - **Halaman Tabel Koordinat Vertex Resmi**

### 💾 5. Cloud Auto-Save (Supabase PostGIS)
- Penyimpanan data geometri spasial otomatis ke database cloud Supabase PostGIS.
- Penanganan format spasial standar OGC (`Polygon`, `LineString`, `Point`).

### 👥 6. Collaborative Team Workspace & RBAC
- Undang anggota tim ke dalam proyek dengan hak akses terkontrol:
  - **Owner**: Kontrol penuh proyek dan manajemen anggota.
  - **Editor**: Dapat menggambar dan mengedit geometri lahan.
  - **Viewer**: Mode baca saja (*read-only*) untuk dibagikan ke klien.

### 📥 7. Multi-Format GIS Exporter & Importer
- Ekspor & impor berkas spasial populer: **GeoJSON**, **GPX (Garmin)**, **KML (Google Earth)**, dan **CSV Vertex Table**.

---

## 🛠️ Tech Stack

- **Frontend Framework**: [Next.js 16 (App Router)](https://nextjs.org/) & [React 19](https://react.dev/)
- **Database & Cloud Spasial**: [Supabase](https://supabase.com/) (PostgreSQL + PostGIS Extension)
- **Map & Drawing Engine**: [Leaflet](https://leafletjs.com/) & [@geoman-io/leaflet-geoman-free](https://geoman.io/)
- **Styling & UI**: [Tailwind CSS v4](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/), & [Lucide Icons](https://lucide.dev/)
- **PDF Exporter Engine**: [jsPDF](https://github.com/parallax/jsPDF) & [html2canvas](https://html2canvas.hertzen.com/)
- **UTM Engine**: Custom WGS84-UTM Transverse Mercator Projection Math

---

## 🚀 Panduan Memulai (Quick Start)

### Prasyarat
- Node.js versi `v18.0.0` atau yang lebih baru.
- Akun [Supabase](https://supabase.com) (opsional jika menggunakan mode demo offline).

### Langkah Instalasi Lokal

1. **Clone repository ini**:
   ```bash
   git clone https://github.com/ferys2195/geovertex.git
   cd geovertex
   ```

2. **Install dependensi project**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables**:
   Salin file `.env.example` menjadi `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Isi variabel Supabase sesuai project Anda:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Jalankan server pengembangan lokal**:
   ```bash
   npm run dev
   ```
   Buka browser di `http://localhost:3000`.

---

## 📚 Panduan Dokumentasi Lengkap

- 🧪 **[DEV_GUIDE.md](./DEV_GUIDE.md)** — Panduan pengujian lokal offline tanpa perlu akun cloud.
- ☁️ **[DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)** — Langkah-langkah penyetelan database Supabase PostGIS & deployment Vercel Production.
- 📋 **[geovertex_saas_prd.md](./geovertex_saas_prd.md)** — Dokumen spesifikasi kebutuhan produk (PRD).

---

## 📄 Lisensi

Proyek ini dikembangkan secara terbuka di bawah lisensi [MIT License](./LICENSE).
