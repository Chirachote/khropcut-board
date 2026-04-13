-- KhropCut Production Board — Supabase Schema
-- Run this in the Supabase SQL Editor

-- ─────────────────────────────────────────────
-- TECHNICIANS TABLE (dynamic team management)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS technicians (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#00aaff',
  avatar TEXT NOT NULL DEFAULT '🎬',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users read technicians"   ON technicians FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users insert technicians" ON technicians FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth users update technicians" ON technicians FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users delete technicians" ON technicians FOR DELETE USING (auth.role() = 'authenticated');

-- Default team
INSERT INTO technicians (name, color, avatar, sort_order) VALUES
  ('อั้ม',  '#ff6b9d', '👩‍💻', 1),
  ('เบน',   '#00aaff', '👨‍🎬', 2),
  ('แพรว',  '#00ff41', '👩‍🎨', 3),
  ('ปี๊ก',  '#ffd700', '🎧',   4),
  ('ดริ้ง', '#ff6b35', '🎬',   5),
  ('เบส',   '#b06bff', '🖥️',  6)
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────
-- JOBS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Video Edit',
  technician TEXT NOT NULL,
  deadline DATE,
  client TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users read jobs"   ON jobs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users insert jobs" ON jobs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth users update jobs" ON jobs FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users delete jobs" ON jobs FOR DELETE USING (auth.role() = 'authenticated');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Sample jobs (optional)
INSERT INTO jobs (title, type, technician, deadline, client, status) VALUES
  ('MV บิลลี่ - สุดท้าย',       'Video Edit',      'อั้ม',  CURRENT_DATE + 3,  'Genie Records', 'in-progress'),
  ('Color Grade EP.12 รายการ X', 'Color Grade',     'เบน',   CURRENT_DATE + 5,  'PPTV',          'pending'),
  ('Motion Graphic Opening',     'Motion Graphics', 'แพรว',  CURRENT_DATE + 2,  'True CJ',       'review'),
  ('Short Form TikTok Pack',     'Short Form',      'ปี๊ก',  CURRENT_DATE + 7,  'Brand A',       'pending'),
  ('Sound Mix Documentary',      'Sound Mix',       'ดริ้ง', CURRENT_DATE + 10, 'GDH',           'in-progress'),
  ('Thumbnail Series',           'Thumbnail',       'เบส',   CURRENT_DATE + 1,  'YouTube Channel','in-progress');
