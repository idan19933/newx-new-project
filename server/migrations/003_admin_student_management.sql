-- server/migrations/003_admin_student_management.sql
-- CORRECTED VERSION - Without missions table (will be created by 029/030)

-- Admin Messages Table
CREATE TABLE IF NOT EXISTS admin_messages (
                                              id SERIAL PRIMARY KEY,
                                              user_id INTEGER NOT NULL,
                                              message TEXT NOT NULL,
                                              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                              UNIQUE(user_id)
    );

CREATE INDEX IF NOT EXISTS idx_admin_messages_user_id ON admin_messages(user_id);

-- ============================================================
-- NOTE: missions table REMOVED from here!
-- It will be created by migrations 029/030 as "student_missions"
-- ============================================================

-- User Stats Table
CREATE TABLE IF NOT EXISTS user_stats (
                                          id SERIAL PRIMARY KEY,
                                          user_id INTEGER NOT NULL UNIQUE,
                                          questions_answered INTEGER DEFAULT 0,
                                          correct_answers INTEGER DEFAULT 0,
                                          streak INTEGER DEFAULT 0,
                                          practice_time INTEGER DEFAULT 0,
                                          last_activity TIMESTAMP,
                                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- Triggers for admin_messages
CREATE OR REPLACE FUNCTION update_admin_messages_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_admin_messages_updated_at ON admin_messages;
CREATE TRIGGER trigger_admin_messages_updated_at
    BEFORE UPDATE ON admin_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_messages_timestamp();

-- ============================================================
-- missions triggers REMOVED - will be created by 029/030
-- ============================================================

SELECT 'Admin student management migration completed (without missions table)' as status;