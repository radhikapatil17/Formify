-- Migration: Add category column to forms table
-- Safe to run multiple times (IF NOT EXISTS)

ALTER TABLE forms ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'General';
UPDATE forms SET category = 'General' WHERE category IS NULL;
