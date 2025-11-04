-- server/migrations/003_question_history.sql
-- Track questions asked to prevent repeats - PostgreSQL Version

-- Create table WITHOUT inline indexes
CREATE TABLE IF NOT EXISTS question_history (
                                                id SERIAL PRIMARY KEY,
                                                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    firebase_uid VARCHAR(255) NOT NULL,
    topic_id VARCHAR(255),
    subtopic_id VARCHAR(255),
    question_text TEXT NOT NULL,
    question_hash VARCHAR(64) NOT NULL,
    difficulty VARCHAR(20),
    asked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Create indexes AFTER table creation (PostgreSQL way)
CREATE INDEX IF NOT EXISTS idx_question_history_user_time
    ON question_history(firebase_uid, asked_at DESC);

CREATE INDEX IF NOT EXISTS idx_question_history_hash
    ON question_history(question_hash);

CREATE INDEX IF NOT EXISTS idx_question_history_topic
    ON question_history(topic_id);

-- Verify table was created
SELECT 'question_history table created successfully' AS status;

COMMIT;