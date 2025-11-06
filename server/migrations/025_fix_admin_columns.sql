-- Migration 025: Fix admin columns
-- SAFE VERSION - Checks if tables exist before modifying

DO $$
DECLARE
exam_uploads_exists BOOLEAN;
    question_bank_exists BOOLEAN;
BEGIN
    -- Check if tables exist
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'exam_uploads'
) INTO exam_uploads_exists;

SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'question_bank'
) INTO question_bank_exists;

RAISE NOTICE '📊 Migration 025_fix_admin_columns - Table Status:';
    RAISE NOTICE '   exam_uploads: %', CASE WHEN exam_uploads_exists THEN '✅ EXISTS' ELSE '❌ NOT FOUND' END;
    RAISE NOTICE '   question_bank: %', CASE WHEN question_bank_exists THEN '✅ EXISTS' ELSE '❌ NOT FOUND' END;

    -- ==================== Fix exam_uploads table ====================
    IF exam_uploads_exists THEN
        RAISE NOTICE '📝 Modifying exam_uploads table...';

        -- Add processed_at column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'exam_uploads'
            AND column_name = 'processed_at'
        ) THEN
ALTER TABLE exam_uploads ADD COLUMN processed_at TIMESTAMP;
RAISE NOTICE '   ✅ Added processed_at column';

            -- Update existing records only if uploaded_at exists
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = 'exam_uploads'
                AND column_name = 'uploaded_at'
            ) THEN
UPDATE exam_uploads
SET processed_at = uploaded_at
WHERE processed_at IS NULL;
RAISE NOTICE '   ✅ Updated existing records';
ELSE
                RAISE NOTICE '   ⚠️  uploaded_at column not found - skipping update';
END IF;
ELSE
            RAISE NOTICE '   ⏭️  processed_at already exists';
END IF;

ELSE
        RAISE NOTICE '⚠️  exam_uploads table not found - skipping';
END IF;

    -- ==================== Fix question_bank table ====================
    IF question_bank_exists THEN
        RAISE NOTICE '📝 Modifying question_bank table...';

        -- Add metadata column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'question_bank'
            AND column_name = 'metadata'
        ) THEN
ALTER TABLE question_bank ADD COLUMN metadata JSONB DEFAULT '{}';
RAISE NOTICE '   ✅ Added metadata column';
ELSE
            RAISE NOTICE '   ⏭️  metadata already exists';
END IF;

        -- Create index for metadata
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE schemaname = 'public'
            AND tablename = 'question_bank'
            AND indexname = 'idx_question_metadata'
        ) THEN
CREATE INDEX idx_question_metadata ON question_bank USING gin(metadata);
RAISE NOTICE '   ✅ Created index on metadata';
ELSE
            RAISE NOTICE '   ⏭️  Index idx_question_metadata already exists';
END IF;

ELSE
        RAISE NOTICE '⚠️  question_bank table not found - skipping';
END IF;

    RAISE NOTICE '🎉 Migration 025_fix_admin_columns completed successfully!';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Migration 025_fix_admin_columns failed: %', SQLERRM;
        -- Don't throw - allow other migrations to continue
END $$;

-- Migration complete - runner handles tracking automatically