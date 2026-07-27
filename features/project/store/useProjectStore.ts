import { create } from "zustand";
import type {
  Project,
  UserRole,
  TeamMemberItem,
  MapFeatureExportData,
  CoordinateMode,
  CloudSaveStatus,
} from "../types/project.types";

export type SidebarTab = "layers" | "attribute" | "team" | "utm";

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
  selectedPdfFeatureId: null,
};

export const useProjectStore = create<ProjectState>((set) => ({
  ...initialStoreState,

  setProjectId: (id) => set({ projectId: id }),

  setProjectData: (project, currentRole, members) =>
    set({ project, currentRole, members }),

  setMapFeatures: (features) =>
    set({ mapFeatures: features }),

  addMapFeature: (feature) =>
    set((state) => ({
      mapFeatures: [...state.mapFeatures, feature],
      saveStatus: "unsaved",
      isDirty: true,
    })),

  updateMapFeature: (id, updated) =>
    set((state) => ({
      mapFeatures: state.mapFeatures.map((f) =>
        f.id === id ? { ...f, ...updated } : f
      ),
      saveStatus: "unsaved",
      isDirty: true,
    })),

  deleteMapFeature: (id) =>
    set((state) => ({
      mapFeatures: state.mapFeatures.filter((f) => f.id !== id),
      deletedFeatureIds: [...state.deletedFeatureIds, id],
      selectedFeatureId: state.selectedFeatureId === id ? null : state.selectedFeatureId,
      saveStatus: "unsaved",
      isDirty: true,
    })),

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

  setSelectedPdfFeatureId: (selectedPdfFeatureId) => set({ selectedPdfFeatureId }),

  clearDeletedFeatureIds: () => set({ deletedFeatureIds: [] }),

  resetStore: () => set({ ...initialStoreState }),
}));
