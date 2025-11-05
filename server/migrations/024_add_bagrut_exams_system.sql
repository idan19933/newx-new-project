-- 024_add_bagrut_exams_system.sql
-- Bagrut Exam Practice System

-- ========================================
-- Bagrut Exams Table
-- ========================================
CREATE TABLE IF NOT EXISTS bagrut_exams (
                                            id SERIAL PRIMARY KEY,

    -- Exam metadata
                                            exam_name VARCHAR(255) NOT NULL,
    exam_code VARCHAR(50),
    exam_date DATE,
    exam_season VARCHAR(50), -- winter, summer, makeup
    exam_year INTEGER,

    -- Classification
    grade_level INTEGER NOT NULL CHECK (grade_level IN (10, 11, 12)),
    units INTEGER NOT NULL CHECK (units IN (3, 4, 5)),
    exam_type VARCHAR(50) DEFAULT 'regular', -- regular, makeup, pilot

-- Content
    pdf_url TEXT,
    solutions_pdf_url TEXT,
    total_questions INTEGER,
    total_points INTEGER,
    duration_minutes INTEGER,

    -- Metadata
    topics JSONB, -- ['calculus', 'geometry', 'algebra']
    difficulty VARCHAR(20) DEFAULT 'medium',
    source VARCHAR(100) DEFAULT 'melumad',
    source_url TEXT,

    -- Status
    is_parsed BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    views_count INTEGER DEFAULT 0,
    completion_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- ========================================
-- Bagrut Exam Questions Table
-- ========================================
CREATE TABLE IF NOT EXISTS bagrut_exam_questions (
                                                     id SERIAL PRIMARY KEY,
                                                     exam_id INTEGER REFERENCES bagrut_exams(id) ON DELETE CASCADE,

    -- Question identification
    question_number INTEGER NOT NULL,
    section_number INTEGER, -- פרק 1, פרק 2, etc.
    sub_question VARCHAR(10), -- a, b, c, etc.

-- Content
    question_text TEXT NOT NULL,
    question_image_url TEXT,
    correct_answer TEXT,
    solution_steps JSONB,
    explanation TEXT,

    -- Classification
    topic VARCHAR(100),
    subtopic VARCHAR(100),
    difficulty VARCHAR(20),
    points INTEGER,

    -- Metadata
    requires_proof BOOLEAN DEFAULT false,
    requires_graph BOOLEAN DEFAULT false,
    is_multiple_choice BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- ========================================
-- Student Exam Attempts Table
-- ========================================
CREATE TABLE IF NOT EXISTS student_exam_attempts (
                                                     id SERIAL PRIMARY KEY,

    -- References
                                                     user_id VARCHAR(255) NOT NULL,
    exam_id INTEGER REFERENCES bagrut_exams(id) ON DELETE CASCADE,

    -- Attempt details
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    time_spent_minutes INTEGER,

    -- Progress
    status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, completed, abandoned
    current_question INTEGER DEFAULT 1,
    total_questions_answered INTEGER DEFAULT 0,

    -- Scoring
    total_score INTEGER DEFAULT 0,
    max_score INTEGER,
    percentage DECIMAL(5,2),

    -- Metadata
    device_type VARCHAR(50),
    is_practice BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- ========================================
-- Student Question Answers Table
-- ========================================
CREATE TABLE IF NOT EXISTS student_exam_answers (
                                                    id SERIAL PRIMARY KEY,

    -- References
                                                    attempt_id INTEGER REFERENCES student_exam_attempts(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES bagrut_exam_questions(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,

    -- Answer data
    student_answer TEXT,
    answer_image_url TEXT, -- Photo of handwritten answer
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0,
    max_points INTEGER,

    -- AI Verification
    ai_feedback TEXT,
    ai_confidence DECIMAL(5,2),
    verified_by_ai BOOLEAN DEFAULT false,
    needs_manual_review BOOLEAN DEFAULT false,

    -- Timing
    time_spent_seconds INTEGER,
    hints_used INTEGER DEFAULT 0,
    attempts_count INTEGER DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- ========================================
-- Bagrut Exam Stats (Materialized View)
-- ========================================
CREATE TABLE IF NOT EXISTS bagrut_exam_stats (
                                                 exam_id INTEGER PRIMARY KEY REFERENCES bagrut_exams(id) ON DELETE CASCADE,

    total_attempts INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,
    avg_score DECIMAL(5,2),
    avg_time_minutes INTEGER,

    completion_rate DECIMAL(5,2),

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- ========================================
-- Indexes for Performance
-- ========================================
CREATE INDEX idx_bagrut_exams_grade_units ON bagrut_exams(grade_level, units);
CREATE INDEX idx_bagrut_exams_year ON bagrut_exams(exam_year DESC);
CREATE INDEX idx_bagrut_exams_active ON bagrut_exams(is_active) WHERE is_active = true;

CREATE INDEX idx_bagrut_questions_exam ON bagrut_exam_questions(exam_id);
CREATE INDEX idx_bagrut_questions_topic ON bagrut_exam_questions(topic);

CREATE INDEX idx_student_attempts_user ON student_exam_attempts(user_id);
CREATE INDEX idx_student_attempts_exam ON student_exam_attempts(exam_id);
CREATE INDEX idx_student_attempts_status ON student_exam_attempts(status);

CREATE INDEX idx_student_answers_attempt ON student_exam_answers(attempt_id);
CREATE INDEX idx_student_answers_user ON student_exam_answers(user_id);

-- ========================================
-- Triggers for Auto-Update
-- ========================================

-- Update exam stats on new attempt
CREATE OR REPLACE FUNCTION update_exam_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert stats
INSERT INTO bagrut_exam_stats (exam_id, total_attempts)
VALUES (NEW.exam_id, 1)
    ON CONFLICT (exam_id)
    DO UPDATE SET
    total_attempts = bagrut_exam_stats.total_attempts + 1,
               updated_at = CURRENT_TIMESTAMP;

-- If attempt is completed, update completion stats
IF NEW.status = 'completed' THEN
UPDATE bagrut_exam_stats
SET
    total_completions = total_completions + 1,
    avg_score = (
        SELECT AVG(percentage)
        FROM student_exam_attempts
        WHERE exam_id = NEW.exam_id AND status = 'completed'
    ),
    avg_time_minutes = (
        SELECT AVG(time_spent_minutes)
        FROM student_exam_attempts
        WHERE exam_id = NEW.exam_id AND status = 'completed'
    ),
    completion_rate = (
        (total_completions + 1)::DECIMAL / total_attempts * 100
    ),
    updated_at = CURRENT_TIMESTAMP
WHERE exam_id = NEW.exam_id;
END IF;

RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_exam_stats
    AFTER INSERT OR UPDATE ON student_exam_attempts
                        FOR EACH ROW
                        EXECUTE FUNCTION update_exam_stats();

-- Update exam views count
CREATE OR REPLACE FUNCTION increment_exam_views()
RETURNS TRIGGER AS $$
BEGIN
UPDATE bagrut_exams
SET views_count = views_count + 1
WHERE id = NEW.exam_id;

RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_views
    AFTER INSERT ON student_exam_attempts
    FOR EACH ROW
    EXECUTE FUNCTION increment_exam_views();

-- ========================================
-- Success Message
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '✅ Bagrut Exams System created successfully!';
    RAISE NOTICE '   - bagrut_exams: Exam metadata';
    RAISE NOTICE '   - bagrut_exam_questions: Individual questions';
    RAISE NOTICE '   - student_exam_attempts: Student progress tracking';
    RAISE NOTICE '   - student_exam_answers: Answer verification';
    RAISE NOTICE '   - bagrut_exam_stats: Performance analytics';
END $$;