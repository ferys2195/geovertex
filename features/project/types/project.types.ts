import type { Project, UserRole } from "@/lib/supabase/types";
import type { MapFeatureExportData } from "@/lib/export/pdfExporter";
import type { CoordinateMode, GisFeatureProperties } from "@/lib/types";

export type { Project, UserRole, MapFeatureExportData, CoordinateMode, GisFeatureProperties };

export interface TeamMemberItem {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  avatar_url?: string;
}

export type CloudSaveStatus = "synced" | "saving" | "unsaved";
