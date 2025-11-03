-- Migration: Add source_metadata column to question_bank
-- File: 018_add_source_metadata_to_question_bank.sql

-- Add source_metadata column if it doesn't exist
ALTER TABLE question_bank
    ADD COLUMN IF NOT EXISTS source_metadata JSONB;

-- Add index for faster queries on source_metadata
CREATE INDEX IF NOT EXISTS idx_question_bank_source_metadata
    ON question_bank USING gin(source_metadata);

-- Add comment
COMMENT ON COLUMN question_bank.source_metadata IS 'Metadata about the source (e.g., Israeli source info, extraction details)';

-- Verify column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'question_bank'
  AND column_name = 'source_metadata';