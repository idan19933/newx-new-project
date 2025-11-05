// server/routes/adminRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import visionProcessorService from '../services/visionProcessorService.js';
import pool from '../config/database.js';

const router = express.Router();

// Configure multer for file uploads
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
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

/**
 * 📤 POST /api/admin/upload-exam
 * העלאת תמונת מבחן ועיבוד עם Claude Vision
 */
router.post('/upload-exam', upload.single('image'), async (req, res) => {
    try {
        console.log('📤 Admin upload exam request');

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image uploaded' });
        }

        const {
            examTitle,
            gradeLevel,
            subject,
            units,
            examType,
            uploadedBy
        } = req.body;

        // 1. שמור פרטי העלאה ל-DB
        const uploadResult = await pool.query(
            `INSERT INTO exam_uploads (
                filename, original_name, file_path, file_size, mime_type,
                exam_title, exam_type, grade_level, subject, units,
                uploaded_by, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'processing')
            RETURNING id`,
            [
                req.file.filename,
                req.file.originalname,
                req.file.path,
                req.file.size,
                req.file.mimetype,
                examTitle,
                examType,
                parseInt(gradeLevel),
                subject,
                units ? parseInt(units) : null,
                uploadedBy,
            ]
        );

        const uploadId = uploadResult.rows[0].id;

        // 2. עדכן שהעיבוד התחיל
        await pool.query(
            'UPDATE exam_uploads SET processing_started_at = NOW() WHERE id = $1',
            [uploadId]
        );

        // 3. קרא את התמונה
        const imageBuffer = fs.readFileSync(req.file.path);

        // 4. עבד עם Claude Vision
        const visionResult = await visionProcessorService.processExamImage(imageBuffer, {
            examTitle,
            gradeLevel: parseInt(gradeLevel),
            subject,
            units: units ? parseInt(units) : null,
            examType
        });

        if (!visionResult.success) {
            throw new Error('Vision processing failed');
        }

        // 5. שמור את השאלות שחולצו
        const saveResult = await visionProcessorService.saveExtractedQuestions(
            visionResult.questions,
            uploadId,
            {
                examTitle,
                gradeLevel: parseInt(gradeLevel),
                subject,
                units: units ? parseInt(units) : null,
                examType
            }
        );

        // 6. עדכן סטטוס
        await pool.query(
            `UPDATE exam_uploads SET
                status = 'completed',
                processing_completed_at = NOW(),
                questions_extracted = $1,
                total_questions = $2,
                extracted_data = $3
             WHERE id = $4`,
            [
                saveResult.savedCount,
                visionResult.questions.length,
                JSON.stringify(visionResult.metadata),
                uploadId
            ]
        );

        res.json({
            success: true,
            uploadId,
            questionsExtracted: saveResult.savedCount,
            totalQuestions: visionResult.questions.length,
            upload: {
                id: uploadId,
                exam_title: examTitle,
                grade_level: parseInt(gradeLevel),
                units: units ? parseInt(units) : null,
                total_questions: visionResult.questions.length,
                status: 'completed'
            }
        });

    } catch (error) {
        console.error('❌ Upload exam error:', error);

        // עדכן סטטוס שגיאה
        if (req.body.uploadId) {
            await pool.query(
                `UPDATE exam_uploads SET
                    status = 'failed',
                    error_message = $1,
                    processing_completed_at = NOW()
                 WHERE id = $2`,
                [error.message, req.body.uploadId]
            );
        }

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 📊 GET /api/admin/uploads
 * קבל רשימת העלאות
 */
router.get('/uploads', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM exam_uploads 
             ORDER BY uploaded_at DESC 
             LIMIT 50`
        );

        res.json({
            success: true,
            uploads: result.rows
        });

    } catch (error) {
        console.error('❌ Get uploads error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 🗑️ DELETE /api/admin/upload/:id
 * מחק העלאה
 */
router.delete('/upload/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // מחק מה-DB
        await pool.query('DELETE FROM exam_uploads WHERE id = $1', [id]);

        // מחק את הקובץ
        // TODO: implement file deletion

        res.json({ success: true });

    } catch (error) {
        console.error('❌ Delete upload error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;