CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

CREATE TYPE profile_type AS ENUM ('studio', 'pro', 'admin');
CREATE TYPE invitation_type AS ENUM ('studio', 'pro');
CREATE TYPE mission_status AS ENUM ('published', 'selecting', 'filled', 'completed', 'rated', 'expired', 'cancelled');
CREATE TYPE application_status AS ENUM ('pending', 'selected', 'rejected');
CREATE TYPE session_status AS ENUM ('confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE file_type AS ENUM ('reference', 'delivery');

CREATE TABLE profiles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  type profile_type NOT NULL,
  full_name text,
  avatar_url text,
  phone text,
  city text NOT NULL DEFAULT 'Paris',
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE studios (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  studio_name text NOT NULL,
  address text,
  arrondissement text,
  description text,
  photos text[] NOT NULL DEFAULT '{}',
  equipment text[] NOT NULL DEFAULT '{}',
  website text,
  instagram text,
  rating_avg numeric(3,2) NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE professionals (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  bio text,
  skills text[] NOT NULL DEFAULT '{}',
  instruments text[] NOT NULL DEFAULT '{}',
  genres text[] NOT NULL DEFAULT '{}',
  min_rate integer,
  portfolio_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_available boolean NOT NULL DEFAULT true,
  notification_prefs jsonb NOT NULL DEFAULT '{"skills":[],"genres":[],"min_rate":0}'::jsonb,
  rating_avg numeric(3,2) NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE invitations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  type invitation_type NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  used_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE missions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  title text NOT NULL,
  service_type text NOT NULL,
  artist_name text,
  is_confidential boolean NOT NULL DEFAULT false,
  genre text[] NOT NULL DEFAULT '{}',
  beat_type text,
  hours integer,
  rate integer,
  is_rate_negotiable boolean NOT NULL DEFAULT false,
  description text,
  work_language text NOT NULL DEFAULT 'Français',
  is_urgent boolean NOT NULL DEFAULT false,
  preferred_dates jsonb NOT NULL DEFAULT '[]'::jsonb,
  max_candidates integer,
  status mission_status NOT NULL DEFAULT 'published',
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE applications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  mission_id uuid NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  pro_id uuid NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  message varchar(280) NOT NULL,
  status application_status NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (mission_id, pro_id)
);

CREATE TABLE sessions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  mission_id uuid NOT NULL REFERENCES missions(id),
  studio_id uuid NOT NULL REFERENCES studios(id),
  pro_id uuid NOT NULL REFERENCES professionals(id),
  application_id uuid REFERENCES applications(id) ON DELETE RESTRICT,
  date date NOT NULL,
  time_start time NOT NULL,
  duration_hours numeric(4,2) NOT NULL,
  status session_status NOT NULL DEFAULT 'confirmed',
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE mission_files (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  mission_id uuid NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_type file_type NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL CHECK (file_size >= 0),
  mime_type text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  file_url text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE ratings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE RESTRICT,
  from_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score >= 1 AND score <= 5),
  comment text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (session_id, from_profile_id)
);

CREATE INDEX idx_missions_studio_id ON missions(studio_id);
CREATE INDEX idx_missions_status ON missions(status);
CREATE INDEX idx_missions_expires_at ON missions(expires_at);
CREATE INDEX idx_applications_mission_id ON applications(mission_id);
CREATE INDEX idx_applications_pro_id ON applications(pro_id);
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_sessions_studio_id ON sessions(studio_id);
CREATE INDEX idx_sessions_pro_id ON sessions(pro_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "studios_select_all" ON studios FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "studios_insert_own" ON studios FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "studios_update_own" ON studios FOR UPDATE USING (auth.uid() = profile_id);

ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "professionals_select_all" ON professionals FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "professionals_insert_own" ON professionals FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "professionals_update_own" ON professionals FOR UPDATE USING (auth.uid() = profile_id);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invitations_select_unused" ON invitations FOR SELECT USING (used_by IS NULL OR used_by = auth.uid());
CREATE POLICY "invitations_update_claim" ON invitations FOR UPDATE USING (used_by IS NULL) WITH CHECK (auth.uid() = used_by);

ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "missions_select_all" ON missions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "missions_insert_own_studio" ON missions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM studios WHERE studios.id = studio_id AND studios.profile_id = auth.uid())
);
CREATE POLICY "missions_update_own_studio" ON missions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM studios WHERE studios.id = studio_id AND studios.profile_id = auth.uid())
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applications_select_pro_own" ON applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM professionals WHERE professionals.id = pro_id AND professionals.profile_id = auth.uid())
);
CREATE POLICY "applications_select_studio_missions" ON applications FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM missions m
    JOIN studios s ON s.id = m.studio_id
    WHERE m.id = mission_id AND s.profile_id = auth.uid()
  )
);
CREATE POLICY "applications_insert_pro" ON applications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM professionals WHERE professionals.id = pro_id AND professionals.profile_id = auth.uid())
);
CREATE POLICY "applications_update_studio" ON applications FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM missions m
    JOIN studios s ON s.id = m.studio_id
    WHERE m.id = mission_id AND s.profile_id = auth.uid()
  )
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_select_parties" ON sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM studios WHERE studios.id = studio_id AND studios.profile_id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM professionals WHERE professionals.id = pro_id AND professionals.profile_id = auth.uid())
);

ALTER TABLE mission_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "files_reference_select" ON mission_files FOR SELECT USING (
  file_type = 'reference' AND (
    EXISTS (SELECT 1 FROM missions m JOIN studios s ON s.id = m.studio_id WHERE m.id = mission_id AND s.profile_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM applications a JOIN professionals p ON p.id = a.pro_id WHERE a.mission_id = mission_id AND p.profile_id = auth.uid())
  )
);
CREATE POLICY "files_delivery_select" ON mission_files FOR SELECT USING (
  file_type = 'delivery' AND (
    uploaded_by = auth.uid()
    OR
    EXISTS (SELECT 1 FROM sessions ss JOIN studios st ON st.id = ss.studio_id JOIN professionals pr ON pr.id = ss.pro_id WHERE ss.mission_id = mission_id AND (st.profile_id = auth.uid() OR pr.profile_id = auth.uid()))
  )
);
CREATE POLICY "files_insert_parties" ON mission_files FOR INSERT WITH CHECK (uploaded_by = auth.uid());

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_select_parties" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM sessions ss
    JOIN studios st ON st.id = ss.studio_id
    JOIN professionals pr ON pr.id = ss.pro_id
    WHERE ss.id = session_id AND (st.profile_id = auth.uid() OR pr.profile_id = auth.uid())
  )
);
CREATE POLICY "messages_insert_parties" ON messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM sessions ss
    JOIN studios st ON st.id = ss.studio_id
    JOIN professionals pr ON pr.id = ss.pro_id
    WHERE ss.id = session_id AND (st.profile_id = auth.uid() OR pr.profile_id = auth.uid())
  )
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ratings_select_all" ON ratings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "ratings_insert_parties" ON ratings FOR INSERT WITH CHECK (
  from_profile_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM sessions ss
    JOIN studios st ON st.id = ss.studio_id
    JOIN professionals pr ON pr.id = ss.pro_id
    WHERE ss.id = session_id AND (st.profile_id = auth.uid() OR pr.profile_id = auth.uid())
  )
);

SELECT cron.schedule(
  'expire-missions',
  '*/5 * * * *',
  $$UPDATE missions SET status = 'expired' WHERE expires_at < now() AND status = 'published'$$
);

-- À exécuter manuellement dans le Dashboard Supabase > Storage :
-- Bucket "avatars" : public = true
-- Bucket "mission-references" : public = false
-- Bucket "mission-deliveries" : public = false
