-- ==================== ANSWER REVIEW QUEUE ====================
-- טבלה לניהול תשובות שצריכות בדיקה ידנית של אדמין

CREATE TABLE IF NOT EXISTS answer_review_queue (
                                                   id SERIAL PRIMARY KEY,

    -- פרטי השאלה
                                                   question_id INTEGER,  -- ID מ-question_cache או question_bank
                                                   question_source VARCHAR(50),  -- 'cache', 'israeli_source', 'ai_generated'
    question_text TEXT NOT NULL,
    topic_name VARCHAR(255),
    subtopic_name VARCHAR(255),
    difficulty VARCHAR(20),  -- easy, medium, hard
    grade_level INTEGER,

    -- השוואת תשובות
    stored_answer TEXT NOT NULL,  -- התשובה המקורית במערכת
    ai_calculated_answer TEXT,  -- מה ה-AI חישב
    math_calculated_answer TEXT,  -- מה mathjs חישב
    user_answer TEXT,  -- מה המשתמש ענה (אם הופעל על ידי משתמש)

-- רמות בטחון
    ai_confidence INTEGER,  -- 0-100
    math_confidence INTEGER,  -- 0-100

-- סיווג הבעיה
    issue_type VARCHAR(50),  -- 'calculation_mismatch', 'low_confidence', 'complex_problem'
    complexity_level VARCHAR(20),  -- simple, moderate, complex, very_complex

-- סטטוס בדיקה
    needs_review BOOLEAN DEFAULT true,
    priority VARCHAR(20) DEFAULT 'medium',  -- low, medium, high, critical

-- בדיקת אדמין
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    final_answer TEXT,  -- התשובה הסופית שהאדמין אישר
    admin_notes TEXT,  -- הערות האדמין
    action_taken VARCHAR(50),  -- 'approved_stored', 'approved_ai', 'approved_math', 'manual_correction'

-- מטא-דאטה
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- מניעת כפילויות
    UNIQUE(question_id, question_source)
    );

-- אינדקסים לביצועים
CREATE INDEX IF NOT EXISTS idx_answer_review_needs_review
    ON answer_review_queue(needs_review, priority, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_answer_review_reviewed_by
    ON answer_review_queue(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_answer_review_created_at
    ON answer_review_queue(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_answer_review_complexity
    ON answer_review_queue(complexity_level, needs_review);

-- הערות
COMMENT ON TABLE answer_review_queue IS 'תור לבדיקת תשובות מתמטיות שצריכות אישור ידני';
COMMENT ON COLUMN answer_review_queue.priority IS 'עדיפות: critical (פוגע בתלמידים), high (כנראה שגוי), medium (לא בטוח), low (בעיה קלה)';
COMMENT ON COLUMN answer_review_queue.issue_type IS 'סוג הבעיה שגרמה לשליחה לבדיקה';
COMMENT ON COLUMN answer_review_queue.complexity_level IS 'רמת מורכבות השאלה: simple, moderate, complex, very_complex';