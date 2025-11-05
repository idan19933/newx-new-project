-- 022_deactivate_metadata_questions.sql
-- Deactivate metadata questions that are not real math problems

-- Mark metadata questions as inactive
UPDATE question_bank
SET
    is_active = false,
    keywords =
        CASE
            WHEN keywords IS NULL THEN ARRAY['metadata']::TEXT[]
            WHEN NOT ('metadata' = ANY(keywords)) THEN array_append(keywords, 'metadata')
            ELSE keywords
            END,
    updated_at = NOW()
WHERE
    topic = 'כללי'
  AND (subtopic IS NULL OR subtopic = '')
  AND grade_level = 12
  AND (
    question_text ILIKE '%שאלון%'
        OR question_text ILIKE '%מועד%'
        OR question_text ILIKE '%בחינה%'
        OR question_text ILIKE '%תכנית%'
        OR question_text ILIKE '%כיתה נבחן%'
        OR question_text ILIKE '%מספר חלופי%'
        OR question_text ILIKE '%באיזו כיתה%'
        OR question_text ILIKE '%כמה שאלונים%'
        OR question_text ILIKE '%באיזו שנה%'
        OR question_text ILIKE '%מהו המספר החלופי%'
        OR question_text ILIKE '%האם היה מועד%'
    );

-- Log the changes
DO $$
DECLARE
deactivated_count INTEGER;
BEGIN
SELECT COUNT(*) INTO deactivated_count
FROM question_bank
WHERE
    is_active = false
  AND 'metadata' = ANY(keywords);

RAISE NOTICE '✅ Deactivated % metadata questions', deactivated_count;
END $$;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_question_bank_active_type
    ON question_bank(is_active, topic)
    WHERE is_active = true;

-- Add comment
COMMENT ON COLUMN question_bank.is_active IS
'Active questions only. Metadata questions and invalid questions are marked as inactive.';