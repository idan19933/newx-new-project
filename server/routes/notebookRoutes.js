// server/routes/notebookRoutes.js - FIXED: Query params + Answer saving
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
 * POST /api/notebook - Save answer to notebook (AUTO + MANUAL)
 * Called when user answers a question OR manually saves
 */
router.post('/', async (req, res) => {
    try {
        const {
            userId,
            topic,
            subtopic,
            questionText,
            userAnswer,
            correctAnswer,
            explanation,
            isCorrect,
            difficulty
        } = req.body;

        console.log('📔 Saving answer to notebook:', {
            userId,
            topic,
            isCorrect
        });

        // Get internal user ID
        let internalUserId = await getUserIdFromFirebaseUid(userId);

        // Create user if doesn't exist
        if (!internalUserId) {
            const createResult = await pool.query(
                'INSERT INTO users (firebase_uid) VALUES ($1) RETURNING id',
                [userId]
            );
            internalUserId = createResult.rows[0].id;
            console.log('✅ Created new user ID:', internalUserId);
        }

        // Insert into notebook
        const result = await pool.query(
            `INSERT INTO notebook_entries 
            (user_id, student_id, topic, subtopic, question_text, user_answer, correct_answer, explanation, is_correct, difficulty, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
            RETURNING *`,
            [
                internalUserId,
                internalUserId, // Use same as user_id
                topic,
                subtopic || null,
                questionText || '',
                userAnswer || '',
                correctAnswer || '',
                explanation || '',
                isCorrect || false,
                difficulty || 'medium'
            ]
        );

        console.log('✅ Saved to notebook, entry ID:', result.rows[0].id);

        res.json({
            success: true,
            entry: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error saving to notebook:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save to notebook',
            error: error.message
        });
    }
});

/**
 * POST /api/notebook/save-exercise - Alternative endpoint for frontend
 * Handles exerciseData wrapper structure
 */
router.post('/save-exercise', async (req, res) => {
    try {
        const { userId, exerciseData } = req.body;

        if (!userId || !exerciseData) {
            return res.status(400).json({
                success: false,
                message: 'Missing userId or exerciseData'
            });
        }

        console.log('📝 Saving exercise to notebook:', {
            userId,
            topic: exerciseData.topic,
            isCorrect: exerciseData.isCorrect
        });

        // Get internal user ID
        let internalUserId = await getUserIdFromFirebaseUid(userId);

        // Create user if doesn't exist
        if (!internalUserId) {
            const createResult = await pool.query(
                'INSERT INTO users (firebase_uid) VALUES ($1) RETURNING id',
                [userId]
            );
            internalUserId = createResult.rows[0].id;
            console.log('✅ Created new user ID:', internalUserId);
        }

        // Insert into notebook
        const result = await pool.query(
            `INSERT INTO notebook_entries 
            (user_id, student_id, topic, subtopic, question_text, user_answer, correct_answer, explanation, is_correct, difficulty, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
            RETURNING *`,
            [
                internalUserId,
                internalUserId,
                exerciseData.topic || '',
                exerciseData.subtopic || null,
                exerciseData.question || '',
                exerciseData.userAnswer || '',
                exerciseData.correctAnswer || '',
                exerciseData.explanation || '',
                exerciseData.isCorrect || false,
                exerciseData.difficulty || 'medium'
            ]
        );

        console.log('✅ Exercise saved to notebook, ID:', result.rows[0].id);

        res.json({
            success: true,
            entry: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error saving exercise:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save exercise',
            error: error.message
        });
    }
});
/**
 * POST /api/notebook/save - Save entry to notebook
 * Simple endpoint matching frontend call
 */
router.post('/save', async (req, res) => {
    try {
        const {
            userId,
            topic,
            subtopic,
            question,
            studentAnswer,
            correctAnswer,
            isCorrect,
            difficulty,
            hintsUsed,
            attempts,
            timeSpent
        } = req.body;

        console.log('💾 POST /api/notebook/save');
        console.log('   Body:', { userId, topic, isCorrect, difficulty });

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Missing userId'
            });
        }

        // Get internal user ID
        let internalUserId = await getUserIdFromFirebaseUid(userId);

        // Create user if doesn't exist
        if (!internalUserId) {
            const createResult = await pool.query(
                'INSERT INTO users (firebase_uid) VALUES ($1) RETURNING id',
                [userId]
            );
            internalUserId = createResult.rows[0].id;
            console.log('✅ Created new user ID:', internalUserId);
        }

        // Insert into notebook_entries
        const result = await pool.query(
            `INSERT INTO notebook_entries 
            (user_id, student_id, topic, subtopic, question_text, user_answer, correct_answer, is_correct, difficulty, hints_used, attempts, time_spent, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
            RETURNING *`,
            [
                internalUserId,
                internalUserId, // student_id same as user_id
                topic || '',
                subtopic || null,
                question || '',
                studentAnswer || '',
                correctAnswer || '',
                isCorrect || false,
                difficulty || 'medium',
                hintsUsed || 0,
                attempts || 1,
                timeSpent || 0
            ]
        );

        console.log('✅ Notebook entry saved, ID:', result.rows[0].id);

        res.json({
            success: true,
            entry: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error in /save route:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save to notebook',
            error: error.message
        });
    }
});
/**
 * GET /api/notebook/entries?userId=xxx - Get all notebook entries
 */
router.get('/entries', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Missing userId parameter'
            });
        }

        console.log('📚 Getting notebook entries for:', userId);

        const internalUserId = await getUserIdFromFirebaseUid(userId);

        if (!internalUserId) {
            return res.json({
                success: true,
                entries: [],
                count: 0
            });
        }

        const result = await pool.query(
            `SELECT * FROM notebook_entries 
            WHERE user_id = $1
            ORDER BY created_at DESC`,
            [internalUserId]
        );

        console.log(`✅ Found ${result.rows.length} entries`);

        res.json({
            success: true,
            entries: result.rows,
            count: result.rows.length
        });

    } catch (error) {
        console.error('❌ Error fetching notebook entries:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch entries',
            error: error.message
        });
    }
});

/**
 * GET /api/notebook/stats?userId=xxx - Get notebook stats
 */
router.get('/stats', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Missing userId parameter'
            });
        }

        console.log('📊 Getting notebook stats for:', userId);

        const internalUserId = await getUserIdFromFirebaseUid(userId);

        if (!internalUserId) {
            return res.json({
                success: true,
                stats: {
                    totalEntries: 0,
                    correctCount: 0,
                    accuracy: 0,
                    topicsPracticed: 0
                }
            });
        }

        const statsQuery = `
            SELECT 
                COUNT(*) as total_entries,
                SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count,
                ROUND(AVG(CASE WHEN is_correct THEN 1 ELSE 0 END) * 100) as accuracy,
                COUNT(DISTINCT topic) as topics_practiced
            FROM notebook_entries
            WHERE user_id = $1
        `;

        const result = await pool.query(statsQuery, [internalUserId]);
        const stats = result.rows[0];

        res.json({
            success: true,
            stats: {
                totalEntries: parseInt(stats.total_entries) || 0,
                correctCount: parseInt(stats.correct_count) || 0,
                accuracy: parseInt(stats.accuracy) || 0,
                topicsPracticed: parseInt(stats.topics_practiced) || 0
            }
        });

    } catch (error) {
        console.error('❌ Error getting notebook stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get stats',
            error: error.message
        });
    }
});

/**
 * GET /api/notebook/entries/:topic?userId=xxx - Get entries by topic
 */
router.get('/entries/:topic', async (req, res) => {
    try {
        const { topic } = req.params;
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Missing userId parameter'
            });
        }

        const internalUserId = await getUserIdFromFirebaseUid(userId);

        if (!internalUserId) {
            return res.json({
                success: true,
                entries: []
            });
        }

        const result = await pool.query(
            `SELECT * FROM notebook_entries 
            WHERE user_id = $1 AND topic = $2
            ORDER BY created_at DESC`,
            [internalUserId, topic]
        );

        res.json({
            success: true,
            entries: result.rows
        });

    } catch (error) {
        console.error('❌ Error fetching topic entries:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch entries',
            error: error.message
        });
    }
});

/**
 * PUT /api/notebook/entry/:entryId - Update entry
 */
router.put('/entry/:entryId', async (req, res) => {
    try {
        const { entryId } = req.params;
        const { title, content, notes, tags, summary } = req.body;

        const result = await pool.query(
            `UPDATE notebook_entries 
            SET title = COALESCE($1, title),
                content = COALESCE($2, content),
                notes = COALESCE($3, notes),
                tags = COALESCE($4, tags),
                summary = COALESCE($5, summary),
                updated_at = NOW()
            WHERE id = $6
            RETURNING *`,
            [title, content, notes, tags, summary, entryId]
        );

        res.json({
            success: true,
            entry: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error updating entry:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update entry',
            error: error.message
        });
    }
});

/**
 * DELETE /api/notebook/entry/:entryId - Delete entry
 */
router.delete('/entry/:entryId', async (req, res) => {
    try {
        const { entryId } = req.params;

        await pool.query(
            'DELETE FROM notebook_entries WHERE id = $1',
            [entryId]
        );

        res.json({
            success: true,
            message: 'Entry deleted successfully'
        });

    } catch (error) {
        console.error('❌ Error deleting entry:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete entry',
            error: error.message
        });
    }
});

export default router;