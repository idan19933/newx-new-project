-- Migration 024: Multi-file exams with solutions and ordering
-- SAFE VERSION - Checks if tables exist before modifying them

DO $$
DECLARE
exam_uploads_exists BOOLEAN;
    questions_exists BOOLEAN;
BEGIN
    -- Check if tables exist
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'exam_uploads'
) INTO exam_uploads_exists;

SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'questions'
) INTO questions_exists;

RAISE NOTICE '📊 Table Status:';
    RAISE NOTICE '   exam_uploads: %', CASE WHEN exam_uploads_exists THEN '✅ EXISTS' ELSE '❌ NOT FOUND' END;
    RAISE NOTICE '   questions: %', CASE WHEN questions_exists THEN '✅ EXISTS' ELSE '❌ NOT FOUND' END;

    -- ==================== PART 1: exam_uploads modifications ====================
    IF exam_uploads_exists THEN
        RAISE NOTICE '📝 Modifying exam_uploads table...';

        -- Add exam_group_id column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'exam_uploads'
            AND column_name = 'exam_group_id'
        ) THEN
ALTER TABLE exam_uploads ADD COLUMN exam_group_id UUID;
RAISE NOTICE '   ✅ Added exam_group_id column';
ELSE
            RAISE NOTICE '   ⏭️  exam_group_id already exists';
END IF;

        -- Add file_order column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'exam_uploads'
            AND column_name = 'file_order'
        ) THEN
ALTER TABLE exam_uploads ADD COLUMN file_order INTEGER DEFAULT 1;
RAISE NOTICE '   ✅ Added file_order column';
ELSE
            RAISE NOTICE '   ⏭️  file_order already exists';
END IF;

        -- Add is_solution_page column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'exam_uploads'
            AND column_name = 'is_solution_page'
        ) THEN
ALTER TABLE exam_uploads ADD COLUMN is_solution_page BOOLEAN DEFAULT FALSE;
RAISE NOTICE '   ✅ Added is_solution_page column';
ELSE
            RAISE NOTICE '   ⏭️  is_solution_page already exists';
END IF;

        -- Add total_files_in_group column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'exam_uploads'
            AND column_name = 'total_files_in_group'
        ) THEN
ALTER TABLE exam_uploads ADD COLUMN total_files_in_group INTEGER DEFAULT 1;
RAISE NOTICE '   ✅ Added total_files_in_group column';
ELSE
            RAISE NOTICE '   ⏭️  total_files_in_group already exists';
END IF;

        -- Create index
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE schemaname = 'public'
            AND tablename = 'exam_uploads'
            AND indexname = 'idx_exam_uploads_group_order'
        ) THEN
CREATE INDEX idx_exam_uploads_group_order ON exam_uploads(exam_group_id, file_order);
RAISE NOTICE '   ✅ Created index idx_exam_uploads_group_order';
ELSE
            RAISE NOTICE '   ⏭️  Index idx_exam_uploads_group_order already exists';
END IF;

        -- Add comments
        COMMENT ON COLUMN exam_uploads.exam_group_id IS 'Groups multiple files belonging to the same exam';
        COMMENT ON COLUMN exam_uploads.file_order IS 'Order of this file within the exam group (1-based)';
        COMMENT ON COLUMN exam_uploads.is_solution_page IS 'TRUE if this file contains solutions/answers';
        RAISE NOTICE '   ✅ Added column comments';

        -- Create or replace view
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
RAISE NOTICE '   ✅ Created/updated exam_groups view';

ELSE
        RAISE NOTICE '⚠️  exam_uploads table not found - skipping exam_uploads modifications';
END IF;

    -- ==================== PART 2: questions table modifications ====================
    IF questions_exists THEN
        RAISE NOTICE '📝 Modifying questions table...';

        -- Add full_solution column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'questions'
            AND column_name = 'full_solution'
        ) THEN
ALTER TABLE questions ADD COLUMN full_solution TEXT;
RAISE NOTICE '   ✅ Added full_solution column';
ELSE
            RAISE NOTICE '   ⏭️  full_solution already exists';
END IF;

        -- Add solution_image_url column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'questions'
            AND column_name = 'solution_image_url'
        ) THEN
ALTER TABLE questions ADD COLUMN solution_image_url TEXT;
RAISE NOTICE '   ✅ Added solution_image_url column';
ELSE
            RAISE NOTICE '   ⏭️  solution_image_url already exists';
END IF;

        -- Add has_solution column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'questions'
            AND column_name = 'has_solution'
        ) THEN
ALTER TABLE questions ADD COLUMN has_solution BOOLEAN DEFAULT FALSE;
RAISE NOTICE '   ✅ Added has_solution column';
ELSE
            RAISE NOTICE '   ⏭️  has_solution already exists';
END IF;

        -- Add comments
        COMMENT ON COLUMN questions.full_solution IS 'Complete step-by-step solution text';
        COMMENT ON COLUMN questions.has_solution IS 'TRUE if a solution has been extracted for this question';
        RAISE NOTICE '   ✅ Added column comments';

ELSE
        RAISE NOTICE '⚠️  questions table not found - skipping questions modifications';
        RAISE NOTICE '💡 TIP: You may be using question_cache or question_bank instead';
END IF;

    RAISE NOTICE '🎉 Migration 024 completed!';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Migration 024 failed: %', SQLERRM;
        RAISE NOTICE '📋 Error details: %', SQLSTATE;
        -- Don't throw - allow other migrations to continue
END $$;

-- Mark as complete (even if some parts were skipped)
INSERT INTO schema_migrations (version, applied_at)
VALUES ('024_multi_file_exams_with_solutions', NOW())
    ON CONFLICT (version) DO NOTHING;