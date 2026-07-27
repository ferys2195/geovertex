# 📋 [ISSUE] Forced Dark Mode Only & Activity-Based Auto-Save Optimization

## 📌 Deskripsi Issue

Berdasarkan pengujian UI dan UX pada lingkungan Production & Lokal, terdapat 2 poin perbaikan krusial yang perlu diterapkan:

### 1. Forced Dark Mode Only & Removal of Theme Hotkey
- **Masalah**: Light Mode saat ini belum stabil secara visual pada komponen GIS dan berisiko membingungkan pengguna jika tema berubah tiba-tiba. Selain itu, shortcut tombol keyboard `"D"` secara tidak sengaja men-toggle tema saat pengguna sedang beraktivitas.
- **Solusi**: 
  - Tetapkan tema ke **Dark Mode Only** secara permanen pada `ThemeProvider` (`forcedTheme="dark"` / `defaultTheme="dark"`).
  - Hapus/nonaktifkan shortcut keyboard tombol `"D"` (`ThemeHotkey`) agar tidak mengganti tema secara tidak sengaja.
  - Pastikan seluruh variabel CSS dan elemen UI selalu konsisten bertema gelap di Production maupun Lokal.

### 2. Activity-Based Auto-Save Engine & Auto-Save Toggle
- **Masalah**: Mekanisme auto-save saat ini berjalan secara konstan meskipun tidak ada aktivitas baru di peta (*map canvas*), yang berpotensi memicu request berlebihan dan berdampak pada performa.
- **Solusi**:
  - **Activity/Dirty State Tracking**: Auto-save hanya akan terpicu ketika ada **aktivitas nyata pada peta** (misal: menggambar polygon, menggeser titik vertex, mengubah atribut bidang, atau menghapus geometri).
  - **Setting Toggle Auto-Save**: Tambahkan opsi sakelar (Toggle Switch) pada navbar status cloud untuk **Enable / Disable Auto-Save** sesuai kebutuhan pengguna.

---

## 🛠️ Rencana Perubahan Komponen

### A. Theme Management
1. **`components/providers/theme-provider.tsx`**:
   - Konfigurasi `forcedTheme="dark"`, `defaultTheme="dark"`.
   - Hapus komponen `ThemeHotkey` (listener tombol `"D"`).
2. **`app/layout.tsx`**:
   - Berikan `className="dark"` pada elemen `<html>` dan pastikan hydration berjalan tanpa warning.

### B. Auto-Save Optimization & Store Settings
1. **`features/project/store/useProjectStore.ts`**:
   - Tambahkan state `isAutoSaveEnabled: boolean` (default: `true`) dan action `toggleAutoSave()`.
   - Tambahkan state `isDirty: boolean` dan `markDirty()`, `clearDirty()`.
2. **`features/project/hooks/useAutoSave.ts`**:
   - Perbarui logika auto-save agar hanya mengeksekusi sinkronisasi Supabase jika `isAutoSaveEnabled === true` DAN `isDirty === true` (ada aktivitas baru di canvas peta).
   - Setelah sukses menyimpan ke Supabase, panggil `clearDirty()`.
3. **`features/project/components/ProjectEditorView.tsx`**:
   - Tambahkan kontrol UI **Toggle Auto-Save** pada navbar status cloud (samping status *Tersimpan di Cloud*).

---

## 📑 Task List Eksekusi

- [ ] **1. Terapkan Forced Dark Mode Only pada `theme-provider.tsx` & Hapus Hotkey Tombol "D"**
- [ ] **2. Tambahkan State `isAutoSaveEnabled` & `isDirty` pada `useProjectStore.ts`**
- [ ] **3. Perbarui Logic `useAutoSave.ts` (Hanya Save Jika Ada Aktivitas/Dirty)**
- [ ] **4. Tambahkan Tombol Sakelar Toggle Auto-Save pada Navbar `ProjectEditorView.tsx`**
- [ ] **5. Validasi Build Next.js (`npm run build`) & Uji Coba Performa**

---

*GeoVertex Issue Document — Forced Dark Mode & Smart Auto-Save Standard*
