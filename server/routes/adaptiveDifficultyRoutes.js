// server/routes/adaptiveDifficultyRoutes.js - FIXED VERSION 🎯
import express from 'express';
import adaptiveDifficultyService from '../services/adaptiveDifficultyService.js';

const router = express.Router();

/**
 * GET /api/adaptive/recommend - Get recommended difficulty for user
 * Query params: userId (required), topicId (optional)
 */
router.get('/recommend', async (req, res) => {
    try {
        const { userId, topicId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId is required'
            });
        }

        console.log('🎯 [Adaptive] Getting recommendation for:', userId, 'topic:', topicId);

        const recommendation = await adaptiveDifficultyService.getRecommendedDifficulty(
            userId,
            topicId || null
        );

        console.log('✅ [Adaptive] Recommendation:', recommendation.difficulty, 'confidence:', recommendation.confidence);

        return res.json({
            success: true,
            recommendation
        });

    } catch (error) {
        console.error('❌ [Adaptive] Error getting recommendation:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get difficulty recommendation',
            details: error.message
        });
    }
});

/**
 * POST /api/adaptive/check-adjustment - Check if difficulty should be adjusted after answer
 * Body: { userId, topicId, currentDifficulty OR difficulty, isCorrect }
 */
router.post('/check-adjustment', async (req, res) => {
    try {
        // ✅ FIX: Accept both parameter names
        const {
            userId,
            topicId,
            currentDifficulty,  // Old name
            difficulty,         // New name (used by frontend)
            isCorrect
        } = req.body;

        // ✅ Use whichever is provided
        const difficultyLevel = difficulty || currentDifficulty;

        if (!userId || !difficultyLevel) {
            return res.status(400).json({
                success: false,
                error: 'userId and difficulty are required'
            });
        }

        console.log('🔄 [Adaptive] Checking adjustment:', {
            userId,
            topicId,
            difficulty: difficultyLevel,
            isCorrect
        });

        const adjustment = await adaptiveDifficultyService.shouldAdjustDifficulty(
            userId,
            topicId || null,
            difficultyLevel,  // ✅ Use the unified parameter
            isCorrect
        );

        console.log('✅ [Adaptive] Adjustment result:', adjustment);

        return res.json({
            success: true,
            shouldAdjust: adjustment.shouldAdjust,  // ✅ Match frontend expectation
            recommendation: adjustment.shouldAdjust ? {
                newDifficulty: adjustment.newDifficulty,
                reason: adjustment.reason,
                confidence: adjustment.confidence
            } : null
        });

    } catch (error) {
        console.error('❌ [Adaptive] Error checking adjustment:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to check difficulty adjustment',
            details: error.message
        });
    }
});

/**
 * GET /api/adaptive/performance-summary - Get comprehensive performance summary
 * Query params: userId (required), topicId (optional)
 */
router.get('/performance-summary', async (req, res) => {
    try {
        const { userId, topicId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId is required'
            });
        }

        console.log('📊 [Adaptive] Getting performance summary for:', userId);

        const recommendation = await adaptiveDifficultyService.getRecommendedDifficulty(
            userId,
            topicId || null
        );

        return res.json({
            success: true,
            summary: {
                currentDifficulty: recommendation.difficulty,
                confidence: recommendation.confidence,
                message: recommendation.message,
                reason: recommendation.reason,
                performance: recommendation.details,
                emoji: adaptiveDifficultyService.getDifficultyEmoji(recommendation.difficulty),
                label: adaptiveDifficultyService.getDifficultyLabel(recommendation.difficulty)
            }
        });

    } catch (error) {
        console.error('❌ [Adaptive] Error getting performance summary:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get performance summary',
            details: error.message
        });
    }
});

/**
 * GET /api/adaptive/recommendation/:userId - Alternative endpoint for recommendations
 */
router.get('/recommendation/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { topicId } = req.query;

        console.log('🎯 [Adaptive] Getting recommendation for:', userId, 'topic:', topicId);

        const recommendation = await adaptiveDifficultyService.getRecommendedDifficulty(
            userId,
            topicId || null
        );

        return res.json({
            success: true,
            recommendation
        });

    } catch (error) {
        console.error('❌ [Adaptive] Error getting recommendation:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get difficulty recommendation',
            details: error.message
        });
    }
});

/**
 * GET /api/adaptive/performance/:userId - Get user performance metrics
 */
router.get('/performance/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { topicId } = req.query;

        console.log('📊 [Adaptive] Getting performance for:', userId);

        const recommendation = await adaptiveDifficultyService.getRecommendedDifficulty(
            userId,
            topicId || null
        );

        return res.json({
            success: true,
            performance: {
                hasEnoughData: recommendation.confidence > 0,
                totalQuestions: 0,  // Can be enhanced later
                correctAnswers: 0,   // Can be enhanced later
                accuracy: 0          // Can be enhanced later
            },
            recommendation
        });

    } catch (error) {
        console.error('❌ [Adaptive] Error getting performance:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get performance data',
            details: error.message
        });
    }
});

export default router;