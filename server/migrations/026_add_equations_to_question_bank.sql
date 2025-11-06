-- Migration 026: Add equations and enhanced fields to question_bank
-- Adds support for equations, diagrams, and images in question_bank table

DO $$
DECLARE
question_bank_exists BOOLEAN;
BEGIN
    -- Check if question_bank exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'question_bank'
) INTO question_bank_exists;

RAISE NOTICE '📊 Migration 026 - question_bank: %',
        CASE WHEN question_bank_exists THEN '✅ EXISTS' ELSE '❌ NOT FOUND' END;

    IF question_bank_exists THEN
        RAISE NOTICE '📝 Adding enhanced columns to question_bank...';

        -- Add equations column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'question_bank'
            AND column_name = 'equations'
        ) THEN
ALTER TABLE question_bank ADD COLUMN equations JSONB DEFAULT '[]'::jsonb;
RAISE NOTICE '   ✅ Added equations column';
ELSE
            RAISE NOTICE '   ⏭️  equations already exists';
END IF;

        -- Add question_images column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'question_bank'
            AND column_name = 'question_images'
        ) THEN
ALTER TABLE question_bank ADD COLUMN question_images JSONB DEFAULT '[]'::jsonb;
RAISE NOTICE '   ✅ Added question_images column';
ELSE
            RAISE NOTICE '   ⏭️  question_images already exists';
END IF;

        -- Add has_diagrams column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'question_bank'
            AND column_name = 'has_diagrams'
        ) THEN
ALTER TABLE question_bank ADD COLUMN has_diagrams BOOLEAN DEFAULT FALSE;
RAISE NOTICE '   ✅ Added has_diagrams column';
ELSE
            RAISE NOTICE '   ⏭️  has_diagrams already exists';
END IF;

        -- Add diagram_description column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'question_bank'
            AND column_name = 'diagram_description'
        ) THEN
ALTER TABLE question_bank ADD COLUMN diagram_description TEXT;
RAISE NOTICE '   ✅ Added diagram_description column';
ELSE
            RAISE NOTICE '   ⏭️  diagram_description already exists';
END IF;

        -- Add raw_math_content column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'question_bank'
            AND column_name = 'raw_math_content'
        ) THEN
ALTER TABLE question_bank ADD COLUMN raw_math_content TEXT;
RAISE NOTICE '   ✅ Added raw_math_content column';
ELSE
            RAISE NOTICE '   ⏭️  raw_math_content already exists';
END IF;

        -- Add full_solution column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'question_bank'
            AND column_name = 'full_solution'
        ) THEN
ALTER TABLE question_bank ADD COLUMN full_solution TEXT;
RAISE NOTICE '   ✅ Added full_solution column';
ELSE
            RAISE NOTICE '   ⏭️  full_solution already exists';
END IF;

        -- Add solution_image_url column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'question_bank'
            AND column_name = 'solution_image_url'
        ) THEN
ALTER TABLE question_bank ADD COLUMN solution_image_url TEXT;
RAISE NOTICE '   ✅ Added solution_image_url column';
ELSE
            RAISE NOTICE '   ⏭️  solution_image_url already exists';
END IF;

        -- Add has_solution column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'question_bank'
            AND column_name = 'has_solution'
        ) THEN
ALTER TABLE question_bank ADD COLUMN has_solution BOOLEAN DEFAULT FALSE;
RAISE NOTICE '   ✅ Added has_solution column';
ELSE
            RAISE NOTICE '   ⏭️  has_solution already exists';
END IF;

        -- Add comments
EXECUTE 'COMMENT ON COLUMN question_bank.equations IS ''JSON array of mathematical equations in LaTeX format''';
EXECUTE 'COMMENT ON COLUMN question_bank.question_images IS ''JSON array of image URLs''';
EXECUTE 'COMMENT ON COLUMN question_bank.has_diagrams IS ''TRUE if question contains diagrams''';
EXECUTE 'COMMENT ON COLUMN question_bank.diagram_description IS ''Description of diagrams''';
EXECUTE 'COMMENT ON COLUMN question_bank.raw_math_content IS ''Raw mathematical content''';
EXECUTE 'COMMENT ON COLUMN question_bank.full_solution IS ''Complete step-by-step solution''';
EXECUTE 'COMMENT ON COLUMN question_bank.has_solution IS ''TRUE if solution exists''';

RAISE NOTICE '   ✅ Added column comments';

        RAISE NOTICE '🎉 Migration 026 completed successfully!';
ELSE
        RAISE NOTICE '⚠️  question_bank table not found - skipping';
END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Migration 026 failed: %', SQLERRM;
END $$;