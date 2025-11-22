// server/services/missionTracker.js - FINAL VERSION
import pool from '../config/database.js';

class MissionTracker {
    async createMission({ userId, firebaseUid, title, description, missionType, config, points, deadline, createdBy }) {
        try {
            console.log('📝 Creating new mission:', { userId, title, missionType });

            const query = `
                INSERT INTO student_missions (
                    user_id, firebase_uid, title, description,
                    mission_type, config, points, deadline, created_by
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    RETURNING *
            `;

            const result = await pool.query(query, [
                userId, firebaseUid, title, description, missionType,
                JSON.stringify(config), points || 0, deadline, createdBy
            ]);

            const mission = result.rows[0];
            await this.initializeProgress(mission.id, userId, missionType, config);

            console.log('✅ Mission created:', mission.id);
            return { success: true, mission };

        } catch (error) {
            console.error('❌ Error creating mission:', error);
            return { success: false, error: error.message };
        }
    }

    async initializeProgress(missionId, userId, missionType, config) {
        try {
            let requiredCount = 0;

            if (missionType === 'practice') {
                requiredCount = config.requiredQuestions || 10;
            } else if (missionType === 'lecture') {
                requiredCount = config.requiredSections?.length || 0;
            }

            const query = `
                INSERT INTO student_mission_progress (
                    mission_id, user_id, current_count, required_count, progress_data
                )
                VALUES ($1, $2, 0, $3, $4)
                    ON CONFLICT (mission_id, user_id) DO NOTHING
            `;

            await pool.query(query, [
                missionId, userId, requiredCount,
                JSON.stringify({ initialized: true, startedAt: new Date().toISOString() })
            ]);

        } catch (error) {
            console.error('❌ Error initializing progress:', error);
        }
    }

    async trackPracticeAttempt({ missionId, userId, questionId, questionText, isCorrect }) {
        try {
            console.log('📊 Tracking practice attempt:', { missionId, userId, questionId, isCorrect });

            const checkQuery = `
                SELECT * FROM practice_question_attempts
                WHERE mission_id = $1 AND user_id = $2 AND question_id = $3
            `;
            const checkResult = await pool.query(checkQuery, [missionId, userId, questionId]);

            let countsForMission = false;

            if (checkResult.rows.length === 0) {
                countsForMission = true;
                await pool.query(`
                    INSERT INTO practice_question_attempts (
                        mission_id, user_id, question_id, question_text,
                        is_correct, attempts_count, counts_for_mission
                    ) VALUES ($1, $2, $3, $4, $5, 1, TRUE)
                `, [missionId, userId, questionId, questionText, isCorrect]);
            } else {
                countsForMission = false;
                await pool.query(`
                    UPDATE practice_question_attempts
                    SET attempts_count = attempts_count + 1,
                        last_attempt_at = CURRENT_TIMESTAMP,
                        is_correct = $1
                    WHERE mission_id = $2 AND user_id = $3 AND question_id = $4
                `, [isCorrect, missionId, userId, questionId]);
            }

            if (countsForMission) {
                await this.updatePracticeProgress(missionId, userId);
            }

            await this.checkCompletion(missionId, userId);

            return { success: true, countsForMission };

        } catch (error) {
            console.error('❌ Error tracking practice attempt:', error);
            return { success: false, error: error.message };
        }
    }

    async updatePracticeProgress(missionId, userId) {
        try {
            const countResult = await pool.query(`
                SELECT COUNT(*) as unique_count,
                       SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count
                FROM practice_question_attempts
                WHERE mission_id = $1 AND user_id = $2 AND counts_for_mission = TRUE
            `, [missionId, userId]);

            const uniqueCount = parseInt(countResult.rows[0].unique_count);
            const correctCount = parseInt(countResult.rows[0].correct_count);
            const accuracy = uniqueCount > 0 ? (correctCount / uniqueCount) * 100 : 0;

            await pool.query(`
                UPDATE student_mission_progress
                SET current_count = $1,
                    accuracy = $2,
                    last_activity = CURRENT_TIMESTAMP,
                    progress_data = jsonb_set(progress_data, '{uniqueQuestions}', $3::jsonb)
                WHERE mission_id = $4 AND user_id = $5
            `, [uniqueCount, accuracy.toFixed(2), JSON.stringify(uniqueCount), missionId, userId]);

            console.log(`✅ Progress: ${uniqueCount} questions, ${accuracy.toFixed(1)}% accuracy`);

        } catch (error) {
            console.error('❌ Error updating practice progress:', error);
        }
    }

    async trackLectureSection({ missionId, userId, lectureId, sectionId, timeSpent }) {
        try {
            console.log('📚 Tracking lecture section:', { missionId, userId, lectureId, sectionId });

            await pool.query(`
                INSERT INTO lecture_section_progress (
                    mission_id, user_id, lecture_id, section_id,
                    is_completed, time_spent, completed_at
                ) VALUES ($1, $2, $3, $4, TRUE, $5, CURRENT_TIMESTAMP)
                ON CONFLICT (mission_id, user_id, lecture_id, section_id)
                DO UPDATE SET
                    is_completed = TRUE,
                    time_spent = lecture_section_progress.time_spent + $5,
                    completed_at = CURRENT_TIMESTAMP
            `, [missionId, userId, lectureId, sectionId, timeSpent || 0]);

            await this.updateLectureProgress(missionId, userId);
            await this.checkCompletion(missionId, userId);

            return { success: true };

        } catch (error) {
            console.error('❌ Error tracking lecture section:', error);
            return { success: false, error: error.message };
        }
    }

    async updateLectureProgress(missionId, userId) {
        try {
            const result = await pool.query(`
                SELECT COUNT(*) as completed_count, SUM(time_spent) as total_time
                FROM lecture_section_progress
                WHERE mission_id = $1 AND user_id = $2 AND is_completed = TRUE
            `, [missionId, userId]);

            const completedCount = parseInt(result.rows[0].completed_count);
            const totalTime = parseInt(result.rows[0].total_time) || 0;

            await pool.query(`
                UPDATE student_mission_progress
                SET current_count = $1,
                    last_activity = CURRENT_TIMESTAMP,
                    progress_data = jsonb_set(progress_data, '{totalTimeSpent}', $2::jsonb)
                WHERE mission_id = $3 AND user_id = $4
            `, [completedCount, JSON.stringify(totalTime), missionId, userId]);

            console.log(`✅ Lecture: ${completedCount} sections completed`);

        } catch (error) {
            console.error('❌ Error updating lecture progress:', error);
        }
    }

    async checkCompletion(missionId, userId) {
        try {
            // Use the correct function name
            const query = 'SELECT check_student_mission_completion($1, $2) as is_complete';
            const result = await pool.query(query, [missionId, userId]);
            const isComplete = result.rows[0].is_complete;

            if (isComplete) {
                console.log(`🎉 Mission ${missionId} completed by user ${userId}!`);
                await this.awardPoints(missionId, userId);
            }

            return isComplete;

        } catch (error) {
            console.error('❌ Error checking completion:', error);
            return false;
        }
    }

    async awardPoints(missionId, userId) {
        try {
            const result = await pool.query('SELECT points FROM student_missions WHERE id = $1', [missionId]);
            const points = result.rows[0]?.points || 0;

            if (points > 0) {
                console.log(`🏆 Awarding ${points} points to user ${userId}`);
            }

        } catch (error) {
            console.error('❌ Error awarding points:', error);
        }
    }

    async getUserMissions(userId) {
        try {
            const result = await pool.query(`
                SELECT 
                    m.*,
                    mp.current_count, mp.required_count, mp.accuracy,
                    mp.last_activity, mp.progress_data,
                    CASE 
                        WHEN mp.required_count > 0 THEN 
                            (mp.current_count::FLOAT / mp.required_count::FLOAT * 100)
                        ELSE 0 
                    END as progress_percentage
                FROM student_missions m
                LEFT JOIN student_mission_progress mp ON m.id = mp.mission_id AND mp.user_id = $1
                WHERE m.user_id = $1
                ORDER BY 
                    CASE m.status WHEN 'active' THEN 1 WHEN 'completed' THEN 2 ELSE 3 END,
                    m.deadline ASC NULLS LAST,
                    m.created_at DESC
            `, [userId]);

            return { success: true, missions: result.rows };

        } catch (error) {
            console.error('❌ Error getting user missions:', error);
            return { success: false, error: error.message };
        }
    }

    async getMissionDetails(missionId, userId) {
        try {
            const result = await pool.query(`
                SELECT m.*, mp.current_count, mp.required_count, mp.accuracy, mp.progress_data
                FROM student_missions m
                LEFT JOIN student_mission_progress mp ON m.id = mp.mission_id AND mp.user_id = $1
                WHERE m.id = $2
            `, [userId, missionId]);

            if (result.rows.length === 0) {
                return { success: false, error: 'Mission not found' };
            }

            const mission = result.rows[0];

            if (mission.mission_type === 'practice') {
                const attempts = await pool.query(`
                    SELECT question_id, question_text, is_correct, attempts_count,
                           counts_for_mission, first_attempt_at, last_attempt_at
                    FROM practice_question_attempts
                    WHERE mission_id = $1 AND user_id = $2
                    ORDER BY first_attempt_at DESC
                `, [missionId, userId]);
                mission.attempts = attempts.rows;
            }

            if (mission.mission_type === 'lecture') {
                const sections = await pool.query(`
                    SELECT section_id, is_completed, time_spent, started_at, completed_at
                    FROM lecture_section_progress
                    WHERE mission_id = $1 AND user_id = $2
                    ORDER BY started_at ASC
                `, [missionId, userId]);
                mission.sections = sections.rows;
            }

            return { success: true, mission };

        } catch (error) {
            console.error('❌ Error getting mission details:', error);
            return { success: false, error: error.message };
        }
    }
}

export default new MissionTracker();