// server/services/adaptiveDifficultyService.js - POSTGRESQL VERSION 🎯
import pool from '../config/database.js';

/**
 * 🚀 ADAPTIVE DIFFICULTY SERVICE
 * PostgreSQL version with adaptive_answers table
 */

class AdaptiveDifficultyService {

    // ==================== ✅ AUTO-CREATE USER IF NOT EXISTS ====================
    async ensureUserExists(firebaseUid) {
        try {
            console.log('👤 Checking if user exists:', firebaseUid);

            // PostgreSQL uses $1, $2 placeholders, not ?
            const result = await pool.query(
                `SELECT id, firebase_uid, display_name, grade 
                 FROM users 
                 WHERE firebase_uid = $1`,
                [firebaseUid]
            );

            // PostgreSQL returns { rows: [...] }, not an array
            if (result.rows.length === 0) {
                console.log('🆕 User not found in database, creating new user:', firebaseUid);

                const insertResult = await pool.query(
                    `INSERT INTO users (firebase_uid, email, display_name, grade, created_at, updated_at) 
                     VALUES ($1, $2, $3, $4, NOW(), NOW())
                     RETURNING id`,
                    [
                        firebaseUid,
                        `student_${firebaseUid.substring(0, 8)}@nexon.app`,
                        'Student',
                        'grade8'
                    ]
                );

                console.log('✅ User created successfully with ID:', insertResult.rows[0].id);
                return insertResult.rows[0].id;
            } else {
                console.log('✅ User already exists:', result.rows[0]);
                return result.rows[0].id;
            }
        } catch (error) {
            console.error('❌ Error ensuring user exists:', error);
            return null;
        }
    }

    // ==================== 📝 RECORD ANSWER TO ADAPTIVE_ANSWERS ====================
    async recordAnswer(firebaseUid, answerData) {
        try {
            const userId = await this.ensureUserExists(firebaseUid);
            if (!userId) {
                console.error('❌ Could not get user ID');
                return false;
            }

            const {
                topicId,
                subtopicId,
                difficulty,
                isCorrect,
                timeTaken,
                hintsUsed,
                attempts
            } = answerData;

            console.log('📝 Recording answer to adaptive_answers:', {
                userId,
                topicId,
                difficulty,
                isCorrect
            });

            // Insert into adaptive_answers table (not student_answers)
            await pool.query(
                `INSERT INTO adaptive_answers 
                (user_id, topic_id, subtopic_id, difficulty, is_correct, 
                 time_taken, hints_used, attempts, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
                [
                    userId,
                    topicId || null,
                    subtopicId || null,
                    difficulty,
                    isCorrect, // PostgreSQL accepts boolean directly
                    timeTaken || 0,
                    hintsUsed || 0,
                    attempts || 1
                ]
            );

            console.log('✅ Answer recorded successfully to adaptive_answers');
            return true;

        } catch (error) {
            console.error('❌ Error recording answer:', error);
            console.error('Error details:', error.message);
            return false;
        }
    }

    // ==================== 🎯 GET RECENT PERFORMANCE ====================
    async getRecentPerformance(firebaseUid, topicId = null, limit = 10) {
        try {
            const userId = await this.ensureUserExists(firebaseUid);
            if (!userId) {
                console.log('⚠️ User ID not found');
                return [];
            }

            let query = `
                SELECT difficulty, is_correct, time_taken, hints_used, created_at
                FROM adaptive_answers
                WHERE user_id = $1
            `;

            const params = [userId];

            if (topicId) {
                query += ` AND topic_id = $2`;
                params.push(topicId);
                query += ` ORDER BY created_at DESC LIMIT $3`;
                params.push(limit);
            } else {
                query += ` ORDER BY created_at DESC LIMIT $2`;
                params.push(limit);
            }

            const result = await pool.query(query, params);

            console.log(`📊 Found ${result.rows.length} recent answers for user ${userId}`);

            return result.rows.map(row => ({
                difficulty: row.difficulty,
                isCorrect: Boolean(row.is_correct),
                timeTaken: row.time_taken,
                hintsUsed: row.hints_used,
                timestamp: row.created_at
            }));

        } catch (error) {
            console.error('❌ Error getting recent performance:', error);
            return [];
        }
    }

    // ==================== 🔄 SHOULD ADJUST DIFFICULTY ====================
    async shouldAdjustDifficulty(firebaseUid, topicId, currentDifficulty, isCorrect) {
        try {
            console.log('🔄 [Adaptive] Checking adjustment:', {
                firebaseUid,
                topicId,
                currentDifficulty,
                isCorrect
            });

            // Record this answer first
            const recorded = await this.recordAnswer(firebaseUid, {
                topicId,
                difficulty: currentDifficulty,
                isCorrect
            });

            if (!recorded) {
                console.error('❌ Failed to record answer');
                return {
                    shouldAdjust: false,
                    newDifficulty: currentDifficulty,
                    reason: 'שגיאה בשמירת תשובה',
                    confidence: 0
                };
            }

            // Get recent performance (last 5 questions)
            const recentAnswers = await this.getRecentPerformance(firebaseUid, topicId, 5);

            console.log(`📊 Recent answers count: ${recentAnswers.length}`);

            // Need at least 3 questions to make a decision
            if (recentAnswers.length < 3) {
                console.log(`ℹ️ Not enough data yet (${recentAnswers.length}/3)`);
                return {
                    shouldAdjust: false,
                    newDifficulty: currentDifficulty,
                    reason: `צריך עוד ${3 - recentAnswers.length} תשובות כדי להתאים את הקושי`,
                    confidence: recentAnswers.length / 3
                };
            }

            // Calculate recent accuracy
            const correctCount = recentAnswers.filter(a => a.isCorrect).length;
            const accuracy = (correctCount / recentAnswers.length) * 100;

            console.log(`📈 Recent accuracy: ${accuracy.toFixed(1)}% (${correctCount}/${recentAnswers.length})`);

            // Decision logic
            let shouldAdjust = false;
            let newDifficulty = currentDifficulty;
            let reason = '';

            // Too easy - increase difficulty (90%+ accuracy)
            if (accuracy >= 90 && currentDifficulty !== 'hard') {
                shouldAdjust = true;
                newDifficulty = currentDifficulty === 'easy' ? 'medium' : 'hard';
                reason = `מצוין! עניתנו נכון על ${correctCount} מתוך ${recentAnswers.length} שאלות. זמן להעלות רמה! 🚀`;
            }
            // Good performance - move to medium (70-89%)
            else if (accuracy >= 70 && accuracy < 90 && currentDifficulty === 'easy') {
                shouldAdjust = true;
                newDifficulty = 'medium';
                reason = `יפה מאוד! אתה מתקדם יפה. בואו ננסה משהו קצת יותר מאתגר ⚡`;
            }
            // Struggling hard - decrease difficulty (<40%)
            else if (accuracy < 40 && currentDifficulty !== 'easy') {
                shouldAdjust = true;
                newDifficulty = currentDifficulty === 'hard' ? 'medium' : 'easy';
                reason = `בואו נחזור קצת אחורה ונחזק את היסודות 💪`;
            }
            // Medium performance on medium - move to easy (<50%)
            else if (accuracy < 50 && currentDifficulty === 'medium') {
                shouldAdjust = true;
                newDifficulty = 'easy';
                reason = `זה בסדר לקחת צעד אחורה. בואו נתרגל עוד קצת ברמה קלה יותר 🌱`;
            }

            if (shouldAdjust) {
                console.log(`✅ Adjustment RECOMMENDED: ${currentDifficulty} → ${newDifficulty}`);
                console.log(`   Reason: ${reason}`);
            } else {
                console.log(`ℹ️ No adjustment needed, staying at ${currentDifficulty}`);
                reason = `מצוין! ממשיכים ברמת קושי ${this.getDifficultyLabel(currentDifficulty)}`;
            }

            return {
                shouldAdjust,
                newDifficulty,
                reason,
                confidence: Math.min(recentAnswers.length / 5, 1),
                stats: {
                    accuracy: accuracy.toFixed(1),
                    correctCount,
                    totalCount: recentAnswers.length
                }
            };

        } catch (error) {
            console.error('❌ Error checking difficulty adjustment:', error);
            console.error('Stack:', error.stack);
            return {
                shouldAdjust: false,
                newDifficulty: currentDifficulty,
                reason: 'שגיאה בבדיקת רמת קושי',
                confidence: 0
            };
        }
    }

    // ==================== 🎯 GET RECOMMENDED DIFFICULTY ====================
    async getRecommendedDifficulty(firebaseUid, topicId = null) {
        try {
            console.log('🎯 Analyzing difficulty for user:', firebaseUid, 'topic:', topicId);

            await this.ensureUserExists(firebaseUid);

            const recentAnswers = await this.getRecentPerformance(firebaseUid, topicId, 10);

            if (recentAnswers.length === 0) {
                console.log('⚠️ No history found, returning default (medium)');
                return {
                    difficulty: 'medium',
                    confidence: 0,
                    message: 'זו השאלה הראשונה שלך! בואו נתחיל ברמה בינונית',
                    reason: 'אין נתונים קודמים',
                    details: null
                };
            }

            const correctCount = recentAnswers.filter(a => a.isCorrect).length;
            const accuracy = (correctCount / recentAnswers.length) * 100;

            const difficultyDistribution = {
                easy: recentAnswers.filter(a => a.difficulty === 'easy').length,
                medium: recentAnswers.filter(a => a.difficulty === 'medium').length,
                hard: recentAnswers.filter(a => a.difficulty === 'hard').length
            };

            let recommendedDifficulty;
            let message;
            let reason;

            if (accuracy >= 85) {
                recommendedDifficulty = 'hard';
                message = 'מעולה! אתה מוכן לאתגרים 🔥';
                reason = `דיוק גבוה של ${accuracy.toFixed(1)}%`;
            } else if (accuracy >= 60) {
                recommendedDifficulty = 'medium';
                message = 'טוב מאוד! ממשיכים להתקדם ⚡';
                reason = `ביצועים טובים - ${accuracy.toFixed(1)}% דיוק`;
            } else {
                recommendedDifficulty = 'easy';
                message = 'בואו נחזק את היסודות 🌱';
                reason = `צריך עוד תרגול - ${accuracy.toFixed(1)}% דיוק`;
            }

            return {
                difficulty: recommendedDifficulty,
                confidence: Math.min(recentAnswers.length / 10, 1),
                message,
                reason,
                details: {
                    accuracy: accuracy.toFixed(1),
                    correctCount,
                    totalCount: recentAnswers.length,
                    difficultyDistribution
                }
            };

        } catch (error) {
            console.error('❌ Error getting recommended difficulty:', error);
            return {
                difficulty: 'medium',
                confidence: 0,
                message: 'התחלה חדשה!',
                reason: 'שגיאה בניתוח',
                details: null
            };
        }
    }

    // ==================== 🎨 HELPER METHODS ====================
    getDifficultyEmoji(difficulty) {
        const emojis = {
            easy: '🌱',
            medium: '⚡',
            hard: '🔥'
        };
        return emojis[difficulty] || '⚡';
    }

    getDifficultyLabel(difficulty) {
        const labels = {
            easy: 'קל',
            medium: 'בינוני',
            hard: 'מאתגר'
        };
        return labels[difficulty] || 'בינוני';
    }
}

export default new AdaptiveDifficultyService();