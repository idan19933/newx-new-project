// server/routes/adminRoutes.js - COMPLETE MERGED VERSION
// Includes: Standard uploads, Enhanced extraction, Multi-file groups, Solutions
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import visionProcessorService from '../services/visionProcessorService.js';
import enhancedVisionProcessor from '../services/enhancedVisionProcessor.js;
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

/**
 * 📤 POST /api/admin/upload-exam-enhanced
 * העלאת מבחן עם חילוץ משוואות וגרפים
 */
router.post('/upload-exam-enhanced', upload.single('image'), async (req, res) => {
    try {
        console.log('📤 Enhanced exam upload');

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image' });
        }

        const { examTitle, gradeLevel, subject, units, examType, uploadedBy } = req.body;

        const uploadResult = await pool.query(
            `INSERT INTO exam_uploads (
                filename, original_name, file_path, file_size, mime_type,
                exam_title, exam_type, grade_level, subject, units,
                uploaded_by, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'processing')
                 RETURNING id`,
            [req.file.filename, req.file.originalname, req.file.path, req.file.size,
                req.file.mimetype, examTitle, examType, parseInt(gradeLevel),
                subject, units ? parseInt(units) : null, uploadedBy]
        );

        const uploadId = uploadResult.rows[0].id;
        await pool.query('UPDATE exam_uploads SET processing_started_at = NOW() WHERE id = $1', [uploadId]);

        const imageBuffer = fs.readFileSync(req.file.path);

        const enhancedResult = await enhancedVisionProcessor.processExamImageEnhanced(
            imageBuffer,
            { examTitle, gradeLevel: parseInt(gradeLevel), subject,
                units: units ? parseInt(units) : null, examType }
        );

        if (!enhancedResult.success) {
            throw new Error('Enhanced vision failed');
        }

        const saveResult = await enhancedVisionProcessor.saveEnhancedQuestions(
            enhancedResult.questions,
            uploadId,
            { examTitle, gradeLevel: parseInt(gradeLevel), subject,
                units: units ? parseInt(units) : null, examType }
        );

        await pool.query(
            `UPDATE exam_uploads SET
                                     status = 'completed',
                                     processing_completed_at = NOW(),
                                     questions_extracted = $1,
                                     total_questions = $2,
                                     contains_diagrams = $3,
                                     extracted_data = $4
             WHERE id = $5`,
            [saveResult.savedCount, enhancedResult.questions.length,
                enhancedResult.containsDiagrams || false,
                JSON.stringify({
                    ...enhancedResult.metadata,
                    totalEquations: enhancedResult.totalEquations || 0,
                    totalDiagrams: enhancedResult.totalDiagrams || 0
                }),
                uploadId]
        );

        res.json({
            success: true,
            uploadId,
            questionsExtracted: saveResult.savedCount,
            totalQuestions: enhancedResult.questions.length,
            totalEquations: enhancedResult.totalEquations || 0,
            totalDiagrams: enhancedResult.totalDiagrams || 0
        });

    } catch (error) {
        console.error('❌ Enhanced upload error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 📤 POST /api/admin/upload-exam
 * העלאת מבחן רגילה (backward compatibility)
 */
router.post('/upload-exam', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image' });
        }

        const { examTitle, gradeLevel, subject, units, examType, uploadedBy } = req.body;

        const uploadResult = await pool.query(
            `INSERT INTO exam_uploads (
                filename, original_name, file_path, file_size, mime_type,
                exam_title, exam_type, grade_level, subject, units,
                uploaded_by, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'processing')
            RETURNING id`,
            [req.file.filename, req.file.originalname, req.file.path, req.file.size,
                req.file.mimetype, examTitle, examType, parseInt(gradeLevel),
                subject, units ? parseInt(units) : null, uploadedBy]
        );

        const uploadId = uploadResult.rows[0].id;
        const imageBuffer = fs.readFileSync(req.file.path);

        const visionResult = await visionProcessorService.processExamImage(imageBuffer, {
            examTitle, gradeLevel: parseInt(gradeLevel), subject,
            units: units ? parseInt(units) : null, examType
        });

        if (!visionResult.success) throw new Error('Vision processing failed');

        const saveResult = await visionProcessorService.saveExtractedQuestions(
            visionResult.questions, uploadId,
            { examTitle, gradeLevel: parseInt(gradeLevel), subject,
                units: units ? parseInt(units) : null, examType }
        );

        await pool.query(
            `UPDATE exam_uploads SET
                status = 'completed',
                processing_completed_at = NOW(),
                questions_extracted = $1,
                total_questions = $2
            WHERE id = $3`,
            [saveResult.savedCount, visionResult.questions.length, uploadId]
        );

        res.json({
            success: true,
            uploadId,
            questionsExtracted: saveResult.savedCount,
            totalQuestions: visionResult.questions.length
        });

    } catch (error) {
        console.error('❌ Upload error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 📤 POST /api/admin/upload-exam-grouped-enhanced
 * העלאת קובץ כחלק מקבוצה
 */
router.post('/upload-exam-grouped-enhanced', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image' });
        }

        const {
            examTitle, gradeLevel, subject, units, examType,
            examGroupId, fileOrder, isSolutionPage, totalFilesInGroup, uploadedBy
        } = req.body;

        const uploadResult = await pool.query(
            `INSERT INTO exam_uploads (
                filename, original_name, file_path, file_size, mime_type,
                exam_title, exam_type, grade_level, subject, units,
                uploaded_by, status,
                exam_group_id, file_order, is_solution_page, total_files_in_group
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'processing', $12, $13, $14, $15)
            RETURNING id`,
            [req.file.filename, req.file.originalname, req.file.path, req.file.size,
                req.file.mimetype, examTitle, examType, parseInt(gradeLevel),
                subject, units ? parseInt(units) : null, uploadedBy,
                examGroupId, parseInt(fileOrder), isSolutionPage === 'true', parseInt(totalFilesInGroup)]
        );

        const uploadId = uploadResult.rows[0].id;
        const imageBuffer = fs.readFileSync(req.file.path);

        if (isSolutionPage === 'true') {
            const solutionResult = await enhancedVisionProcessor.extractSolutions(imageBuffer, examGroupId);
            await pool.query(
                `UPDATE exam_uploads SET status = 'completed', processing_completed_at = NOW(),
                 questions_extracted = $1 WHERE id = $2`,
                [solutionResult.matchedCount || 0, uploadId]
            );

            res.json({
                success: true,
                uploadId,
                solutionsMatched: solutionResult.matchedCount || 0,
                isSolutionPage: true
            });
        } else {
            const enhancedResult = await enhancedVisionProcessor.processExamImageEnhanced(
                imageBuffer,
                { examTitle, gradeLevel: parseInt(gradeLevel), subject,
                    units: units ? parseInt(units) : null, examType }
            );

            const saveResult = await enhancedVisionProcessor.saveEnhancedQuestions(
                enhancedResult.questions, uploadId,
                { examTitle, gradeLevel: parseInt(gradeLevel), subject,
                    units: units ? parseInt(units) : null, examType }
            );

            await pool.query(
                `UPDATE exam_uploads SET status = 'completed', processing_completed_at = NOW(),
                 questions_extracted = $1, total_questions = $2, contains_diagrams = $3
                 WHERE id = $4`,
                [saveResult.savedCount, enhancedResult.questions.length,
                    enhancedResult.containsDiagrams || false, uploadId]
            );

            res.json({
                success: true,
                uploadId,
                questionsExtracted: saveResult.savedCount,
                totalEquations: enhancedResult.totalEquations || 0,
                isSolutionPage: false
            });
        }

    } catch (error) {
        console.error('❌ Grouped upload error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 🎯 POST /api/admin/create-exam
 * צור מבחן מתמונה
 */
router.post('/create-exam', async (req, res) => {
    try {
        const { imageUrl, examTitle, gradeLevel, subject, units, examType, useEnhanced = true } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ success: false, error: 'imageUrl required' });
        }

        const filename = imageUrl.split('/').pop() || 'uploaded-image.png';

        const uploadResult = await pool.query(
            `INSERT INTO exam_uploads (
                filename, original_name, image_url, exam_title, grade_level,
                subject, units, exam_type, status, uploaded_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING id`,
            [filename, 'uploaded-image.png', imageUrl, examTitle || 'Untitled',
                parseInt(gradeLevel) || 12, subject || 'mathematics',
                units ? parseInt(units) : 5, examType || 'bagrut', 'processing']
        );

        const uploadId = uploadResult.rows[0].id;
        const imagePath = imageUrl.startsWith('/') ? path.join(process.cwd(), imageUrl) : imageUrl;
        const imageBuffer = fs.readFileSync(imagePath);

        let result, savedCount;

        if (useEnhanced) {
            result = await enhancedVisionProcessor.processExamImageEnhanced(
                imageBuffer,
                { examTitle, gradeLevel: parseInt(gradeLevel), subject,
                    units: units ? parseInt(units) : 5, examType }
            );

            const saveResult = await enhancedVisionProcessor.saveEnhancedQuestions(
                result.questions, uploadId,
                { examTitle, gradeLevel: parseInt(gradeLevel), units: units ? parseInt(units) : 5 }
            );

            savedCount = saveResult.savedCount;

            await pool.query(
                `UPDATE exam_uploads SET status = $1, total_questions = $2,
                 questions_extracted = $3, contains_diagrams = $4, processed_at = NOW()
                 WHERE id = $5`,
                ['completed', result.questions.length, savedCount,
                    result.containsDiagrams || false, uploadId]
            );
        } else {
            result = await visionProcessorService.processExamImage(
                imageBuffer,
                { examTitle, gradeLevel: parseInt(gradeLevel), subject,
                    units: units ? parseInt(units) : 5, examType }
            );

            const saveResult = await visionProcessorService.saveExtractedQuestions(
                result.questions, uploadId,
                { examTitle, gradeLevel: parseInt(gradeLevel), units: units ? parseInt(units) : 5 }
            );

            savedCount = saveResult.savedCount;

            await pool.query(
                `UPDATE exam_uploads SET status = $1, total_questions = $2,
                 questions_extracted = $3, processed_at = NOW() WHERE id = $4`,
                ['completed', result.questions.length, savedCount, uploadId]
            );
        }

        res.json({
            success: true,
            uploadId,
            questionsExtracted: savedCount,
            totalQuestions: result.questions.length,
            totalEquations: result.totalEquations || 0,
            enhanced: useEnhanced
        });

    } catch (error) {
        console.error('❌ Create exam error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 📊 GET /api/admin/uploads
 */
router.get('/uploads', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM exam_uploads ORDER BY uploaded_at DESC LIMIT 50`
        );
        res.json({ success: true, uploads: result.rows });
    } catch (error) {
        console.error('❌ Get uploads error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 📊 GET /api/admin/exam-groups
 */
router.get('/exam-groups', async (req, res) => {
    try {
        const groupsResult = await pool.query(`
            SELECT exam_group_id, MIN(uploaded_at) as first_uploaded_at,
                   MAX(uploaded_at) as last_uploaded_at, COUNT(*) as total_files,
                   SUM(questions_extracted) as total_questions,
                   STRING_AGG(exam_title, ' | ' ORDER BY file_order) as combined_title,
                   MAX(grade_level) as grade_level, MAX(units) as units,
                   MAX(exam_type) as exam_type,
                   CASE 
                       WHEN COUNT(*) = COUNT(*) FILTER (WHERE status = 'completed') THEN 'completed'
                       WHEN COUNT(*) FILTER (WHERE status = 'failed') > 0 THEN 'partial'
                       ELSE 'processing'
                   END as group_status
            FROM exam_uploads WHERE exam_group_id IS NOT NULL
            GROUP BY exam_group_id ORDER BY first_uploaded_at DESC
        `);

        const groups = [];
        for (const group of groupsResult.rows) {
            const filesResult = await pool.query(`
                SELECT id, exam_title, grade_level, units, exam_type, image_url,
                       status, file_order, is_solution_page, questions_extracted,
                       uploaded_at, processing_completed_at
                FROM exam_uploads WHERE exam_group_id = $1 ORDER BY file_order ASC
            `, [group.exam_group_id]);

            groups.push({ ...group, files: filesResult.rows });
        }

        res.json({ success: true, groups, total: groups.length });
    } catch (error) {
        console.error('❌ Fetch groups error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 📄 GET /api/admin/uploads/:id
 */
router.get('/uploads/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM exam_uploads WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Not found' });
        }
        res.json({ success: true, upload: result.rows[0] });
    } catch (error) {
        console.error('❌ Get upload error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 📄 GET /api/admin/exam/:id/enhanced
 */
router.get('/exam/:id/enhanced', async (req, res) => {
    try {
        const examResult = await pool.query('SELECT * FROM exam_uploads WHERE id = $1', [req.params.id]);
        if (examResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Not found' });
        }

        const exam = examResult.rows[0];

        const questionsResult = await pool.query(`
            SELECT id, question_text, topic, subtopic, difficulty, has_image,
                   hints, correct_answer, explanation, solution_steps,
                   equations, question_images, has_diagrams, diagram_description,
                   raw_math_content, full_solution, has_solution, created_at
            FROM question_bank WHERE metadata->>'uploadId' = $1 ORDER BY created_at ASC
        `, [req.params.id]);

        const questions = questionsResult.rows;
        const totalEquations = questions.reduce((sum, q) => {
            const equations = q.equations || [];
            return sum + (Array.isArray(equations) ? equations.length : 0);
        }, 0);
        const totalDiagrams = questions.filter(q => q.has_diagrams).length;

        res.json({
            success: true,
            exam,
            questions,
            totalQuestions: questions.length,
            totalEquations,
            totalDiagrams
        });
    } catch (error) {
        console.error('❌ Get enhanced exam error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 📚 GET /api/admin/exam/:id/questions
 */
router.get('/exam/:id/questions', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM question_bank WHERE metadata->>'uploadId' = $1 ORDER BY created_at ASC`,
            [req.params.id]
        );
        res.json({ success: true, questions: result.rows });
    } catch (error) {
        console.error('❌ Get questions error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 📄 GET /api/questions/:questionId/solution
 */
router.get('/questions/:questionId/solution', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, question_text, full_solution, correct_answer,
                   solution_steps, explanation, has_solution
            FROM question_bank WHERE id = $1
        `, [req.params.questionId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Not found' });
        }

        res.json({ success: true, question: result.rows[0] });
    } catch (error) {
        console.error('❌ Fetch solution error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 🗑️ DELETE /api/admin/questions/:id
 */
router.delete('/questions/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM question_bank WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Delete question error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 🗑️ DELETE /api/admin/upload/:id
 */
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

export default router;