-- db/migrations/016_fix_israeli_sources_schema.sql
-- Fix Israeli Sources Schema

-- Fix scraping_sources table
DO $$
BEGIN
    -- Add unique constraint on url if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'scraping_sources_url_key'
    ) THEN
ALTER TABLE scraping_sources ADD CONSTRAINT scraping_sources_url_key UNIQUE (url);
END IF;
END $$;

-- Fix scraping_logs table - rename columns to match code
DO $$
BEGIN
    -- Rename items_scraped to items_found if column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scraping_logs' AND column_name = 'items_scraped'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scraping_logs' AND column_name = 'items_found'
    ) THEN
ALTER TABLE scraping_logs RENAME COLUMN items_scraped TO items_found;
END IF;

    -- Add items_saved column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scraping_logs' AND column_name = 'items_saved'
    ) THEN
ALTER TABLE scraping_logs ADD COLUMN items_saved INTEGER DEFAULT 0;
END IF;

    -- Rename scraped_at to created_at if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scraping_logs' AND column_name = 'scraped_at'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scraping_logs' AND column_name = 'created_at'
    ) THEN
ALTER TABLE scraping_logs RENAME COLUMN scraped_at TO created_at;
END IF;
END $$;

-- Fix question_cache table - ensure correct column names
DO $$
BEGIN
    -- The table should already have 'question' column from 015 migration
    -- Just verify it exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'question_cache' AND column_name = 'question'
    ) THEN
        RAISE EXCEPTION 'question_cache table missing question column - migration 015 may have failed';
END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_scraping_sources_url ON scraping_sources(url);
CREATE INDEX IF NOT EXISTS idx_scraping_logs_source_created ON scraping_logs(source_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_cache_source ON question_cache(source);

COMMIT;