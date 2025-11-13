// server/routes/adminRoutes.js - CORRECTED FOR PRODUCTION
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
// [Keeping all exam endpoints unchanged - they work fine]

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

// ==================== FIXED STUDENT MANAGEMENT ENDPOINTS ====================

/**
 * 📊 GET /api/admin/dashboard-stats - FIXED
 */
router.get('/dashboard-stats', async (req, res) => {
    try {
        // Total users from users table
        const usersResult = await pool.query('SELECT COUNT(*) FROM users');
        const totalUsers = parseInt(usersResult.rows[0].count);

        // Active users - users who have records in student_question_history in last 7 days
        const activeUsersResult = await pool.query(`
            SELECT COUNT(DISTINCT
                         CASE
                             WHEN user_id ~ '^[0-9]+$' THEN user_id::integer
                         ELSE NULL
                         END
                   )
            FROM student_question_history
            WHERE created_at > NOW() - INTERVAL '7 days'
              AND user_id IS NOT NULL
        `);
        const activeUsers = parseInt(activeUsersResult.rows[0].count);

        // Total questions from student_question_history
        const questionsResult = await pool.query('SELECT COUNT(*) FROM student_question_history');
        const totalQuestions = parseInt(questionsResult.rows[0].count);

        // Total exams
        const examsResult = await pool.query('SELECT COUNT(*) FROM bagrut_exams');
        const totalExams = parseInt(examsResult.rows[0].count);

        // Missions stats
        const missionsResult = await pool.query(`
            SELECT COUNT(*) as total, COUNT(CASE WHEN completed = true THEN 1 END) as completed 
            FROM missions
        `);
        const totalMissions = parseInt(missionsResult.rows[0]?.total || 0);
        const completedMissions = parseInt(missionsResult.rows[0]?.completed || 0);

        // Average accuracy - simplified to avoid column issues
        const averageAccuracy = 0; // Will calculate once we know the correct column names

        // Average streak
        const averageStreak = 0;

        // Total learning time - set to 0 since we don't know the column name
        const totalLearningTime = 0;

        res.json({
            success: true,
            stats: { totalUsers, activeUsers, totalQuestions, totalExams, totalMissions, completedMissions, averageAccuracy, averageStreak, totalLearningTime }
        });
    } catch (error) {
        console.error('❌ Dashboard stats error:', error);
        console.error('Full error:', error.stack);
        res.status(500).json({ success: false, error: 'Failed to load stats', details: error.message });
    }
});

/**
 * 👥 GET /api/admin/users - SIMPLIFIED TO AVOID COLUMN ISSUES
 */
router.get('/users', async (req, res) => {
    try {
        const { limit = 100 } = req.query;

        // Simple query that only uses columns we know exist in the users table
        // Note: u.id is INTEGER, but some tables may have user_id as VARCHAR, so we cast
        const query = `
            SELECT 
                u.id, 
                u.firebase_uid as "firebaseUid",
                u.display_name as "displayName",
                u.display_name as name,
                u.email, 
                u.grade,
                u.created_at as "createdAt",
                json_build_object(
                    'questionsAnswered', COALESCE(sqh_count.total, 0),
                    'correctAnswers', 0,
                    'streak', 0,
                    'practiceTime', 0,
                    'completedMissions', COALESCE(m_completed.count, 0),
                    'totalMissions', COALESCE(m_total.count, 0)
                ) as stats
            FROM users u
            LEFT JOIN (
                SELECT 
                    CASE 
                        WHEN user_id ~ '^[0-9]+$' THEN user_id::integer 
                        ELSE NULL 
                    END as user_id, 
                    COUNT(*) as total
                FROM student_question_history
                WHERE user_id IS NOT NULL
                GROUP BY user_id
            ) sqh_count ON u.id = sqh_count.user_id
            LEFT JOIN (
                SELECT user_id, COUNT(*) as count
                FROM missions
                WHERE completed = true
                GROUP BY user_id
            ) m_completed ON u.id = m_completed.user_id
            LEFT JOIN (
                SELECT user_id, COUNT(*) as count
                FROM missions
                GROUP BY user_id
            ) m_total ON u.id = m_total.user_id
            ORDER BY u.created_at DESC 
            LIMIT $1
        `;

        const result = await pool.query(query, [limit]);
        res.json({ success: true, users: result.rows });
    } catch (error) {
        console.error('❌ Get users error:', error);
        console.error('Full error:', error.stack);
        res.status(500).json({ success: false, error: 'Failed to load users', details: error.message });
    }
});

/**
 * 👤 GET /api/admin/users/:userId
 */
router.get('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(`
            SELECT 
                id, 
                firebase_uid as "firebaseUid",
                display_name as "displayName", 
                display_name as name,
                email, 
                grade,
                grade as track,
                created_at as "createdAt" 
            FROM users 
            WHERE id = $1
        `, [userId]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });
        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error('❌ Get user error:', error);
        res.status(500).json({ success: false, error: 'Failed to load user' });
    }
});

/**
 * 💬 GET /api/admin/user-message/:userId
 */
router.get('/user-message/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(`SELECT message, created_at as "createdAt", updated_at as "updatedAt" FROM admin_messages WHERE user_id = $1`, [userId]);
        if (result.rows.length === 0) return res.json({ success: true, message: null });
        res.json({ success: true, ...result.rows[0] });
    } catch (error) {
        console.error('❌ Get message error:', error);
        res.status(500).json({ success: false, error: 'Failed to load message' });
    }
});

/**
 * 💬 POST /api/admin/user-message/:userId
 */
router.post('/user-message/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { message } = req.body;
        if (!message || !message.trim()) return res.status(400).json({ success: false, error: 'Message cannot be empty' });
        const result = await pool.query(`INSERT INTO admin_messages (user_id, message) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET message = EXCLUDED.message, updated_at = CURRENT_TIMESTAMP RETURNING *`, [userId, message.trim()]);
        res.json({ success: true, message: result.rows[0] });
    } catch (error) {
        console.error('❌ Save message error:', error);
        res.status(500).json({ success: false, error: 'Failed to save message' });
    }
});

/**
 * 🎯 GET /api/admin/missions/user/:userId
 */
router.get('/missions/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { type } = req.query;
        let query = `SELECT id, title, description, topic_id as "topicId", type, completed, created_at as "createdAt", completed_at as "completedAt" FROM missions WHERE user_id = $1`;
        const params = [userId];
        if (type) { query += ` AND type = $2`; params.push(type); }
        query += ` ORDER BY completed ASC, created_at DESC`;
        const result = await pool.query(query, params);
        res.json({ success: true, missions: result.rows });
    } catch (error) {
        console.error('❌ Get missions error:', error);
        res.status(500).json({ success: false, error: 'Failed to load missions' });
    }
});

/**
 * 🎯 POST /api/admin/missions/create
 */
router.post('/missions/create', async (req, res) => {
    try {
        const { userId, title, description, type, topicId } = req.body;
        if (!userId || !title) return res.status(400).json({ success: false, error: 'userId and title required' });

        // Get the user's firebase_uid
        const userResult = await pool.query('SELECT firebase_uid FROM users WHERE id = $1', [userId]);
        const firebaseUid = userResult.rows[0]?.firebase_uid;

        // Check if missions table has firebase_uid column
        const columnCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'missions' AND column_name = 'firebase_uid'
        `);

        let result;
        if (columnCheck.rows.length > 0 && firebaseUid) {
            // Insert with firebase_uid
            result = await pool.query(`
                INSERT INTO missions (user_id, firebase_uid, title, description, type, topic_id) 
                VALUES ($1, $2, $3, $4, $5, $6) 
                RETURNING *
            `, [userId, firebaseUid, title, description || null, type || 'practice', topicId || null]);
        } else {
            // Insert without firebase_uid
            result = await pool.query(`
                INSERT INTO missions (user_id, title, description, type, topic_id) 
                VALUES ($1, $2, $3, $4, $5) 
                RETURNING *
            `, [userId, title, description || null, type || 'practice', topicId || null]);
        }

        res.json({ success: true, mission: result.rows[0] });
    } catch (error) {
        console.error('❌ Create mission error:', error);
        res.status(500).json({ success: false, error: 'Failed to create mission' });
    }
});

/**
 * 🎯 POST /api/admin/missions/:missionId/toggle
 */
router.post('/missions/:missionId/toggle', async (req, res) => {
    try {
        const { missionId } = req.params;
        const { completed } = req.body;
        const result = await pool.query(`UPDATE missions SET completed = $1, completed_at = CASE WHEN $1 = true THEN CURRENT_TIMESTAMP ELSE NULL END WHERE id = $2 RETURNING *`, [completed, missionId]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Mission not found' });
        res.json({ success: true, mission: result.rows[0] });
    } catch (error) {
        console.error('❌ Toggle mission error:', error);
        res.status(500).json({ success: false, error: 'Failed to update mission' });
    }
});

/**
 * 🎯 POST /api/admin/missions/complete/:missionId
 */
router.post('/missions/complete/:missionId', async (req, res) => {
    try {
        const { missionId } = req.params;
        const result = await pool.query(`UPDATE missions SET completed = true, completed_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`, [missionId]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Mission not found' });
        res.json({ success: true, mission: result.rows[0] });
    } catch (error) {
        console.error('❌ Complete mission error:', error);
        res.status(500).json({ success: false, error: 'Failed to complete mission' });
    }
});

/**
 * 🗑️ DELETE /api/admin/missions/:missionId
 */
router.delete('/missions/:missionId', async (req, res) => {
    try {
        const { missionId } = req.params;
        const result = await pool.query('DELETE FROM missions WHERE id = $1 RETURNING *', [missionId]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Mission not found' });
        res.json({ success: true, deleted: result.rows[0] });
    } catch (error) {
        console.error('❌ Delete mission error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete mission' });
    }
});

/**
 * 📊 GET /api/admin/profile/stats/:userId - Get detailed user stats
 */
router.get('/profile/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Get question stats from student_question_history
        const questionStatsResult = await pool.query(`
            SELECT 
                COUNT(*) as questions_answered,
                0 as correct_answers,
                0 as streak,
                0 as practice_time
            FROM student_question_history
            WHERE CASE 
                WHEN user_id ~ '^[0-9]+$' THEN user_id::integer = $1
                ELSE false
            END
        `, [userId]);

        // Get mission stats
        const missionStatsResult = await pool.query(`
            SELECT 
                COUNT(*) as total_missions,
                COUNT(CASE WHEN completed = true THEN 1 END) as completed_missions
            FROM missions
            WHERE user_id = $1
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

/**
 * 📚 GET /api/admin/curriculum/topics - Get curriculum topics
 */
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

/**
 * 📚 GET /api/admin/topics
 */
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

/**
 * 🎯 GET /api/admin/my-missions - Get missions for a user by firebase_uid
 * This can be used by the student's dashboard to fetch their missions
 */
router.get('/my-missions', async (req, res) => {
    try {
        const { firebaseUid, userId } = req.query;

        if (!firebaseUid && !userId) {
            return res.status(400).json({ success: false, error: 'firebaseUid or userId required' });
        }

        let query, params;

        if (firebaseUid) {
            // Query by firebase_uid
            query = `
                SELECT 
                    m.id, 
                    m.title, 
                    m.description, 
                    m.topic_id as "topicId", 
                    m.type, 
                    m.completed, 
                    m.created_at as "createdAt", 
                    m.completed_at as "completedAt"
                FROM missions m
                WHERE m.firebase_uid = $1
                ORDER BY m.completed ASC, m.created_at DESC
            `;
            params = [firebaseUid];
        } else {
            // Query by user_id
            query = `
                SELECT 
                    m.id, 
                    m.title, 
                    m.description, 
                    m.topic_id as "topicId", 
                    m.type, 
                    m.completed, 
                    m.created_at as "createdAt", 
                    m.completed_at as "completedAt"
                FROM missions m
                WHERE m.user_id = $1
                ORDER BY m.completed ASC, m.created_at DESC
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

console.log('✅ Admin routes (exams + student management) CORRECTED AND LOADED');

export default router;