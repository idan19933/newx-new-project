// server/routes/adminRoutes.js - FULLY CORRECTED FOR student_missions
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import visionProcessorService from '../services/visionProcessorService.js';
import enhancedVisionProcessor from '../services/enhancedVisionProcessor.js';
import pool from '../config/database.js';

const router = express.Router();

// Configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'exams');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'exam-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files allowed!'));
        }
    }
});

// ==================== EXAM UPLOAD ENDPOINTS ====================

router.post('/upload-exam-enhanced', upload.single('image'), async (req, res) => {
    try {
        console.log('📤 Enhanced exam upload');
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image' });
        }
        const { examTitle, gradeLevel, subject, units, examType, uploadedBy } = req.body;
        const uploadResult = await pool.query(
            `INSERT INTO exam_uploads (filename, original_name, file_path, file_size, mime_type, exam_title, exam_type, grade_level, subject, units, uploaded_by, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'processing') RETURNING id`,
            [req.file.filename, req.file.originalname, req.file.path, req.file.size, req.file.mimetype, examTitle, examType, parseInt(gradeLevel), subject, units ? parseInt(units) : null, uploadedBy]
        );
        const uploadId = uploadResult.rows[0].id;
        await pool.query('UPDATE exam_uploads SET processing_started_at = NOW() WHERE id = $1', [uploadId]);
        const imageBuffer = fs.readFileSync(req.file.path);
        const enhancedResult = await enhancedVisionProcessor.processExamImageEnhanced(imageBuffer, { examTitle, gradeLevel: parseInt(gradeLevel), subject, units: units ? parseInt(units) : null, examType });
        if (!enhancedResult.success) throw new Error('Enhanced vision failed');
        const saveResult = await enhancedVisionProcessor.saveEnhancedQuestions(enhancedResult.questions, uploadId, { examTitle, gradeLevel: parseInt(gradeLevel), subject, units: units ? parseInt(units) : null, examType });
        await pool.query(`UPDATE exam_uploads SET status = 'completed', processing_completed_at = NOW(), questions_extracted = $1, total_questions = $2, contains_diagrams = $3, extracted_data = $4 WHERE id = $5`,
            [saveResult.savedCount, enhancedResult.questions.length, enhancedResult.containsDiagrams || false, JSON.stringify({ ...enhancedResult.metadata, totalEquations: enhancedResult.totalEquations || 0, totalDiagrams: enhancedResult.totalDiagrams || 0 }), uploadId]
        );
        res.json({ success: true, uploadId, questionsExtracted: saveResult.savedCount, totalQuestions: enhancedResult.questions.length, totalEquations: enhancedResult.totalEquations || 0, totalDiagrams: enhancedResult.totalDiagrams || 0 });
    } catch (error) {
        console.error('❌ Enhanced upload error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/upload-exam', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'No image' });
        const { examTitle, gradeLevel, subject, units, examType, uploadedBy } = req.body;
        const uploadResult = await pool.query(`INSERT INTO exam_uploads (filename, original_name, file_path, file_size, mime_type, exam_title, exam_type, grade_level, subject, units, uploaded_by, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'processing') RETURNING id`,
            [req.file.filename, req.file.originalname, req.file.path, req.file.size, req.file.mimetype, examTitle, examType, parseInt(gradeLevel), subject, units ? parseInt(units) : null, uploadedBy]
        );
        const uploadId = uploadResult.rows[0].id;
        const imageBuffer = fs.readFileSync(req.file.path);
        const visionResult = await visionProcessorService.processExamImage(imageBuffer, { examTitle, gradeLevel: parseInt(gradeLevel), subject, units: units ? parseInt(units) : null, examType });
        if (!visionResult.success) throw new Error('Vision processing failed');
        const saveResult = await visionProcessorService.saveExtractedQuestions(visionResult.questions, uploadId, { examTitle, gradeLevel: parseInt(gradeLevel), subject, units: units ? parseInt(units) : null, examType });
        await pool.query(`UPDATE exam_uploads SET status = 'completed', processing_completed_at = NOW(), questions_extracted = $1, total_questions = $2 WHERE id = $3`, [saveResult.savedCount, visionResult.questions.length, uploadId]);
        res.json({ success: true, uploadId, questionsExtracted: saveResult.savedCount, totalQuestions: visionResult.questions.length });
    } catch (error) {
        console.error('❌ Upload error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/upload-exam-grouped-enhanced', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'No image' });
        const { examTitle, gradeLevel, subject, units, examType, examGroupId, fileOrder, isSolutionPage, totalFilesInGroup, uploadedBy } = req.body;
        const uploadResult = await pool.query(
            `INSERT INTO exam_uploads (filename, original_name, file_path, file_size, mime_type, exam_title, exam_type, grade_level, subject, units, uploaded_by, status, exam_group_id, file_order, is_solution_page, total_files_in_group)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'processing', $12, $13, $14, $15) RETURNING id`,
            [req.file.filename, req.file.originalname, req.file.path, req.file.size, req.file.mimetype, examTitle, examType, parseInt(gradeLevel), subject, units ? parseInt(units) : null, uploadedBy, examGroupId, parseInt(fileOrder), isSolutionPage === 'true', parseInt(totalFilesInGroup)]
        );
        const uploadId = uploadResult.rows[0].id;
        const imageBuffer = fs.readFileSync(req.file.path);
        if (isSolutionPage === 'true') {
            const solutionResult = await enhancedVisionProcessor.extractSolutions(imageBuffer, examGroupId);
            await pool.query(`UPDATE exam_uploads SET status = 'completed', processing_completed_at = NOW(), questions_extracted = $1 WHERE id = $2`, [solutionResult.matchedCount || 0, uploadId]);
            res.json({ success: true, uploadId, solutionsMatched: solutionResult.matchedCount || 0, isSolutionPage: true });
        } else {
            const enhancedResult = await enhancedVisionProcessor.processExamImageEnhanced(imageBuffer, { examTitle, gradeLevel: parseInt(gradeLevel), subject, units: units ? parseInt(units) : null, examType });
            const saveResult = await enhancedVisionProcessor.saveEnhancedQuestions(enhancedResult.questions, uploadId, { examTitle, gradeLevel: parseInt(gradeLevel), subject, units: units ? parseInt(units) : null, examType });
            await pool.query(`UPDATE exam_uploads SET status = 'completed', processing_completed_at = NOW(), questions_extracted = $1, total_questions = $2, contains_diagrams = $3 WHERE id = $4`,
                [saveResult.savedCount, enhancedResult.questions.length, enhancedResult.containsDiagrams || false, uploadId]
            );
            res.json({ success: true, uploadId, questionsExtracted: saveResult.savedCount, totalEquations: enhancedResult.totalEquations || 0, isSolutionPage: false });
        }
    } catch (error) {
        console.error('❌ Grouped upload error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/create-exam', async (req, res) => {
    try {
        const { imageUrl, examTitle, gradeLevel, subject, units, examType, useEnhanced = true } = req.body;
        if (!imageUrl) return res.status(400).json({ success: false, error: 'imageUrl required' });
        const filename = imageUrl.split('/').pop() || 'uploaded-image.png';
        const uploadResult = await pool.query(`INSERT INTO exam_uploads (filename, original_name, image_url, exam_title, grade_level, subject, units, exam_type, status, uploaded_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING id`,
            [filename, 'uploaded-image.png', imageUrl, examTitle || 'Untitled', parseInt(gradeLevel) || 12, subject || 'mathematics', units ? parseInt(units) : 5, examType || 'bagrut', 'processing']
        );
        const uploadId = uploadResult.rows[0].id;
        const imagePath = imageUrl.startsWith('/') ? path.join(process.cwd(), imageUrl) : imageUrl;
        const imageBuffer = fs.readFileSync(imagePath);
        let result, savedCount;
        if (useEnhanced) {
            result = await enhancedVisionProcessor.processExamImageEnhanced(imageBuffer, { examTitle, gradeLevel: parseInt(gradeLevel), subject, units: units ? parseInt(units) : 5, examType });
            const saveResult = await enhancedVisionProcessor.saveEnhancedQuestions(result.questions, uploadId, { examTitle, gradeLevel: parseInt(gradeLevel), units: units ? parseInt(units) : 5 });
            savedCount = saveResult.savedCount;
            await pool.query(`UPDATE exam_uploads SET status = $1, total_questions = $2, questions_extracted = $3, contains_diagrams = $4, processed_at = NOW() WHERE id = $5`,
                ['completed', result.questions.length, savedCount, result.containsDiagrams || false, uploadId]
            );
        } else {
            result = await visionProcessorService.processExamImage(imageBuffer, { examTitle, gradeLevel: parseInt(gradeLevel), subject, units: units ? parseInt(units) : 5, examType });
            const saveResult = await visionProcessorService.saveExtractedQuestions(result.questions, uploadId, { examTitle, gradeLevel: parseInt(gradeLevel), units: units ? parseInt(units) : 5 });
            savedCount = saveResult.savedCount;
            await pool.query(`UPDATE exam_uploads SET status = $1, total_questions = $2, questions_extracted = $3, processed_at = NOW() WHERE id = $4`, ['completed', result.questions.length, savedCount, uploadId]);
        }
        res.json({ success: true, uploadId, questionsExtracted: savedCount, totalQuestions: result.questions.length, totalEquations: result.totalEquations || 0, enhanced: useEnhanced });
    } catch (error) {
        console.error('❌ Create exam error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/uploads', async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM exam_uploads ORDER BY uploaded_at DESC LIMIT 50`);
        res.json({ success: true, uploads: result.rows });
    } catch (error) {
        console.error('❌ Get uploads error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/exam-groups', async (req, res) => {
    try {
        const groupsResult = await pool.query(`
            SELECT exam_group_id, MIN(uploaded_at) as first_uploaded_at, MAX(uploaded_at) as last_uploaded_at, COUNT(*) as total_files, SUM(questions_extracted) as total_questions,
                   STRING_AGG(exam_title, ' | ' ORDER BY file_order) as combined_title, MAX(grade_level) as grade_level, MAX(units) as units, MAX(exam_type) as exam_type,
                   CASE WHEN COUNT(*) = COUNT(*) FILTER (WHERE status = 'completed') THEN 'completed' WHEN COUNT(*) FILTER (WHERE status = 'failed') > 0 THEN 'partial' ELSE 'processing' END as group_status
            FROM exam_uploads WHERE exam_group_id IS NOT NULL GROUP BY exam_group_id ORDER BY first_uploaded_at DESC
        `);
        const groups = [];
        for (const group of groupsResult.rows) {
            const filesResult = await pool.query(`SELECT id, exam_title, grade_level, units, exam_type, image_url, status, file_order, is_solution_page, questions_extracted, uploaded_at, processing_completed_at FROM exam_uploads WHERE exam_group_id = $1 ORDER BY file_order ASC`, [group.exam_group_id]);
            groups.push({ ...group, files: filesResult.rows });
        }
        res.json({ success: true, groups, total: groups.length });
    } catch (error) {
        console.error('❌ Fetch groups error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/uploads/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM exam_uploads WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
        res.json({ success: true, upload: result.rows[0] });
    } catch (error) {
        console.error('❌ Get upload error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/exam/:id/enhanced', async (req, res) => {
    try {
        const examResult = await pool.query('SELECT * FROM exam_uploads WHERE id = $1', [req.params.id]);
        if (examResult.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
        const exam = examResult.rows[0];
        const questionsResult = await pool.query(`SELECT id, question_text, topic, subtopic, difficulty, has_image, hints, correct_answer, explanation, solution_steps, equations, question_images, has_diagrams, diagram_description, raw_math_content, full_solution, has_solution, created_at FROM question_bank WHERE metadata->>'uploadId' = $1 ORDER BY created_at ASC`, [req.params.id]);
        const questions = questionsResult.rows;
        const totalEquations = questions.reduce((sum, q) => sum + (Array.isArray(q.equations) ? q.equations.length : 0), 0);
        const totalDiagrams = questions.filter(q => q.has_diagrams).length;
        res.json({ success: true, exam, questions, totalQuestions: questions.length, totalEquations, totalDiagrams });
    } catch (error) {
        console.error('❌ Get enhanced exam error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/exam/:id/questions', async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM question_bank WHERE metadata->>'uploadId' = $1 ORDER BY created_at ASC`, [req.params.id]);
        res.json({ success: true, questions: result.rows });
    } catch (error) {
        console.error('❌ Get questions error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/questions/:questionId/solution', async (req, res) => {
    try {
        const result = await pool.query(`SELECT id, question_text, full_solution, correct_answer, solution_steps, explanation, has_solution FROM question_bank WHERE id = $1`, [req.params.questionId]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
        res.json({ success: true, question: result.rows[0] });
    } catch (error) {
        console.error('❌ Fetch solution error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/questions/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM question_bank WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Delete question error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/upload/:id', async (req, res) => {
    try {
        await pool.query(`DELETE FROM question_bank WHERE metadata->>'uploadId' = $1`, [req.params.id]);
        await pool.query('DELETE FROM exam_uploads WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Delete upload error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== STUDENT MANAGEMENT ENDPOINTS ====================

router.get('/dashboard-stats', async (req, res) => {
    try {
        const usersResult = await pool.query('SELECT COUNT(*) FROM prototype_students');
        const totalUsers = parseInt(usersResult.rows[0].count);

        const activeUsersResult = await pool.query(`
            SELECT COUNT(DISTINCT CASE WHEN user_id ~ '^[0-9]+$' THEN user_id::integer ELSE NULL END)
            FROM student_question_history
            WHERE created_at > NOW() - INTERVAL '7 days' AND user_id IS NOT NULL
        `);
        const activeUsers = parseInt(activeUsersResult.rows[0].count);

        const questionsResult = await pool.query('SELECT COUNT(*) FROM student_question_history');
        const totalQuestions = parseInt(questionsResult.rows[0].count);

        const examsResult = await pool.query('SELECT COUNT(*) FROM bagrut_exams');
        const totalExams = parseInt(examsResult.rows[0].count);

        const missionsResult = await pool.query(`
            SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
            FROM student_missions
        `);
        const totalMissions = parseInt(missionsResult.rows[0]?.total || 0);
        const completedMissions = parseInt(missionsResult.rows[0]?.completed || 0);

        res.json({
            success: true,
            stats: { totalUsers, activeUsers, totalQuestions, totalExams, totalMissions, completedMissions, averageAccuracy: 0, averageStreak: 0, totalLearningTime: 0 }
        });
    } catch (error) {
        console.error('❌ Dashboard stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to load stats', details: error.message });
    }
});

router.get('/users', async (req, res) => {
    try {
        const { limit = 100 } = req.query;

        const query = `
            SELECT
                ps.id,
                ps.firebase_uid as "firebaseUid",
                COALESCE(ps.name, u.display_name) as "displayName",
                COALESCE(ps.name, u.display_name) as name,
                COALESCE(ps.email, u.email) as email,
                COALESCE(ps.grade, u.grade) as grade,
                ps.created_at as "createdAt",
                json_build_object(
                        'questionsAnswered', COALESCE(sqh_count.total, 0),
                        'correctAnswers', 0,
                        'streak', 0,
                        'practiceTime', 0,
                        'completedMissions', COALESCE(m_completed.count, 0),
                        'totalMissions', COALESCE(m_total.count, 0)
                ) as stats
            FROM prototype_students ps
                     LEFT JOIN users u ON ps.firebase_uid = u.firebase_uid OR ps.email = u.email
                     LEFT JOIN (
                SELECT CASE WHEN user_id ~ '^[0-9]+$' THEN user_id::integer ELSE NULL END as user_id, COUNT(*) as total
                FROM student_question_history WHERE user_id IS NOT NULL GROUP BY user_id
            ) sqh_count ON ps.id = sqh_count.user_id
                     LEFT JOIN (
                SELECT user_id, COUNT(*) as count FROM student_missions WHERE status = 'completed' GROUP BY user_id
            ) m_completed ON ps.id = m_completed.user_id
                     LEFT JOIN (
                SELECT user_id, COUNT(*) as count FROM student_missions GROUP BY user_id
            ) m_total ON ps.id = m_total.user_id
            ORDER BY ps.created_at DESC LIMIT $1
        `;

        const result = await pool.query(query, [limit]);
        res.json({ success: true, users: result.rows });
    } catch (error) {
        console.error('❌ Get users error:', error);
        res.status(500).json({ success: false, error: 'Failed to load users', details: error.message });
    }
});

router.get('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(`
            SELECT
                ps.id, ps.firebase_uid as "firebaseUid",
                COALESCE(ps.name, u.display_name) as "displayName",
                COALESCE(ps.name, u.display_name) as name,
                COALESCE(ps.email, u.email) as email,
                COALESCE(ps.grade, u.grade) as grade,
                COALESCE(ps.grade, u.grade) as track,
                ps.created_at as "createdAt"
            FROM prototype_students ps
            LEFT JOIN users u ON ps.firebase_uid = u.firebase_uid OR ps.email = u.email
            WHERE ps.id = $1
        `, [userId]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });
        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error('❌ Get user error:', error);
        res.status(500).json({ success: false, error: 'Failed to load user' });
    }
});

router.put('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { displayName, email, grade } = req.body;

        const result = await pool.query(`
            UPDATE prototype_students
            SET name = COALESCE($1, name), email = COALESCE($2, email),
                grade = COALESCE($3, grade), updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING id, firebase_uid as "firebaseUid", name as "displayName", name, email, grade, created_at as "createdAt"
        `, [displayName, email, grade, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error('❌ Update user error:', error);
        res.status(500).json({ success: false, error: 'Failed to update user' });
    }
});

router.get('/user-message/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        let dbUserId;

        if (/^\d+$/.test(userId)) {
            dbUserId = parseInt(userId);
        } else {
            const userResult = await pool.query('SELECT id FROM prototype_students WHERE firebase_uid = $1', [userId]);
            if (userResult.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }
            dbUserId = userResult.rows[0].id;
        }

        const result = await pool.query(`SELECT message, created_at as "createdAt", updated_at as "updatedAt" FROM admin_messages WHERE user_id = $1`, [dbUserId]);

        if (result.rows.length === 0) {
            return res.json({ success: true, message: null });
        }

        res.json({ success: true, ...result.rows[0] });
    } catch (error) {
        console.error('❌ Get message error:', error);
        res.status(500).json({ success: false, error: 'Failed to load message' });
    }
});

router.post('/user-message/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, error: 'Message cannot be empty' });
        }

        let dbUserId;

        if (/^\d+$/.test(userId)) {
            dbUserId = parseInt(userId);
        } else {
            const userResult = await pool.query('SELECT id FROM prototype_students WHERE firebase_uid = $1', [userId]);
            if (userResult.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }
            dbUserId = userResult.rows[0].id;
        }

        const result = await pool.query(`
            INSERT INTO admin_messages (user_id, message)
            VALUES ($1, $2)
            ON CONFLICT (user_id) 
            DO UPDATE SET message = EXCLUDED.message, updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [dbUserId, message.trim()]);

        res.json({ success: true, message: result.rows[0] });
    } catch (error) {
        console.error('❌ Save message error:', error);
        res.status(500).json({ success: false, error: 'Failed to save message' });
    }
});

router.get('/missions/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { type } = req.query;

        let query, params;

        if (/^\d+$/.test(userId)) {
            query = `SELECT id, title, description, config->>'topicId' as "topicId", mission_type as type, status, created_at as "createdAt", completed_at as "completedAt" FROM student_missions WHERE user_id = $1`;
            params = [parseInt(userId)];
        } else {
            const userResult = await pool.query('SELECT id FROM prototype_students WHERE firebase_uid = $1', [userId]);

            if (userResult.rows.length > 0) {
                const dbUserId = userResult.rows[0].id;
                query = `SELECT id, title, description, config->>'topicId' as "topicId", mission_type as type, status, created_at as "createdAt", completed_at as "completedAt" FROM student_missions WHERE firebase_uid = $1 OR user_id = $2`;
                params = [userId, dbUserId];
            } else {
                return res.json({ success: true, missions: [] });
            }
        }

        if (type) {
            query += ` AND mission_type = $${params.length + 1}`;
            params.push(type);
        }
        query += ` ORDER BY CASE status WHEN 'active' THEN 1 WHEN 'completed' THEN 2 ELSE 3 END, created_at DESC`;

        const result = await pool.query(query, params);
        res.json({ success: true, missions: result.rows });
    } catch (error) {
        console.error('❌ Get missions error:', error);
        res.status(500).json({ success: false, error: 'Failed to load missions' });
    }
});

router.post('/missions/create', async (req, res) => {
    try {
        const { userId, title, description, type, topicId } = req.body;
        if (!userId || !title) return res.status(400).json({ success: false, error: 'userId and title required' });

        const userResult = await pool.query('SELECT firebase_uid FROM prototype_students WHERE id = $1', [userId]);
        const firebaseUid = userResult.rows[0]?.firebase_uid;

        const result = await pool.query(`
            INSERT INTO student_missions (user_id, firebase_uid, title, description, mission_type, config)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
        `, [userId, firebaseUid, title, description || null, type || 'practice', JSON.stringify({ topicId: topicId || null })]);

        res.json({ success: true, mission: result.rows[0] });
    } catch (error) {
        console.error('❌ Create mission error:', error);
        res.status(500).json({ success: false, error: 'Failed to create mission' });
    }
});

router.post('/missions/:missionId/toggle', async (req, res) => {
    try {
        const { missionId } = req.params;
        const { completed } = req.body;

        const newStatus = completed ? 'completed' : 'active';
        const result = await pool.query(`
            UPDATE student_missions 
            SET status = $1, completed_at = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END 
            WHERE id = $2 RETURNING *
        `, [newStatus, missionId]);

        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Mission not found' });
        res.json({ success: true, mission: result.rows[0] });
    } catch (error) {
        console.error('❌ Toggle mission error:', error);
        res.status(500).json({ success: false, error: 'Failed to update mission' });
    }
});

router.post('/missions/complete/:missionId', async (req, res) => {
    try {
        const { missionId } = req.params;
        const result = await pool.query(`
            UPDATE student_missions 
            SET status = 'completed', completed_at = CURRENT_TIMESTAMP 
            WHERE id = $1 RETURNING *
        `, [missionId]);

        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Mission not found' });
        res.json({ success: true, mission: result.rows[0] });
    } catch (error) {
        console.error('❌ Complete mission error:', error);
        res.status(500).json({ success: false, error: 'Failed to complete mission' });
    }
});

router.delete('/missions/:missionId', async (req, res) => {
    try {
        const { missionId } = req.params;
        const result = await pool.query('DELETE FROM student_missions WHERE id = $1 RETURNING *', [missionId]);

        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Mission not found' });
        res.json({ success: true, deleted: result.rows[0] });
    } catch (error) {
        console.error('❌ Delete mission error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete mission' });
    }
});

router.get('/profile/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const questionStatsResult = await pool.query(`
            SELECT COUNT(*) as questions_answered, 0 as correct_answers, 0 as streak, 0 as practice_time
            FROM student_question_history
            WHERE CASE WHEN user_id ~ '^[0-9]+$' THEN user_id::integer = $1 ELSE false END
        `, [userId]);

        const missionStatsResult = await pool.query(`
            SELECT COUNT(*) as total_missions,
                   COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_missions
            FROM student_missions WHERE user_id = $1
        `, [userId]);

        const stats = {
            questionsAnswered: parseInt(questionStatsResult.rows[0]?.questions_answered || 0),
            correctAnswers: parseInt(questionStatsResult.rows[0]?.correct_answers || 0),
            streak: parseInt(questionStatsResult.rows[0]?.streak || 0),
            practiceTime: parseInt(questionStatsResult.rows[0]?.practice_time || 0),
            totalMissions: parseInt(missionStatsResult.rows[0]?.total_missions || 0),
            completedMissions: parseInt(missionStatsResult.rows[0]?.completed_missions || 0)
        };

        res.json({ success: true, stats });
    } catch (error) {
        console.error('❌ Get profile stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to load stats' });
    }
});

router.get('/curriculum/topics', async (req, res) => {
    const topics = [
        { id: 'algebra', name: 'אלגברה' },
        { id: 'geometry', name: 'גאומטריה' },
        { id: 'functions', name: 'פונקציות' },
        { id: 'calculus', name: 'חשבון אינפיניטסימלי' },
        { id: 'statistics', name: 'סטטיסטיקה והסתברות' },
        { id: 'trigonometry', name: 'טריגונומטריה' }
    ];
    res.json({ success: true, topics });
});

router.get('/topics', async (req, res) => {
    const topics = [
        { id: 'algebra', name: 'אלגברה' },
        { id: 'geometry', name: 'גאומטריה' },
        { id: 'functions', name: 'פונקציות' },
        { id: 'calculus', name: 'חשבון אינפיניטסימלי' },
        { id: 'statistics', name: 'סטטיסטיקה והסתברות' },
        { id: 'trigonometry', name: 'טריגונומטריה' }
    ];
    res.json({ success: true, topics });
});

router.get('/my-missions', async (req, res) => {
    try {
        const { firebaseUid, userId } = req.query;

        if (!firebaseUid && !userId) {
            return res.status(400).json({ success: false, error: 'firebaseUid or userId required' });
        }

        let query, params;

        if (firebaseUid) {
            const userResult = await pool.query('SELECT id FROM prototype_students WHERE firebase_uid = $1', [firebaseUid]);

            if (userResult.rows.length === 0) {
                return res.json({ success: true, missions: [] });
            }

            const dbUserId = userResult.rows[0].id;

            query = `
                SELECT m.id, m.title, m.description, m.config->>'topicId' as "topicId", 
                       m.mission_type as "type", m.status,
                       m.created_at as "createdAt", m.completed_at as "completedAt"
                FROM student_missions m
                WHERE m.firebase_uid = $1 OR m.user_id = $2
                ORDER BY CASE m.status WHEN 'active' THEN 1 WHEN 'completed' THEN 2 ELSE 3 END, m.created_at DESC
            `;
            params = [firebaseUid, dbUserId];
        } else {
            query = `
                SELECT m.id, m.title, m.description, m.config->>'topicId' as "topicId",
                       m.mission_type as "type", m.status,
                       m.created_at as "createdAt", m.completed_at as "completedAt"
                FROM student_missions m
                WHERE m.user_id = $1
                ORDER BY CASE m.status WHEN 'active' THEN 1 WHEN 'completed' THEN 2 ELSE 3 END, m.created_at DESC
            `;
            params = [userId];
        }

        const result = await pool.query(query, params);
        res.json({ success: true, missions: result.rows });
    } catch (error) {
        console.error('❌ Get my missions error:', error);
        res.status(500).json({ success: false, error: 'Failed to load missions' });
    }
});

router.get('/debug-users', async (req, res) => {
    try {
        const users = await pool.query(`SELECT * FROM users ORDER BY id LIMIT 10`);
        const columns = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `);

        res.json({
            success: true,
            columns: columns.rows,
            users: users.rows,
            message: 'These are ALL the fields in the users table'
        });
    } catch (error) {
        console.error('❌ Debug error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

console.log('✅ Admin routes (FULLY CORRECTED FOR student_missions)');

export default router;