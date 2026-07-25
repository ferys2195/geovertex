-- =====================================================================
-- GEOVERTEX SAAS — SUPABASE POSTGRESQL + POSTGIS DATABASE SCHEMA (V1.0)
-- =====================================================================

-- 1. Enable PostGIS Spatial Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Profiles Table (User Profile & Subscription Tier)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Projects Table (Mapping Projects)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Project Members Table (Team Collaboration & Roles)
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- 5. Map Features Table (Spatial PostGIS Geometries)
CREATE TABLE IF NOT EXISTS public.map_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  layer_name TEXT DEFAULT 'Default Layer',
  feature_type TEXT NOT NULL, -- 'Polygon', 'Polyline', 'Marker', 'Circle', 'Rectangle'
  geometry GEOMETRY(Geometry, 4326) NOT NULL, -- WGS84 GeoJSON / PostGIS Geometry
  properties JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_features ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Projects Policies
CREATE POLICY "Users can view projects they own or belong to"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM public.project_members 
      WHERE project_members.project_id = projects.id 
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects if under quota"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Project owners and editors can update projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM public.project_members 
      WHERE project_members.project_id = projects.id 
      AND project_members.user_id = auth.uid()
      AND project_members.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Project owners can delete projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Project Members Policies
CREATE POLICY "Project members can view fellow project members"
  ON public.project_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_members.project_id 
      AND (
        projects.owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.project_members pm 
          WHERE pm.project_id = projects.id AND pm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Project owners can manage team members"
  ON public.project_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_members.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- Map Features Policies
CREATE POLICY "Users can view features of accessible projects"
  ON public.map_features FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = map_features.project_id 
      AND (
        projects.owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.project_members 
          WHERE project_members.project_id = projects.id 
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Owners and editors can insert map features"
  ON public.map_features FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = map_features.project_id 
      AND (
        projects.owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.project_members 
          WHERE project_members.project_id = projects.id 
          AND project_members.user_id = auth.uid() 
          AND project_members.role IN ('owner', 'editor')
        )
      )
    )
  );

CREATE POLICY "Owners and editors can update map features"
  ON public.map_features FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = map_features.project_id 
      AND (
        projects.owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.project_members 
          WHERE project_members.project_id = projects.id 
          AND project_members.user_id = auth.uid() 
          AND project_members.role IN ('owner', 'editor')
        )
      )
    )
  );

CREATE POLICY "Owners and editors can delete map features"
  ON public.map_features FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = map_features.project_id 
      AND (
        projects.owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.project_members 
          WHERE project_members.project_id = projects.id 
          AND project_members.user_id = auth.uid() 
          AND project_members.role IN ('owner', 'editor')
        )
      )
    )
  );

-- =====================================================================
-- AUTOMATIC PROFILE TRIGGER ON SIGNUP
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
