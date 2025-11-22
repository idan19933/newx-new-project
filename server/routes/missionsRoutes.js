// server/routes/missionsRoutes.js - SMART MISSIONS API
import express from 'express';
import missionTracker from '../services/missionTracker.js';
import pool from '../config/database.js';

const router = express.Router();

// ==================== ADMIN: CREATE MISSION ====================
router.post('/create', async (req, res) => {
    console.log('📝 Creating mission:', req.body);

    try {
        const {
            userId,
            firebaseUid,
            title,
            description,
            missionType, // 'practice' | 'lecture' | 'notebook_review' | 'custom'
            config,      // Mission-specific configuration
            points,
            deadline,
            createdBy
        } = req.body;

        if (!userId && !firebaseUid) {
            return res.status(400).json({
                success: false,
                error: 'User ID or Firebase UID required'
            });
        }

        if (!title || !missionType) {
            return res.status(400).json({
                success: false,
                error: 'Title and mission type required'
            });
        }

        const result = await missionTracker.createMission({
            userId,
            firebaseUid,
            title,
            description,
            missionType,
            config,
            points,
            deadline,
            createdBy
        });

        res.json(result);

    } catch (error) {
        console.error('❌ Error creating mission:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==================== STUDENT: GET MY MISSIONS ====================
router.get('/my-missions/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await missionTracker.getUserMissions(userId);
        res.json(result);

    } catch (error) {
        console.error('❌ Error getting missions:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==================== STUDENT: GET MISSION DETAILS ====================
router.get('/mission/:missionId/:userId', async (req, res) => {
    try {
        const { missionId, userId } = req.params;

        const result = await missionTracker.getMissionDetails(missionId, userId);
        res.json(result);

    } catch (error) {
        console.error('❌ Error getting mission details:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==================== TRACK PRACTICE ATTEMPT ====================
router.post('/track/practice', async (req, res) => {
    console.log('📊 Tracking practice attempt');

    try {
        const {
            missionId,
            userId,
            questionId,
            questionText,
            isCorrect
        } = req.body;

        if (!missionId || !userId || !questionId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        const result = await missionTracker.trackPracticeAttempt({
            missionId,
            userId,
            questionId,
            questionText,
            isCorrect
        });

        res.json(result);

    } catch (error) {
        console.error('❌ Error tracking practice:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==================== TRACK LECTURE SECTION ====================
router.post('/track/lecture', async (req, res) => {
    console.log('📚 Tracking lecture section');

    try {
        const {
            missionId,
            userId,
            lectureId,
            sectionId,
            timeSpent
        } = req.body;

        if (!missionId || !userId || !lectureId || !sectionId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        const result = await missionTracker.trackLectureSection({
            missionId,
            userId,
            lectureId,
            sectionId,
            timeSpent
        });

        res.json(result);

    } catch (error) {
        console.error('❌ Error tracking lecture:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==================== ADMIN: GET ALL MISSIONS ====================
router.get('/admin/all', async (req, res) => {
    try {
        const query = `
            SELECT 
                m.*,
                u.name as user_name,
                u.email as user_email,
                COUNT(DISTINCT mp.id) as total_progress_entries
            FROM missions m
            LEFT JOIN users u ON m.user_id = u.id
            LEFT JOIN mission_progress mp ON m.id = mp.mission_id
            GROUP BY m.id, u.name, u.email
            ORDER BY m.created_at DESC
        `;

        const result = await pool.query(query);

        res.json({
            success: true,
            missions: result.rows
        });

    } catch (error) {
        console.error('❌ Error getting all missions:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==================== ADMIN: GET MISSION STATS ====================
router.get('/admin/stats', async (req, res) => {
    try {
        const statsQuery = `
            SELECT 
                COUNT(*) FILTER (WHERE status = 'active') as active_missions,
                COUNT(*) FILTER (WHERE status = 'completed') as completed_missions,
                COUNT(*) FILTER (WHERE status = 'expired') as expired_missions,
                COUNT(DISTINCT user_id) as users_with_missions,
                AVG(mp.accuracy) as avg_accuracy
            FROM missions m
            LEFT JOIN mission_progress mp ON m.id = mp.mission_id
        `;

        const result = await pool.query(statsQuery);

        res.json({
            success: true,
            stats: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error getting mission stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==================== UPDATE MISSION STATUS ====================
router.put('/update/:missionId', async (req, res) => {
    try {
        const { missionId } = req.params;
        const { status, deadline, points } = req.body;

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (status) {
            updates.push(`status = $${paramCount++}`);
            values.push(status);
        }
        if (deadline !== undefined) {
            updates.push(`deadline = $${paramCount++}`);
            values.push(deadline);
        }
        if (points !== undefined) {
            updates.push(`points = $${paramCount++}`);
            values.push(points);
        }

        if (updates.length === 0) {
            return res.json({ success: true, message: 'No updates provided' });
        }

        values.push(missionId);

        const query = `
            UPDATE missions
            SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await pool.query(query, values);

        res.json({
            success: true,
            mission: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error updating mission:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==================== DELETE MISSION ====================
router.delete('/delete/:missionId', async (req, res) => {
    try {
        const { missionId } = req.params;

        const query = 'DELETE FROM missions WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [missionId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Mission not found'
            });
        }

        res.json({
            success: true,
            message: 'Mission deleted'
        });

    } catch (error) {
        console.error('❌ Error deleting mission:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;