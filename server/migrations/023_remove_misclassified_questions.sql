-- 023_remove_misclassified_questions.sql
-- Remove Grade 12 questions that are actually Grade 8 content

-- Deactivate "משוואות לינאריות" from Grade 12
-- (These belong to Grade 8, not Grade 12!)
UPDATE question_bank
SET
    is_active = false,
    keywords =
        CASE
            WHEN keywords IS NULL THEN ARRAY['misclassified']::TEXT[]
            WHEN NOT ('misclassified' = ANY(keywords)) THEN array_append(keywords, 'misclassified')
            ELSE keywords
            END,
    updated_at = NOW()
WHERE
    grade_level = 12
  AND topic = 'אלגברה'
  AND subtopic = 'משוואות לינאריות'
  AND source = 'israeli_source'
  AND is_active = true;

-- Log the changes
DO $$
DECLARE
deactivated_count INTEGER;
BEGIN
SELECT COUNT(*) INTO deactivated_count
FROM question_bank
WHERE
    grade_level = 12
  AND topic = 'אלגברה'
  AND subtopic = 'משוואות לינאריות'
  AND is_active = false;

RAISE NOTICE '✅ Deactivated % misclassified Grade 12 "משוואות לינאריות" questions', deactivated_count;
    RAISE NOTICE '   (These are Grade 8 content, not Grade 12!)';
END $$;

-- Show remaining Grade 12 questions
DO $$
DECLARE
remaining_count INTEGER;
BEGIN
SELECT COUNT(*) INTO remaining_count
FROM question_bank
WHERE
    grade_level = 12
  AND source = 'israeli_source'
  AND is_active = true;

RAISE NOTICE '📊 Remaining active Grade 12 questions: %', remaining_count;
END $$;