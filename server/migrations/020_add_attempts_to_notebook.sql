-- Add attempts column to notebook_entries if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notebook_entries'
        AND column_name = 'attempts'
    ) THEN
ALTER TABLE notebook_entries ADD COLUMN attempts INTEGER DEFAULT 1;
END IF;
END $$;

-- Also add time_spent if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notebook_entries'
        AND column_name = 'time_spent'
    ) THEN
ALTER TABLE notebook_entries ADD COLUMN time_spent INTEGER DEFAULT 0;
END IF;
END $$;