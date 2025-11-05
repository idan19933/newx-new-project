-- 025_fix_admin_columns.sql
-- Add missing columns for admin exam upload system

-- Fix exam_uploads table
ALTER TABLE exam_uploads
    ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;

-- Fix question_bank table
ALTER TABLE question_bank
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_question_metadata ON question_bank USING gin(metadata);

-- Update existing records
UPDATE exam_uploads
SET processed_at = uploaded_at
WHERE processed_at IS NULL;