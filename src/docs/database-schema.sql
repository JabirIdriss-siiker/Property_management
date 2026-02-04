-- =============================================
-- ConciergeApp - PostgreSQL Database Schema
-- Optimized for Supabase & Industry Standards
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUM TYPES
-- =============================================

CREATE TYPE user_role AS ENUM ('admin', 'agent');
CREATE TYPE coffee_type AS ENUM ('none', 'nespresso', 'senseo', 'filter', 'other');
CREATE TYPE bag_status AS ENUM ('à_préparer', 'à_préparer_incomplet', 'prêt', 'sale', 'en_lavage');
CREATE TYPE mission_status AS ENUM ('à_faire', 'en_cours', 'terminée', 'annulée');
CREATE TYPE stock_category AS ENUM ('linge', 'consommable');

-- =============================================
-- PROFILES TABLE
-- =============================================
-- Linked to Supabase Auth via auth.users

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'agent',
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for performance
CREATE INDEX idx_profiles_auth_id ON public.profiles(auth_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- =============================================
-- STOCK_ITEMS TABLE
-- =============================================

CREATE TABLE public.stock_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category stock_category NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  alert_threshold INTEGER NOT NULL DEFAULT 5 CHECK (alert_threshold >= 0),
  unit VARCHAR(50) DEFAULT 'unité',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_stock_items_category ON public.stock_items(category);

-- =============================================
-- APARTMENTS TABLE
-- =============================================

CREATE TABLE public.apartments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  description TEXT,
  has_code_box BOOLEAN DEFAULT false,
  code_box VARCHAR(50),
  ical_link TEXT,
  ical_last_sync TIMESTAMPTZ,
  ical_sync_enabled BOOLEAN DEFAULT true,
  cleaning_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  bed_count INTEGER NOT NULL DEFAULT 1 CHECK (bed_count > 0),
  coffee_type coffee_type DEFAULT 'none',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_apartments_active ON public.apartments(is_active) WHERE is_active = true;

-- =============================================
-- BAGS TABLE
-- =============================================

CREATE TABLE public.bags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apartment_id UUID NOT NULL UNIQUE REFERENCES public.apartments(id) ON DELETE CASCADE,
  status bag_status NOT NULL DEFAULT 'à_préparer',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_bags_status ON public.bags(status);

-- =============================================
-- BAG_ITEMS TABLE (Junction)
-- =============================================

CREATE TABLE public.bag_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bag_id UUID NOT NULL REFERENCES public.bags(id) ON DELETE CASCADE,
  stock_item_id UUID NOT NULL REFERENCES public.stock_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(bag_id, stock_item_id)
);

CREATE INDEX idx_bag_items_bag_id ON public.bag_items(bag_id);

-- =============================================
-- RESERVATIONS TABLE
-- =============================================

CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apartment_id UUID NOT NULL REFERENCES public.apartments(id) ON DELETE CASCADE,
  ical_uid VARCHAR(500),
  summary VARCHAR(500),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  source VARCHAR(100),
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(apartment_id, ical_uid)
);

CREATE INDEX idx_reservations_dates ON public.reservations(check_in, check_out);

-- =============================================
-- MISSIONS TABLE
-- =============================================

CREATE TABLE public.missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apartment_id UUID NOT NULL REFERENCES public.apartments(id) ON DELETE CASCADE,
  bag_id UUID NOT NULL REFERENCES public.bags(id) ON DELETE RESTRICT,
  agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL DEFAULT '11:00',
  status mission_status NOT NULL DEFAULT 'à_faire',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  is_manual BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_missions_status ON public.missions(status);
CREATE INDEX idx_missions_scheduled_date ON public.missions(scheduled_date);

-- =============================================
-- HELPER FUNCTIONS (Industry Standards)
-- =============================================

-- Avoid RLS recursion by using a security definer function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT (role = 'admin')
    FROM public.profiles
    WHERE auth_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current profile ID
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id
    FROM public.profiles
    WHERE auth_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGERS & FUNCTIONS
-- =============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at to all tables
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('profiles', 'stock_items', 'apartments', 'bags', 'reservations', 'missions') LOOP
    EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
  END LOOP;
END;
$$;

-- Auto-create profile on Supabase Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (auth_id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'agent'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-create bag for apartment
CREATE OR REPLACE FUNCTION public.create_bag_for_apartment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.bags (apartment_id, status)
  VALUES (NEW.id, 'à_préparer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_bag_for_apartment
  AFTER INSERT ON public.apartments
  FOR EACH ROW EXECUTE FUNCTION public.create_bag_for_apartment();

-- Sync bag status on mission update
CREATE OR REPLACE FUNCTION public.sync_bag_status_on_mission_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'en_cours' AND OLD.status != 'en_cours' THEN
    UPDATE public.bags SET status = 'prêt' WHERE id = NEW.bag_id;
    NEW.started_at = NOW();
  ELSIF NEW.status = 'terminée' AND OLD.status != 'terminée' THEN
    UPDATE public.bags SET status = 'sale' WHERE id = NEW.bag_id;
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_bag_status_on_mission_update
  BEFORE UPDATE ON public.missions
  FOR EACH ROW EXECUTE FUNCTION public.sync_bag_status_on_mission_update();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bag_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

-- Profiles: Admin see all, Agent see self
CREATE POLICY profiles_admin_all ON public.profiles FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY profiles_self_read ON public.profiles FOR SELECT TO authenticated USING (auth_id = auth.uid());
CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE TO authenticated USING (auth_id = auth.uid());

-- Apartments: Admin full, Agent read
CREATE POLICY apartments_admin_all ON public.apartments FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY apartments_agent_read ON public.apartments FOR SELECT TO authenticated USING (true);

-- Bags & Bag Items: Admin full, Agent read
CREATE POLICY bags_admin_all ON public.bags FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY bags_agent_read ON public.bags FOR SELECT TO authenticated USING (true);
CREATE POLICY bag_items_admin_all ON public.bag_items FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY bag_items_agent_read ON public.bag_items FOR SELECT TO authenticated USING (true);

-- Stock: Admin full, Agent read
CREATE POLICY stock_admin_all ON public.stock_items FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY stock_agent_read ON public.stock_items FOR SELECT TO authenticated USING (true);

-- Reservations: Admin full, Agent read
CREATE POLICY reservations_admin_all ON public.reservations FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY reservations_agent_read ON public.reservations FOR SELECT TO authenticated USING (true);

-- Missions: Admin full, Agent read assigned, Agent update own
CREATE POLICY missions_admin_all ON public.missions FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY missions_agent_read ON public.missions FOR SELECT TO authenticated 
  USING (agent_id = public.get_my_profile_id());
CREATE POLICY missions_agent_update_own ON public.missions FOR UPDATE TO authenticated 
  USING (agent_id = public.get_my_profile_id())
  WITH CHECK (agent_id = public.get_my_profile_id());

-- =============================================
-- VIEWS
-- =============================================

CREATE OR REPLACE VIEW public.v_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM public.missions WHERE scheduled_date = CURRENT_DATE AND status != 'annulée') as missions_today,
  (SELECT COUNT(*) FROM public.bags WHERE status IN ('à_préparer', 'à_préparer_incomplet')) as bags_to_prepare,
  (SELECT COUNT(*) FROM public.stock_items WHERE quantity <= alert_threshold) as stock_alerts,
  (SELECT COUNT(*) FROM public.apartments WHERE is_active = true) as active_apartments;

CREATE OR REPLACE VIEW public.v_today_missions AS
SELECT 
  m.*,
  a.name as apartment_name,
  a.address as apartment_address,
  a.code_box,
  a.has_code_box,
  b.status as bag_status,
  p.name as agent_name
FROM public.missions m
JOIN public.apartments a ON a.id = m.apartment_id
JOIN public.bags b ON b.id = m.bag_id
LEFT JOIN public.profiles p ON p.id = m.agent_id
WHERE m.scheduled_date = CURRENT_DATE
ORDER BY m.scheduled_time;

-- =============================================
-- SAMPLE DATA
-- =============================================

INSERT INTO public.stock_items (name, category, quantity, alert_threshold) VALUES
  ('Parure Lit 140cm', 'linge', 15, 5),
  ('Parure Lit 160cm', 'linge', 8, 3),
  ('Serviette Bain', 'linge', 40, 10),
  ('Serviette Main', 'linge', 35, 10),
  ('Tapis de Bain', 'linge', 12, 4),
  ('Torchon', 'linge', 25, 5),
  ('Dosettes Nespresso', 'consommable', 150, 20),
  ('Dosettes Senseo', 'consommable', 20, 10),
  ('Papier Toilette', 'consommable', 60, 10),
  ('Sac Poubelle 30L', 'consommable', 100, 15)
ON CONFLICT DO NOTHING;

INSERT INTO public.apartments (name, address, has_code_box, code_box, cleaning_price, bed_count, coffee_type) VALUES
  ('Studio Marais', '12 Rue des Rosiers, 75004 Paris', true, '4567', 40, 1, 'nespresso'),
  ('Loft Bastille', '45 Rue de la Roquette, 75011 Paris', true, '8901', 60, 2, 'nespresso'),
  ('Appartement République', '10 Place de la République, 75010 Paris', true, '2345', 50, 1, 'senseo')
ON CONFLICT DO NOTHING;
