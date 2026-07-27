# 📋 [ISSUE] Refactoring & Modular Breakdown Komponen `MapCanvas.tsx`

## 📌 Deskripsi Issue

Komponen [`MapCanvas.tsx`](file:///e:/Personal/Website/showcases/geovertex/features/project/components/MapCanvas.tsx) saat ini berukuran **1.206 baris kode** dalam 1 file tunggal. Hal ini menyulitkan pemeliharaan kode (*maintainability*), pengujian, dan pembacaan alur program.

Berdasarkan aturan arsitektur pada [`ARCHITECTURE.md`](file:///e:/Personal/Website/showcases/geovertex/ARCHITECTURE.md):
- Batasan komponen UI modular idealnya berkisar **50 – 100 baris per file**.
- Logika non-UI (Leaflet map lifecycle, Geoman event listeners, kalkulasi pengukuran spasial, sinkronisasi GeoJSON) **WAJIB** diekstrak ke dalam **Custom Hooks** di `features/project/hooks/`.
- Fungsi pembantu mentah (*pure helper functions*) **WAJIB** berada di folder `utils/` atau `lib/gis`.
- Elemen UI independen (floating bar, basemap switcher, status bar) **WAJIB** dipecah menjadi **Sub-komponen Granular** di `features/project/components/MapCanvas/`.

> ⚠️ **PRINSIP UTAMA REFACTORING**:
> Refactoring ini bersifat **pure code breakdown** (memecah kode menjadi bagian-bagian kecil). **TIDAK ADA** perubahan tampilan visual, warna, layout, fitur, maupun penambahan/pengurangan fungsi. Setelah refactoring selesai, seluruh fungsionalitas aplikasi **HARUS BERJALAN 100% IDENTIK** seperti saat ini (*Zero Regression*).

---

## 🛠️ Rencana Struktur Pemecahan Kode (Breakdown Architecture)

```
features/project/
├── types/
│   └── mapCanvas.types.ts           # Interfase props, hover coords, measurement types
├── constants/
│   └── mapLayers.config.ts          # Definisi konstan BASE_LAYERS (OSM, Satellite, Carto, Topo)
├── utils/
│   └── leafletHelpers.ts            # Helper getFlatLatLngs, formatters, & marker SVG generator
├── hooks/
│   ├── useMapCanvasInit.ts          # Custom Hook: Inisialisasi map Leaflet & TileLayer lifecycle
│   ├── useMapDrawEvents.ts          # Custom Hook: Geoman control & drawing/editing listeners
│   ├── useMapMeasurements.ts        # Custom Hook: Kalkulasi & rendering label pengukuran (live & focused)
│   └── useMapLayerSync.ts           # Custom Hook: Sync GeoJSON external ke Leaflet & fitBounds logic
└── components/
    ├── MapCanvas.tsx                # Clean Main Container (Orchestrator component < 100 baris)
    └── MapCanvas/                   # Folder sub-komponen granular UI
        ├── MapBaseLayerSwitcher.tsx # Floating switcher basemap tile layer
        ├── MapUtmToolbar.tsx        # Floating toolbar UTM Converter & instruksi menggambar
        ├── MapCoordinateBar.tsx     # Floating status bar koordinat kursor & toggle mode (UTM/LatLng)
        └── MapContextMenu.tsx       # Context menu klik-kanan "Salin Koordinat"
```

---

## 🧩 Detail Pemisahan & Responsibilitas Layer

### 1. `features/project/types/mapCanvas.types.ts`
- `MapContainerProps`: Interface props untuk `MapCanvas`.
- `LatLngCoords`: Interface `{ lat: number; lng: number }`.
- `BaseLayerConfig`: Interface konfigurasi tile layer.

### 2. `features/project/constants/mapLayers.config.ts`
- Ekstrak konstanta `BASE_LAYERS` (OSM, Esri Satellite, CartoDB Dark, CartoDB Light, OpenTopoMap).

### 3. `features/project/utils/leafletHelpers.ts`
- `getFlatLatLngs(latlngs)`: Rekursif flattening LatLng array dari geometri Leaflet.
- `createCustomPinIcon(color)`: Dynamic SVG Pin Marker generator untuk point features.
- `formatSegmentDist(meters)`: Formatter jarak segmen (m / km).

### 4. Custom Hooks (`features/project/hooks/`)
- **`useMapCanvasInit`**:
  - Inisialisasi `L.map`, `zoomControl`, `geojsonGroupRef`, `measurementGroupRef`, `focusedMeasurementGroupRef`, dan `tileLayer`.
  - Handle cleanup `map.remove()`.
- **`useMapDrawEvents`**:
  - Setup Geoman controls (`map.pm.addControls`).
  - Handler event `pm:create`, `pm:remove`, `pm:drawstart`, `pm:drawend`, `pm:workinglayercreated`, `pm:vertexadded`, `pm:vertexremoved`.
  - Event listener kursor `mousemove`, `mouseout`, `contextmenu`, `click`.
- **`useMapMeasurements`**:
  - `updateDrawingMeasurements(mouseLatLng)`: Label pengukuran saat sedang menggambar.
  - `updateFocusedMeasurementsForLayer(layer)`: Label panjang setiap sisi pada geometri yang dipilih.
  - Clear measurement groups (`clearDrawingMeasurements`, `clearFocusedMeasurements`).
- **`useMapLayerSync`**:
  - Synchronize `geoJsonData` prop dari React state ke canvas Leaflet.
  - Binding popup interaktif pada tiap layer (Tombol PDF, Edit, Hapus).
  - Handle `zoomToTrigger` (efek zoom dari item sidebar).
  - Handle auto-fit bounds (`fitBounds`) saat data pertama kali dimuat.

### 5. Sub-Komponen UI Granular (`features/project/components/MapCanvas/`)
- **`MapBaseLayerSwitcher.tsx`**:
  - Render floating button & menu dropdown pilihan Peta Dasar (OSM, Esri, Carto, Topo).
- **`MapUtmToolbar.tsx`**:
  - Render floating button **UTM Converter** & banner petunjuk pengoperasian canvas.
- **`MapCoordinateBar.tsx`**:
  - Render status bar koordinat kursor real-time (UTM atau Lat/Lng) beserta sakelar toggle format koordinat.
- **`MapContextMenu.tsx`**:
  - Wrapper `ContextMenu` Shadcn/UI untuk opsi klik-kanan "Salin Koordinat".

### 6. Main Component (`features/project/components/MapCanvas.tsx`)
- Komponen utama bersih yang menghubungkan refs, custom hooks, `UtmConverterDialog`, dan sub-komponen UI.
- Ukuran kode berkurang dari **1.206 baris** menjadi **< 100 baris**.

---

## 📑 Task List Eksekusi (Refactoring Checklist)

- [ ] **1. Buat File Type & Konstanta**
  - [ ] Create `features/project/types/mapCanvas.types.ts`
  - [ ] Create `features/project/constants/mapLayers.config.ts`

- [ ] **2. Buat File Utilitas Helper**
  - [ ] Create `features/project/utils/leafletHelpers.ts` (`getFlatLatLngs`, `createCustomPinIcon`, `formatSegmentDist`)

- [ ] **3. Ekstrak Custom Hooks Logika GIS & Leaflet**
  - [ ] Create `features/project/hooks/useMapCanvasInit.ts`
  - [ ] Create `features/project/hooks/useMapMeasurements.ts`
  - [ ] Create `features/project/hooks/useMapDrawEvents.ts`
  - [ ] Create `features/project/hooks/useMapLayerSync.ts`

- [ ] **4. Ekstrak Sub-Komponen UI Granular**
  - [ ] Create `features/project/components/MapCanvas/MapBaseLayerSwitcher.tsx`
  - [ ] Create `features/project/components/MapCanvas/MapUtmToolbar.tsx`
  - [ ] Create `features/project/components/MapCanvas/MapCoordinateBar.tsx`
  - [ ] Create `features/project/components/MapCanvas/MapContextMenu.tsx`

- [ ] **5. Restrukturisasi `MapCanvas.tsx` Utom**
  - [ ] Hubungkan seluruh Hooks & Sub-komponen di [`features/project/components/MapCanvas.tsx`](file:///e:/Personal/Website/showcases/geovertex/features/project/components/MapCanvas.tsx)
  - [ ] Pastikan file utama bersih, rapi, dan mudah dibaca (< 100 baris)

- [ ] **6. Validasi Fungsionalitas & Build (*Zero Regression*)**
  - [ ] Jalankan `npm run build` untuk memastikannya bebas error TypeScript & ESLint
  - [ ] Verifikasi interaktivitas menggambar (Geoman draw marker, line, polygon)
  - [ ] Verifikasi label ukuran jarak/luas saat menggambar & saat geometri diklik/dipilih
  - [ ] Verifikasi switcher basemap tile layer, UTM converter, dan toggle mode koordinat
  - [ ] Verifikasi popup interaktif (PDF export modal, edit atribut modal, hapus geometri)

---

*GeoVertex Refactoring Issue Document — Modular Code Breakdown Standard for `MapCanvas.tsx`*
