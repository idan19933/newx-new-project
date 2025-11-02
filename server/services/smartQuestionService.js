// server/services/smartQuestionService.js - SMART QUESTION ROUTING
import pool from '../config/database.js';
import crypto from 'crypto';

class SmartQuestionService {
    /**
     * Get a question - tries database first, falls back to AI
     */
    async getQuestion(params) {
        const {
            topicId,
            topicName,
            subtopicId,
            subtopicName,
            difficulty = 'medium',
            gradeLevel,
            userId,
            excludeQuestionIds = []
        } = params;

        console.log('🎯 Smart question request:', {
            topicName,
            subtopicName,
            difficulty,
            gradeLevel
        });

        // Try to get from database first
        const dbQuestion = await this.getFromDatabase({
            topicId,
            subtopicId,
            difficulty,
            gradeLevel,
            userId,
            excludeQuestionIds
        });

        if (dbQuestion) {
            console.log('✅ Serving question from database (cached)');
            await this.trackUsage(dbQuestion.id, userId);
            return {
                ...dbQuestion,
                source: 'database',
                cached: true
            };
        }

        // No suitable question in database - need AI generation
        console.log('🤖 No cached question found - will generate with AI');
        return {
            source: 'ai_required',
            cached: false,
            shouldGenerate: true,
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
     * Get question from database
     */
    async getFromDatabase(params) {
        const {
            topicId,
            subtopicId,
            difficulty,
            gradeLevel,
            userId,
            excludeQuestionIds
        } = params;

        try {
            // Build query based on available filters
            let query = `
                SELECT 
                    id,
                    question_text,
                    correct_answer,
                    hints,
                    explanation,
                    visual_data,
                    topic_id,
                    topic_name,
                    subtopic_id,
                    subtopic_name,
                    difficulty,
                    quality_score,
                    usage_count
                FROM question_cache
                WHERE is_active = true
                    AND difficulty = $1
            `;

            const queryParams = [difficulty];
            let paramIndex = 2;

            // Add grade filter if provided
            if (gradeLevel) {
                query += ` AND (grade_level = $${paramIndex} OR grade_level IS NULL)`;
                queryParams.push(gradeLevel);
                paramIndex++;
            }

            // Add topic filter - prefer exact match, allow null
            if (topicId) {
                query += ` AND (topic_id = $${paramIndex} OR topic_id IS NULL)`;
                queryParams.push(topicId);
                paramIndex++;
            }

            // Add subtopic filter if provided
            if (subtopicId) {
                query += ` AND (subtopic_id = $${paramIndex} OR subtopic_id IS NULL)`;
                queryParams.push(subtopicId);
                paramIndex++;
            }

            // Exclude previously seen questions
            if (excludeQuestionIds.length > 0) {
                query += ` AND id NOT IN (${excludeQuestionIds.map((_, i) => `$${paramIndex + i}`).join(',')})`;
                queryParams.push(...excludeQuestionIds);
                paramIndex += excludeQuestionIds.length;
            }

            // Exclude recently used questions by this user (within last 50 questions)
            if (userId) {
                query += `
                    AND id NOT IN (
                        SELECT question_id 
                        FROM question_usage_history 
                        WHERE user_id = $${paramIndex}
                        ORDER BY created_at DESC 
                        LIMIT 50
                    )
                `;
                queryParams.push(userId);
                paramIndex++;
            }

            // Order by quality and freshness (less used = more fresh)
            query += `
                ORDER BY 
                    quality_score DESC,
                    usage_count ASC,
                    RANDOM()
                LIMIT 1
            `;

            const result = await pool.query(query, queryParams);

            if (result.rows.length > 0) {
                return this.formatQuestion(result.rows[0]);
            }

            return null;

        } catch (error) {
            console.error('❌ Database query error:', error);
            return null;
        }
    }

    /**
     * Cache an AI-generated question
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

            // Generate hash to prevent duplicates
            const questionHash = this.generateQuestionHash(question);

            // Check if question already exists
            const existing = await pool.query(
                'SELECT id FROM question_cache WHERE question_hash = $1',
                [questionHash]
            );

            if (existing.rows.length > 0) {
                console.log('⚠️ Question already cached');
                return existing.rows[0].id;
            }

            // Insert new question
            const result = await pool.query(
                `INSERT INTO question_cache (
                    question_text, correct_answer, hints, explanation, visual_data,
                    topic_id, topic_name, subtopic_id, subtopic_name,
                    difficulty, grade_level, question_hash, source
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ai_generated')
                RETURNING id`,
                [
                    question,
                    correctAnswer,
                    JSON.stringify(hints || []),
                    explanation,
                    JSON.stringify(visualData),
                    topicId,
                    topicName,
                    subtopicId,
                    subtopicName,
                    difficulty,
                    gradeLevel,
                    questionHash
                ]
            );

            console.log(`✅ Question cached (ID: ${result.rows[0].id})`);
            return result.rows[0].id;

        } catch (error) {
            console.error('❌ Cache question error:', error);
            return null;
        }
    }

    /**
     * Track question usage
     */
    async trackUsage(questionId, userId, usageData = {}) {
        try {
            const {
                isCorrect,
                timeSpent,
                hintsUsed,
                attempts
            } = usageData;

            // Update usage count and last used
            await pool.query(
                `UPDATE question_cache 
                 SET usage_count = usage_count + 1,
                     last_used = CURRENT_TIMESTAMP
                 WHERE id = $1`,
                [questionId]
            );

            // Record usage in history if we have user data
            if (userId && isCorrect !== undefined) {
                await pool.query(
                    `INSERT INTO question_usage_history (
                        question_id, user_id, is_correct, 
                        time_spent_seconds, hints_used, attempts
                    ) VALUES ($1, $2, $3, $4, $5, $6)`,
                    [questionId, userId, isCorrect, timeSpent, hintsUsed, attempts]
                );

                // Update success rate
                await this.updateQuestionStats(questionId);
            }

        } catch (error) {
            console.error('❌ Track usage error:', error);
        }
    }

    /**
     * Update question statistics
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
                    quality_score = LEAST(100, GREATEST(0,
                        50 +
                        CASE WHEN usage_count > 0 THEN (success_rate - 50) / 2 ELSE 0 END +
                        CASE WHEN usage_count >= 10 THEN 20 WHEN usage_count >= 5 THEN 10 ELSE 0 END
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
        // Normalize question text
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
     * Format question for response
     */
    formatQuestion(row) {
        return {
            id: row.id,
            question: row.question_text,
            correctAnswer: row.correct_answer,
            hints: row.hints || [],
            explanation: row.explanation,
            visualData: row.visual_data,
            topic: {
                id: row.topic_id,
                name: row.topic_name
            },
            subtopic: row.subtopic_id ? {
                id: row.subtopic_id,
                name: row.subtopic_name
            } : null,
            difficulty: row.difficulty,
            metadata: {
                qualityScore: row.quality_score,
                usageCount: row.usage_count
            }
        };
    }

    /**
     * Get question statistics
     */
    async getStats() {
        try {
            const result = await pool.query(`
                SELECT 
                    COUNT(*) as total_questions,
                    COUNT(CASE WHEN source = 'ai_generated' THEN 1 END) as ai_generated,
                    COUNT(CASE WHEN source = 'israeli_source' THEN 1 END) as from_sources,
                    AVG(quality_score) as avg_quality,
                    SUM(usage_count) as total_usage,
                    COUNT(DISTINCT topic_id) as unique_topics,
                    COUNT(CASE WHEN difficulty = 'easy' THEN 1 END) as easy_questions,
                    COUNT(CASE WHEN difficulty = 'medium' THEN 1 END) as medium_questions,
                    COUNT(CASE WHEN difficulty = 'hard' THEN 1 END) as hard_questions
                FROM question_cache
                WHERE is_active = true
            `);

            return result.rows[0];
        } catch (error) {
            console.error('❌ Get stats error:', error);
            return null;
        }
    }
}

export default new SmartQuestionService();