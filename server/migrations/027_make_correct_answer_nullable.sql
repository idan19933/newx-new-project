-- Migration 027: Make correct_answer nullable
-- Some questions (open-ended, essay) don't have a single correct answer

DO $$
BEGIN
    RAISE NOTICE '📝 Migration 027 - Making correct_answer nullable...';

    -- Check if question_bank exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'question_bank'
    ) THEN
        -- Make correct_answer nullable
ALTER TABLE question_bank
    ALTER COLUMN correct_answer DROP NOT NULL;

RAISE NOTICE '   ✅ correct_answer is now nullable';

        -- Also make explanation nullable if needed
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'question_bank'
            AND column_name = 'explanation'
            AND is_nullable = 'NO'
        ) THEN
ALTER TABLE question_bank
    ALTER COLUMN explanation DROP NOT NULL;
RAISE NOTICE '   ✅ explanation is now nullable';
ELSE
            RAISE NOTICE '   ⏭️  explanation already nullable';
END IF;

        -- Make solution_steps nullable if needed
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'question_bank'
            AND column_name = 'solution_steps'
            AND is_nullable = 'NO'
        ) THEN
ALTER TABLE question_bank
    ALTER COLUMN solution_steps DROP NOT NULL;
RAISE NOTICE '   ✅ solution_steps is now nullable';
ELSE
            RAISE NOTICE '   ⏭️  solution_steps already nullable';
END IF;

        RAISE NOTICE '🎉 Migration 027 completed successfully!';
ELSE
        RAISE NOTICE '⚠️  question_bank table not found';
END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Migration 027 failed: %', SQLERRM;
END $$;