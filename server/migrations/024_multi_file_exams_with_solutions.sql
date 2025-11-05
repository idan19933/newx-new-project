-- Migration 024: Multi-file exams with solutions and ordering
-- Run this migration to support multiple files per exam and store solutions

-- 1. Add exam grouping and ordering to exam_uploads
ALTER TABLE exam_uploads
    ADD COLUMN IF NOT EXISTS exam_group_id UUID,
    ADD COLUMN IF NOT EXISTS file_order INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS is_solution_page BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS total_files_in_group INTEGER DEFAULT 1;

-- 2. Add solution fields to questions table
ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS full_solution TEXT,
    ADD COLUMN IF NOT EXISTS solution_image_url TEXT,
    ADD COLUMN IF NOT EXISTS has_solution BOOLEAN DEFAULT FALSE;

-- 3. Create index for faster querying by exam group
CREATE INDEX IF NOT EXISTS idx_exam_uploads_group_order
    ON exam_uploads(exam_group_id, file_order);

-- 4. Create a view for grouped exams
CREATE OR REPLACE VIEW exam_groups AS
SELECT
    exam_group_id,
    MIN(uploaded_at) as first_uploaded_at,
    MAX(uploaded_at) as last_uploaded_at,
    COUNT(*) as total_files,
    SUM(questions_extracted) as total_questions,
    STRING_AGG(exam_title, ' | ' ORDER BY file_order) as combined_title,
    MAX(grade_level) as grade_level,
    MAX(units) as units,
    MAX(exam_type) as exam_type,
    CASE
        WHEN COUNT(*) = COUNT(*) FILTER (WHERE status = 'completed') THEN 'completed'
        WHEN COUNT(*) FILTER (WHERE status = 'failed') > 0 THEN 'partial'
        ELSE 'processing'
        END as group_status
FROM exam_uploads
WHERE exam_group_id IS NOT NULL
GROUP BY exam_group_id;

-- 5. Add comments for documentation
COMMENT ON COLUMN exam_uploads.exam_group_id IS 'Groups multiple files belonging to the same exam';
COMMENT ON COLUMN exam_uploads.file_order IS 'Order of this file within the exam group (1-based)';
COMMENT ON COLUMN exam_uploads.is_solution_page IS 'TRUE if this file contains solutions/answers';
COMMENT ON COLUMN questions.full_solution IS 'Complete step-by-step solution text';
COMMENT ON COLUMN questions.has_solution IS 'TRUE if a solution has been extracted for this question';

-- Migration complete
SELECT 'Migration 024 completed successfully!' as status;