-- Migration: Create israeli_sources system tables
-- File: server/migrations/017_create_israeli_sources_tables.sql

-- ==================== ISRAELI SOURCES TABLE ====================
-- Stores Israeli educational sources with their content
CREATE TABLE IF NOT EXISTS israeli_sources (
                                               id SERIAL PRIMARY KEY,
                                               title VARCHAR(500) NOT NULL,
    source_type VARCHAR(100) NOT NULL,  -- 'rama', 'merchat_pedagogi', 'meyda_pdfs', etc.
    source_url TEXT,
    content TEXT,  -- The actual content (PDF text, HTML, etc.)
    status VARCHAR(50) DEFAULT 'active',  -- 'active', 'inactive', 'pending'
    grade_level INTEGER,  -- Target grade (7-12)
    subject VARCHAR(100),  -- 'מתמטיקה', 'אלגברה', etc.
    notes TEXT,
    last_scraped_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- ==================== ISRAELI SOURCES LOG TABLE ====================
-- Logs all processing activities
CREATE TABLE IF NOT EXISTS israeli_sources_log (
                                                   id SERIAL PRIMARY KEY,
                                                   source_id INTEGER REFERENCES israeli_sources(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,  -- 'fetch', 'process_questions', 'verify', etc.
    result VARCHAR(50) NOT NULL,  -- 'success', 'error', 'warning'
    details JSONB,  -- JSON with processing details
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_israeli_sources_status
    ON israeli_sources(status);

CREATE INDEX IF NOT EXISTS idx_israeli_sources_type
    ON israeli_sources(source_type);

CREATE INDEX IF NOT EXISTS idx_israeli_sources_grade
    ON israeli_sources(grade_level);

CREATE INDEX IF NOT EXISTS idx_israeli_sources_log_source
    ON israeli_sources_log(source_id);

CREATE INDEX IF NOT EXISTS idx_israeli_sources_log_action
    ON israeli_sources_log(action);

CREATE INDEX IF NOT EXISTS idx_israeli_sources_log_created
    ON israeli_sources_log(created_at DESC);

-- ==================== COMMENTS ====================
COMMENT ON TABLE israeli_sources IS 'Israeli educational sources for question extraction';
COMMENT ON TABLE israeli_sources_log IS 'Activity log for Israeli sources processing';

COMMENT ON COLUMN israeli_sources.content IS 'Full text content from source (extracted from PDF/HTML)';
COMMENT ON COLUMN israeli_sources.grade_level IS 'Target grade level for this source (7-12)';
COMMENT ON COLUMN israeli_sources.subject IS 'Subject area (e.g., אלגברה, גיאומטריה)';

-- ==================== INSERT SAMPLE DATA (OPTIONAL) ====================
-- You can add your 4 sources here or add them via API

-- Example: Insert your RAMA sources
-- INSERT INTO israeli_sources (title, source_type, source_url, grade_level, subject, content, status)
-- VALUES
--     ('RAMA Grade 9 Algebra', 'rama', 'https://rama.cet.ac.il/...', 9, 'אלגברה', '...content...', 'active'),
--     ('Merchat Pedagogi Grade 10', 'merchat_pedagogi', 'https://...', 10, 'מתמטיקה', '...content...', 'active');

-- ==================== VERIFICATION ====================
-- Check tables were created
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('israeli_sources', 'israeli_sources_log')
ORDER BY table_name;

-- Check if empty or has data
SELECT 'israeli_sources' as table_name, COUNT(*) as row_count FROM israeli_sources
UNION ALL
SELECT 'israeli_sources_log', COUNT(*) FROM israeli_sources_log;