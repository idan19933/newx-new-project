-- server/migrations/003_admin_student_management.sql

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

-- Missions Table
CREATE TABLE IF NOT EXISTS missions (
                                        id SERIAL PRIMARY KEY,
                                        user_id INTEGER NOT NULL,
                                        title TEXT NOT NULL,
                                        description TEXT,
                                        topic_id VARCHAR(255),
    type VARCHAR(50) DEFAULT 'practice',
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (type IN ('practice', 'lecture', 'review'))
    );

CREATE INDEX IF NOT EXISTS idx_missions_user_id ON missions(user_id);
CREATE INDEX IF NOT EXISTS idx_missions_type ON missions(type);
CREATE INDEX IF NOT EXISTS idx_missions_completed ON missions(completed);
CREATE INDEX IF NOT EXISTS idx_missions_user_type ON missions(user_id, type);

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

-- Triggers
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

CREATE OR REPLACE FUNCTION update_missions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_missions_updated_at ON missions;
CREATE TRIGGER trigger_missions_updated_at
    BEFORE UPDATE ON missions
    FOR EACH ROW
    EXECUTE FUNCTION update_missions_timestamp();