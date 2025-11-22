-- server/migrations/029_cleanup_old_missions.sql
-- Cleanup old missions table before creating student_missions

-- ============================================================
-- Drop ALL old missions-related objects
-- ============================================================

-- Drop indexes first (if they exist)
DROP INDEX IF EXISTS idx_missions_type CASCADE;
DROP INDEX IF EXISTS idx_missions_user_id CASCADE;
DROP INDEX IF EXISTS idx_missions_status CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS update_missions_updated_at ON missions CASCADE;

-- Drop tables in correct order (newest to oldest dependencies)
DROP TABLE IF EXISTS mission_attempts CASCADE;
DROP TABLE IF EXISTS mission_progress CASCADE;
DROP TABLE IF EXISTS missions CASCADE;

-- Drop any old functions related to missions
DROP FUNCTION IF EXISTS update_missions_updated_at() CASCADE;
DROP FUNCTION IF EXISTS check_mission_completion(INTEGER, INTEGER) CASCADE;

-- Confirm cleanup
SELECT 'Old missions tables and objects cleaned up successfully!' as status;