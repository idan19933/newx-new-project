-- server/migrations/030_student_missions_system.sql
-- Smart Student Missions System with Progress Tracking
-- RENAMED TO AVOID CONFLICTS WITH EXISTING missions TABLE

-- ============================================================
-- Drop existing tables in correct order
-- ============================================================
DROP TABLE IF EXISTS lecture_section_progress CASCADE;
DROP TABLE IF EXISTS practice_question_attempts CASCADE;
DROP TABLE IF EXISTS student_mission_progress CASCADE;
DROP TABLE IF EXISTS student_missions CASCADE;

-- ============================================================
-- Main student missions table
-- ============================================================
CREATE TABLE student_missions (
                                  id SERIAL PRIMARY KEY,
                                  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                                  firebase_uid VARCHAR(255),

    -- Mission Details
                                  title VARCHAR(500) NOT NULL,
                                  description TEXT,
                                  mission_type VARCHAR(50) NOT NULL CHECK (mission_type IN ('practice', 'lecture', 'notebook_review', 'custom')),

    -- Mission Configuration (JSON)
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
CREATE TABLE student_mission_progress (
                                          id SERIAL PRIMARY KEY,
                                          mission_id INTEGER REFERENCES student_missions(id) ON DELETE CASCADE,
                                          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    -- Progress Data (JSON)
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
                                            mission_id INTEGER REFERENCES student_missions(id) ON DELETE CASCADE,
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
                                          mission_id INTEGER REFERENCES student_missions(id) ON DELETE CASCADE,
                                          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                                          lecture_id VARCHAR(255) NOT NULL,
                                          section_id VARCHAR(255) NOT NULL,

    -- Progress
                                          is_completed BOOLEAN DEFAULT FALSE,
                                          time_spent INTEGER DEFAULT 0,

    -- Tracking
                                          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                          completed_at TIMESTAMP,

                                          UNIQUE(mission_id, user_id, lecture_id, section_id)
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_student_missions_user_id ON student_missions(user_id);
CREATE INDEX idx_student_missions_firebase_uid ON student_missions(firebase_uid);
CREATE INDEX idx_student_missions_status ON student_missions(status);
CREATE INDEX idx_student_missions_type ON student_missions(mission_type);
CREATE INDEX idx_student_mission_progress_mission_id ON student_mission_progress(mission_id);
CREATE INDEX idx_student_mission_progress_user_id ON student_mission_progress(user_id);
CREATE INDEX idx_practice_attempts_mission_user ON practice_question_attempts(mission_id, user_id);
CREATE INDEX idx_lecture_progress_mission_user ON lecture_section_progress(mission_id, user_id);

-- ============================================================
-- Triggers
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_student_missions_updated_at ON student_missions;
CREATE TRIGGER update_student_missions_updated_at
    BEFORE UPDATE ON student_missions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_mission_progress_updated_at ON student_mission_progress;
CREATE TRIGGER update_student_mission_progress_updated_at
    BEFORE UPDATE ON student_mission_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Completion check function
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
SELECT * INTO v_mission FROM student_missions WHERE id = p_mission_id;
IF NOT FOUND THEN RETURN FALSE; END IF;

SELECT * INTO v_progress FROM student_mission_progress
WHERE mission_id = p_mission_id AND user_id = p_user_id;
IF NOT FOUND THEN RETURN FALSE; END IF;

    IF v_mission.mission_type = 'practice' THEN
        v_is_complete := (v_progress.current_count >= v_progress.required_count);

        IF (v_mission.config->>'minAccuracy') IS NOT NULL THEN
            v_is_complete := v_is_complete AND
                (v_progress.accuracy >= (v_mission.config->>'minAccuracy')::DECIMAL);
END IF;

    ELSIF v_mission.mission_type = 'lecture' THEN
SELECT COUNT(*) INTO v_completed_count
FROM lecture_section_progress
WHERE mission_id = p_mission_id AND user_id = p_user_id AND is_completed = TRUE;

v_required_count := COALESCE(jsonb_array_length(v_mission.config->'requiredSections'), 0);
        v_is_complete := (v_completed_count >= v_required_count);
END IF;

    IF v_is_complete AND v_mission.status != 'completed' THEN
UPDATE student_missions
SET status = 'completed', completed_at = CURRENT_TIMESTAMP
WHERE id = p_mission_id;
END IF;

RETURN v_is_complete;
END;
$$ LANGUAGE plpgsql;

SELECT 'Student Missions System created successfully!' as status;