import express from 'express';
import pool from '../config/database.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for diagram uploads
const storage = multer.diskStorage({
    destination: 'uploads/exam-diagrams',
    filename: (req, file, cb) => {
        const uniqueName = `diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ==========================================
// ADD QUESTION TO EXAM
// ==========================================
router.post('/exams/:examId/questions', upload.single('diagram'), async (req, res) => {
    try {
        const { examId } = req.params;
        const {
            questionNumber,
            sectionNumber,
            subQuestion,
            questionText,
            correctAnswer,
            points,
            topic,
            difficulty,
            hints,
            solutionSteps,
            hasMultipleParts
        } = req.body;

        const diagramUrl = req.file ? `/uploads/exam-diagrams/${req.file.filename}` : null;

        const result = await pool.query(
            `INSERT INTO bagrut_exam_questions (
                exam_id, question_number, section_number, sub_question,
                question_text, correct_answer, points, topic, difficulty,
                hints, solution_steps, diagram_url, has_multiple_parts
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *`,
            [
                examId,
                questionNumber,
                sectionNumber || 1,
                subQuestion || null,
                questionText,
                correctAnswer,
                points || 10,
                topic || 'כללי',
                difficulty || 'medium',
                JSON.stringify(hints ? JSON.parse(hints) : []),
                JSON.stringify(solutionSteps ? JSON.parse(solutionSteps) : []),
                diagramUrl,
                hasMultipleParts || false
            ]
        );

        res.json({
            success: true,
            question: result.rows[0]
        });

    } catch (error) {
        console.error('Error adding question:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// UPDATE QUESTION
// ==========================================
router.put('/questions/:questionId', upload.single('diagram'), async (req, res) => {
    try {
        const { questionId } = req.params;
        const {
            questionText,
            correctAnswer,
            points,
            topic,
            difficulty,
            hints,
            solutionSteps
        } = req.body;

        const diagramUrl = req.file ? `/uploads/exam-diagrams/${req.file.filename}` : undefined;

        let query = `
            UPDATE bagrut_exam_questions
            SET question_text = $1,
                correct_answer = $2,
                points = $3,
                topic = $4,
                difficulty = $5,
                hints = $6,
                solution_steps = $7,
                updated_at = CURRENT_TIMESTAMP
        `;

        const params = [
            questionText,
            correctAnswer,
            points,
            topic,
            difficulty,
            JSON.stringify(hints ? JSON.parse(hints) : []),
            JSON.stringify(solutionSteps ? JSON.parse(solutionSteps) : [])
        ];

        if (diagramUrl) {
            query += `, diagram_url = $8 WHERE id = $9 RETURNING *`;
            params.push(diagramUrl, questionId);
        } else {
            query += ` WHERE id = $8 RETURNING *`;
            params.push(questionId);
        }

        const result = await pool.query(query, params);

        res.json({
            success: true,
            question: result.rows[0]
        });

    } catch (error) {
        console.error('Error updating question:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// DELETE QUESTION
// ==========================================
router.delete('/questions/:questionId', async (req, res) => {
    try {
        const { questionId } = req.params;

        await pool.query('DELETE FROM bagrut_exam_questions WHERE id = $1', [questionId]);

        res.json({ success: true });

    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// GET ALL QUESTIONS FOR EXAM
// ==========================================
router.get('/exams/:examId/questions', async (req, res) => {
    try {
        const { examId } = req.params;

        const result = await pool.query(
            `SELECT * FROM bagrut_exam_questions
             WHERE exam_id = $1
             ORDER BY section_number, question_number, sub_question`,
            [examId]
        );

        res.json({
            success: true,
            questions: result.rows
        });

    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;