-- KhropCut Production Board — Supabase Schema
-- Run this in the Supabase SQL Editor

-- Jobs table
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

-- RLS (Row Level Security) — allow authenticated users full access
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read jobs"
  ON jobs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert jobs"
  ON jobs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update jobs"
  ON jobs FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete jobs"
  ON jobs FOR DELETE
  USING (auth.role() = 'authenticated');

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Sample data (optional)
INSERT INTO jobs (title, type, technician, deadline, client, status) VALUES
  ('MV บิลลี่ - สุดท้าย', 'Video Edit', 'อั้ม', CURRENT_DATE + 3, 'Genie Records', 'in-progress'),
  ('Color Grade EP.12 รายการ X', 'Color Grade', 'เบน', CURRENT_DATE + 5, 'PPTV', 'pending'),
  ('Motion Graphic Opening', 'Motion Graphics', 'แพรว', CURRENT_DATE + 2, 'True CJ', 'review'),
  ('Short Form TikTok Pack', 'Short Form', 'ปี๊ก', CURRENT_DATE + 7, 'Brand A', 'pending'),
  ('Sound Mix Documentary', 'Sound Mix', 'ดริ้ง', CURRENT_DATE + 10, 'GDH', 'in-progress'),
  ('Thumbnail Series', 'Thumbnail', 'เบส', CURRENT_DATE + 1, 'YouTube Channel', 'in-progress');
