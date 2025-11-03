-- db/migrations/016_fix_israeli_sources_schema.sql
-- Fix Israeli Sources Schema and Question Cache

-- ==================== FIX QUESTION_CACHE TABLE ====================
-- Add missing columns to question_cache
DO $$
BEGIN
    -- Add question column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'question_cache' AND column_name = 'question'
    ) THEN
ALTER TABLE question_cache ADD COLUMN question TEXT NOT NULL DEFAULT 'temp';
-- Remove default after adding
ALTER TABLE question_cache ALTER COLUMN question DROP DEFAULT;
END IF;

    -- Add correct_answer column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'question_cache' AND column_name = 'correct_answer'
    ) THEN
ALTER TABLE question_cache ADD COLUMN correct_answer TEXT;
END IF;

    -- Add topic column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'question_cache' AND column_name = 'topic'
    ) THEN
ALTER TABLE question_cache ADD COLUMN topic VARCHAR(100);
END IF;

    -- Add subtopic column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'question_cache' AND column_name = 'subtopic'
    ) THEN
ALTER TABLE question_cache ADD COLUMN subtopic VARCHAR(100);
END IF;

    -- Add difficulty column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'question_cache' AND column_name = 'difficulty'
    ) THEN
ALTER TABLE question_cache ADD COLUMN difficulty VARCHAR(20) DEFAULT 'medium';
END IF;

    -- Add hints column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'question_cache' AND column_name = 'hints'
    ) THEN
ALTER TABLE question_cache ADD COLUMN hints JSONB;
END IF;

    -- Add explanation column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'question_cache' AND column_name = 'explanation'
    ) THEN
ALTER TABLE question_cache ADD COLUMN explanation TEXT;
END IF;

    -- Add source column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'question_cache' AND column_name = 'source'
    ) THEN
ALTER TABLE question_cache ADD COLUMN source VARCHAR(50);
END IF;

    -- Add metadata column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'question_cache' AND column_name = 'metadata'
    ) THEN
ALTER TABLE question_cache ADD COLUMN metadata JSONB;
END IF;

    -- Add created_at column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'question_cache' AND column_name = 'created_at'
    ) THEN
ALTER TABLE question_cache ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
END IF;
END $$;

-- ==================== FIX SCRAPING_SOURCES TABLE ====================
DO $$
BEGIN
    -- Add unique constraint on url if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'scraping_sources_url_key'
    ) THEN
ALTER TABLE scraping_sources ADD CONSTRAINT scraping_sources_url_key UNIQUE (url);
END IF;

    -- Ensure last_scraped column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scraping_sources' AND column_name = 'last_scraped'
    ) THEN
ALTER TABLE scraping_sources ADD COLUMN last_scraped TIMESTAMP;
END IF;
END $$;

-- ==================== FIX SCRAPING_LOGS TABLE ====================
DO $$
BEGIN
    -- Add items_found column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scraping_logs' AND column_name = 'items_found'
    ) THEN
ALTER TABLE scraping_logs ADD COLUMN items_found INTEGER DEFAULT 0;
END IF;

    -- Add items_saved column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scraping_logs' AND column_name = 'items_saved'
    ) THEN
ALTER TABLE scraping_logs ADD COLUMN items_saved INTEGER DEFAULT 0;
END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scraping_logs' AND column_name = 'created_at'
    ) THEN
ALTER TABLE scraping_logs ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
END IF;

    -- Rename old columns if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scraping_logs' AND column_name = 'items_scraped'
    ) THEN
        -- Copy data to items_found
UPDATE scraping_logs SET items_found = items_scraped WHERE items_found IS NULL;
-- Drop old column
ALTER TABLE scraping_logs DROP COLUMN items_scraped;
END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scraping_logs' AND column_name = 'scraped_at'
    ) THEN
        -- Copy data to created_at
UPDATE scraping_logs SET created_at = scraped_at WHERE created_at IS NULL;
-- Drop old column
ALTER TABLE scraping_logs DROP COLUMN scraped_at;
END IF;
END $$;

-- ==================== ADD INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_scraping_sources_url ON scraping_sources(url);
CREATE INDEX IF NOT EXISTS idx_scraping_logs_source_created ON scraping_logs(source_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_cache_source ON question_cache(source);
CREATE INDEX IF NOT EXISTS idx_question_cache_question ON question_cache(question);

COMMIT;