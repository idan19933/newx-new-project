-- server/migrations/030_smart_missions_system.sql
-- Smart Missions System with Progress Tracking

-- Drop existing missions table if needed
DROP TABLE IF EXISTS mission_progress CASCADE;
DROP TABLE IF EXISTS missions CASCADE;

-- Main missions table
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

-- Mission progress tracking
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

-- Practice session tracking (for deduplication)
CREATE TABLE practice_question_attempts (
                                            id SERIAL PRIMARY KEY,
                                            mission_id INTEGER REFERENCES missions(id) ON DELETE CASCADE,
                                            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                                            question_id VARCHAR(255),
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

-- Lecture section tracking
CREATE TABLE lecture_section_progress (
                                          id SERIAL PRIMARY KEY,
                                          mission_id INTEGER REFERENCES missions(id) ON DELETE CASCADE,
                                          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                                          lecture_id VARCHAR(255),
                                          section_id VARCHAR(255),

    -- Progress
                                          is_completed BOOLEAN DEFAULT FALSE,
                                          time_spent INTEGER DEFAULT 0, -- seconds

    -- Tracking
                                          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                          completed_at TIMESTAMP,

                                          UNIQUE(mission_id, user_id, lecture_id, section_id)
);

-- Indexes for performance
CREATE INDEX idx_missions_user_id ON missions(user_id);
CREATE INDEX idx_missions_firebase_uid ON missions(firebase_uid);
CREATE INDEX idx_missions_status ON missions(status);
CREATE INDEX idx_mission_progress_mission_id ON mission_progress(mission_id);
CREATE INDEX idx_mission_progress_user_id ON mission_progress(user_id);
CREATE INDEX idx_practice_attempts_mission_user ON practice_question_attempts(mission_id, user_id);
CREATE INDEX idx_lecture_progress_mission_user ON lecture_section_progress(mission_id, user_id);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_missions_updated_at BEFORE UPDATE ON missions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mission_progress_updated_at BEFORE UPDATE ON mission_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check if mission is complete
CREATE OR REPLACE FUNCTION check_mission_completion(p_mission_id INTEGER, p_user_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
v_mission RECORD;
    v_progress RECORD;
    v_is_complete BOOLEAN := FALSE;
BEGIN
    -- Get mission details
SELECT * INTO v_mission FROM missions WHERE id = p_mission_id;

-- Get progress
SELECT * INTO v_progress FROM mission_progress
WHERE mission_id = p_mission_id AND user_id = p_user_id;

IF v_mission.mission_type = 'practice' THEN
        -- Check if required questions completed
        v_is_complete := (v_progress.current_count >= v_progress.required_count);

        -- Check accuracy if required
        IF (v_mission.config->>'minAccuracy')::INTEGER IS NOT NULL THEN
            v_is_complete := v_is_complete AND
                (v_progress.accuracy >= (v_mission.config->>'minAccuracy')::DECIMAL);
END IF;

    ELSIF v_mission.mission_type = 'lecture' THEN
        -- Check if all sections completed
        DECLARE
v_completed_count INTEGER;
            v_required_count INTEGER;
BEGIN
SELECT COUNT(*) INTO v_completed_count
FROM lecture_section_progress
WHERE mission_id = p_mission_id
  AND user_id = p_user_id
  AND is_completed = TRUE;

v_required_count := jsonb_array_length(v_mission.config->'requiredSections');
            v_is_complete := (v_completed_count >= v_required_count);
END;
END IF;

    -- Update mission status if complete
    IF v_is_complete AND v_mission.status != 'completed' THEN
UPDATE missions
SET status = 'completed', completed_at = CURRENT_TIMESTAMP
WHERE id = p_mission_id;
END IF;

RETURN v_is_complete;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE missions IS 'Smart missions system with detailed tracking';
COMMENT ON TABLE mission_progress IS 'Tracks user progress on missions';
COMMENT ON TABLE practice_question_attempts IS 'Prevents counting same question multiple times';
COMMENT ON TABLE lecture_section_progress IS 'Tracks lecture section completion';