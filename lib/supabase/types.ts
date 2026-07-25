export type UserRole = 'owner' | 'editor' | 'viewer';
export type SubscriptionTier = 'free' | 'pro';
export type FeatureType = 'Polygon' | 'Polyline' | 'Marker' | 'Circle' | 'Rectangle';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: SubscriptionTier;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  center_lat?: number;
  center_lng?: number;
  zoom_level?: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  owner?: Profile;
  members_count?: number;
  my_role?: UserRole;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  profile?: Profile;
}

export interface MapFeatureRecord {
  id: string;
  project_id: string;
  layer_name: string;
  feature_type: FeatureType;
  geometry: any; // GeoJSON Geometry Object (Feature/Geometry)
  properties: Record<string, any>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}
