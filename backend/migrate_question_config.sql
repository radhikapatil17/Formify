-- Migration: Add question configuration columns to fields and field_options tables
-- Safe to run multiple times (IF NOT EXISTS)

-- ── fields table: General settings ───────────────────────────────────────────
ALTER TABLE fields ADD COLUMN IF NOT EXISTS help_text TEXT;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS is_read_only BOOLEAN DEFAULT FALSE;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS default_value TEXT;

-- ── fields table: Display settings ───────────────────────────────────────────
ALTER TABLE fields ADD COLUMN IF NOT EXISTS width VARCHAR DEFAULT 'full';
ALTER TABLE fields ADD COLUMN IF NOT EXISTS label_position VARCHAR DEFAULT 'top';

-- ── fields table: Validation settings ────────────────────────────────────────
ALTER TABLE fields ADD COLUMN IF NOT EXISTS min_length INTEGER;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS max_length INTEGER;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS regex_pattern VARCHAR;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS validation_message VARCHAR;

-- ── fields table: Choice field settings ──────────────────────────────────────
ALTER TABLE fields ADD COLUMN IF NOT EXISTS shuffle_options BOOLEAN DEFAULT FALSE;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS allow_other BOOLEAN DEFAULT FALSE;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS allow_multiple BOOLEAN DEFAULT FALSE;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS max_selections INTEGER;

-- ── fields table: File / Image upload settings ────────────────────────────────
ALTER TABLE fields ADD COLUMN IF NOT EXISTS allowed_file_types VARCHAR;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS max_file_size_mb INTEGER;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS max_files INTEGER DEFAULT 1;

-- ── field_options table: Order column ────────────────────────────────────────
ALTER TABLE field_options ADD COLUMN IF NOT EXISTS option_order INTEGER DEFAULT 0;

-- Set sensible defaults for existing rows
UPDATE fields SET is_read_only = FALSE WHERE is_read_only IS NULL;
UPDATE fields SET is_hidden = FALSE WHERE is_hidden IS NULL;
UPDATE fields SET shuffle_options = FALSE WHERE shuffle_options IS NULL;
UPDATE fields SET allow_other = FALSE WHERE allow_other IS NULL;
UPDATE fields SET allow_multiple = FALSE WHERE allow_multiple IS NULL;
UPDATE fields SET max_files = 1 WHERE max_files IS NULL;
UPDATE fields SET width = 'full' WHERE width IS NULL;
UPDATE fields SET label_position = 'top' WHERE label_position IS NULL;
UPDATE field_options SET option_order = 0 WHERE option_order IS NULL;
