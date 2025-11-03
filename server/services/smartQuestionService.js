// server/services/smartQuestionService.js - WITH ISRAELI QUESTIONS INTEGRATION
import pool from '../config/database.js';
import crypto from 'crypto';

// ✅ TOPIC MAPPING: English → Hebrew
const TOPIC_MAPPING = {
    'linear-equations': ['אלגברה', 'משוואות לינאריות', 'משוואות'],
    'multi-step-equations': ['אלגברה', 'משוואות'],
    'inequalities': ['אי-שוויונות', 'משוואות ואי-שוויונות'],
    'systems-of-equations': ['אלגברה', 'מערכות משוואות'],
    'proportions-ratios': ['יחסים ופרופורציות', 'פרופורציה', 'אחוזים'],
    'exponents': ['חזקות', 'חזקות ושורשים'],
    'polynomials': ['אלגברה', 'פולינומים'],
    'functions': ['פונקציות', 'כללי'],
    'linear-functions': ['פונקציות לינאריות', 'פונקציות'],
    'similarity-congruence': ['גיאומטריה', 'דמיון'],
    'pythagorean-theorem': ['גיאומטריה', 'משפט פיתגורס', 'גאומטריה'],
    'volume-surface-area': ['נפח', 'מדידה', 'גיאומטריה'],
    'data-analysis': ['סטטיסטיקה', 'ניתוח נתונים'],
    'probability': ['הסתברות']
};

class SmartQuestionService {
    /**
     * Get a question - tries ALL sources with priority order
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
            gradeLevel,
            userId: userId || 'anonymous'
        });

        // ==================== STEP 1: Try EXACT MATCH from question_cache ====================
        let dbQuestion = await this.getFromCache({
            topicId,
            subtopicId,
            difficulty,
            gradeLevel,
            userId,
            excludeQuestionIds,
            exactMatch: true
        });

        if (dbQuestion) {
            console.log('✅ Found EXACT match in cache');
            await this.trackUsage(dbQuestion.id, userId);
            return {
                ...dbQuestion,
                source: 'cache',
                cached: true,
                matchType: 'exact'
            };
        }

        // ==================== STEP 2: Try ISRAELI QUESTIONS from question_bank ====================
        console.log('🇮🇱 Checking Israeli question bank...');

        const israeliQuestion = await this.getIsraeliQuestion({
            topicName,
            subtopicName,
            difficulty,
            gradeLevel,
            excludeQuestionIds
        });

        if (israeliQuestion) {
            console.log('✅ Found match in Israeli question bank!');
            return {
                ...israeliQuestion,
                source: 'israeli_source',
                cached: true,
                matchType: 'israeli'
            };
        }

        // ==================== STEP 3: Try BROADER MATCH (same topic, any subtopic) ====================
        if (topicId && subtopicId) {
            console.log('🔍 No exact match, trying topic-level match...');

            dbQuestion = await this.getFromCache({
                topicId,
                subtopicId: null,
                difficulty,
                gradeLevel,
                userId,
                excludeQuestionIds,
                exactMatch: true
            });

            if (dbQuestion) {
                console.log('✅ Found topic-level match in cache');
                await this.trackUsage(dbQuestion.id, userId);
                return {
                    ...dbQuestion,
                    source: 'cache',
                    cached: true,
                    matchType: 'topic_level'
                };
            }
        }

        // ==================== STEP 4: No match - need AI generation ====================
        console.log('❌ No suitable cached question found');
        console.log('🤖 Will generate new question with AI');

        return {
            source: 'ai_required',
            cached: false,
            shouldGenerate: true,
            reason: 'no_matching_cached_questions',
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
     * ✅ NEW: Get question from Israeli question bank
     */
    async getIsraeliQuestion(params) {
        const {
            topicName,
            subtopicName,
            difficulty,
            gradeLevel,
            excludeQuestionIds = []
        } = params;

        try {
            // Get Hebrew topic names from mapping
            const hebrewTopics = this.getHebrewTopics(topicName, subtopicName);

            if (hebrewTopics.length === 0) {
                console.log('   ⏭️  No Hebrew topic mapping found');
                return null;
            }

            console.log(`   🔍 Searching Israeli questions for: ${hebrewTopics.join(', ')}`);

            let query = `
                SELECT
                    id,
                    question_text,
                    correct_answer,
                    hints,
                    explanation,
                    solution_steps,
                    topic,
                    subtopic,
                    difficulty,
                    grade_level,
                    keywords
                FROM question_bank
                WHERE source = 'israeli_source'
                  AND is_active = true
            `;

            const queryParams = [];
            let paramIndex = 1;

            // Match Hebrew topics
            query += ` AND topic = ANY($${paramIndex})`;
            queryParams.push(hebrewTopics);
            paramIndex++;

            // Match difficulty
            if (difficulty) {
                query += ` AND difficulty = $${paramIndex}`;
                queryParams.push(difficulty);
                paramIndex++;
            }

            // Match grade
            if (gradeLevel) {
                query += ` AND grade_level = $${paramIndex}`;
                queryParams.push(gradeLevel);
                paramIndex++;
            }

            // Exclude already shown questions
            if (excludeQuestionIds.length > 0) {
                const placeholders = excludeQuestionIds.map((_, i) => `$${paramIndex + i}`).join(',');
                query += ` AND id NOT IN (${placeholders})`;
                queryParams.push(...excludeQuestionIds);
                paramIndex += excludeQuestionIds.length;
            }

            query += ` ORDER BY RANDOM() LIMIT 5`;

            const result = await pool.query(query, queryParams);

            console.log(`   📊 Found ${result.rows.length} Israeli questions`);

            if (result.rows.length > 0) {
                const selectedQuestion = result.rows[0];

                console.log('   ✅ Selected Israeli question:', {
                    id: selectedQuestion.id,
                    topic: selectedQuestion.topic,
                    difficulty: selectedQuestion.difficulty,
                    preview: selectedQuestion.question_text.substring(0, 50) + '...'
                });

                return this.formatIsraeliQuestion(selectedQuestion);
            }

            return null;

        } catch (error) {
            console.error('   ❌ Israeli question query error:', error);
            return null;
        }
    }

    /**
     * ✅ Get Hebrew topic names from English topic/subtopic
     */
    getHebrewTopics(topicName, subtopicName) {
        const topics = new Set();

        // Add topics from main topic
        if (topicName && TOPIC_MAPPING[topicName]) {
            TOPIC_MAPPING[topicName].forEach(t => topics.add(t));
        }

        // Add topics from subtopic
        if (subtopicName && TOPIC_MAPPING[subtopicName]) {
            TOPIC_MAPPING[subtopicName].forEach(t => topics.add(t));
        }

        // Fallback: try partial matching
        if (topics.size === 0) {
            const searchTerm = subtopicName || topicName;
            Object.entries(TOPIC_MAPPING).forEach(([key, values]) => {
                if (key.includes(searchTerm?.toLowerCase() || '')) {
                    values.forEach(t => topics.add(t));
                }
            });
        }

        return Array.from(topics);
    }

    /**
     * Get question from question_cache with STRICT filtering
     */
    async getFromCache(params) {
        const {
            topicId,
            subtopicId,
            difficulty,
            gradeLevel,
            userId,
            excludeQuestionIds,
            exactMatch = true
        } = params;

        try {
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
                    usage_count,
                    success_rate
                FROM question_cache
                WHERE is_active = true
            `;

            const queryParams = [];
            let paramIndex = 1;

            // STRICT: Must match difficulty exactly
            query += ` AND difficulty = $${paramIndex}`;
            queryParams.push(difficulty);
            paramIndex++;

            // STRICT: Must match grade exactly (or be grade-agnostic)
            if (gradeLevel) {
                query += ` AND (grade_level = $${paramIndex} OR grade_level IS NULL)`;
                queryParams.push(gradeLevel);
                paramIndex++;
            }

            // STRICT: Must match topic exactly (if exactMatch is true)
            if (topicId) {
                if (exactMatch) {
                    query += ` AND topic_id = $${paramIndex}`;
                    queryParams.push(topicId);
                    paramIndex++;
                } else {
                    query += ` AND (topic_id = $${paramIndex} OR topic_id IS NULL)`;
                    queryParams.push(topicId);
                    paramIndex++;
                }
            }

            // STRICT: Must match subtopic exactly (if provided)
            if (subtopicId) {
                query += ` AND subtopic_id = $${paramIndex}`;
                queryParams.push(subtopicId);
                paramIndex++;
            }

            // Exclude questions from current session
            if (excludeQuestionIds.length > 0) {
                const placeholders = excludeQuestionIds.map((_, i) => `$${paramIndex + i}`).join(',');
                query += ` AND id NOT IN (${placeholders})`;
                queryParams.push(...excludeQuestionIds);
                paramIndex += excludeQuestionIds.length;
            }

            // Exclude recently used questions by this user (last 100 questions!)
            if (userId) {
                query += `
                    AND id NOT IN (
                        SELECT question_id 
                        FROM question_usage_history 
                        WHERE user_id = $${paramIndex}
                        ORDER BY created_at DESC 
                        LIMIT 100
                    )
                `;
                queryParams.push(userId);
                paramIndex++;
            }

            // Smart ordering: Quality + Variety + Randomness
            query += `
                ORDER BY 
                    CASE 
                        WHEN quality_score >= 80 THEN 3
                        WHEN quality_score >= 60 THEN 2
                        ELSE 1
                    END DESC,
                    usage_count ASC,
                    RANDOM()
                LIMIT 5
            `;

            const result = await pool.query(query, queryParams);

            console.log(`📊 Found ${result.rows.length} candidate questions in cache`);

            if (result.rows.length > 0) {
                const randomIndex = Math.floor(Math.random() * result.rows.length);
                const selectedQuestion = result.rows[randomIndex];

                console.log('✅ Selected question from cache:', {
                    id: selectedQuestion.id,
                    topic: selectedQuestion.topic_name,
                    subtopic: selectedQuestion.subtopic_name,
                    difficulty: selectedQuestion.difficulty,
                    quality: selectedQuestion.quality_score,
                    usageCount: selectedQuestion.usage_count
                });

                return this.formatCacheQuestion(selectedQuestion);
            }

            return null;

        } catch (error) {
            console.error('❌ Cache query error:', error);
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
                console.log('⚠️ Question already cached (duplicate detected)');
                return existing.rows[0].id;
            }

            // Insert new question with STRICT metadata
            const result = await pool.query(
                `INSERT INTO question_cache (
                    question_text, correct_answer, hints, explanation, visual_data,
                    topic_id, topic_name, subtopic_id, subtopic_name,
                    difficulty, grade_level, question_hash, source, quality_score
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ai_generated', 70)
                RETURNING id`,
                [
                    question,
                    correctAnswer,
                    JSON.stringify(hints || []),
                    explanation || '',
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

            // Update usage count
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
     * Format cache question for response
     */
    formatCacheQuestion(row) {
        return {
            id: row.id,
            question: row.question_text,
            correctAnswer: row.correct_answer,
            hints: Array.isArray(row.hints) ? row.hints : (row.hints ? JSON.parse(row.hints) : []),
            explanation: row.explanation || '',
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
                usageCount: row.usage_count,
                successRate: row.success_rate || 0
            }
        };
    }

    /**
     * ✅ Format Israeli question for response
     */
    formatIsraeliQuestion(row) {
        return {
            id: `israeli_${row.id}`, // Prefix to avoid conflicts
            question: row.question_text,
            correctAnswer: row.correct_answer,
            hints: Array.isArray(row.hints) ? row.hints : (row.hints ? JSON.parse(row.hints) : []),
            explanation: row.explanation || '',
            solutionSteps: Array.isArray(row.solution_steps) ? row.solution_steps : (row.solution_steps ? JSON.parse(row.solution_steps) : []),
            visualData: null,
            topic: {
                id: null,
                name: row.topic
            },
            subtopic: row.subtopic ? {
                id: null,
                name: row.subtopic
            } : null,
            difficulty: row.difficulty,
            metadata: {
                source: 'israeli_question_bank',
                gradeLevel: row.grade_level,
                keywords: row.keywords || [],
                qualityScore: 75,
                usageCount: 0,
                successRate: 0
            }
        };
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

            // Get Israeli question stats
            const israeliStats = await pool.query(`
                SELECT 
                    COUNT(*) as israeli_questions,
                    COUNT(DISTINCT topic) as israeli_topics,
                    COUNT(CASE WHEN difficulty = 'easy' THEN 1 END) as israeli_easy,
                    COUNT(CASE WHEN difficulty = 'medium' THEN 1 END) as israeli_medium,
                    COUNT(CASE WHEN difficulty = 'hard' THEN 1 END) as israeli_hard
                FROM question_bank
                WHERE source = 'israeli_source' AND is_active = true
            `);

            return {
                ...cacheStats.rows[0],
                ...israeliStats.rows[0]
            };
        } catch (error) {
            console.error('❌ Get stats error:', error);
            return null;
        }
    }
}

export default new SmartQuestionService();