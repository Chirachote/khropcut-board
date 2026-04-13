-- Migration: Add post_date column + update status constraint to include 'queued'
-- Run this in Supabase SQL Editor

-- 1. Add post_date column
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS post_date DATE;

-- 2. Drop old status check constraint (if exists) and add new one with 'queued'
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE jobs
  ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('queued', 'pending', 'in-progress', 'review', 'done', 'cancelled'));
