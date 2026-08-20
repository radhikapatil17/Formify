-- Migration: Add show_placeholder column to fields table
-- Safe to run multiple times (IF NOT EXISTS)

ALTER TABLE fields ADD COLUMN IF NOT EXISTS show_placeholder BOOLEAN DEFAULT TRUE;
UPDATE fields SET show_placeholder = TRUE WHERE show_placeholder IS NULL;
