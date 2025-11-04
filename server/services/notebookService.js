// server/services/notebookService.js - BACKEND SERVICE ✅
import pool from '../config/database.js';

class NotebookService {
    /**
     * Save a new notebook entry
     */
    async saveEntry(userId, entryData) {
        try {
            console.log('📝 Saving notebook entry:', { userId, topic: entryData.topic });

            // Get internal user ID
            const userQuery = 'SELECT id FROM users WHERE firebase_uid = $1';
            const userResult = await pool.query(userQuery, [userId]);

            if (userResult.rows.length === 0) {
                throw new Error('User not found');
            }

            const internalUserId = userResult.rows[0].id;

            // Insert entry with difficulty
            const insertQuery = `
                INSERT INTO notebook_entries (
                    user_id,
                    question_text,
                    correct_answer,
                    student_answer,
                    is_correct,
                    topic,
                    subtopic,
                    difficulty,
                    hints_used,
                    attempts,
                    time_spent,
                    created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
                RETURNING *
            `;

            const values = [
                internalUserId,
                entryData.question,
                entryData.correctAnswer || '',
                entryData.studentAnswer || '',
                entryData.isCorrect,
                entryData.topic || 'כללי',
                entryData.subtopic || '',
                entryData.difficulty || 'medium', // ✅ DIFFICULTY FIELD
                entryData.hintsUsed || 0,
                entryData.attempts || 1,
                entryData.timeSpent || 0
            ];

            const result = await pool.query(insertQuery, values);

            console.log('✅ Entry saved successfully');

            return {
                success: true,
                entry: result.rows[0]
            };

        } catch (error) {
            console.error('❌ Error saving entry:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get all entries for a user
     */
    async getEntries(userId) {
        try {
            const userQuery = 'SELECT id FROM users WHERE firebase_uid = $1';
            const userResult = await pool.query(userQuery, [userId]);

            if (userResult.rows.length === 0) {
                return {
                    success: true,
                    entries: []
                };
            }

            const internalUserId = userResult.rows[0].id;

            const entriesQuery = `
                SELECT 
                    id,
                    question_text,
                    correct_answer,
                    student_answer,
                    is_correct,
                    topic,
                    subtopic,
                    difficulty,
                    hints_used,
                    attempts,
                    time_spent,
                    created_at
                FROM notebook_entries
                WHERE user_id = $1
                ORDER BY created_at DESC
            `;

            const result = await pool.query(entriesQuery, [internalUserId]);

            return {
                success: true,
                entries: result.rows
            };

        } catch (error) {
            console.error('❌ Error getting entries:', error);
            return {
                success: false,
                error: error.message,
                entries: []
            };
        }
    }

    /**
     * Get entries by topic
     */
    async getEntriesByTopic(userId, topic) {
        try {
            const userQuery = 'SELECT id FROM users WHERE firebase_uid = $1';
            const userResult = await pool.query(userQuery, [userId]);

            if (userResult.rows.length === 0) {
                return {
                    success: true,
                    entries: []
                };
            }

            const internalUserId = userResult.rows[0].id;

            const entriesQuery = `
                SELECT * FROM notebook_entries
                WHERE user_id = $1 AND topic = $2
                ORDER BY created_at DESC
            `;

            const result = await pool.query(entriesQuery, [internalUserId, topic]);

            return {
                success: true,
                entries: result.rows
            };

        } catch (error) {
            console.error('❌ Error getting entries by topic:', error);
            return {
                success: false,
                error: error.message,
                entries: []
            };
        }
    }

    /**
     * Get entries by difficulty
     */
    async getEntriesByDifficulty(userId, difficulty) {
        try {
            const userQuery = 'SELECT id FROM users WHERE firebase_uid = $1';
            const userResult = await pool.query(userQuery, [userId]);

            if (userResult.rows.length === 0) {
                return {
                    success: true,
                    entries: []
                };
            }

            const internalUserId = userResult.rows[0].id;

            const entriesQuery = `
                SELECT * FROM notebook_entries
                WHERE user_id = $1 AND difficulty = $2
                ORDER BY created_at DESC
            `;

            const result = await pool.query(entriesQuery, [internalUserId, difficulty]);

            return {
                success: true,
                entries: result.rows
            };

        } catch (error) {
            console.error('❌ Error getting entries by difficulty:', error);
            return {
                success: false,
                error: error.message,
                entries: []
            };
        }
    }

    /**
     * Get notebook statistics
     */
    async getStats(userId) {
        try {
            const userQuery = 'SELECT id FROM users WHERE firebase_uid = $1';
            const userResult = await pool.query(userQuery, [userId]);

            if (userResult.rows.length === 0) {
                return {
                    success: true,
                    stats: {
                        totalQuestions: 0,
                        correctAnswers: 0,
                        accuracy: 0,
                        byTopic: {},
                        byDifficulty: {}
                    }
                };
            }

            const internalUserId = userResult.rows[0].id;

            // Overall stats
            const statsQuery = `
                SELECT 
                    COUNT(*) as total_questions,
                    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_answers,
                    ROUND(AVG(CASE WHEN is_correct THEN 1 ELSE 0 END) * 100) as accuracy
                FROM notebook_entries
                WHERE user_id = $1
            `;
            const statsResult = await pool.query(statsQuery, [internalUserId]);
            const stats = statsResult.rows[0];

            // Stats by topic
            const topicQuery = `
                SELECT 
                    topic,
                    COUNT(*) as total,
                    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct,
                    ROUND(AVG(CASE WHEN is_correct THEN 1 ELSE 0 END) * 100) as accuracy
                FROM notebook_entries
                WHERE user_id = $1
                GROUP BY topic
            `;
            const topicResult = await pool.query(topicQuery, [internalUserId]);

            // Stats by difficulty
            const difficultyQuery = `
                SELECT 
                    difficulty,
                    COUNT(*) as total,
                    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct,
                    ROUND(AVG(CASE WHEN is_correct THEN 1 ELSE 0 END) * 100) as accuracy
                FROM notebook_entries
                WHERE user_id = $1
                GROUP BY difficulty
            `;
            const difficultyResult = await pool.query(difficultyQuery, [internalUserId]);

            // Format results
            const byTopic = {};
            topicResult.rows.forEach(row => {
                byTopic[row.topic] = {
                    total: parseInt(row.total),
                    correct: parseInt(row.correct),
                    accuracy: parseInt(row.accuracy) || 0
                };
            });

            const byDifficulty = {};
            difficultyResult.rows.forEach(row => {
                byDifficulty[row.difficulty] = {
                    total: parseInt(row.total),
                    correct: parseInt(row.correct),
                    accuracy: parseInt(row.accuracy) || 0
                };
            });

            return {
                success: true,
                stats: {
                    totalQuestions: parseInt(stats.total_questions) || 0,
                    correctAnswers: parseInt(stats.correct_answers) || 0,
                    accuracy: parseInt(stats.accuracy) || 0,
                    byTopic,
                    byDifficulty
                }
            };

        } catch (error) {
            console.error('❌ Error getting stats:', error);
            return {
                success: false,
                error: error.message,
                stats: null
            };
        }
    }

    /**
     * Get weak topics (< 60% accuracy)
     */
    async getWeakTopics(userId) {
        try {
            const userQuery = 'SELECT id FROM users WHERE firebase_uid = $1';
            const userResult = await pool.query(userQuery, [userId]);

            if (userResult.rows.length === 0) {
                return {
                    success: true,
                    topics: []
                };
            }

            const internalUserId = userResult.rows[0].id;

            const weakQuery = `
                SELECT 
                    topic,
                    COUNT(*) as attempts,
                    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct,
                    ROUND(AVG(CASE WHEN is_correct THEN 1 ELSE 0 END) * 100) as accuracy
                FROM notebook_entries
                WHERE user_id = $1
                GROUP BY topic
                HAVING AVG(CASE WHEN is_correct THEN 1 ELSE 0 END) * 100 < 60
                ORDER BY accuracy ASC
            `;

            const result = await pool.query(weakQuery, [internalUserId]);

            return {
                success: true,
                topics: result.rows
            };

        } catch (error) {
            console.error('❌ Error getting weak topics:', error);
            return {
                success: false,
                error: error.message,
                topics: []
            };
        }
    }

    /**
     * Delete an entry
     */
    async deleteEntry(entryId) {
        try {
            const deleteQuery = 'DELETE FROM notebook_entries WHERE id = $1 RETURNING *';
            const result = await pool.query(deleteQuery, [entryId]);

            if (result.rows.length === 0) {
                return {
                    success: false,
                    error: 'Entry not found'
                };
            }

            return {
                success: true,
                message: 'Entry deleted successfully'
            };

        } catch (error) {
            console.error('❌ Error deleting entry:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get performance analytics for adaptive difficulty
     */
    async getPerformanceAnalytics(userId) {
        try {
            const userQuery = 'SELECT id FROM users WHERE firebase_uid = $1';
            const userResult = await pool.query(userQuery, [userId]);

            if (userResult.rows.length === 0) {
                return {
                    success: false,
                    error: 'User not found'
                };
            }

            const internalUserId = userResult.rows[0].id;

            // Get recent performance (last 10 questions)
            const recentQuery = `
                SELECT 
                    difficulty,
                    is_correct,
                    created_at
                FROM notebook_entries
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT 10
            `;
            const recentResult = await pool.query(recentQuery, [internalUserId]);

            // Calculate accuracy by difficulty
            const accuracyQuery = `
                SELECT 
                    difficulty,
                    COUNT(*) as total,
                    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct,
                    ROUND(AVG(CASE WHEN is_correct THEN 1 ELSE 0 END) * 100) as accuracy
                FROM notebook_entries
                WHERE user_id = $1
                GROUP BY difficulty
            `;
            const accuracyResult = await pool.query(accuracyQuery, [internalUserId]);

            return {
                success: true,
                recentPerformance: recentResult.rows,
                accuracyByDifficulty: accuracyResult.rows
            };

        } catch (error) {
            console.error('❌ Error getting performance analytics:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export default new NotebookService();