// routes/questionRoutes.js - Integrates with your existing smartQuestionService
import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import smartQuestionService from '../services/smartQuestionService.js';
import aiQuestionGenerator from '../services/aiQuestionGenerator.js';

const router = express.Router();

/**
 * POST /api/questions/generate
 * Smart question generation - uses cache first, AI fallback
 */
router.post('/generate', verifyToken, async (req, res) => {
    try {
        const {
            topicId,
            topicName,
            subtopicId,
            subtopicName,
            difficulty = 'medium',
            gradeLevel,
            excludeQuestionIds = []
        } = req.body;

        const userId = req.user?.id || req.body.userId;

        console.log('📥 Question request:', {
            topicName,
            subtopicName,
            difficulty,
            gradeLevel,
            userId
        });

        // STEP 1: Try to get from cache using your smart service
        const smartResult = await smartQuestionService.getQuestion({
            topicId,
            topicName,
            subtopicId,
            subtopicName,
            difficulty,
            gradeLevel,
            userId,
            excludeQuestionIds
        });

        // STEP 2: If found in cache, return it
        if (smartResult.source === 'database') {
            console.log('✅ Returning cached question');
            return res.json({
                success: true,
                question: smartResult,
                source: 'cache'
            });
        }

        // STEP 3: Generate new question with AI
        console.log('🤖 Generating new question with Claude...');

        const aiQuestion = await aiQuestionGenerator.generate({
            topicId,
            topicName,
            subtopicId,
            subtopicName,
            difficulty,
            gradeLevel
        });

        // STEP 4: Cache the new question
        const cachedId = await smartQuestionService.cacheQuestion({
            question: aiQuestion.question,
            correctAnswer: aiQuestion.correctAnswer,
            hints: aiQuestion.hints,
            explanation: aiQuestion.explanation,
            visualData: aiQuestion.visualData,
            topicId,
            topicName,
            subtopicId,
            subtopicName,
            difficulty,
            gradeLevel
        });

        console.log(`✅ New question generated and cached (ID: ${cachedId})`);

        res.json({
            success: true,
            question: {
                ...aiQuestion,
                id: cachedId,
                source: 'ai_generated',
                cached: false
            },
            source: 'generated'
        });

    } catch (error) {
        console.error('❌ Error generating question:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/questions/cache-stats
 * Get comprehensive cache statistics
 */
router.get('/cache-stats', async (req, res) => {
    try {
        const { topicId, difficulty, gradeLevel } = req.query;

        const stats = await smartQuestionService.getStats({
            topicId: topicId ? parseInt(topicId) : null,
            difficulty,
            gradeLevel: gradeLevel ? parseInt(gradeLevel) : null
        });

        res.json({
            success: true,
            stats,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error getting cache stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/questions/by-topic/:topicId
 * Get all cached questions for a topic (debugging)
 */
router.get('/by-topic/:topicId', async (req, res) => {
    try {
        const { topicId } = req.params;
        const { difficulty } = req.query;

        const questions = await smartQuestionService.getQuestionsByTopic(
            parseInt(topicId),
            difficulty
        );

        res.json({
            success: true,
            questions,
            count: questions.length
        });

    } catch (error) {
        console.error('❌ Error getting questions by topic:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/questions/track-usage
 * Track question usage and update stats
 */
router.post('/track-usage', verifyToken, async (req, res) => {
    try {
        const {
            questionId,
            isCorrect,
            timeSpent,
            hintsUsed,
            attempts
        } = req.body;

        const userId = req.user?.id || req.body.userId;

        await smartQuestionService.trackUsage(questionId, userId, {
            isCorrect,
            timeSpent,
            hintsUsed,
            attempts
        });

        res.json({
            success: true,
            message: 'Usage tracked successfully'
        });

    } catch (error) {
        console.error('❌ Error tracking usage:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;