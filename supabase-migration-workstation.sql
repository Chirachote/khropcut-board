-- Migration: Add workstation column to technicians
-- Stores which workstation (1-6) this editor is assigned to
-- Run in Supabase SQL Editor

ALTER TABLE technicians
  ADD COLUMN IF NOT EXISTS workstation INTEGER CHECK (workstation BETWEEN 1 AND 7);
-- 1-6 = regular workstations, 7 = CEO desk
