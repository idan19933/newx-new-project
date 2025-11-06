// server/services/questionHistory.js - ENHANCED WITH ID TRACKING 🔄
import pool from '../config/database.js';
import crypto from 'crypto';

class QuestionHistoryManager {
    constructor() {
        // ✅ In-memory for FAST session checks
        this.history = new Map();
        this.maxHistorySize = 30; // Increased to 30
        console.log('✅ Question History Manager initialized');
    }

    /**
     * 🔑 Generate session key
     */
    getKey(studentId, topicId) {
        return `${studentId}_${topicId}`;
    }

    /**
     * ➕ Add question to history with ID tracking
     */
    addQuestion(studentId, topicId, questionData) {
        const key = this.getKey(studentId, topicId);

        if (!this.history.has(key)) {
            this.history.set(key, []);
        }

        const questions = this.history.get(key);

        // ✅ CRITICAL: Extract ID from multiple possible fields
        const questionId = questionData.id ||
            questionData.questionId ||
            questionData.cached_id ||
            null;

        console.log('   🔍 Extracting ID from:', {
            'questionData.id': questionData.id,
            'questionData.questionId': questionData.questionId,
            'questionData.cached_id': questionData.cached_id,
            'final questionId': questionId
        });

        // ✅ Store with ID
        const entry = {
            questionId: questionId,  // ✅ USE EXTRACTED ID
            question: questionData.question || questionData.questionText || '',
            timestamp: Date.now(),
            difficulty: questionData.difficulty || 'unknown',
            source: questionData.source || 'unknown',
            keywords: this.extractKeywords(questionData.question || questionData.questionText || ''),
            numbers: this.extractNumbers(questionData.question || questionData.questionText || '')
        };

        questions.push(entry);

        // Keep last 30 questions
        if (questions.length > this.maxHistorySize) {
            questions.shift();
        }

        console.log(`📝 Added question to history: ${key}`);
        console.log(`   ID: ${questionId || 'NO-ID-FOUND'}`);
        console.log(`   Total in session: ${questions.length}`);

        // ✅ WARNING if no ID
        if (!questionId) {
            console.warn('   ⚠️⚠️⚠️ WARNING: Question added without ID!');
            console.warn('   This will cause duplicate questions!');
            console.warn('   Question preview:', entry.question.substring(0, 50));
        }
    }

    /**
     * 🆔 Get excluded question IDs
     */
    getExcludedQuestionIds(studentId, topicId, limit = 30) {
        const key = this.getKey(studentId, topicId);
        const questions = this.history.get(key) || [];

        // Extract all IDs
        const ids = questions
            .slice(-limit)
            .map(q => q.questionId)
            .filter(id => id !== null && id !== undefined && id !== 'no-id');

        console.log(`🚫 Excluded IDs for ${key}:`, ids.length);
        if (ids.length > 0) {
            console.log(`   IDs:`, ids.slice(0, 10)); // Show first 10
        }

        return ids;
    }

    /**
     * 🔤 Extract keywords from question
     */
    extractKeywords(question) {
        if (!question) return [];
        const mathTerms = question.match(/[א-ת]{3,}/g) || [];
        return mathTerms.slice(0, 8);
    }

    /**
     * 🔢 Extract numbers from question
     */
    extractNumbers(question) {
        if (!question) return [];
        return question.match(/\d+(\.\d+)?/g) || [];
    }

    /**
     * 📋 Get recent questions
     */
    getRecentQuestions(studentId, topicId, count = 10) {
        const key = this.getKey(studentId, topicId);
        const questions = this.history.get(key) || [];

        console.log(`🔍 Getting recent questions for: ${key}`);
        console.log(`   Found ${questions.length} questions in history`);

        return questions.slice(-count);
    }

    /**
     * 🔍 Check if new question is similar to recent ones
     */
    isSimilar(newQuestion, recentQuestions) {
        const newNumbers = new Set(this.extractNumbers(newQuestion));
        const newKeywords = new Set(this.extractKeywords(newQuestion));

        for (const recent of recentQuestions) {
            const recentNumbers = new Set(recent.numbers);
            const numberOverlap = [...newNumbers].filter(n => recentNumbers.has(n));

            const recentKeywords = new Set(recent.keywords);
            const keywordOverlap = [...newKeywords].filter(k => recentKeywords.has(k));

            const numberSimilarity = numberOverlap.length / Math.max(newNumbers.size, recentNumbers.size, 1);
            const keywordSimilarity = keywordOverlap.length / Math.max(newKeywords.size, recentKeywords.size, 1);

            if (numberSimilarity > 0.5 && keywordSimilarity > 0.5) {
                return true;
            }
        }

        return false;
    }

    /**
     * 🗑️ Clear history for user/topic
     */
    clearHistory(studentId, topicId = null) {
        if (topicId) {
            const key = this.getKey(studentId, topicId);
            this.history.delete(key);
            console.log(`🗑️ Cleared history for ${key}`);
        } else {
            // Clear all topics for this student
            const keysToDelete = [];
            for (const key of this.history.keys()) {
                if (key.startsWith(`${studentId}_`)) {
                    keysToDelete.push(key);
                }
            }
            keysToDelete.forEach(key => this.history.delete(key));
            console.log(`🗑️ Cleared all history for student ${studentId}`);
        }
    }

    // ==================== DATABASE METHODS ====================

    /**
     * 🔐 Generate question hash
     */
    hashQuestion(questionText) {
        return crypto
            .createHash('md5')
            .update(questionText.trim().toLowerCase())
            .digest('hex');
    }

    /**
     * 💾 Record to database
     */
    async recordToDatabase(userId, questionData) {
        try {
            const { topicId, subtopicId, questionText, difficulty, isCorrect } = questionData;

            // Get user ID if we have firebase_uid
            let userIdInt = userId;
            if (isNaN(userId)) {
                const userResult = await pool.query(
                    'SELECT id FROM users WHERE firebase_uid = $1',
                    [userId]
                );

                if (userResult.rows.length === 0) {
                    console.log('⚠️ User not found for database recording');
                    return false;
                }

                userIdInt = userResult.rows[0].id;
            }

            const questionHash = this.hashQuestion(questionText);

            await pool.query(
                `INSERT INTO question_history
                 (user_id, topic_id, subtopic_id, question_text, question_hash, difficulty, is_correct, asked_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
                [
                    userIdInt,
                    topicId || null,
                    subtopicId || null,
                    questionText,
                    questionHash,
                    difficulty,
                    isCorrect || null
                ]
            );

            console.log(`💾 Recorded to database for user ${userIdInt}`);
            return true;

        } catch (error) {
            console.error('❌ Database recording error:', error.message);
            return false;
        }
    }

    /**
     * 📊 Get database questions
     */
    async getDatabaseQuestions(userId, topicId = null, days = 14) {
        try {
            // Get user ID if we have firebase_uid
            let userIdInt = userId;
            if (isNaN(userId)) {
                const userResult = await pool.query(
                    'SELECT id FROM users WHERE firebase_uid = $1',
                    [userId]
                );

                if (userResult.rows.length === 0) {
                    return [];
                }

                userIdInt = userResult.rows[0].id;
            }

            let query = `
                SELECT question_text, difficulty, asked_at
                FROM question_history
                WHERE user_id = $1
                  AND asked_at > NOW() - INTERVAL '${days} days'
            `;

            const params = [userIdInt];

            if (topicId) {
                query += ` AND topic_id = $2`;
                params.push(topicId);
            }

            query += ` ORDER BY asked_at DESC LIMIT 20`;

            const result = await pool.query(query, params);

            return result.rows.map(row => ({
                question: row.question_text,
                difficulty: row.difficulty,
                askedAt: row.asked_at
            }));

        } catch (error) {
            console.error('❌ Database query error:', error.message);
            return [];
        }
    }

    /**
     * 📝 Build avoidance prompt
     */
    async buildAvoidancePrompt(studentId, topicId) {
        let prompt = '';

        // ✅ Part 1: Session history
        const sessionQuestions = this.getRecentQuestions(studentId, topicId, 5);

        if (sessionQuestions.length > 0) {
            prompt += '\n🚫 CRITICAL: NEVER repeat these questions from THIS SESSION:\n';
            prompt += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
            sessionQuestions.forEach((q, idx) => {
                const preview = q.question.substring(0, 80);
                prompt += `${idx + 1}. "${preview}..."\n`;
            });
            prompt += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        }

        // ✅ Part 2: Database history
        try {
            const dbQuestions = await this.getDatabaseQuestions(studentId, topicId, 7);

            if (dbQuestions.length > 0) {
                prompt += '\n🚫 Also avoid questions from PAST WEEK:\n';

                dbQuestions.slice(0, 5).forEach((q, idx) => {
                    const preview = q.question.substring(0, 60);
                    const daysAgo = Math.floor((Date.now() - new Date(q.askedAt)) / (1000 * 60 * 60 * 24));
                    prompt += `${idx + 1}. "${preview}..." (${daysAgo}d ago)\n`;
                });
            }
        } catch (error) {
            console.error('⚠️ Could not load database history:', error.message);
        }

        if (prompt) {
            prompt += '\n⚠️⚠️⚠️ CREATE SOMETHING COMPLETELY DIFFERENT!\n';
            prompt += '- Different numbers\n';
            prompt += '- Different context\n';
            prompt += '- Different approach\n';
            prompt += '- Unique scenario\n\n';
        }

        return prompt;
    }

    /**
     * 📊 Get statistics
     */
    getStats() {
        const totalSessions = this.history.size;
        let totalQuestions = 0;

        for (const questions of this.history.values()) {
            totalQuestions += questions.length;
        }

        return {
            totalSessions,
            totalQuestions,
            avgQuestionsPerSession: totalSessions > 0 ? (totalQuestions / totalSessions).toFixed(1) : 0
        };
    }
}

const questionHistoryManager = new QuestionHistoryManager();
export default questionHistoryManager;