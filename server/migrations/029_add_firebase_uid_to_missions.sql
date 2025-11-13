-- Migration: Add firebase_uid to missions table
-- This allows missions to be queried by firebase_uid from the user dashboard

-- Add firebase_uid column to missions table
ALTER TABLE missions
    ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(255);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_missions_firebase_uid ON missions(firebase_uid);

-- Update existing missions with firebase_uid from users table
UPDATE missions m
SET firebase_uid = u.firebase_uid
    FROM users u
WHERE m.user_id = u.id
  AND m.firebase_uid IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN missions.firebase_uid IS 'Firebase UID for looking up missions from user dashboard';

COMMIT;