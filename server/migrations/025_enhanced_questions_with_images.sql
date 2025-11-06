-- Migration 025: Enhanced Questions with Images, Equations, and Diagrams
-- SAFE VERSION - Checks if tables exist before modifying them

DO $$
DECLARE
questions_exists BOOLEAN;
    exam_uploads_exists BOOLEAN;
BEGIN
    -- Check if tables exist
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'questions'
) INTO questions_exists;

SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'exam_uploads'
) INTO exam_uploads_exists;

RAISE NOTICE '📊 Migration 025 - Table Status:';
    RAISE NOTICE '   questions: %', CASE WHEN questions_exists THEN '✅ EXISTS' ELSE '❌ NOT FOUND' END;
    RAISE NOTICE '   exam_uploads: %', CASE WHEN exam_uploads_exists THEN '✅ EXISTS' ELSE '❌ NOT FOUND' END;

    -- ==================== PART 1: Modify questions table ====================
    IF questions_exists THEN
        RAISE NOTICE '📝 Modifying questions table...';

        -- Add equations column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'questions'
            AND column_name = 'equations'
        ) THEN
ALTER TABLE questions ADD COLUMN equations JSONB DEFAULT '[]'::jsonb;
RAISE NOTICE '   ✅ Added equations column';
ELSE
            RAISE NOTICE '   ⏭️  equations already exists';
END IF;

        -- Add question_images column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'questions'
            AND column_name = 'question_images'
        ) THEN
ALTER TABLE questions ADD COLUMN question_images JSONB DEFAULT '[]'::jsonb;
RAISE NOTICE '   ✅ Added question_images column';
ELSE
            RAISE NOTICE '   ⏭️  question_images already exists';
END IF;

        -- Add has_diagrams column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'questions'
            AND column_name = 'has_diagrams'
        ) THEN
ALTER TABLE questions ADD COLUMN has_diagrams BOOLEAN DEFAULT FALSE;
RAISE NOTICE '   ✅ Added has_diagrams column';
ELSE
            RAISE NOTICE '   ⏭️  has_diagrams already exists';
END IF;

        -- Add diagram_description column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'questions'
            AND column_name = 'diagram_description'
        ) THEN
ALTER TABLE questions ADD COLUMN diagram_description TEXT;
RAISE NOTICE '   ✅ Added diagram_description column';
ELSE
            RAISE NOTICE '   ⏭️  diagram_description already exists';
END IF;

        -- Add raw_math_content column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'questions'
            AND column_name = 'raw_math_content'
        ) THEN
ALTER TABLE questions ADD COLUMN raw_math_content TEXT;
RAISE NOTICE '   ✅ Added raw_math_content column';
ELSE
            RAISE NOTICE '   ⏭️  raw_math_content already exists';
END IF;

        -- Create index
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE schemaname = 'public'
            AND tablename = 'questions'
            AND indexname = 'idx_questions_has_diagrams'
        ) THEN
CREATE INDEX idx_questions_has_diagrams ON questions(has_diagrams);
RAISE NOTICE '   ✅ Created index on has_diagrams';
ELSE
            RAISE NOTICE '   ⏭️  Index idx_questions_has_diagrams already exists';
END IF;

        -- Add comments
EXECUTE 'COMMENT ON COLUMN questions.equations IS ''JSON array of mathematical equations in LaTeX format''';
EXECUTE 'COMMENT ON COLUMN questions.question_images IS ''JSON array of image URLs associated with this question''';
EXECUTE 'COMMENT ON COLUMN questions.has_diagrams IS ''TRUE if question contains graphs, diagrams, or illustrations''';
EXECUTE 'COMMENT ON COLUMN questions.diagram_description IS ''Description of diagrams/graphs in the question''';
EXECUTE 'COMMENT ON COLUMN questions.raw_math_content IS ''Raw mathematical content for rendering''';
RAISE NOTICE '   ✅ Added column comments';

ELSE
        RAISE NOTICE '⚠️  questions table not found - skipping questions modifications';
END IF;

    -- ==================== PART 2: Modify exam_uploads table ====================
    IF exam_uploads_exists THEN
        RAISE NOTICE '📝 Modifying exam_uploads table...';

        -- Add contains_diagrams column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'exam_uploads'
            AND column_name = 'contains_diagrams'
        ) THEN
ALTER TABLE exam_uploads ADD COLUMN contains_diagrams BOOLEAN DEFAULT FALSE;
RAISE NOTICE '   ✅ Added contains_diagrams column';
ELSE
            RAISE NOTICE '   ⏭️  contains_diagrams already exists';
END IF;

        -- Add extracted_images_count column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'exam_uploads'
            AND column_name = 'extracted_images_count'
        ) THEN
ALTER TABLE exam_uploads ADD COLUMN extracted_images_count INTEGER DEFAULT 0;
RAISE NOTICE '   ✅ Added extracted_images_count column';
ELSE
            RAISE NOTICE '   ⏭️  extracted_images_count already exists';
END IF;

        -- Add processing_metadata column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'exam_uploads'
            AND column_name = 'processing_metadata'
        ) THEN
ALTER TABLE exam_uploads ADD COLUMN processing_metadata JSONB DEFAULT '{}'::jsonb;
RAISE NOTICE '   ✅ Added processing_metadata column';
ELSE
            RAISE NOTICE '   ⏭️  processing_metadata already exists';
END IF;

        -- Create index
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE schemaname = 'public'
            AND tablename = 'exam_uploads'
            AND indexname = 'idx_exam_uploads_diagrams'
        ) THEN
CREATE INDEX idx_exam_uploads_diagrams ON exam_uploads(contains_diagrams);
RAISE NOTICE '   ✅ Created index on contains_diagrams';
ELSE
            RAISE NOTICE '   ⏭️  Index idx_exam_uploads_diagrams already exists';
END IF;

ELSE
        RAISE NOTICE '⚠️  exam_uploads table not found - skipping exam_uploads modifications';
END IF;

    -- ==================== PART 3: Create exam_extracted_images table ====================
    IF questions_exists AND exam_uploads_exists THEN
        RAISE NOTICE '📝 Creating exam_extracted_images table...';

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'exam_extracted_images'
        ) THEN
CREATE TABLE exam_extracted_images (
                                       id SERIAL PRIMARY KEY,
                                       exam_upload_id INTEGER REFERENCES exam_uploads(id) ON DELETE CASCADE,
                                       question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
                                       image_url TEXT NOT NULL,
                                       image_type VARCHAR(50),
                                       description TEXT,
                                       extracted_at TIMESTAMP DEFAULT NOW(),
                                       storage_path TEXT,
                                       width INTEGER,
                                       height INTEGER
);
RAISE NOTICE '   ✅ Created exam_extracted_images table';

            -- Create indexes
CREATE INDEX idx_exam_images_question ON exam_extracted_images(question_id);
CREATE INDEX idx_exam_images_type ON exam_extracted_images(image_type);
RAISE NOTICE '   ✅ Created indexes';

            -- Add comment
EXECUTE 'COMMENT ON TABLE exam_extracted_images IS ''Stores images extracted from exam pages''';
EXECUTE 'COMMENT ON COLUMN exam_extracted_images.image_type IS ''Type of image: diagram, graph, illustration, equation''';
RAISE NOTICE '   ✅ Added table comments';

ELSE
            RAISE NOTICE '   ⏭️  exam_extracted_images table already exists';
END IF;

ELSE
        RAISE NOTICE '⚠️  Cannot create exam_extracted_images - required tables missing';
END IF;

    -- ==================== PART 4: Create function and view ====================
    IF questions_exists THEN
        RAISE NOTICE '📝 Creating helper function and view...';

        -- Create function
        CREATE OR REPLACE FUNCTION count_question_images(question_id_param INTEGER)
        RETURNS INTEGER AS $func$
BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exam_extracted_images') THEN
                RETURN (
                    SELECT COUNT(*)
                    FROM exam_extracted_images
                    WHERE question_id = question_id_param
                );
ELSE
                RETURN 0;
END IF;
END;
        $func$ LANGUAGE plpgsql;
        RAISE NOTICE '   ✅ Created count_question_images function';

        -- Create view (only if exam_extracted_images exists)
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'exam_extracted_images'
        ) THEN
            CREATE OR REPLACE VIEW questions_with_images AS
SELECT
    q.*,
    COALESCE(
            (SELECT json_agg(
                            json_build_object(
                                    'id', ei.id,
                                    'url', ei.image_url,
                                    'type', ei.image_type,
                                    'description', ei.description
                            ) ORDER BY ei.id
                    )
             FROM exam_extracted_images ei
             WHERE ei.question_id = q.id),
            '[]'::json
    ) as images
FROM questions q;
RAISE NOTICE '   ✅ Created questions_with_images view';
ELSE
            RAISE NOTICE '   ⏭️  Skipping view - exam_extracted_images not available';
END IF;

ELSE
        RAISE NOTICE '⚠️  Cannot create function/view - questions table missing';
END IF;

    RAISE NOTICE '🎉 Migration 025 completed successfully!';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Migration 025 failed: %', SQLERRM;
        RAISE NOTICE '📋 Error details: %', SQLSTATE;
        -- Don't throw - allow other migrations to continue
END $$;

-- Migration complete - runner handles tracking automatically