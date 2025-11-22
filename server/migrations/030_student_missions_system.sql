-- server/migrations/030_student_missions_system.sql
-- Smart Student Missions System (runs after 029_cleanup)

-- ============================================================
-- Main student missions table
-- ============================================================
CREATE TABLE IF NOT EXISTS student_missions (
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
CREATE TABLE IF NOT EXISTS student_mission_progress (
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

    CONSTRAINT uq_mission_progress UNIQUE(mission_id, user_id)
    );

-- ============================================================
-- Practice session tracking (for deduplication)
-- ============================================================
CREATE TABLE IF NOT EXISTS practice_question_attempts (
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

    CONSTRAINT uq_practice_attempt UNIQUE(mission_id, user_id, question_id)
    );

-- ============================================================
-- Lecture section tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS lecture_section_progress (
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

    CONSTRAINT uq_lecture_section UNIQUE(mission_id, user_id, lecture_id, section_id)
    );

-- ============================================================
-- Indexes (safe - only create if not exists)
-- ============================================================
DO $$
BEGIN
    -- Student missions indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_student_missions_user_id') THEN
CREATE INDEX idx_student_missions_user_id ON student_missions(user_id);
END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_student_missions_firebase_uid') THEN
CREATE INDEX idx_student_missions_firebase_uid ON student_missions(firebase_uid);
END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_student_missions_status') THEN
CREATE INDEX idx_student_missions_status ON student_missions(status);
END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_student_missions_type') THEN
CREATE INDEX idx_student_missions_type ON student_missions(mission_type);
END IF;

    -- Progress indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_student_mission_progress_mission') THEN
CREATE INDEX idx_student_mission_progress_mission ON student_mission_progress(mission_id);
END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_student_mission_progress_user') THEN
CREATE INDEX idx_student_mission_progress_user ON student_mission_progress(user_id);
END IF;

    -- Practice attempts indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_practice_attempts_mission_user') THEN
CREATE INDEX idx_practice_attempts_mission_user ON practice_question_attempts(mission_id, user_id);
END IF;

    -- Lecture progress indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_lecture_progress_mission_user') THEN
CREATE INDEX idx_lecture_progress_mission_user ON lecture_section_progress(mission_id, user_id);
END IF;
END $$;

-- ============================================================
-- Triggers
-- ============================================================
CREATE OR REPLACE FUNCTION update_student_missions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_student_missions_updated_at ON student_missions;
CREATE TRIGGER trg_student_missions_updated_at
    BEFORE UPDATE ON student_missions
    FOR EACH ROW
    EXECUTE FUNCTION update_student_missions_updated_at();

DROP TRIGGER IF EXISTS trg_student_mission_progress_updated_at ON student_mission_progress;
CREATE TRIGGER trg_student_mission_progress_updated_at
    BEFORE UPDATE ON student_mission_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_student_missions_updated_at();

-- ============================================================
-- Completion check function
-- ============================================================
CREATE OR REPLACE FUNCTION check_student_mission_completion(p_mission_id INTEGER, p_user_id INTEGER)
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

-- ============================================================
-- Completion message
-- ============================================================
SELECT 'Student Missions System created successfully!' as status,
       COUNT(*) as tables_created
FROM information_schema.tables
WHERE table_name IN ('student_missions', 'student_mission_progress', 'practice_question_attempts', 'lecture_section_progress');