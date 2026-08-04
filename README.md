# GeoVertex 🌍 (Public Beta V1.0)

> **Collaborative GIS & Spatial Digitizing SaaS Platform**  
> *Cloud-native land parcel digitizing, millimeter-precision vertex editing, real-time UTM conversion, and official cartographic PDF report generation.*

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=flat-square&logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostGIS-emerald?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Status](https://img.shields.io/badge/Status-Public_Beta_V1.0-amber?style=flat-square)](#)

---

## 🌟 About GeoVertex

**GeoVertex** is a modern web-based geospatial mapping SaaS platform designed specifically for **GIS Specialists, Field Surveyors, Land Drafters, and Spatial Consulting Teams**.

Built to eliminate the need for heavy desktop GIS software installations (such as QGIS or AutoCAD), GeoVertex empowers you to digitize land polygons and paths, inspect vertex coordinates with millimeter precision, convert WGS84 Lat/Lng to UTM coordinates in real time, collaborate seamlessly with team members, and generate official cartographic PDF map reports instantly.

---

## ✨ Key Features

### 🎯 1. Precision Vertex Inspector
- Interactive vertex coordinate inspector table.
- Edit numerical coordinates ($X/Y$ or Lat/Lng) directly to fine-tune land boundary nodes with millimeter accuracy.

### 🗺️ 2. Interactive GIS Canvas & Multi-Basemap
- High-performance mapping engine optimized for 60 FPS vertex drag operations.
- Choose between 4 Basemap Tile Layers: CartoDB Light, CartoDB Dark, OpenStreetMap, and Esri World Imagery (HD Satellite).
- Extended **Max Zoom support up to level 24**.

### ⚡ 3. Real-time UTM ↔ Lat/Lng Converter
- Instant coordinate conversion between **WGS84 (Latitude/Longitude)** and **UTM (Universal Transverse Mercator - Easting/Northing)**.
- Quick UTM input dialog to plot field surveyor boundary benchmarks directly onto the map canvas.

### 📄 4. Cartographic PDF Report Generator
- Export official scaled cartographic PDF map reports featuring:
  - **UTM Grid Border ($X/Y$)**
  - **North Arrow Compass**
  - **Map Legend**
  - **Official Vertex Coordinate Table Page**

### 💾 5. Cloud Auto-Save (Supabase PostGIS)
- Automatic spatial geometry saving directly to a cloud Supabase PostGIS database.
- Standard OGC spatial format handling (`Polygon`, `LineString`, `Point`).

### 👥 6. Collaborative Team Workspace & RBAC
- Invite team members to projects with granular access controls:
  - **Owner**: Full project control and member management.
  - **Editor**: Can draw, edit, and modify spatial geometries.
  - **Viewer**: Read-only mode for sharing preview links with clients.

### 📥 7. Multi-Format GIS Exporter & Importer
- Import and export popular spatial file formats: **GeoJSON**, **Garmin GPX**, **Google Earth KML**, and **CSV Vertex Table**.

---

## 🛠️ Tech Stack

- **Frontend Framework**: [Next.js 16 (App Router)](https://nextjs.org/) & [React 19](https://react.dev/)
- **Database & Spatial Cloud**: [Supabase](https://supabase.com/) (PostgreSQL + PostGIS Extension)
- **Map & Drawing Engine**: [Leaflet](https://leafletjs.com/) & [@geoman-io/leaflet-geoman-free](https://geoman.io/)
- **Styling & UI**: [Tailwind CSS v4](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/), & [Lucide Icons](https://lucide.dev/)
- **PDF Export Engine**: [jsPDF](https://github.com/parallax/jsPDF) & [html2canvas](https://html2canvas.hertzen.com/)
- **UTM Engine**: Custom WGS84-UTM Transverse Mercator Projection Math

---

## 🚀 Quick Start

### Prerequisites
- Node.js `v18.0.0` or higher.
- A [Supabase](https://supabase.com) account (optional if using local offline demo mode).

### Local Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ferys2195/geovertex.git
   cd geovertex
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Add your Supabase project credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Run the local development server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

---

## 📚 Complete Documentation Guides

- 🧪 **[DEV_GUIDE.md](./DEV_GUIDE.md)** — Offline local development and testing guide.
- ☁️ **[DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)** — Step-by-step Supabase PostGIS setup & Vercel production deployment guide.
- 📋 **[geovertex_saas_prd.md](./geovertex_saas_prd.md)** — Product Requirements Document (PRD).

---

## ☕ Support & Donation

GeoVertex is 100% free to use for spatial mapping, parcel digitizing, and cartographic PDF exports without watermarks or feature limits. If GeoVertex helps your daily workflow, consider supporting its development:

- 🇮🇩 **[Trakteer.id](https://trakteer.id/ferys2195)** (GoPay, OVO, Dana, QRIS)
- 🇮🇩 **[Saweria.co](https://saweria.co/ferys2195)** (All Payment QRIS)

---

## 👤 Author & Developer

Created with ❤️ by **[Fery Irawan](https://feryirawan.com)**

- Website: [https://feryirawan.com](https://feryirawan.com)
- GitHub: [@ferys2195](https://github.com/ferys2195)

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).
