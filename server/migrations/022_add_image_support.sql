-- db/migrations/022_add_image_support.sql

-- הוסף עמודת תמונות לטבלת question_bank
ALTER TABLE question_bank
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS image_data JSONB,
    ADD COLUMN IF NOT EXISTS has_image BOOLEAN DEFAULT false;

-- טבלה חדשה לניהול העלאות מבחנים
CREATE TABLE IF NOT EXISTS exam_uploads (
                                            id SERIAL PRIMARY KEY,
                                            filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    file_path TEXT,
    image_url TEXT,
    file_size INTEGER,
    mime_type VARCHAR(100),

    -- Metadata
    exam_title VARCHAR(255),
    exam_type VARCHAR(100), -- 'bagrut', 'monthly', 'practice'
    grade_level INTEGER,
    subject VARCHAR(100),
    units INTEGER, -- 3, 4, or 5 units

-- Processing status
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    processing_started_at TIMESTAMP,
    processing_completed_at TIMESTAMP,
    error_message TEXT,

    -- Results
    questions_extracted INTEGER DEFAULT 0,
    questions_generated INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,

    -- Admin info
    uploaded_by VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- JSON data
    processing_log JSONB,
    extracted_data JSONB
    );

-- אינדקסים
CREATE INDEX IF NOT EXISTS idx_exam_uploads_status ON exam_uploads(status);
CREATE INDEX IF NOT EXISTS idx_exam_uploads_grade ON exam_uploads(grade_level);
CREATE INDEX IF NOT EXISTS idx_exam_uploads_date ON exam_uploads(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_bank_image ON question_bank(has_image);

-- טבלה לניהול אדמינים
CREATE TABLE IF NOT EXISTS admin_users (
                                           id SERIAL PRIMARY KEY,
                                           firebase_uid VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin', -- admin, super_admin
    is_active BOOLEAN DEFAULT true,
    permissions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
    );

-- הוסף אינדקס
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);

COMMIT;