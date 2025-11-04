-- server/migrations/003_question_history.sql
-- Track questions asked to prevent repeats

CREATE TABLE IF NOT EXISTS question_history (
                                                id SERIAL PRIMARY KEY,
                                                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    firebase_uid VARCHAR(255) NOT NULL,
    topic_id VARCHAR(255),
    subtopic_id VARCHAR(255),
    question_text TEXT NOT NULL,
    question_hash VARCHAR(64) NOT NULL,  -- MD5 hash for quick lookup
    difficulty VARCHAR(20),
    asked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_question_history_user (firebase_uid, asked_at DESC),
    INDEX idx_question_history_hash (question_hash)
    );

-- Create index on user and time for efficient recent question lookups
CREATE INDEX idx_question_history_user_time ON question_history(firebase_uid, asked_at DESC);

COMMIT;