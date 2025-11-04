// server/routes/progressRoutes.js - FIXED: NO DUPLICATE SAVES
import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

/**
 * Helper function to get internal user ID from Firebase UID
 */
async function getUserIdFromFirebaseUid(firebaseUid) {
    try {
        const result = await pool.query(
            'SELECT id FROM users WHERE firebase_uid = $1',
            [firebaseUid]
        );
        
        if (result.rows.length > 0) {
            return result.rows[0].id;
        }
        return null;
    } catch (error) {
        console.error('❌ Error looking up user:', error);
        return null;
    }
}

/**
 * Record progress - ONLY saves to progress_tracking table
 * Does NOT duplicate to notebook
 */
router.post('/record', async (req, res) => {
    try {
        const { 
            userId, 
            topicId, 
            subtopicId, 
            topic, 
            subtopic, 
            correct, 
            timeSpent, 
            hintsUsed, 
            attempts 
        } = req.body;

        console.log('📊 Recording progress:', {
            userId,
            topic,
            subtopic,
            correct
        });

        // Get internal user ID
        const internalUserId = await getUserIdFromFirebaseUid(userId);
        console.log("debug");
        if (!internalUserId) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Insert into progress_tracking table ONLY
        const result = await pool.query(
            `INSERT INTO progress_tracking 
            (user_id, topic_id, subtopic_id, topic, subtopic, correct, time_spent, hints_used, attempts, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            RETURNING *`,
            [
                internalUserId,
                topicId || null,
                subtopicId || null,
                topic,
                subtopic || null,
                correct,
                timeSpent || 0,
                hintsUsed || 0,
                attempts || 1
            ]
        );

        console.log('✅ Progress recorded');

        res.json({
            success: true,
            progress: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error recording progress:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record progress',
            error: error.message
        });
    }
});

/**
 * Get user progress by topic
 */
router.get('/topic/:userId/:topicId', async (req, res) => {
    try {
        const { userId, topicId } = req.params;

        const internalUserId = await getUserIdFromFirebaseUid(userId);
        
        if (!internalUserId) {
            return res.json({
                success: true,
                progress: []
            });
        }

        const result = await pool.query(
            `SELECT * FROM progress_tracking 
            WHERE user_id = $1 AND topic_id = $2
            ORDER BY created_at DESC`,
            [internalUserId, topicId]
        );

        res.json({
            success: true,
            progress: result.rows
        });

    } catch (error) {
        console.error('❌ Error fetching progress:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch progress',
            error: error.message
        });
    }
});

/**
 * Get all user progress
 */
router.get('/all/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const internalUserId = await getUserIdFromFirebaseUid(userId);
        
        if (!internalUserId) {
            return res.json({
                success: true,
                progress: []
            });
        }

        const result = await pool.query(
            `SELECT * FROM progress_tracking 
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 100`,
            [internalUserId]
        );

        res.json({
            success: true,
            progress: result.rows,
            count: result.rows.length
        });

    } catch (error) {
        console.error('❌ Error fetching all progress:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch progress',
            error: error.message
        });
    }
});

router.get('/curriculum/:gradeId', async (req, res) => {
    try {
        const { gradeId } = req.params;
        console.log('📚 Fetching curriculum for:', gradeId);

        // Dynamic import to always get fresh data from file
        const { ISRAELI_CURRICULUM } = await import('../config/israeliCurriculum.js');

        const gradeConfig = ISRAELI_CURRICULUM[gradeId];

        if (!gradeConfig) {
            console.log('❌ Grade not found:', gradeId);
            return res.status(404).json({
                success: false,
                error: 'Grade not found'
            });
        }

        console.log('✅ Found', gradeConfig.topics?.length || 0, 'topics for', gradeId);

        res.json({
            success: true,
            data: {
                id: gradeConfig.id,
                name: gradeConfig.name,
                nameEn: gradeConfig.nameEn,
                emoji: gradeConfig.emoji,
                topics: gradeConfig.topics || []
            }
        });
    } catch (error) {
        console.error('❌ Error fetching curriculum:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch curriculum',
            message: error.message
        });
    }
});

export default router;
