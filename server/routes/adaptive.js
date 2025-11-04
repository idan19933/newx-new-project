// server/routes/adaptive.js
import express from 'express';
import pool from '../config/database.js';
import adaptiveDifficultyService from '../services/adaptiveDifficultyService.js';

const router = express.Router();

router.post('/check-adjustment', async (req, res) => {
    try {
        console.log('📥 Adaptive check request:', req.body);

        const { userId, topicId, difficulty, isCorrect } = req.body;

        if (!userId || !difficulty) {
            return res.status(400).json({
                success: false,
                error: 'User ID and difficulty are required'
            });
        }

        const result = await adaptiveDifficultyService.shouldAdjustDifficulty(
            userId,
            topicId,
            difficulty,
            isCorrect
        );

        console.log('📊 Adjustment result:', result);

        res.json({
            success: true,
            shouldAdjust: result.shouldAdjust,
            recommendation: result.shouldAdjust ? {
                newDifficulty: result.newDifficulty,
                reason: result.reason,
                confidence: result.confidence
            } : null
        });

    } catch (error) {
        console.error('❌ Error in check-adjustment:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/performance/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { topicId } = req.query;

        const userResult = await pool.query(
            'SELECT id FROM users WHERE firebase_uid = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.json({
                success: true,
                performance: {
                    totalQuestions: 0,
                    correctAnswers: 0,
                    accuracy: 0,
                    hasEnoughData: false
                },
                recommendation: {
                    difficulty: 'medium',
                    reason: 'no_data',
                    message: 'התחל לתרגל כדי לקבל המלצות'
                }
            });
        }

        const internalUserId = userResult.rows[0].id;
        const performanceMetrics = await adaptiveDifficultyService.getPerformanceMetrics(internalUserId, topicId);
        const recommendation = await adaptiveDifficultyService.getRecommendedDifficulty(userId, topicId);

        res.json({
            success: true,
            performance: performanceMetrics,
            recommendation
        });

    } catch (error) {
        console.error('❌ Error getting performance:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/recommendation/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { topicId } = req.query;

        const recommendation = await adaptiveDifficultyService.getRecommendedDifficulty(userId, topicId);

        res.json({
            success: true,
            recommendation
        });

    } catch (error) {
        console.error('❌ Error getting recommendation:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;