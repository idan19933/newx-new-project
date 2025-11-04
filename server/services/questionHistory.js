// server/services/questionHistory.js - HYBRID VERSION 🔄
import pool from '../config/database.js';
import crypto from 'crypto';

class QuestionHistoryManager {
    constructor() {
        // ✅ Keep in-memory for FAST session checks
        this.history = new Map();
        this.maxHistorySize = 15;
    }

    getKey(studentId, topicId) {
        return `${studentId}_${topicId}`;
    }

    addQuestion(studentId, topicId, questionData) {
        const key = this.getKey(studentId, topicId);

        if (!this.history.has(key)) {
            this.history.set(key, []);
        }

        const questions = this.history.get(key);
        questions.push({
            question: questionData.question,
            timestamp: Date.now(),
            keywords: this.extractKeywords(questionData.question),
            numbers: this.extractNumbers(questionData.question)
        });

        if (questions.length > this.maxHistorySize) {
            questions.shift();
        }
    }

    extractKeywords(question) {
        const mathTerms = question.match(/[א-ת]{3,}/g) || [];
        return mathTerms.slice(0, 8);
    }

    extractNumbers(question) {
        return question.match(/\d+(\.\d+)?/g) || [];
    }

    getRecentQuestions(studentId, topicId, count = 5) {
        const key = this.getKey(studentId, topicId);
        const questions = this.history.get(key) || [];
        return questions.slice(-count);
    }

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

    // ==================== DATABASE METHODS ====================

    hashQuestion(questionText) {
        return crypto
            .createHash('md5')
            .update(questionText.trim().toLowerCase())
            .digest('hex');
    }

    async recordToDatabase(firebaseUid, questionData) {
        try {
            const { topicId, subtopicId, questionText, difficulty } = questionData;

            const userResult = await pool.query(
                'SELECT id FROM users WHERE firebase_uid = $1',
                [firebaseUid]
            );

            if (userResult.rows.length === 0) {
                console.log('⚠️ User not found for database recording');
                return false;
            }

            const userId = userResult.rows[0].id;
            const questionHash = this.hashQuestion(questionText);

            await pool.query(
                `INSERT INTO question_history 
                (user_id, firebase_uid, topic_id, subtopic_id, question_text, question_hash, difficulty, asked_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
                [
                    userId,
                    firebaseUid,
                    topicId || null,
                    subtopicId || null,
                    questionText,
                    questionHash,
                    difficulty
                ]
            );

            return true;

        } catch (error) {
            console.error('❌ Database recording error:', error);
            return false;
        }
    }

    async getDatabaseQuestions(firebaseUid, topicId = null, days = 14) {
        try {
            let query = `
                SELECT question_text, difficulty, asked_at
                FROM question_history
                WHERE firebase_uid = $1
                  AND asked_at > NOW() - INTERVAL '${days} days'
            `;

            const params = [firebaseUid];

            if (topicId) {
                query += ` AND topic_id = $2`;
                params.push(topicId);
                query += ` ORDER BY asked_at DESC LIMIT 20`;
            } else {
                query += ` ORDER BY asked_at DESC LIMIT 20`;
            }

            const result = await pool.query(query, params);

            return result.rows.map(row => ({
                question: row.question_text,
                difficulty: row.difficulty,
                askedAt: row.asked_at
            }));

        } catch (error) {
            console.error('❌ Database query error:', error);
            return [];
        }
    }

    async buildAvoidancePrompt(studentId, topicId) {
        let prompt = '';

        // ✅ Part 1: Session history
        const sessionQuestions = this.getRecentQuestions(studentId, topicId, 3);

        if (sessionQuestions.length > 0) {
            prompt += '\n🚫 AVOID - Questions from THIS SESSION:\n';
            sessionQuestions.forEach((q, idx) => {
                const preview = q.question.substring(0, 100);
                prompt += `${idx + 1}. "${preview}..."\n`;
            });
        }

        // ✅ Part 2: Database history
        try {
            const dbQuestions = await this.getDatabaseQuestions(studentId, topicId, 7);

            if (dbQuestions.length > 0) {
                prompt += '\n🚫 AVOID - Questions from PAST WEEK:\n';

                dbQuestions.slice(0, 5).forEach((q, idx) => {
                    const preview = q.question.substring(0, 80);
                    const daysAgo = Math.floor((Date.now() - new Date(q.askedAt)) / (1000 * 60 * 60 * 24));
                    prompt += `${idx + 1}. "${preview}..." (${daysAgo} days ago)\n`;
                });
            }
        } catch (error) {
            console.error('⚠️ Could not load database history:', error);
        }

        if (prompt) {
            prompt += '\n✅ CREATE SOMETHING COMPLETELY DIFFERENT!\n';
        }

        return prompt;
    }
}

const questionHistoryManager = new QuestionHistoryManager();
export default questionHistoryManager;
