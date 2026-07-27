# 📋 [ISSUE / PLAN] Refactoring Features/Project: Logic Hooks & Zustand Store (Strict UI Preservation)

## 📌 Ringkasan Refactoring

Fokus utama refactoring pada modul `features/project` adalah:
1. **Mengekstrak Pengelolaan State ke Zustand Store**: Memusatkan state aplikasi (`project`, `members`, `mapFeatures`, `saveStatus`, modal states, selection) ke dalam Zustand store (`useProjectStore.ts`).
2. **Mengekstrak Business Logic ke Custom Hooks**: Memindahkan data fetching Supabase, cloud auto-saving, dan GIS math ke custom hooks (`useProjectInit`, `useAutoSave`, `useGisCalculations`).
3. **Strict UI Preservation (100% Tampilan Asli)**: **TIDAK MENGUBAH TAMPILAN VISUAL, STYLING TAILWIND, DAN MOUNTING KOMPONEN ASLI SAMA SEKALI**. Seluruh tata letak, card, badge, animasi, dan komponen UI tetap identik dengan versi awal.

---

## 🏗️ Struktur Modul `features/project`

```
features/project/
├── index.ts                            # Public API Fitur Project
├── types/
│   └── project.types.ts                # Type definitions & GIS Interfaces
├── store/                              # 🧠 TERPUSAT: State Management (Zustand)
│   └── useProjectStore.ts              # Store untuk Project, Features, Selection, UI & Save Status
├── hooks/                              # ⚙️ REUSABLE LOGIC (Custom Hooks)
│   ├── useProjectInit.ts               # Fetch data project, members, & features dari Supabase/Demo
│   ├── useAutoSave.ts                  # Auto-save engine (debounced 2s sync ke Supabase)
│   └── useGisCalculations.ts           # Kalkulasi GIS (Luas, Keliling, UTM Conversion)
└── components/                         # 🎨 UI COMPONENTS (Visual 100% Preserved)
    ├── ProjectEditorView.tsx           # Entry View Layout utama
    ├── EditorSidebar.tsx               # Sidebar dengan Quick Stats, Feature List, & Atribut (Persis Asli)
    ├── MapCanvas.tsx                   # Leaflet Map Canvas (Persis Asli)
    └── modals/                         # Reusable Modals & Dialogs
        ├── ExportModal.tsx             # Modal export (GeoJSON, KML, GPX, PDF)
        ├── ShareModal.tsx              # Modal invite & kelola tim
        └── UtmConverterDialog.tsx      # Standalone dialog konversi UTM
```

---

## 📑 Rencana Eksekusi Refactoring (Completed Task List)

- [x] **1. Setup State Management Terpusat dengan Zustand (`useProjectStore.ts`)**
- [x] **2. Ekstraksi Logic Data Fetching (`useProjectInit.ts`)**
- [x] **3. Ekstraksi Logic Auto-Save Cloud (`useAutoSave.ts`)**
- [x] **4. Ekstraksi Logic Spasial GIS (`useGisCalculations.ts`)**
- [x] **5. Strict Preservasi Tampilan Asli `EditorSidebar.tsx`, `MapCanvas.tsx`, & `ProjectEditorView.tsx`**
- [x] **6. Validation `npx tsc --noEmit` & `npm run build` (PASSED 100%)**
- [x] **7. Dokumentasi Arsitektur di `@/ARCHITECTURE.md`**

---

*GeoVertex Refactoring Issue Document — Strict UI Preservation Standard*
