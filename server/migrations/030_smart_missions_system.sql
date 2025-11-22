-- server/migrations/030_smart_missions_system.sql - FIXED VERSION
-- Smart Missions System with Progress Tracking

-- ============================================================
-- SAFETY: Drop existing tables in correct order
-- ============================================================
DROP TABLE IF EXISTS lecture_section_progress CASCADE;
DROP TABLE IF EXISTS practice_question_attempts CASCADE;
DROP TABLE IF EXISTS mission_progress CASCADE;
DROP TABLE IF EXISTS missions CASCADE;

-- ============================================================
-- Main missions table
-- ============================================================
CREATE TABLE missions (
                          id SERIAL PRIMARY KEY,
                          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                          firebase_uid VARCHAR(255),

    -- Mission Details
                          title VARCHAR(500) NOT NULL,
                          description TEXT,
                          mission_type VARCHAR(50) NOT NULL CHECK (mission_type IN ('practice', 'lecture', 'notebook_review', 'custom')),

    -- Mission Configuration (JSON)
    -- For practice: { "topicId": "...", "subtopicId": "...", "requiredQuestions": 10, "minAccuracy": 70 }
    -- For lecture: { "lectureId": "...", "requiredSections": ["intro", "examples", "summary"] }
                          config JSONB DEFAULT '{}',

    -- Status
                          status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),

    -- Rewards
                          points INTEGER DEFAULT 0,

    -- Timing
                          assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                          deadline TIMESTAMP,
                          completed_at TIMESTAMP,

    -- Metadata
                          created_by INTEGER REFERENCES users(id),
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Mission progress tracking
-- ============================================================
CREATE TABLE mission_progress (
                                  id SERIAL PRIMARY KEY,
                                  mission_id INTEGER REFERENCES missions(id) ON DELETE CASCADE,
                                  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    -- Progress Data (JSON)
    -- For practice: { "uniqueQuestions": ["q1", "q2"], "correctCount": 5, "totalAttempts": 8 }
    -- For lecture: { "completedSections": ["intro"], "timeSpent": 300 }
                                  progress_data JSONB DEFAULT '{}',

    -- Statistics
                                  current_count INTEGER DEFAULT 0,
                                  required_count INTEGER DEFAULT 0,
                                  accuracy DECIMAL(5,2) DEFAULT 0,

    -- Tracking
                                  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                                  UNIQUE(mission_id, user_id)
);

-- ============================================================
-- Practice session tracking (for deduplication)
-- ============================================================
CREATE TABLE practice_question_attempts (
                                            id SERIAL PRIMARY KEY,
                                            mission_id INTEGER REFERENCES missions(id) ON DELETE CASCADE,
                                            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                                            question_id VARCHAR(255) NOT NULL,
                                            question_text TEXT,

    -- Attempt details
                                            is_correct BOOLEAN,
                                            attempts_count INTEGER DEFAULT 1,
                                            first_attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                            last_attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Track if this counts towards mission
                                            counts_for_mission BOOLEAN DEFAULT TRUE,

                                            UNIQUE(mission_id, user_id, question_id)
);

-- ============================================================
-- Lecture section tracking
-- ============================================================
CREATE TABLE lecture_section_progress (
                                          id SERIAL PRIMARY KEY,
                                          mission_id INTEGER REFERENCES missions(id) ON DELETE CASCADE,
                                          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                                          lecture_id VARCHAR(255) NOT NULL,
                                          section_id VARCHAR(255) NOT NULL,

    -- Progress
                                          is_completed BOOLEAN DEFAULT FALSE,
                                          time_spent INTEGER DEFAULT 0, -- seconds

    -- Tracking
                                          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                          completed_at TIMESTAMP,

                                          UNIQUE(mission_id, user_id, lecture_id, section_id)
);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX idx_missions_user_id ON missions(user_id);
CREATE INDEX idx_missions_firebase_uid ON missions(firebase_uid);
CREATE INDEX idx_missions_status ON missions(status);
CREATE INDEX idx_missions_mission_type ON missions(mission_type);
CREATE INDEX idx_mission_progress_mission_id ON mission_progress(mission_id);
CREATE INDEX idx_mission_progress_user_id ON mission_progress(user_id);
CREATE INDEX idx_practice_attempts_mission_user ON practice_question_attempts(mission_id, user_id);
CREATE INDEX idx_practice_attempts_question ON practice_question_attempts(question_id);
CREATE INDEX idx_lecture_progress_mission_user ON lecture_section_progress(mission_id, user_id);

-- ============================================================
-- Updated_at triggers
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_missions_updated_at ON missions;
CREATE TRIGGER update_missions_updated_at
    BEFORE UPDATE ON missions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mission_progress_updated_at ON mission_progress;
CREATE TRIGGER update_mission_progress_updated_at
    BEFORE UPDATE ON mission_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Function to check if mission is complete
-- ============================================================
CREATE OR REPLACE FUNCTION check_mission_completion(p_mission_id INTEGER, p_user_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
v_mission RECORD;
    v_progress RECORD;
    v_is_complete BOOLEAN := FALSE;
    v_completed_count INTEGER;
    v_required_count INTEGER;
BEGIN
    -- Get mission details
SELECT * INTO v_mission FROM missions WHERE id = p_mission_id;

IF NOT FOUND THEN
        RETURN FALSE;
END IF;

    -- Get progress
SELECT * INTO v_progress FROM mission_progress
WHERE mission_id = p_mission_id AND user_id = p_user_id;

IF NOT FOUND THEN
        RETURN FALSE;
END IF;

    IF v_mission.mission_type = 'practice' THEN
        -- Check if required questions completed
        v_is_complete := (v_progress.current_count >= v_progress.required_count);

        -- Check accuracy if required
        IF (v_mission.config->>'minAccuracy') IS NOT NULL AND (v_mission.config->>'minAccuracy')::NUMERIC > 0 THEN
            v_is_complete := v_is_complete AND
                (v_progress.accuracy >= (v_mission.config->>'minAccuracy')::DECIMAL);
END IF;

    ELSIF v_mission.mission_type = 'lecture' THEN
        -- Check if all sections completed
SELECT COUNT(*) INTO v_completed_count
FROM lecture_section_progress
WHERE mission_id = p_mission_id
  AND user_id = p_user_id
  AND is_completed = TRUE;

v_required_count := COALESCE(jsonb_array_length(v_mission.config->'requiredSections'), 0);

        IF v_required_count > 0 THEN
            v_is_complete := (v_completed_count >= v_required_count);
ELSE
            v_is_complete := FALSE;
END IF;
END IF;

    -- Update mission status if complete
    IF v_is_complete AND v_mission.status != 'completed' THEN
UPDATE missions
SET status = 'completed',
    completed_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE id = p_mission_id;
END IF;

RETURN v_is_complete;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Sample data for testing (optional - comment out if not needed)
-- ============================================================
-- INSERT INTO missions (user_id, title, description, mission_type, config, points, status)
-- VALUES
--     (2, 'תרגול בחזקות', 'פתור 10 שאלות בנושא חוקי חזקות', 'practice',
--      '{"topicId": "powers", "requiredQuestions": 10, "minAccuracy": 70}', 20, 'active');

-- ============================================================
-- Comments for documentation
-- ============================================================
COMMENT ON TABLE missions IS 'Smart missions system with detailed tracking and deduplication';
COMMENT ON TABLE mission_progress IS 'Tracks user progress on missions with statistics';
COMMENT ON TABLE practice_question_attempts IS 'Prevents counting same question multiple times - ensures unique questions only';
COMMENT ON TABLE lecture_section_progress IS 'Tracks lecture section completion with time spent';
COMMENT ON COLUMN missions.mission_type IS 'Type of mission: practice (questions), lecture (video/content), notebook_review, custom';
COMMENT ON COLUMN missions.config IS 'JSON configuration specific to mission type';
COMMENT ON COLUMN practice_question_attempts.counts_for_mission IS 'TRUE only for first attempt - subsequent attempts do not count';

-- ============================================================
-- Migration complete
-- ============================================================
SELECT 'Smart Missions System migration completed successfully!' as status;