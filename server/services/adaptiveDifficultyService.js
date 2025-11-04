// server/services/adaptiveDifficultyService.js - FIXED WITH RECORDING 🎯
import pool from '../config/database.js';

class AdaptiveDifficultyService {
    constructor() {
        this.DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];

        // Thresholds for difficulty adjustment
        this.THRESHOLDS = {
            INCREASE_ACCURACY: 85,
            INCREASE_STREAK: 5,
            DECREASE_ACCURACY: 40,
            DECREASE_STREAK: 3,
            STABLE_MIN: 60,
            STABLE_MAX: 85
        };

        this.MIN_QUESTIONS = 3;
        this.RECENT_WINDOW = 5; // Only look at last 5 for faster decisions
    }

    // ==================== ✅ AUTO-CREATE USER ====================
    async ensureUserExists(firebaseUid) {
        try {
            console.log('👤 Checking user exists:', firebaseUid);

            const userResult = await pool.query(
                'SELECT id FROM users WHERE firebase_uid = $1',
                [firebaseUid]
            );

            if (userResult.rows.length === 0) {
                console.log('🆕 Creating new user:', firebaseUid);

                const result = await pool.query(
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

                console.log('✅ User created with ID:', result.rows[0].id);
                return result.rows[0].id;
            }

            console.log('✅ User exists with ID:', userResult.rows[0].id);
            return userResult.rows[0].id;

        } catch (error) {
            console.error('❌ Error ensuring user:', error);
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

            console.log('📝 Recording to adaptive_answers:', {
                userId,
                topicId,
                difficulty,
                isCorrect
            });

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
                    isCorrect,
                    timeTaken || 0,
                    hintsUsed || 0,
                    attempts || 1
                ]
            );

            console.log('✅ Answer recorded to adaptive_answers');
            return true;

        } catch (error) {
            console.error('❌ Error recording answer:', error);
            return false;
        }
    }

    // ==================== 🎯 GET RECENT PERFORMANCE FROM ADAPTIVE_ANSWERS ====================
    async getRecentAdaptiveAnswers(firebaseUid, topicId = null, limit = 5) {
        try {
            const userId = await this.ensureUserExists(firebaseUid);
            if (!userId) return [];

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

            console.log(`📊 Found ${result.rows.length} recent adaptive answers`);

            return result.rows.map(row => ({
                difficulty: row.difficulty,
                isCorrect: Boolean(row.is_correct),
                timeTaken: row.time_taken,
                hintsUsed: row.hints_used,
                timestamp: row.created_at
            }));

        } catch (error) {
            console.error('❌ Error getting recent adaptive answers:', error);
            return [];
        }
    }

    // ==================== 🔄 SHOULD ADJUST DIFFICULTY (MAIN FUNCTION) ====================
    async shouldAdjustDifficulty(firebaseUid, topicId, currentDifficulty, isCorrect) {
        try {
            console.log('🔄 [Adaptive] Checking adjustment:', {
                firebaseUid,
                topicId,
                currentDifficulty,
                isCorrect
            });

            // ✅ STEP 1: Record this answer first
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
                    reason: 'שגיאה בשמירה',
                    confidence: 0
                };
            }

            // ✅ STEP 2: Get recent answers
            const recentAnswers = await this.getRecentAdaptiveAnswers(firebaseUid, topicId, 5);

            console.log(`📊 Recent answers: ${recentAnswers.length}`);

            // ✅ STEP 3: Need at least 3 answers
            if (recentAnswers.length < this.MIN_QUESTIONS) {
                console.log(`ℹ️ Not enough data (${recentAnswers.length}/${this.MIN_QUESTIONS})`);
                return {
                    shouldAdjust: false,
                    newDifficulty: currentDifficulty,
                    reason: `צריך עוד ${this.MIN_QUESTIONS - recentAnswers.length} תשובות`,
                    confidence: recentAnswers.length / this.MIN_QUESTIONS
                };
            }

            // ✅ STEP 4: Calculate accuracy
            const correctCount = recentAnswers.filter(a => a.isCorrect).length;
            const accuracy = (correctCount / recentAnswers.length) * 100;

            console.log(`📈 Accuracy: ${accuracy.toFixed(1)}% (${correctCount}/${recentAnswers.length})`);

            // ✅ STEP 5: Calculate streak
            const streak = this.calculateStreakFromAnswers(recentAnswers);

            // ✅ STEP 6: Decision logic
            let shouldAdjust = false;
            let newDifficulty = currentDifficulty;
            let reason = '';

            // 🔥 TOO EASY - INCREASE
            if (accuracy >= this.THRESHOLDS.INCREASE_ACCURACY && currentDifficulty !== 'hard') {
                shouldAdjust = true;
                newDifficulty = currentDifficulty === 'easy' ? 'medium' : 'hard';
                reason = `מצוין! ${correctCount}/${recentAnswers.length} נכון. זמן להעלות רמה! 🚀`;
            }
            // Good on easy → medium
            else if (accuracy >= 70 && currentDifficulty === 'easy') {
                shouldAdjust = true;
                newDifficulty = 'medium';
                reason = `יפה מאוד! בואו ננסה רמה בינונית ⚡`;
            }
            // 🌱 STRUGGLING - DECREASE
            else if (accuracy < this.THRESHOLDS.DECREASE_ACCURACY && currentDifficulty !== 'easy') {
                shouldAdjust = true;
                newDifficulty = currentDifficulty === 'hard' ? 'medium' : 'easy';
                reason = `בואו נחזק את היסודות 💪`;
            }
            else if (accuracy < 50 && currentDifficulty === 'medium') {
                shouldAdjust = true;
                newDifficulty = 'easy';
                reason = `בואו נתרגל ברמה קלה יותר 🌱`;
            }
            // Streak-based (3+ wrong in a row)
            else if (streak.type === 'incorrect' && streak.count >= this.THRESHOLDS.DECREASE_STREAK) {
                if (currentDifficulty !== 'easy') {
                    shouldAdjust = true;
                    newDifficulty = currentDifficulty === 'hard' ? 'medium' : 'easy';
                    reason = `${streak.count} שגיאות ברצף - בואו נוריד רמה 💙`;
                }
            }

            if (shouldAdjust) {
                console.log(`✅ ADJUSTMENT: ${currentDifficulty} → ${newDifficulty}`);
            } else {
                console.log(`ℹ️ No adjustment, staying at ${currentDifficulty}`);
                reason = `ממשיכים ב${this.getDifficultyLabel(currentDifficulty)}`;
            }

            return {
                shouldAdjust,
                newDifficulty,
                reason,
                confidence: Math.min(recentAnswers.length / 5, 1),
                stats: {
                    accuracy: accuracy.toFixed(1),
                    correctCount,
                    totalCount: recentAnswers.length,
                    streak
                }
            };

        } catch (error) {
            console.error('❌ Error in shouldAdjustDifficulty:', error);
            return {
                shouldAdjust: false,
                newDifficulty: currentDifficulty,
                reason: 'שגיאה',
                confidence: 0
            };
        }
    }

    // ==================== 🎯 GET RECOMMENDED DIFFICULTY ====================
    async getRecommendedDifficulty(firebaseUid, topicId = null) {
        try {
            console.log('🎯 Getting recommendation for:', firebaseUid);

            await this.ensureUserExists(firebaseUid);

            const recentAnswers = await this.getRecentAdaptiveAnswers(firebaseUid, topicId, 10);

            if (recentAnswers.length === 0) {
                console.log('⚠️ No data, returning medium');
                return {
                    difficulty: 'medium',
                    reason: 'no_data',
                    confidence: 0,
                    message: 'התחל מרמת בינוני'
                };
            }

            const correctCount = recentAnswers.filter(a => a.isCorrect).length;
            const accuracy = (correctCount / recentAnswers.length) * 100;

            let difficulty, message;

            if (accuracy >= 85) {
                difficulty = 'hard';
                message = 'מצוין! מוכן לאתגרים 🔥';
            } else if (accuracy >= 60) {
                difficulty = 'medium';
                message = 'טוב מאוד! ממשיכים ⚡';
            } else {
                difficulty = 'easy';
                message = 'בואו נחזק יסודות 🌱';
            }

            return {
                difficulty,
                reason: 'performance',
                confidence: Math.min(recentAnswers.length / 10, 1),
                message,
                details: {
                    accuracy: accuracy.toFixed(1),
                    correctCount,
                    totalCount: recentAnswers.length
                }
            };

        } catch (error) {
            console.error('❌ Error in getRecommendedDifficulty:', error);
            return {
                difficulty: 'medium',
                reason: 'error',
                confidence: 0,
                message: 'התחל מבינוני'
            };
        }
    }

    // ==================== 📊 HELPER: CALCULATE STREAK ====================
    calculateStreakFromAnswers(answers) {
        if (answers.length === 0) {
            return { count: 0, type: null };
        }

        let count = 0;
        const firstResult = answers[0].isCorrect;

        for (const answer of answers) {
            if (answer.isCorrect === firstResult) {
                count++;
            } else {
                break;
            }
        }

        return {
            count,
            type: firstResult ? 'correct' : 'incorrect'
        };
    }

    // Keep your existing sophisticated analysis methods for future use
    // (they can read from notebook_entries for long-term analysis)
    async getPerformanceMetrics(internalUserId, topicId = null) {
        // ... keep your existing implementation ...
        // This can be used for detailed analytics dashboard
    }

    calculateStreak(entries) {
        // ... keep existing ...
    }

    analyzeDifficultyBreakdown(entries) {
        // ... keep existing ...
    }

    analyzeTrend(entries) {
        // ... keep existing ...
    }

    analyzeTimePattern(entries) {
        // ... keep existing ...
    }

    analyzeAndRecommend(performance) {
        // ... keep existing ...
    }

    getMostFrequent(arr) {
        // ... keep existing ...
    }

    // ==================== 🎨 HELPER METHODS ====================
    getDifficultyLabel(difficulty) {
        const labels = {
            easy: 'קל',
            medium: 'בינוני',
            hard: 'מאתגר'
        };
        return labels[difficulty] || 'בינוני';
    }

    getDifficultyEmoji(difficulty) {
        const emojis = {
            easy: '🌱',
            medium: '⚡',
            hard: '🔥'
        };
        return emojis[difficulty] || '⚡';
    }
}

const adaptiveDifficultyService = new AdaptiveDifficultyService();
export default adaptiveDifficultyService;