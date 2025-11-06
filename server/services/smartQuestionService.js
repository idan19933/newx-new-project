// server/services/smartQuestionService.js - SIMPLIFIED: Always generate new questions
import pool from '../config/database.js';
import crypto from 'crypto';

class SmartQuestionService {
    /**
     * 🚀 SIMPLIFIED: Always return "need AI generation"
     */
    async getQuestion(params) {
        const {
            topicId,
            topicName,
            subtopicId,
            subtopicName,
            difficulty = 'medium',
            gradeLevel,
            userId
        } = params;

        console.log('🎯 Smart question request (AI generation mode):', {
            topicName,
            subtopicName,
            difficulty,
            gradeLevel,
            userId: userId || 'anonymous'
        });

        // ✅ ALWAYS generate new question - no cache, no reuse
        console.log('🤖 Will generate NEW question with AI');

        return {
            source: 'ai_required',
            cached: false,
            shouldGenerate: true,
            reason: 'always_generate_new',
            params: {
                topicId,
                topicName,
                subtopicId,
                subtopicName,
                difficulty,
                gradeLevel
            }
        };
    }

    /**
     * ✅ Cache an AI-generated question (still save for future)
     */
    async cacheQuestion(questionData) {
        try {
            const {
                question,
                correctAnswer,
                hints,
                explanation,
                visualData,
                topicId,
                topicName,
                subtopicId,
                subtopicName,
                difficulty,
                gradeLevel
            } = questionData;

            // Validation
            if (!question || typeof question !== 'string' || question.trim().length === 0) {
                console.error('❌ Cannot cache - question is empty or invalid');
                return null;
            }

            if (!correctAnswer || typeof correctAnswer !== 'string' || correctAnswer.trim().length === 0) {
                console.error('❌ Cannot cache - correct answer is empty or invalid');
                return null;
            }

            // Generate hash to prevent duplicates
            const questionHash = this.generateQuestionHash(question);

            // Check if question already exists
            const existing = await pool.query(
                'SELECT id FROM question_cache WHERE question_hash = $1',
                [questionHash]
            );

            if (existing.rows.length > 0) {
                console.log('⚠️ Question already cached (duplicate detected)');
                return existing.rows[0].id;
            }

            // Insert new question
            const result = await pool.query(
                `INSERT INTO question_cache (
                    question, correct_answer, hints, explanation, visual_data,
                    topic_id, topic_name, subtopic_id, subtopic_name,
                    difficulty, grade_level, question_hash, source, quality_score
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ai_generated', 70)
                RETURNING id`,
                [
                    question.trim(),
                    correctAnswer.trim(),
                    JSON.stringify(hints || []),
                    explanation?.trim() || '',
                    JSON.stringify(visualData || null),
                    topicId || null,
                    topicName || null,
                    subtopicId || null,
                    subtopicName || null,
                    difficulty,
                    gradeLevel || null,
                    questionHash
                ]
            );

            console.log(`✅ Question cached successfully (ID: ${result.rows[0].id})`);
            return result.rows[0].id;

        } catch (error) {
            console.error('❌ Cache question error:', error);
            return null;
        }
    }

    /**
     * Track question usage (still useful for analytics)
     */
    async trackUsage(questionId, userId, usageData = {}) {
        try {
            const { isCorrect, timeSpent, hintsUsed, attempts } = usageData;

            await pool.query(
                `UPDATE question_cache
                 SET usage_count = usage_count + 1,
                     last_used = CURRENT_TIMESTAMP
                 WHERE id = $1`,
                [questionId]
            );

            if (userId && isCorrect !== undefined) {
                await pool.query(
                    `INSERT INTO question_usage_history (
                        question_id, user_id, is_correct,
                        time_spent_seconds, hints_used, attempts
                    ) VALUES ($1, $2, $3, $4, $5, $6)`,
                    [questionId, userId, isCorrect, timeSpent || 0, hintsUsed || 0, attempts || 1]
                );

                await this.updateQuestionStats(questionId);
            }

            console.log(`✅ Usage tracked for question ${questionId}`);

        } catch (error) {
            console.error('❌ Track usage error:', error);
        }
    }

    /**
     * Update question quality statistics
     */
    async updateQuestionStats(questionId) {
        try {
            await pool.query(
                `UPDATE question_cache qc
                 SET
                     success_rate = (
                         SELECT COALESCE(AVG(CASE WHEN is_correct THEN 100.0 ELSE 0.0 END), 0)
                         FROM question_usage_history
                         WHERE question_id = qc.id
                     ),
                     avg_time_seconds = (
                         SELECT COALESCE(AVG(time_spent_seconds), 0)::INTEGER
                         FROM question_usage_history
                         WHERE question_id = qc.id
                     ),
                     quality_score = LEAST(100, GREATEST(30,
                         50 +
                         CASE WHEN usage_count >= 5 THEN (success_rate - 50) / 2 ELSE 0 END +
                         CASE
                             WHEN usage_count >= 20 THEN 20
                             WHEN usage_count >= 10 THEN 10
                             WHEN usage_count >= 5 THEN 5
                             ELSE 0
                         END
                     ))
                 WHERE id = $1`,
                [questionId]
            );
        } catch (error) {
            console.error('❌ Update stats error:', error);
        }
    }

    /**
     * Generate question hash for duplicate detection
     */
    generateQuestionHash(questionText) {
        const normalized = questionText
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s\u0590-\u05FF]/g, '')
            .trim();

        return crypto
            .createHash('sha256')
            .update(normalized)
            .digest('hex');
    }

    /**
     * Get comprehensive statistics
     */
    async getStats(filters = {}) {
        try {
            const { topicId, difficulty, gradeLevel } = filters;

            let whereClause = 'WHERE is_active = true';
            const params = [];
            let paramIndex = 1;

            if (topicId) {
                whereClause += ` AND topic_id = $${paramIndex}`;
                params.push(topicId);
                paramIndex++;
            }

            if (difficulty) {
                whereClause += ` AND difficulty = $${paramIndex}`;
                params.push(difficulty);
                paramIndex++;
            }

            if (gradeLevel) {
                whereClause += ` AND grade_level = $${paramIndex}`;
                params.push(gradeLevel);
                paramIndex++;
            }

            // Get cache stats
            const cacheStats = await pool.query(`
                SELECT
                    COUNT(*) as total_questions,
                    COUNT(CASE WHEN source = 'ai_generated' THEN 1 END) as ai_generated,
                    ROUND(AVG(quality_score), 1) as avg_quality,
                    SUM(usage_count) as total_usage,
                    COUNT(DISTINCT topic_id) as unique_topics,
                    COUNT(CASE WHEN difficulty = 'easy' THEN 1 END) as easy_questions,
                    COUNT(CASE WHEN difficulty = 'medium' THEN 1 END) as medium_questions,
                    COUNT(CASE WHEN difficulty = 'hard' THEN 1 END) as hard_questions,
                    ROUND(AVG(success_rate), 1) as avg_success_rate
                FROM question_cache
                ${whereClause}
            `, params);

            return cacheStats.rows[0];
        } catch (error) {
            console.error('❌ Get stats error:', error);
            return null;
        }
    }
}

export default new SmartQuestionService();