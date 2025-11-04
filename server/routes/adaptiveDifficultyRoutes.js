// server/services/adaptiveDifficultyService.js - COMPLETE WITH AUTO-USER-CREATION 🎯
import db from '../config/database.js';

/**
 * 🚀 ADAPTIVE DIFFICULTY SERVICE
 * Handles intelligent difficulty adjustment based on student performance
 */

class AdaptiveDifficultyService {

    // ==================== ✅ AUTO-CREATE USER IF NOT EXISTS ====================
    async ensureUserExists(userId) {
        try {
            console.log('👤 Checking if user exists:', userId);

            // Check if user exists by firebase_uid or id
            const [rows] = await db.query(
                `SELECT id, firebase_uid, name, grade 
                 FROM users 
                 WHERE firebase_uid = ? OR id = ?`,
                [userId, userId]
            );

            if (rows.length === 0) {
                console.log('🆕 User not found in database, creating new user:', userId);

                // Insert new user with default values
                const [result] = await db.query(
                    `INSERT INTO users (firebase_uid, name, email, grade, created_at, updated_at) 
                     VALUES (?, ?, ?, ?, NOW(), NOW())`,
                    [
                        userId,                          // firebase_uid
                        'Student',                       // default name
                        `student_${userId}@nexon.app`,  // default email
                        '8'                              // default grade
                    ]
                );

                console.log('✅ User created successfully with ID:', result.insertId);
                return result.insertId;
            } else {
                console.log('✅ User already exists:', rows[0]);
                return rows[0].id;
            }
        } catch (error) {
            console.error('❌ Error ensuring user exists:', error);
            // Don't throw - return null and let app continue
            return null;
        }
    }

    // ==================== 📝 RECORD ANSWER ====================
    async recordAnswer(userId, answerData) {
        try {
            // Ensure user exists first
            await this.ensureUserExists(userId);

            const {
                topicId,
                subtopicId,
                difficulty,
                isCorrect,
                timeTaken,
                hintsUsed,
                attempts
            } = answerData;

            console.log('📝 Recording answer:', {
                userId,
                topicId,
                difficulty,
                isCorrect
            });

            // Insert answer record
            await db.query(
                `INSERT INTO student_answers 
                (user_id, topic_id, subtopic_id, difficulty, is_correct, time_taken, hints_used, attempts, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    userId,
                    topicId || 'general',
                    subtopicId || null,
                    difficulty,
                    isCorrect ? 1 : 0,
                    timeTaken || 0,
                    hintsUsed || 0,
                    attempts || 1
                ]
            );

            console.log('✅ Answer recorded successfully');
            return true;

        } catch (error) {
            console.error('❌ Error recording answer:', error);
            return false;
        }
    }

    // ==================== 🎯 GET RECENT PERFORMANCE ====================
    async getRecentPerformance(userId, topicId = null, limit = 10) {
        try {
            let query = `
                SELECT difficulty, is_correct, time_taken, hints_used, created_at
                FROM student_answers
                WHERE user_id = ?
            `;

            const params = [userId];

            if (topicId) {
                query += ` AND topic_id = ?`;
                params.push(topicId);
            }

            query += ` ORDER BY created_at DESC LIMIT ?`;
            params.push(limit);

            const [rows] = await db.query(query, params);

            console.log(`📊 Found ${rows.length} recent answers for user ${userId}`);

            return rows.map(row => ({
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
    async shouldAdjustDifficulty(userId, topicId, currentDifficulty, isCorrect) {
        try {
            console.log('🔄 Checking if should adjust difficulty:', {
                userId,
                topicId,
                currentDifficulty,
                isCorrect
            });

            // Ensure user exists
            await this.ensureUserExists(userId);

            // Record this answer first
            await this.recordAnswer(userId, {
                topicId,
                difficulty: currentDifficulty,
                isCorrect
            });

            // Get recent performance (last 3-5 questions)
            const recentAnswers = await this.getRecentPerformance(userId, topicId, 5);

            console.log(`📊 Recent answers count: ${recentAnswers.length}`);

            // Need at least 3 questions to make a decision
            if (recentAnswers.length < 3) {
                console.log('ℹ️ Not enough data yet, need at least 3 answers');
                return {
                    shouldAdjust: false,
                    newDifficulty: currentDifficulty,
                    reason: `צריך עוד ${3 - recentAnswers.length} תשובות כדי להתאים את הקושי`
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

            // Too easy - increase difficulty
            if (accuracy >= 90 && currentDifficulty !== 'hard') {
                shouldAdjust = true;
                newDifficulty = currentDifficulty === 'easy' ? 'medium' : 'hard';
                reason = `מצוין! עניתנו נכון על ${correctCount} מתוך ${recentAnswers.length} שאלות. זמן להעלות רמה! 🚀`;
            }
            // Good performance - move to medium
            else if (accuracy >= 70 && accuracy < 90 && currentDifficulty === 'easy') {
                shouldAdjust = true;
                newDifficulty = 'medium';
                reason = `יפה מאוד! אתה מתקדם יפה. בואו ננסה משהו קצת יותר מאתגר ⚡`;
            }
            // Struggling - decrease difficulty
            else if (accuracy < 40 && currentDifficulty !== 'easy') {
                shouldAdjust = true;
                newDifficulty = currentDifficulty === 'hard' ? 'medium' : 'easy';
                reason = `בואו נחזור קצת אחורה ונחזק את היסודות 💪`;
            }
            // Medium performance - might need adjustment
            else if (accuracy < 50 && currentDifficulty === 'medium') {
                shouldAdjust = true;
                newDifficulty = 'easy';
                reason = `זה בסדר לקחת צעד אחורה. בואו נתרגל עוד קצת ברמה קלה יותר 🌱`;
            }

            if (shouldAdjust) {
                console.log(`✅ Adjustment recommended: ${currentDifficulty} → ${newDifficulty}`);
            } else {
                console.log(`ℹ️ No adjustment needed, staying at ${currentDifficulty}`);
                reason = `מצוין! ממשיכים ברמת קושי ${this.getDifficultyLabel(currentDifficulty)}`;
            }

            return {
                shouldAdjust,
                newDifficulty,
                reason,
                confidence: Math.min(recentAnswers.length / 5, 1), // 0-1 scale
                stats: {
                    accuracy,
                    correctCount,
                    totalCount: recentAnswers.length
                }
            };

        } catch (error) {
            console.error('❌ Error checking difficulty adjustment:', error);
            return {
                shouldAdjust: false,
                newDifficulty: currentDifficulty,
                reason: 'שגיאה בבדיקת רמת קושי'
            };
        }
    }

    // ==================== 🎯 GET RECOMMENDED DIFFICULTY ====================
    async getRecommendedDifficulty(userId, topicId = null) {
        try {
            console.log('🎯 Analyzing difficulty for user:', userId, 'topic:', topicId);

            // Ensure user exists
            await this.ensureUserExists(userId);

            // Get recent performance
            const recentAnswers = await this.getRecentPerformance(userId, topicId, 10);

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

            // Calculate statistics
            const correctCount = recentAnswers.filter(a => a.isCorrect).length;
            const accuracy = (correctCount / recentAnswers.length) * 100;

            const difficultyDistribution = {
                easy: recentAnswers.filter(a => a.difficulty === 'easy').length,
                medium: recentAnswers.filter(a => a.difficulty === 'medium').length,
                hard: recentAnswers.filter(a => a.difficulty === 'hard').length
            };

            // Determine recommended difficulty
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