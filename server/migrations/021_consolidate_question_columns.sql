-- db/migrations/021_consolidate_question_columns.sql

-- Copy data from question_text to question (if question is empty)
DO $$
BEGIN
    -- If both columns exist, copy data
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'question_cache' AND column_name = 'question_text'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'question_cache' AND column_name = 'question'
    ) THEN
        -- Copy all non-null question_text values to question where question is null or 'temp'
UPDATE question_cache
SET question = question_text
WHERE (question IS NULL OR question = '' OR question = 'temp')
  AND question_text IS NOT NULL;

-- Drop the old question_text column
ALTER TABLE question_cache DROP COLUMN IF EXISTS question_text;

RAISE NOTICE 'Consolidated question_text into question column';
END IF;
END $$;

-- Ensure question column is NOT NULL
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'question_cache'
          AND column_name = 'question'
          AND is_nullable = 'YES'
    ) THEN
ALTER TABLE question_cache ALTER COLUMN question SET NOT NULL;
END IF;
END $$;

-- Update indexes
DROP INDEX IF EXISTS idx_question_cache_question_text;
CREATE INDEX IF NOT EXISTS idx_question_cache_question ON question_cache(question);

COMMIT;