import { create } from "zustand";
import type {
  Project,
  UserRole,
  TeamMemberItem,
  MapFeatureExportData,
  CoordinateMode,
  CloudSaveStatus,
} from "../types/project.types";
import { saveTempGpxToStorage, clearTempGpxFromStorage } from "../utils/gpxLocalStorage";

export type SidebarTab = "layers" | "drafts" | "settings";

export interface ProjectState {
  // Project & User Info
  projectId: string | null;
  project: Project | null;
  currentRole: UserRole;
  members: TeamMemberItem[];
  loading: boolean;

  // Features Data State
  mapFeatures: MapFeatureExportData[];
  selectedFeatureId: string | null;
  deletedFeatureIds: string[];

  // Sync / Cloud Engine State
  saveStatus: CloudSaveStatus;
  isAutoSaveEnabled: boolean;
  isDirty: boolean;

  // UI States
  isSidebarOpen: boolean;
  activeTab: SidebarTab;
  coordinateMode: CoordinateMode;
  zoomToTrigger: { id: string; time: number } | null;

  // Modal States
  isExportOpen: boolean;
  isShareOpen: boolean;
  isImportGpxOpen: boolean;
  selectedPdfFeatureId: string | null;

  // Actions
  setProjectId: (id: string) => void;
  setProjectData: (
    project: Project | null,
    role: UserRole,
    members: TeamMemberItem[]
  ) => void;
  setMapFeatures: (features: MapFeatureExportData[]) => void;
  addMapFeature: (feature: MapFeatureExportData) => void;
  updateMapFeature: (
    id: string,
    updated: Partial<MapFeatureExportData>
  ) => void;
  deleteMapFeature: (id: string) => void;

  // Temp GPX Features Actions
  addTempGpxFeatures: (newFeatures: MapFeatureExportData[]) => void;
  promoteTempFeature: (id: string) => void;
  promoteAllTempFeatures: () => void;
  removeTempFeature: (id: string) => void;
  clearAllTempFeatures: () => void;

  setSelectedFeatureId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setSaveStatus: (status: CloudSaveStatus) => void;
  toggleAutoSave: () => void;
  markDirty: () => void;
  clearDirty: () => void;
  setSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  toggleSidebar: () => void;
  setActiveTab: (tab: SidebarTab) => void;
  setCoordinateMode: (mode: CoordinateMode) => void;
  setZoomToTrigger: (trigger: { id: string; time: number } | null) => void;
  setIsExportOpen: (open: boolean) => void;
  setIsShareOpen: (open: boolean) => void;
  setIsImportGpxOpen: (open: boolean) => void;
  setSelectedPdfFeatureId: (id: string | null) => void;
  clearDeletedFeatureIds: () => void;
  resetStore: () => void;
}

const initialStoreState = {
  projectId: null,
  project: null,
  currentRole: "owner" as UserRole,
  members: [],
  loading: true,
  mapFeatures: [],
  selectedFeatureId: null,
  deletedFeatureIds: [],
  saveStatus: "synced" as CloudSaveStatus,
  isAutoSaveEnabled: true,
  isDirty: false,
  isSidebarOpen: true,
  activeTab: "layers" as SidebarTab,
  coordinateMode: "UTM" as CoordinateMode,
  zoomToTrigger: null,
  isExportOpen: false,
  isShareOpen: false,
  isImportGpxOpen: false,
  selectedPdfFeatureId: null,
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  ...initialStoreState,

  setProjectId: (id) => set({ projectId: id }),

  setProjectData: (project, currentRole, members) =>
    set({ project, currentRole, members }),

  setMapFeatures: (features) =>
    set({ mapFeatures: features }),

  addMapFeature: (feature) =>
    set((state) => {
      const nextFeatures = [...state.mapFeatures, feature];
      if (feature.isTemporary) {
        saveTempGpxToStorage(state.projectId, nextFeatures);
        return { mapFeatures: nextFeatures };
      }
      return {
        mapFeatures: nextFeatures,
        saveStatus: "unsaved",
        isDirty: true,
      };
    }),

  updateMapFeature: (id, updated) =>
    set((state) => {
      const nextFeatures = state.mapFeatures.map((f) =>
        f.id === id ? { ...f, ...updated } : f
      );
      const isTargetTemp = state.mapFeatures.find((f) => f.id === id)?.isTemporary;
      if (isTargetTemp) {
        saveTempGpxToStorage(state.projectId, nextFeatures);
        return { mapFeatures: nextFeatures };
      }
      return {
        mapFeatures: nextFeatures,
        saveStatus: "unsaved",
        isDirty: true,
      };
    }),

  deleteMapFeature: (id) =>
    set((state) => {
      const target = state.mapFeatures.find((f) => f.id === id);
      const nextFeatures = state.mapFeatures.filter((f) => f.id !== id);

      if (target?.isTemporary) {
        saveTempGpxToStorage(state.projectId, nextFeatures);
        return {
          mapFeatures: nextFeatures,
          selectedFeatureId: state.selectedFeatureId === id ? null : state.selectedFeatureId,
        };
      }

      return {
        mapFeatures: nextFeatures,
        deletedFeatureIds: [...state.deletedFeatureIds, id],
        selectedFeatureId: state.selectedFeatureId === id ? null : state.selectedFeatureId,
        saveStatus: "unsaved",
        isDirty: true,
      };
    }),

  addTempGpxFeatures: (newFeatures) =>
    set((state) => {
      const featMap = new Map<string, MapFeatureExportData>();
      state.mapFeatures.forEach((f) => featMap.set(f.id, f));

      newFeatures.forEach((f, idx) => {
        const isDuplicateId = featMap.has(f.id);
        const uniqueId = !f.id || isDuplicateId
          ? `temp-gpx-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 9)}`
          : f.id;
        const formatted: MapFeatureExportData = {
          ...f,
          id: uniqueId,
          isTemporary: true,
          properties: {
            ...f.properties,
            id: uniqueId,
            isTemporary: true,
          },
        };
        featMap.set(uniqueId, formatted);
      });

      const nextFeatures = Array.from(featMap.values());
      saveTempGpxToStorage(state.projectId, nextFeatures);
      return { mapFeatures: nextFeatures };
    }),

  promoteTempFeature: (id) =>
    set((state) => {
      const isUuid = id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      const permanentId = isUuid
        ? id
        : typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `f-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const nextFeatures = state.mapFeatures.map((f) => {
        if (f.id !== id) return f;
        const newColor = f.color === "#ef4444" || !f.color ? "#2563EB" : f.color;
        return {
          ...f,
          id: permanentId,
          color: newColor,
          isTemporary: false,
          properties: {
            ...f.properties,
            id: permanentId,
            color: newColor,
            isTemporary: false,
          },
        };
      });

      saveTempGpxToStorage(state.projectId, nextFeatures);
      return {
        mapFeatures: nextFeatures,
        selectedFeatureId: state.selectedFeatureId === id ? permanentId : state.selectedFeatureId,
        saveStatus: "unsaved",
        isDirty: true,
      };
    }),

  promoteAllTempFeatures: () =>
    set((state) => {
      const nextFeatures = state.mapFeatures.map((f) => {
        if (!f.isTemporary) return f;
        const isUuid = f.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(f.id);
        const permanentId = isUuid
          ? f.id
          : typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `f-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const newColor = f.color === "#ef4444" || !f.color ? "#2563EB" : f.color;
        return {
          ...f,
          id: permanentId,
          color: newColor,
          isTemporary: false,
          properties: {
            ...f.properties,
            id: permanentId,
            color: newColor,
            isTemporary: false,
          },
        };
      });

      clearTempGpxFromStorage(state.projectId);
      return {
        mapFeatures: nextFeatures,
        saveStatus: "unsaved",
        isDirty: true,
      };
    }),

  removeTempFeature: (id) =>
    set((state) => {
      const nextFeatures = state.mapFeatures.filter((f) => f.id !== id);
      saveTempGpxToStorage(state.projectId, nextFeatures);
      return {
        mapFeatures: nextFeatures,
        selectedFeatureId: state.selectedFeatureId === id ? null : state.selectedFeatureId,
      };
    }),

  clearAllTempFeatures: () =>
    set((state) => {
      const nextFeatures = state.mapFeatures.filter((f) => !f.isTemporary);
      clearTempGpxFromStorage(state.projectId);
      return {
        mapFeatures: nextFeatures,
        selectedFeatureId: state.mapFeatures.find((f) => f.id === state.selectedFeatureId)?.isTemporary
          ? null
          : state.selectedFeatureId,
      };
    }),

  setSelectedFeatureId: (id) => set({ selectedFeatureId: id }),

  setLoading: (loading) => set({ loading }),

  setSaveStatus: (saveStatus) => set({ saveStatus }),

  toggleAutoSave: () =>
    set((state) => ({ isAutoSaveEnabled: !state.isAutoSaveEnabled })),

  markDirty: () => set({ isDirty: true, saveStatus: "unsaved" }),

  clearDirty: () => set({ isDirty: false, saveStatus: "synced" }),

  setSidebarOpen: (open) =>
    set((state) => ({
      isSidebarOpen: typeof open === "function" ? open(state.isSidebarOpen) : open,
    })),

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setActiveTab: (activeTab) => set({ activeTab }),

  setCoordinateMode: (coordinateMode) => set({ coordinateMode }),

  setZoomToTrigger: (zoomToTrigger) => set({ zoomToTrigger }),

  setIsExportOpen: (isExportOpen) => set({ isExportOpen }),

  setIsShareOpen: (isShareOpen) => set({ isShareOpen }),

  setIsImportGpxOpen: (isImportGpxOpen) => set({ isImportGpxOpen }),

  setSelectedPdfFeatureId: (selectedPdfFeatureId) => set({ selectedPdfFeatureId }),

  clearDeletedFeatureIds: () => set({ deletedFeatureIds: [] }),

  resetStore: () => set({ ...initialStoreState }),
}));

