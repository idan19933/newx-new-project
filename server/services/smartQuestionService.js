// server/services/smartQuestionService.js - FIXED: Smart session tracking
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
     * 🎯 Get a question - tries cache first, then Israeli bank, then AI
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
            excludedCount: excludeQuestionIds.length
        });

        // ✅ Clean and validate excluded IDs
        const cleanExcludedIds = this.cleanExcludedIds(excludeQuestionIds);
        console.log('🚫 Excluding questions:', cleanExcludedIds);

        // ==================== STEP 1: Try Cache ====================
        const cacheQuestion = await this.getFromCache({
            topicId,
            subtopicId,
            difficulty,
            gradeLevel,
            excludeQuestionIds: cleanExcludedIds
        });

        if (cacheQuestion) {
            console.log('✅ Found in cache:', cacheQuestion.id);
            if (userId) await this.trackUsage(cacheQuestion.id, userId);
            return {
                ...cacheQuestion,
                source: 'cache',
                cached: true
            };
        }

        // ==================== STEP 2: Try Israeli Questions ====================
        const israeliQuestion = await this.getIsraeliQuestion({
            topicName,
            subtopicName,
            difficulty,
            gradeLevel,
            excludeQuestionIds: cleanExcludedIds
        });

        if (israeliQuestion) {
            console.log('✅ Found in Israeli bank:', israeliQuestion.id);
            return {
                ...israeliQuestion,
                source: 'israeli_source',
                cached: true
            };
        }

        // ==================== STEP 3: Generate with AI ====================
        console.log('🤖 No cached question - will generate with AI');

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
     * ✅ Clean and validate excluded question IDs
     */
    cleanExcludedIds(excludeQuestionIds) {
        if (!Array.isArray(excludeQuestionIds)) {
            console.warn('⚠️ excludeQuestionIds is not an array:', excludeQuestionIds);
            return [];
        }

        const cleaned = excludeQuestionIds
            .filter(id => id !== null && id !== undefined && id !== '')
            .map(id => {
                // Handle israeli_ prefix
                if (String(id).startsWith('israeli_')) {
                    return `israeli_${parseInt(String(id).replace('israeli_', ''))}`;
                }
                // Handle numeric IDs
                const numId = parseInt(id);
                return isNaN(numId) ? null : numId;
            })
            .filter(id => id !== null);

        return [...new Set(cleaned)]; // Remove duplicates
    }

    /**
     * ✅ Get from cache with proper exclusion
     */
    async getFromCache(params) {
        const {
            topicId,
            subtopicId,
            difficulty,
            gradeLevel,
            excludeQuestionIds = []
        } = params;

        try {
            // Separate israeli_ IDs from numeric IDs
            const numericExcluded = excludeQuestionIds.filter(id => typeof id === 'number');

            let query = `
                SELECT
                    id,
                    question,
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

            // Exclude already shown questions
            if (numericExcluded.length > 0) {
                const placeholders = numericExcluded.map((_, i) => `$${paramIndex + i}`).join(',');
                query += ` AND id NOT IN (${placeholders})`;
                queryParams.push(...numericExcluded);
                paramIndex += numericExcluded.length;
            }

            // Match topic if provided
            if (topicId) {
                query += ` AND (topic_id = $${paramIndex} OR topic_id IS NULL)`;
                queryParams.push(topicId);
                paramIndex++;
            }

            // Match subtopic if provided
            if (subtopicId) {
                query += ` AND (subtopic_id = $${paramIndex} OR subtopic_id IS NULL)`;
                queryParams.push(subtopicId);
                paramIndex++;
            }

            // Match grade if provided
            if (gradeLevel) {
                query += ` AND (grade_level = $${paramIndex} OR grade_level IS NULL)`;
                queryParams.push(gradeLevel);
                paramIndex++;
            }

            query += ` ORDER BY quality_score DESC, usage_count ASC, RANDOM() LIMIT 10`;

            const result = await pool.query(query, queryParams);

            if (result.rows.length > 0) {
                // Pick random from top results
                const randomIndex = Math.floor(Math.random() * result.rows.length);
                return this.formatCacheQuestion(result.rows[randomIndex]);
            }

            return null;

        } catch (error) {
            console.error('❌ Cache query error:', error);
            return null;
        }
    }

    /**
     * ✅ Get Israeli question with proper exclusion
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
            // Extract israeli_ IDs
            const israeliExcluded = excludeQuestionIds
                .filter(id => String(id).startsWith('israeli_'))
                .map(id => parseInt(String(id).replace('israeli_', '')))
                .filter(id => !isNaN(id));

            const hebrewTopics = this.getHebrewTopics(topicName, subtopicName);

            if (hebrewTopics.length === 0) {
                return null;
            }

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
                    grade_level
                FROM question_bank
                WHERE source = 'israeli_source'
                  AND is_active = true
                  AND topic = ANY($1)
            `;

            const queryParams = [hebrewTopics];
            let paramIndex = 2;

            // Exclude already shown Israeli questions
            if (israeliExcluded.length > 0) {
                const placeholders = israeliExcluded.map((_, i) => `$${paramIndex + i}`).join(',');
                query += ` AND id NOT IN (${placeholders})`;
                queryParams.push(...israeliExcluded);
                paramIndex += israeliExcluded.length;
            }

            // Match difficulty
            if (difficulty) {
                query += ` AND difficulty = $${paramIndex}`;
                queryParams.push(difficulty);
                paramIndex++;
            }

            // Match grade (within 1 grade)
            if (gradeLevel) {
                const minGrade = Math.max(7, gradeLevel - 1);
                const maxGrade = gradeLevel + 1;
                query += ` AND grade_level >= $${paramIndex} AND grade_level <= $${paramIndex + 1}`;
                queryParams.push(minGrade, maxGrade);
                paramIndex += 2;
            }

            query += ` ORDER BY RANDOM() LIMIT 10`;

            const result = await pool.query(query, queryParams);

            if (result.rows.length > 0) {
                const randomIndex = Math.floor(Math.random() * result.rows.length);
                return this.formatIsraeliQuestion(result.rows[randomIndex]);
            }

            return null;

        } catch (error) {
            console.error('❌ Israeli question query error:', error);
            return null;
        }
    }

    /**
     * ✅ Get Hebrew topics from English mapping
     */
    getHebrewTopics(topicName, subtopicName) {
        const topics = new Set();

        // If already Hebrew
        const isHebrew = /[\u0590-\u05FF]/.test(topicName);
        if (isHebrew) {
            if (topicName) topics.add(topicName);
            if (subtopicName) topics.add(subtopicName);
            return Array.from(topics);
        }

        // Map from English
        if (topicName && TOPIC_MAPPING[topicName]) {
            TOPIC_MAPPING[topicName].forEach(t => topics.add(t));
        }
        if (subtopicName && TOPIC_MAPPING[subtopicName]) {
            TOPIC_MAPPING[subtopicName].forEach(t => topics.add(t));
        }

        return Array.from(topics);
    }

    /**
     * ✅ Cache an AI-generated question
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

            if (!question || !correctAnswer) {
                console.error('❌ Cannot cache - missing question or answer');
                return null;
            }

            const questionHash = this.generateQuestionHash(question);

            // Check for duplicates
            const existing = await pool.query(
                'SELECT id FROM question_cache WHERE question_hash = $1',
                [questionHash]
            );

            if (existing.rows.length > 0) {
                console.log('⚠️ Question already cached');
                return existing.rows[0].id;
            }

            // Insert new
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

            console.log(`✅ Cached question ID: ${result.rows[0].id}`);
            return result.rows[0].id;

        } catch (error) {
            console.error('❌ Cache error:', error);
            return null;
        }
    }

    /**
     * Track usage
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
            }

        } catch (error) {
            console.error('❌ Track usage error:', error);
        }
    }

    /**
     * Generate hash
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
     * Format cache question
     */
    formatCacheQuestion(row) {
        return {
            id: row.id,
            question: row.question,
            correctAnswer: row.correct_answer,
            hints: Array.isArray(row.hints) ? row.hints : JSON.parse(row.hints || '[]'),
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
                usageCount: row.usage_count
            }
        };
    }

    /**
     * Format Israeli question
     */
    formatIsraeliQuestion(row) {
        return {
            id: `israeli_${row.id}`,
            question: row.question_text,
            correctAnswer: row.correct_answer,
            hints: Array.isArray(row.hints) ? row.hints : JSON.parse(row.hints || '[]'),
            explanation: row.explanation || '',
            solutionSteps: Array.isArray(row.solution_steps) ? row.solution_steps : JSON.parse(row.solution_steps || '[]'),
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
                gradeLevel: row.grade_level
            }
        };
    }
}

export default new SmartQuestionService();