-- server/migrations/002_wrong_answers_tracking.sql
-- Wrong Answer Detection & Auto-Fix System
-- This enables the AI to detect and fix wrong stored answers

-- =====================================================
-- WRONG ANSWER LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS wrong_answer_log (
                                                id SERIAL PRIMARY KEY,
                                                question_id VARCHAR(255) UNIQUE,
    question_text TEXT NOT NULL,
    wrong_stored_answer TEXT NOT NULL,
    correct_calculated_answer TEXT NOT NULL,
    topic VARCHAR(255),
    subtopic VARCHAR(255),
    difficulty VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed BOOLEAN DEFAULT FALSE,
    reviewed_at TIMESTAMP,
    reviewed_by VARCHAR(255),
    notes TEXT,
    auto_fixed BOOLEAN DEFAULT FALSE,
    fix_applied_at TIMESTAMP
    );

-- Indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_wrong_answer_log_question_id ON wrong_answer_log(question_id);
CREATE INDEX IF NOT EXISTS idx_wrong_answer_log_reviewed ON wrong_answer_log(reviewed);
CREATE INDEX IF NOT EXISTS idx_wrong_answer_log_created_at ON wrong_answer_log(created_at);
CREATE INDEX IF NOT EXISTS idx_wrong_answer_log_topic ON wrong_answer_log(topic);

-- =====================================================
-- QUESTION FIXES LOG TABLE (Track all fixes)
-- =====================================================
CREATE TABLE IF NOT EXISTS question_fixes_log (
                                                  id SERIAL PRIMARY KEY,
                                                  question_id VARCHAR(255),
    old_answer TEXT,
    new_answer TEXT,
    reason TEXT,
    fixed_by VARCHAR(50) DEFAULT 'system',
    fixed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX IF NOT EXISTS idx_question_fixes_log_question_id ON question_fixes_log(question_id);
CREATE INDEX IF NOT EXISTS idx_question_fixes_log_fixed_at ON question_fixes_log(fixed_at);

-- =====================================================
-- ADD NEEDS_REVIEW COLUMN TO QUESTIONS TABLE
-- =====================================================
-- Add column to mark questions that need manual review
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'questions') THEN
ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_questions_needs_review ON questions(needs_review);

COMMENT ON COLUMN questions.needs_review IS 'Flagged by AI when stored answer is wrong';
END IF;
END $$;

-- =====================================================
-- ADD VERIFICATION METADATA TO QUESTIONS
-- =====================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'questions') THEN
ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS verification_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ai_confidence INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_questions_last_verified ON questions(last_verified_at);

COMMENT ON COLUMN questions.last_verified_at IS 'Last time AI verified this answer';
        COMMENT ON COLUMN questions.verification_count IS 'How many times this was verified';
        COMMENT ON COLUMN questions.ai_confidence IS 'AI confidence in answer (0-100)';
END IF;
END $$;

-- =====================================================
-- FUNCTION: AUTO-UPDATE REVIEWED TIMESTAMP
-- =====================================================
CREATE OR REPLACE FUNCTION update_reviewed_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reviewed = TRUE AND OLD.reviewed = FALSE THEN
        NEW.reviewed_at = CURRENT_TIMESTAMP;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
DROP TRIGGER IF EXISTS update_wrong_answer_reviewed ON wrong_answer_log;
CREATE TRIGGER update_wrong_answer_reviewed
    BEFORE UPDATE ON wrong_answer_log
    FOR EACH ROW
    EXECUTE FUNCTION update_reviewed_timestamp();

-- =====================================================
-- FUNCTION: LOG QUESTION FIX
-- =====================================================
CREATE OR REPLACE FUNCTION log_question_fix()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.correct_answer IS DISTINCT FROM NEW.correct_answer THEN
        INSERT INTO question_fixes_log (question_id, old_answer, new_answer, reason, fixed_by)
        VALUES (
            NEW.id,
            OLD.correct_answer,
            NEW.correct_answer,
            'Answer updated',
            COALESCE(current_setting('app.current_user', true), 'system')
        );
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to questions table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'questions') THEN
DROP TRIGGER IF EXISTS log_question_answer_change ON questions;
CREATE TRIGGER log_question_answer_change
    AFTER UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION log_question_fix();
END IF;
END $$;

-- =====================================================
-- VERIFICATION VIEWS (For Admin Dashboard)
-- =====================================================

-- View: Questions needing review
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

-- View: Recent fixes
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

-- View: Wrong answer statistics
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

-- =====================================================
-- GRANT PERMISSIONS (If using role-based access)
-- =====================================================
-- Uncomment if you have specific roles
-- GRANT SELECT, INSERT, UPDATE ON wrong_answer_log TO app_user;
-- GRANT SELECT, INSERT ON question_fixes_log TO app_user;
-- GRANT SELECT ON questions_needing_review TO admin_user;

-- =====================================================
-- HELPFUL QUERIES FOR DEBUGGING
-- =====================================================

-- Show all wrong answers that need review
-- SELECT * FROM questions_needing_review LIMIT 10;

-- Show recent fixes
-- SELECT * FROM recent_question_fixes LIMIT 10;

-- Show statistics by topic
-- SELECT * FROM wrong_answer_stats;

-- Find specific question that was flagged
-- SELECT * FROM wrong_answer_log WHERE question_id = 'your-question-id';

-- =====================================================
-- CLEANUP FUNCTION (Optional - for testing)
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_old_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS void AS $$
BEGIN
DELETE FROM wrong_answer_log
WHERE reviewed = TRUE
  AND reviewed_at < CURRENT_TIMESTAMP - (days_to_keep || ' days')::INTERVAL;

DELETE FROM question_fixes_log
WHERE fixed_at < CURRENT_TIMESTAMP - (days_to_keep || ' days')::INTERVAL;

RAISE NOTICE 'Cleaned up logs older than % days', days_to_keep;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INITIALIZATION
-- =====================================================
COMMENT ON TABLE wrong_answer_log IS 'Tracks questions where AI detected wrong stored answers';
COMMENT ON TABLE question_fixes_log IS 'Audit log of all question answer changes';

COMMIT;