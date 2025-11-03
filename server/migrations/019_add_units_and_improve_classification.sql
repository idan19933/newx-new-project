-- Migration: Add units column and improve question classification
-- Description: Support 3, 4, 5 units classification for high school math

BEGIN;

-- Add units column to question_bank
ALTER TABLE question_bank
    ADD COLUMN IF NOT EXISTS units INTEGER CHECK (units IN (3, 4, 5));

-- Add comment
COMMENT ON COLUMN question_bank.units IS 'Math units level (3, 4, or 5) for grades 10-12';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_question_bank_units
    ON question_bank(units) WHERE units IS NOT NULL;

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_question_bank_grade_units_difficulty
    ON question_bank(grade_level, units, difficulty)
    WHERE is_active = true;

-- Add composite index for topic-based queries
CREATE INDEX IF NOT EXISTS idx_question_bank_topic_subtopic_grade
    ON question_bank(topic, subtopic, grade_level)
    WHERE is_active = true;

COMMIT;