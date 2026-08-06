import type { MapFeatureExportData } from "../types/project.types";

const TEMP_GPX_KEY_PREFIX = "geovertex_gpx_temp_";

export function getTempGpxKey(projectId: string | null): string {
  return `${TEMP_GPX_KEY_PREFIX}${projectId || "default"}`;
}

export function loadTempGpxFromStorage(projectId: string | null): MapFeatureExportData[] {
  if (typeof window === "undefined") return [];
  try {
    const key = getTempGpxKey(projectId);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({ ...item, isTemporary: true }));
    }
    return [];
  } catch (err) {
    console.error("Gagal membaca temp GPX dari localStorage:", err);
    return [];
  }
}

export function saveTempGpxToStorage(
  projectId: string | null,
  features: MapFeatureExportData[]
): void {
  if (typeof window === "undefined") return;
  try {
    const key = getTempGpxKey(projectId);
    const tempFeatures = features.filter((f) => f.isTemporary);
    if (tempFeatures.length === 0) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(tempFeatures));
    }
  } catch (err) {
    console.error("Gagal menyimpan temp GPX ke localStorage:", err);
  }
}

export function clearTempGpxFromStorage(projectId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    const key = getTempGpxKey(projectId);
    localStorage.removeItem(key);
  } catch (err) {
    console.error("Gagal menghapus temp GPX dari localStorage:", err);
  }
}
