-- ============================================================
-- IT Management System - Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'it_staff', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ASSETS & EQUIPMENT
-- ============================================================
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  asset_tag TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('laptop', 'desktop', 'monitor', 'keyboard', 'mouse', 'printer', 'phone', 'tablet', 'server', 'network', 'peripheral', 'other')),
  brand TEXT,
  model TEXT,
  serial_number TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'under_repair', 'retired', 'lost')),
  condition TEXT DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  purchase_date DATE,
  purchase_cost DECIMAL(10,2),
  warranty_expiry DATE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  location TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset history log
CREATE TABLE IF NOT EXISTS asset_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  from_user UUID REFERENCES profiles(id),
  to_user UUID REFERENCES profiles(id),
  notes TEXT,
  performed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- IT HELPDESK / TICKETS
-- ============================================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_number SERIAL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('hardware', 'software', 'network', 'account', 'email', 'printer', 'phone', 'other')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  related_asset UUID REFERENCES assets(id) ON DELETE SET NULL,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ticket comments
CREATE TABLE IF NOT EXISTS ticket_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  author UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SOFTWARE & LICENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS software_licenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  vendor TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('productivity', 'security', 'development', 'design', 'communication', 'erp', 'crm', 'cloud', 'other')),
  license_type TEXT NOT NULL CHECK (license_type IN ('perpetual', 'subscription', 'per_user', 'concurrent', 'open_source')),
  license_key TEXT,
  total_seats INTEGER,
  used_seats INTEGER DEFAULT 0,
  cost_per_seat DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'annual', 'one_time')),
  purchase_date DATE,
  renewal_date DATE,
  expiry_date DATE,
  vendor_contact TEXT,
  vendor_email TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- License assignments to users
CREATE TABLE IF NOT EXISTS license_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  license_id UUID REFERENCES software_licenses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id),
  UNIQUE(license_id, user_id)
);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE software_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_assignments ENABLE ROW LEVEL SECURITY;

-- Profiles: everyone can view, only self can update
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Assets: authenticated users can view, IT staff/admin can modify
CREATE POLICY "assets_select" ON assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "assets_insert" ON assets FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('it_staff', 'admin'))
);
CREATE POLICY "assets_update" ON assets FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('it_staff', 'admin'))
);

-- Asset history: readable by all authenticated
CREATE POLICY "asset_history_select" ON asset_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "asset_history_insert" ON asset_history FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('it_staff', 'admin'))
);

-- Tickets: employees see their own, IT staff/admin see all
CREATE POLICY "tickets_select_own" ON tickets FOR SELECT TO authenticated
  USING (submitted_by = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('it_staff', 'admin')
  ));
CREATE POLICY "tickets_insert" ON tickets FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid());
CREATE POLICY "tickets_update_staff" ON tickets FOR UPDATE TO authenticated
  USING (submitted_by = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('it_staff', 'admin')
  ));

-- Ticket comments: same as tickets
CREATE POLICY "comments_select" ON ticket_comments FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM tickets t WHERE t.id = ticket_id AND (
      t.submitted_by = auth.uid() OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('it_staff', 'admin'))
    ))
    AND (is_internal = FALSE OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('it_staff', 'admin')))
  );
CREATE POLICY "comments_insert" ON ticket_comments FOR INSERT TO authenticated
  WITH CHECK (author = auth.uid());

-- Software licenses: all can view, only IT/admin can modify
CREATE POLICY "licenses_select" ON software_licenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "licenses_insert" ON software_licenses FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('it_staff', 'admin'))
);
CREATE POLICY "licenses_update" ON software_licenses FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('it_staff', 'admin'))
);

-- License assignments
CREATE POLICY "license_assign_select" ON license_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "license_assign_insert" ON license_assignments FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('it_staff', 'admin'))
);
CREATE POLICY "license_assign_delete" ON license_assignments FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('it_staff', 'admin'))
);

-- ============================================================
-- FUNCTIONS & TRIGGERS (auto-update timestamps)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER licenses_updated_at BEFORE UPDATE ON software_licenses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-update used_seats on license_assignments
CREATE OR REPLACE FUNCTION sync_license_seats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE software_licenses
  SET used_seats = (SELECT COUNT(*) FROM license_assignments WHERE license_id = COALESCE(NEW.license_id, OLD.license_id))
  WHERE id = COALESCE(NEW.license_id, OLD.license_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_seats_insert AFTER INSERT ON license_assignments FOR EACH ROW EXECUTE FUNCTION sync_license_seats();
CREATE TRIGGER sync_seats_delete AFTER DELETE ON license_assignments FOR EACH ROW EXECUTE FUNCTION sync_license_seats();

-- ============================================================
-- SAMPLE DATA (optional - remove in production)
-- ============================================================
-- Insert a sample IT admin after first signup by updating role:
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
