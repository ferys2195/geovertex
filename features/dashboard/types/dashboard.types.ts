import type { Project, Profile } from "@/lib/supabase/types";

export interface DashboardState {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  projects: Project[];
  loading: boolean;
  searchQuery: string;
}

export interface CreateProjectFormData {
  title: string;
  description: string;
}
