-- server/migrations/003_activate_question_tracking.sql
-- Activates question tracking features after questions table exists
-- This is a follow-up migration that runs after questions table is created

-- Check if questions table exists now
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'questions'
    ) THEN
        RAISE NOTICE '⚠️ Questions table still does not exist - skipping activation';
        RETURN;
END IF;

    RAISE NOTICE '✅ Questions table found - activating tracking features';

    -- Add columns if not already added
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'questions'
        AND column_name = 'needs_review'
    ) THEN
ALTER TABLE questions ADD COLUMN needs_review BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_questions_needs_review ON questions(needs_review);
END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'questions'
        AND column_name = 'last_verified_at'
    ) THEN
ALTER TABLE questions ADD COLUMN last_verified_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_questions_last_verified ON questions(last_verified_at);
END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'questions'
        AND column_name = 'verification_count'
    ) THEN
ALTER TABLE questions ADD COLUMN verification_count INTEGER DEFAULT 0;
END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'questions'
        AND column_name = 'ai_confidence'
    ) THEN
ALTER TABLE questions ADD COLUMN ai_confidence INTEGER DEFAULT 0;
END IF;

    -- Create trigger if not exists
    IF NOT EXISTS (
        SELECT FROM information_schema.triggers
        WHERE trigger_name = 'log_question_answer_change'
    ) THEN
CREATE TRIGGER log_question_answer_change
    AFTER UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION log_question_fix();
END IF;

    -- Create views
    CREATE OR REPLACE VIEW questions_needing_review AS
SELECT
    q.id,
    q.topic,
    q.subtopic,
    q.difficulty,
    q.correct_answer,
    w.correct_calculated_answer as suggested_answer,
    q.created_at,
    w.created_at as flagged_at,
    SUBSTRING(q.question, 1, 100) as question_preview
FROM questions q
         INNER JOIN wrong_answer_log w ON q.id = w.question_id
WHERE w.reviewed = FALSE
ORDER BY w.created_at DESC;

CREATE OR REPLACE VIEW recent_question_fixes AS
SELECT
    f.id,
    f.question_id,
    f.old_answer,
    f.new_answer,
    f.fixed_by,
    f.fixed_at,
    q.topic,
    q.difficulty
FROM question_fixes_log f
         LEFT JOIN questions q ON f.question_id = q.id
ORDER BY f.fixed_at DESC
    LIMIT 100;

CREATE OR REPLACE VIEW wrong_answer_stats AS
SELECT
    topic,
    difficulty,
    COUNT(*) as total_wrong_answers,
    COUNT(CASE WHEN reviewed = TRUE THEN 1 END) as reviewed_count,
    COUNT(CASE WHEN auto_fixed = TRUE THEN 1 END) as auto_fixed_count
FROM wrong_answer_log
GROUP BY topic, difficulty
ORDER BY total_wrong_answers DESC;

RAISE NOTICE '🎉 Question tracking fully activated!';
END $$;

COMMIT;