-- server/migrations/015_add_question_cache_system.sql

-- Fix scraping_sources table
ALTER TABLE scraping_sources
    ADD COLUMN IF NOT EXISTS last_scraped TIMESTAMP,
    ADD COLUMN IF NOT EXISTS items_found INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS items_saved INTEGER DEFAULT 0;

-- Create question cache table
CREATE TABLE IF NOT EXISTS question_cache (
                                              id SERIAL PRIMARY KEY,
                                              question_text TEXT NOT NULL,
                                              correct_answer TEXT NOT NULL,
                                              hints JSONB,
                                              explanation TEXT,
                                              visual_data JSONB,

    -- Classification
                                              topic_id VARCHAR(100),
    topic_name VARCHAR(255),
    subtopic_id VARCHAR(100),
    subtopic_name VARCHAR(255),
    difficulty VARCHAR(20) DEFAULT 'medium',
    grade_level INTEGER,

    -- Metadata
    source VARCHAR(50) DEFAULT 'ai_generated',
    quality_score INTEGER DEFAULT 70,
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    avg_time_seconds INTEGER DEFAULT 0,

    -- Question variety tracking
    question_hash VARCHAR(64) UNIQUE,
    similar_questions JSONB,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP,
    is_active BOOLEAN DEFAULT true,

    -- Indexes for fast lookup
    CONSTRAINT unique_question_hash UNIQUE (question_hash)
    );

-- Create indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_question_cache_topic ON question_cache(topic_id, difficulty, grade_level);
CREATE INDEX IF NOT EXISTS idx_question_cache_subtopic ON question_cache(subtopic_id, difficulty);
CREATE INDEX IF NOT EXISTS idx_question_cache_quality ON question_cache(quality_score DESC, usage_count ASC);
CREATE INDEX IF NOT EXISTS idx_question_cache_active ON question_cache(is_active, grade_level);

-- Create question usage tracking
CREATE TABLE IF NOT EXISTS question_usage_history (
                                                      id SERIAL PRIMARY KEY,
                                                      question_id INTEGER REFERENCES question_cache(id),
    user_id INTEGER,
    is_correct BOOLEAN,
    time_spent_seconds INTEGER,
    hints_used INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX IF NOT EXISTS idx_question_usage_user ON question_usage_history(user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_question_usage_question ON question_usage_history(question_id);