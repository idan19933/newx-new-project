// backend/routes/bagrExamRoutes.js
import express from 'express';
import pool from '../config/database.js';
import { verifyToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

// Configure multer for answer image uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const dir = 'uploads/exam-answers';
        await fs.mkdir(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `answer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|pdf/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);

        if (ext && mime) {
            cb(null, true);
        } else {
            cb(new Error('Only images and PDFs allowed'));
        }
    }
});

// ==========================================
// GET ALL EXAMS (with filters)
// ==========================================
router.get('/exams', async (req, res) => {
    try {
        const { grade, units, year, season } = req.query;

        let query = `
            SELECT 
                e.*,
                COALESCE(s.total_attempts, 0) as attempts,
                COALESCE(s.avg_score, 0) as avg_score,
                COALESCE(s.completion_rate, 0) as completion_rate,
                (SELECT COUNT(*) FROM bagrut_exam_questions WHERE exam_id = e.id) as question_count
            FROM bagrut_exams e
            LEFT JOIN bagrut_exam_stats s ON e.id = s.exam_id
            WHERE e.is_active = true
        `;

        const params = [];
        let paramIndex = 1;

        if (grade) {
            query += ` AND e.grade_level = $${paramIndex}`;
            params.push(parseInt(grade));
            paramIndex++;
        }

        if (units) {
            query += ` AND e.units = $${paramIndex}`;
            params.push(parseInt(units));
            paramIndex++;
        }

        if (year) {
            query += ` AND e.exam_year = $${paramIndex}`;
            params.push(parseInt(year));
            paramIndex++;
        }

        if (season) {
            query += ` AND e.exam_season = $${paramIndex}`;
            params.push(season);
            paramIndex++;
        }

        query += ` ORDER BY e.exam_year DESC, e.exam_season DESC`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            exams: result.rows,
            total: result.rows.length
        });

    } catch (error) {
        console.error('Error fetching exams:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// GET SINGLE EXAM WITH QUESTIONS
// ==========================================
router.get('/exams/:examId', async (req, res) => {
    try {
        const { examId } = req.params;

        // Get exam details
        const examResult = await pool.query(
            `SELECT e.*, 
                    COALESCE(s.total_attempts, 0) as attempts,
                    COALESCE(s.avg_score, 0) as avg_score
             FROM bagrut_exams e
             LEFT JOIN bagrut_exam_stats s ON e.id = s.exam_id
             WHERE e.id = $1`,
            [examId]
        );

        if (examResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Exam not found' });
        }

        // Get questions
        const questionsResult = await pool.query(
            `SELECT * FROM bagrut_exam_questions 
             WHERE exam_id = $1 
             ORDER BY section_number, question_number, sub_question`,
            [examId]
        );

        res.json({
            success: true,
            exam: examResult.rows[0],
            questions: questionsResult.rows
        });

    } catch (error) {
        console.error('Error fetching exam:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// START EXAM ATTEMPT
// ==========================================
router.post('/exams/:examId/start', verifyToken, async (req, res) => {
    try {
        const { examId } = req.params;
        const userId = req.user.uid;
        const { isPractice = true } = req.body;

        // Get exam details
        const examResult = await pool.query(
            'SELECT * FROM bagrut_exams WHERE id = $1',
            [examId]
        );

        if (examResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Exam not found' });
        }

        const exam = examResult.rows[0];

        // Create attempt
        const attemptResult = await pool.query(
            `INSERT INTO student_exam_attempts (
                user_id, exam_id, is_practice, max_score
            ) VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [userId, examId, isPractice, exam.total_points || 100]
        );

        res.json({
            success: true,
            attempt: attemptResult.rows[0]
        });

    } catch (error) {
        console.error('Error starting exam:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// SUBMIT ANSWER (with optional image)
// ==========================================
router.post('/attempts/:attemptId/answers',
    verifyToken,
    upload.single('answerImage'),
    async (req, res) => {
        try {
            const { attemptId } = req.params;
            const userId = req.user.uid;
            const { questionId, answer, timeSpent } = req.body;

            // Verify attempt belongs to user
            const attemptResult = await pool.query(
                'SELECT * FROM student_exam_attempts WHERE id = $1 AND user_id = $2',
                [attemptId, userId]
            );

            if (attemptResult.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Attempt not found' });
            }

            // Get question details
            const questionResult = await pool.query(
                'SELECT * FROM bagrut_exam_questions WHERE id = $1',
                [questionId]
            );

            if (questionResult.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Question not found' });
            }

            const question = questionResult.rows[0];

            // Get image URL if uploaded
            const answerImageUrl = req.file ? `/uploads/exam-answers/${req.file.filename}` : null;

            // Check answer correctness (basic check - AI verification will come later)
            const isCorrect = answer?.trim().toLowerCase() === question.correct_answer?.trim().toLowerCase();
            const pointsEarned = isCorrect ? question.points : 0;

            // Save answer
            const answerResult = await pool.query(
                `INSERT INTO student_exam_answers (
                    attempt_id, question_id, user_id, student_answer, answer_image_url,
                    is_correct, points_earned, max_points, time_spent_seconds
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *`,
                [
                    attemptId, questionId, userId, answer, answerImageUrl,
                    isCorrect, pointsEarned, question.points, timeSpent || 0
                ]
            );

            // Update attempt progress
            await pool.query(
                `UPDATE student_exam_attempts 
                 SET total_questions_answered = total_questions_answered + 1,
                     total_score = total_score + $1,
                     current_question = current_question + 1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2`,
                [pointsEarned, attemptId]
            );

            res.json({
                success: true,
                answer: answerResult.rows[0],
                isCorrect,
                pointsEarned,
                correctAnswer: question.correct_answer,
                explanation: question.explanation
            });

        } catch (error) {
            console.error('Error submitting answer:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
);

// ==========================================
// COMPLETE EXAM ATTEMPT
// ==========================================
router.post('/attempts/:attemptId/complete', verifyToken, async (req, res) => {
    try {
        const { attemptId } = req.params;
        const userId = req.user.uid;

        // Get attempt
        const attemptResult = await pool.query(
            'SELECT * FROM student_exam_attempts WHERE id = $1 AND user_id = $2',
            [attemptId, userId]
        );

        if (attemptResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Attempt not found' });
        }

        const attempt = attemptResult.rows[0];

        // Calculate time spent
        const timeSpent = Math.floor((Date.now() - new Date(attempt.start_time).getTime()) / 60000);

        // Calculate percentage
        const percentage = attempt.max_score > 0
            ? (attempt.total_score / attempt.max_score * 100).toFixed(2)
            : 0;

        // Update attempt
        const result = await pool.query(
            `UPDATE student_exam_attempts 
             SET status = 'completed',
                 end_time = CURRENT_TIMESTAMP,
                 time_spent_minutes = $1,
                 percentage = $2,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            [timeSpent, percentage, attemptId]
        );

        // Update exam completion count
        await pool.query(
            'UPDATE bagrut_exams SET completion_count = completion_count + 1 WHERE id = $1',
            [attempt.exam_id]
        );

        res.json({
            success: true,
            attempt: result.rows[0],
            summary: {
                totalScore: attempt.total_score,
                maxScore: attempt.max_score,
                percentage: parseFloat(percentage),
                timeSpent: timeSpent,
                questionsAnswered: attempt.total_questions_answered
            }
        });

    } catch (error) {
        console.error('Error completing exam:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// GET USER'S EXAM HISTORY
// ==========================================
router.get('/my-attempts', verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;

        const result = await pool.query(
            `SELECT 
                a.*,
                e.exam_name,
                e.exam_code,
                e.grade_level,
                e.units,
                e.exam_year
             FROM student_exam_attempts a
             JOIN bagrut_exams e ON a.exam_id = e.id
             WHERE a.user_id = $1
             ORDER BY a.created_at DESC
             LIMIT 50`,
            [userId]
        );

        res.json({
            success: true,
            attempts: result.rows
        });

    } catch (error) {
        console.error('Error fetching attempts:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// GET ATTEMPT DETAILS WITH ANSWERS
// ==========================================
router.get('/attempts/:attemptId', verifyToken, async (req, res) => {
    try {
        const { attemptId } = req.params;
        const userId = req.user.uid;

        // Get attempt
        const attemptResult = await pool.query(
            `SELECT a.*, e.exam_name, e.exam_code
             FROM student_exam_attempts a
             JOIN bagrut_exams e ON a.exam_id = e.id
             WHERE a.id = $1 AND a.user_id = $2`,
            [attemptId, userId]
        );

        if (attemptResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Attempt not found' });
        }

        // Get answers
        const answersResult = await pool.query(
            `SELECT 
                ans.*,
                q.question_text,
                q.correct_answer,
                q.explanation,
                q.question_number,
                q.section_number
             FROM student_exam_answers ans
             JOIN bagrut_exam_questions q ON ans.question_id = q.id
             WHERE ans.attempt_id = $1
             ORDER BY q.section_number, q.question_number`,
            [attemptId]
        );

        res.json({
            success: true,
            attempt: attemptResult.rows[0],
            answers: answersResult.rows
        });

    } catch (error) {
        console.error('Error fetching attempt details:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// REQUEST AI VERIFICATION FOR ANSWER
// ==========================================
router.post('/answers/:answerId/verify-ai', verifyToken, async (req, res) => {
    try {
        const { answerId } = req.params;
        const userId = req.user.uid;

        // Get answer with question
        const result = await pool.query(
            `SELECT 
                ans.*,
                q.question_text,
                q.correct_answer,
                q.solution_steps,
                q.topic
             FROM student_exam_answers ans
             JOIN bagrut_exam_questions q ON ans.question_id = q.id
             WHERE ans.id = $1 AND ans.user_id = $2`,
            [answerId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Answer not found' });
        }

        const data = result.rows[0];

        // Call AI verification (you'll implement this)
        const aiVerification = await verifyAnswerWithAI(data);

        // Update answer with AI feedback
        await pool.query(
            `UPDATE student_exam_answers
             SET ai_feedback = $1,
                 ai_confidence = $2,
                 verified_by_ai = true,
                 needs_manual_review = $3,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [
                aiVerification.feedback,
                aiVerification.confidence,
                aiVerification.needsReview,
                answerId
            ]
        );

        res.json({
            success: true,
            verification: aiVerification
        });

    } catch (error) {
        console.error('Error verifying answer:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// HELPER: AI Verification
// ==========================================
async function verifyAnswerWithAI(answerData) {
    // This will be implemented with Claude API
    // For now, return a placeholder
    return {
        feedback: 'תשובה נבדקה',
        confidence: 85,
        needsReview: false
    };
}

export default router;