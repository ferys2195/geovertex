# 📋 Issue & Proposal Technical Plan: Fitur Import & Open File GPX dengan Penyimpanan Temporer (Local Storage / In-Memory)

Dokumen ini berisi latar belakang, kebutuhan teknis, rancangan arsitektur data, serta rencana aksi implementasi untuk fitur **Import & Open File GPX** di GeoVertex. Sesuai dengan batasan utama, file GPX yang diimpor **tidak akan langsung disimpan ke database (Supabase)**, melainkan dikelola secara temporer (Local Storage / Temp State) di sisi client.

---

## 1. 📌 Latar Belakang & Tujuan (Objective)

### 1.1 Latar Belakang
Format **GPX (GPS Exchange Format)** merupakan standar yang sangat populer digunakan oleh perangkat GPS, smartwatch (Garmin, Suunto), dan aplikasi luar ruangan (Komoot, Strava, Wikiloc) untuk menyimpan data *Waypoints* (Titik), *Tracks* (Jalur/Garis), dan *Routes* (Rute).

Pengguna GeoVertex sering memerlukan kemampuan untuk:
* Membuka dan mendanaukan file `.gpx` untuk meninjau lintasan atau titik koordinat di atas canvas peta.
* Membandingkan data GPX lapangan dengan layer pemetaan yang sudah ada di proyek.
* Melakukan penyesuaian/inspeksi atribut tanpa harus serta-merta mengotori (*pollute*) database utama proyek dengan data mentah.

### 1.2 Tujuan Utama
1. **Dukungan Format GPX**: Memungkinkan pengguna melakukan *drag-and-drop* atau mengunggah file `.gpx` ke dalam editor GeoVertex.
2. **Penyimpanan Temporer (Temp Storage)**: Menyimpan data GPX di **Client-side Storage (Local Storage / Temp Zustand State)** tanpa melakukan panggilan API insert/upsert ke Supabase.
3. **Isolasi Engine Auto-Save**: Memastikan *Cloud Auto-Save Engine* (`useAutoSave`) mengecualikan (*bypass*) layer GPX temporer agar status sync database proyek tetap bersih (`synced`).
4. **Opsi Promosi / Komitmen (Opsional)**: Menyediakan opsi manual bagi pengguna jika sewaktu-waktu ingin mempromosikan data GPX temporer menjadi layer permanen di database proyek.

---

## 2. 🎯 Persyaratan Kunci & Batasan Sistem (Key Requirements)

> [!IMPORTANT]
> **HARD REQUIREMENT**: File GPX yang diimpor **DILARANG KERAS** dipersistensikan langsung ke database Supabase (`map_features` table) saat di-upload/dibuka.

1. **Zero Database Impact on Import**:
   - Proses parsing dan render file `.gpx` terjadi 100% di browser pengguna.
   - Tidak ada transaksi database Supabase yang dipicu saat membuka file GPX.
2. **Client-side Persistence (Local Storage Cache)**:
   - Data temporer disimpan di `localStorage` (atau IndexedDB) berdasar `projectId` / `sessionKey` agar data GPX tidak hilang saat halaman di-refresh.
   - Apabila proyek ditutup/ditinggalkan, data temp dapat disimulasikan sebagai *draft cache*.
3. **Indikator Visual Layer Temporer**:
   - Di *Sidebar Layer List*, layer hasil import GPX diberi badge/label khusus: **`[TEMP]`** atau **`Draft / Unsaved to Cloud`**.
   - Skema warna atau ikon layer membedakan antara layer permanen database dan layer temporer local storage.
4. **Kontrol Manual Pengguna**:
   - 🔘 **Tombol "Simpan ke Database"**: Memindahkan layer temporer menjadi layer permanen proyek (di-upload ke Supabase).
   - 🗑️ **Tombol "Hapus Layer Temporer"**: Membersihkan data temporer dari Local Storage & state aplikasi secara instan.

---

## 3. 🏗️ Rancangan Arsitektur & Alur Data (Data Flow & Storage)

### 3.1 Data Flow Diagram

```
[ File GPX (.gpx) ] 
        │
        ▼ (Upload / Drag & Drop)
[ Client Parser (togeojson / DOMParser) ]
        │
        ▼ (Konversi ke GeoJSON FeatureCollection)
[ Temporary Layer Processor ]
        │
        ├─────────────────────────────────────────┐
        ▼                                         ▼
[ Zustand State (mapFeatures / tempFeatures) ]   [ LocalStorage / Cache Client ]
        │                                         (Key: geovertex_temp_gpx_{projectId})
        ▼
[ Render di Map Canvas (Leaflet/Mapbox) ]
        │
        ❌ (Bypassed / Ignored)
[ AutoSave Engine (useAutoSave) ] ──❌──> [ Supabase DB (map_features) ]
```

### 3.2 Struktur Data Feature (`MapFeatureExportData`)

Menambahkan atribut penanda pada objek feature/layer:

```typescript
export interface MapFeatureExportData {
  id: string;
  name: string;
  type: 'Point' | 'LineString' | 'Polygon' | 'MultiLineString';
  coordinates: any;
  properties: Record<string, any>;
  
  // 🔹 Field Baru untuk Fitur Temporer
  isTemporary?: boolean;      // true = Hanya di LocalStorage/Temp, false = DB Supabase
  sourceFormat?: 'gpx' | 'geojson' | 'manual';
  importedAt?: string;
}
```

### 3.3 Penanganan Local Storage (`lib/storage/tempStorage.ts` / Hook `useGpxTempStorage`)

* **Storage Key Pattern**: `geovertex_gpx_temp_<PROJECT_ID>`
* **Mekanisme Sync**:
  1. Ketinggalan sesi / Refresh browser: Hook membaca `localStorage`, jika ada cache GPX temporer untuk `projectId` ini, otomatis dimuat ke canvas state dengan flag `isTemporary: true`.
  2. Tambah/Hapus GPX temp: Langsung meng-update `localStorage` tanpa menyentuh Supabase.
  3. Pembersihan: Saat pengguna memilih "Clear Temp Layers" atau proyek berhasil disimpan ke DB, cache `localStorage` dihapus.

---

## 4. 🎨 Perubahan UI/UX & Komponen

Berdasarkan `ARCHITECTURE.md` (Feature-based Architecture), seluruh perubahan diletakkan di dalam folder `features/project/`:

1. **Modal Import GPX (`ImportGpxModal.tsx`)**:
   - Lokasi: `features/project/components/modals/ImportGpxModal.tsx`
   - Area *drag-and-drop* file `.gpx`.
   - Opsi styling awal (Warna Garis, Ukuran Point, Nama Layer).
   - Label penjelas: *"Data GPX akan dibuka sebagai layer temporer dan disimpan di browser Anda (Local Storage)."*

2. **Pembaruan Layout Sidebar Editor (`EditorSidebar.tsx`)**:
   - Mengintegrasikan **Accordion / Collapsible Section** untuk memisahkan daftar layer secara terorganisir:
     - 📂 **Section 1: Database Layers (Permanen)**: Daftar feature/layer utama proyek yang tersinkronisasi ke Cloud Supabase.
     - 📂 **Section 2: Temporary GPX Layers (Local Storage)**: Section khusus accordion yang menampilkan daftar file GPX / feature temporer yang berhasil diimpor.
   - Komponen Baru / Sub-komponen Sidebar: `features/project/components/Sidebar/TempGpxAccordion.tsx`
   - **Fitur pada Accordion Layer Temporer**:
     - Status Header: Menampilkan jumlah file GPX / feature temporer yang aktif & indikator badge **`[LOCAL TEMP]`**.
     - Quick Batch Actions di Header Accordion:
       - 💾 *Simpan Semua ke DB* (Promosi batch seluruh temp layers menjadi permanen).
       - 🗑️ *Hapus Semua Temp* (Bersihkan cache Local Storage).
     - Item List Temporer (`SidebarTempItem.tsx`): Menampilkan nama file GPX, ikon geometri (Point/LineString), tombol zoom canvas, serta tombol aksi cepat *Persist* (Simpan ke DB) atau *Discard* (Hapus).

3. **Trigger Tombol Import (`ActionButtons.tsx` / `LayerQuickAdd.tsx`)**:
   - Menambahkan opsi **"Import File GPX"** pada menu header atau sidebar editor layer.

4. **Indikator Layer List (`SidebarFeatureItem.tsx` / `LayerItem.tsx`)**:
   - Menambahkan Badge **`TEMP`** / **`Draft`** pada layer temporer GPX.
   - Menambahkan *context menu* / tombol aksi:
     - 💾 *Simpan Permanen ke Cloud*
     - 🗑️ *Hapus dari Local Storage*

5. **Pembaruan AutoSave Engine (`hooks/useAutoSave.ts`)**:
   - Memfilter array `mapFeatures` sebelum mengirim payload update ke Supabase:
     ```typescript
     const permanentFeatures = mapFeatures.filter(f => !f.isTemporary);
     ```

---

## 5. 🛠️ Rencana Aksi Implementasi (Task Checklist)

### Phase 1: GPX Parser & Modular Utility (`utils/gpxParser.ts`)
- [ ] Buat utilitas parser file GPX (menggunakan `togeojson` atau native XML `DOMParser`).
- [ ] Konversi elemen GPX (`<wpt>`, `<trk>`, `<rte>`) menjadi format standar GeoJSON & `MapFeatureExportData`.
- [ ] Berikan penanda `isTemporary: true` dan `sourceFormat: 'gpx'` secara otomatis pada setiap feature hasil parse.

### Phase 2: Local Storage Manager & Hook State (`hooks/useGpxTemp.ts`)
- [ ] Buat helper / custom hook untuk mengelola pembacaan dan penulisan data GPX temporer ke `localStorage`.
- [ ] Integrasikan pembacaan cache GPX temporer saat `useProjectInit` melakukan loading proyek.

### Phase 3: Zustand Store Integration (`store/useProjectStore.ts`)
- [ ] Tambahkan aksi `addTempGpxFeatures(features: MapFeatureExportData[])` ke store.
- [ ] Pastikan penambahan feature temporer **TIDAK** mengubah `saveStatus` menjadi `"unsaved"` pada cloud auto-save engine, atau memisahkan state `tempFeatures`.

### Phase 4: Pembaruan Sidebar & Accordion Temp GPX (`EditorSidebar.tsx`)
- [ ] Buat komponen Accordion `TempGpxAccordion.tsx` di `features/project/components/Sidebar/`.
- [ ] Integrasikan Accordion ke dalam `EditorSidebar.tsx` untuk menampilkan daftar file GPX temporer terpisah dari layer database.
- [ ] Tambahkan tombol aksi batch (*Simpan Semua* & *Hapus Semua*) pada header accordion temporer.

### Phase 5: UI Komponen Import & Layer Badge (`components/modals/ImportGpxModal.tsx`)
- [ ] Buat UI modal `ImportGpxModal.tsx` dengan upload dropzone file `.gpx`.
- [ ] Tambahkan trigger modal di `ActionButtons.tsx` dan `Sidebar/LayerQuickAdd.tsx`.
- [ ] Update `SidebarFeatureItem.tsx` untuk menampilkan badge `[TEMP]` dan aksi "Simpan ke DB" / "Hapus Temp".

### Phase 6: Verification & Safety Filter
- [ ] Pastikan `useAutoSave.ts` dan fungsi sync database Supabase **TIDAK PERNAH** mengirim data berstatus `isTemporary: true` ke Supabase.
- [ ] Uji skenario refresh browser untuk memastikan data temp tersimpan di Local Storage.
- [ ] Uji skenario promosi layer temporer menjadi layer permanen Supabase.

---

## 6. 🧪 Rencana Pengujian & Verifikasi (Verification Plan)

### 6.1 Automated / Unit Test
- **GPX Parser Test**: Pengujian parsing file `.gpx` valid (Waypoint, Track, Route) dan error handling jika file corrupt.
- **AutoSave Exclusion Test**: Memastikan `isTemporary` features tidak masuk ke dalam payload save Supabase.

### 6.2 Manual Verification Checklist
1. **Import File GPX**: Unggah file `.gpx` (misal dari Strava/Garmin), pastikan lintasan/titik muncul di peta canvas.
2. **Database Integrity Check**: Buka DevTools Network Tab / Supabase Table Editor. Pastikan **TIDAK ADA** HTTP POST/PATCH/UPSERT ke tabel `map_features` setelah file GPX diimpor.
3. **Local Storage Cache Verification**:
   - Inspect `localStorage` di browser DevTools. Pastikan data GPX tersimpan di bawah key `geovertex_gpx_temp_<PROJECT_ID>`.
   - Refresh halaman browser, pastikan layer GPX tetap muncul di peta.
4. **Promosi Manual**: Klik tombol *"Simpan ke Database"* pada `LayerItem` temporer, pastikan data ter-upload ke Supabase dan badge `[TEMP]` hilang.

---

*Status Issue: Open / Ready for Review & Implementation*
