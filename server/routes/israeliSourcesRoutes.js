// server/routes/israeliSourcesRoutes.js - ES6 VERSION
import express from 'express';
import pool from '../config/database.js';
import israeliSourcesFetcher from '../services/israeliSourcesFetcher.js';
import israeliSourcesProcessor from '../services/israeliSourcesProcessor.js';

const router = express.Router();

// ═══════════════════════════════════════════════════════════════
// STATUS & MONITORING ROUTES (FIXED)
// ═══════════════════════════════════════════════════════════════

router.get('/status', async (req, res) => {
    try {
        console.log('📊 Checking system status...');

        // Safe query with COALESCE to handle null/undefined
        const sourcesResult = await pool.query(
            `SELECT COALESCE(COUNT(*), 0) as count 
       FROM israeli_sources 
       WHERE status IN ('active', 'processed')`
        );

        const questionsResult = await pool.query(
            `SELECT COALESCE(COUNT(*), 0) as count 
       FROM question_bank 
       WHERE source = 'israeli_source'`
        );

        const sourcesCount = sourcesResult.rows && sourcesResult.rows.length > 0
            ? parseInt(sourcesResult.rows[0].count) || 0
            : 0;

        const questionsCount = questionsResult.rows && questionsResult.rows.length > 0
            ? parseInt(questionsResult.rows[0].count) || 0
            : 0;

        console.log(`✅ Status check: ${sourcesCount} sources, ${questionsCount} questions`);

        res.json({
            success: true,
            status: 'operational',
            database: {
                israeliSourcesStored: sourcesCount,
                questionsInQuestionBank: questionsCount
            }
        });
    } catch (error) {
        console.error('❌ Status check error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check system status',
            details: error.message
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// PROCESSOR ROUTES (EXTRACT + GENERATE)
// ═══════════════════════════════════════════════════════════════

// Process all pending Israeli sources with Claude
router.post('/process', async (req, res) => {
    try {
        console.log('🚀 Starting Israeli sources processing...');

        const {
            sourceIds,
            maxQuestionsPerSource = 30,
            generateExtra = true
        } = req.body;

        const results = await israeliSourcesProcessor.processAllSources({
            sourceIds,
            maxQuestionsPerSource,
            generateExtra
        });

        console.log('✅ Processing completed:', results);

        res.json({
            success: true,
            message: 'Processing completed',
            results: results
        });
    } catch (error) {
        console.error('❌ Processing error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process sources',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Process a specific source by ID
router.post('/process/:sourceId', async (req, res) => {
    try {
        const { sourceId } = req.params;

        if (!sourceId || isNaN(parseInt(sourceId))) {
            return res.status(400).json({
                success: false,
                error: 'Invalid source ID'
            });
        }

        console.log(`🚀 Processing source ID: ${sourceId}`);

        // Get the source
        const source = await israeliSourcesFetcher.getSourceById(parseInt(sourceId));

        if (!source) {
            return res.status(404).json({
                success: false,
                error: 'Source not found'
            });
        }

        const result = await israeliSourcesProcessor.processSource(source, 30, true);

        res.json({
            success: true,
            message: 'Source processed successfully',
            result: result
        });
    } catch (error) {
        console.error('❌ Processing error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process source',
            details: error.message
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// SOURCE MANAGEMENT ROUTES
// ═══════════════════════════════════════════════════════════════

// Get all stored Israeli sources
router.get('/stored-sources', async (req, res) => {
    try {
        console.log('📚 Fetching stored sources...');

        const sources = await israeliSourcesFetcher.getAllSources();

        console.log(`✅ Found ${sources.length} stored sources`);

        res.json({
            success: true,
            sources: sources || [],
            count: sources ? sources.length : 0
        });
    } catch (error) {
        console.error('❌ Get stored sources error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve stored sources',
            details: error.message
        });
    }
});

// Get a specific source by ID
router.get('/sources/:sourceId', async (req, res) => {
    try {
        const { sourceId } = req.params;

        if (!sourceId || isNaN(parseInt(sourceId))) {
            return res.status(400).json({
                success: false,
                error: 'Invalid source ID'
            });
        }

        const source = await israeliSourcesFetcher.getSourceById(parseInt(sourceId));

        if (!source) {
            return res.status(404).json({
                success: false,
                error: 'Source not found'
            });
        }

        res.json({
            success: true,
            source: source
        });
    } catch (error) {
        console.error('❌ Get source error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve source',
            details: error.message
        });
    }
});

// Add a new Israeli source manually
router.post('/add-source', async (req, res) => {
    try {
        const { title, source_type, source_url, content, grade_level, subject, notes } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                error: 'Title and content are required'
            });
        }

        console.log(`➕ Adding new source: ${title}`);

        const result = await pool.query(`
      INSERT INTO israeli_sources 
      (title, source_type, source_url, content, grade_level, subject, status, notes, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, CURRENT_TIMESTAMP)
      RETURNING id, title, source_type, grade_level, status
    `, [
            title,
            source_type || 'manual',
            source_url || null,
            content,
            grade_level || null,
            subject || 'מתמטיקה',
            notes || 'Manually added'
        ]);

        console.log(`✅ Source added with ID: ${result.rows[0].id}`);

        res.json({
            success: true,
            message: 'Source added successfully',
            source: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Add source error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add source',
            details: error.message
        });
    }
});

// Update a source
router.put('/sources/:sourceId', async (req, res) => {
    try {
        const { sourceId } = req.params;
        const updates = req.body;

        if (!sourceId || isNaN(parseInt(sourceId))) {
            return res.status(400).json({
                success: false,
                error: 'Invalid source ID'
            });
        }

        console.log(`🔄 Updating source ID: ${sourceId}`);

        const updatedSource = await israeliSourcesFetcher.updateSource(parseInt(sourceId), updates);

        res.json({
            success: true,
            message: 'Source updated successfully',
            source: updatedSource
        });
    } catch (error) {
        console.error('❌ Update source error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update source',
            details: error.message
        });
    }
});

// Delete a source
router.delete('/sources/:sourceId', async (req, res) => {
    try {
        const { sourceId } = req.params;

        if (!sourceId || isNaN(parseInt(sourceId))) {
            return res.status(400).json({
                success: false,
                error: 'Invalid source ID'
            });
        }

        console.log(`🗑️  Deleting source ID: ${sourceId}`);

        const deleted = await israeliSourcesFetcher.deleteSource(parseInt(sourceId));

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Source not found'
            });
        }

        res.json({
            success: true,
            message: 'Source deleted successfully'
        });
    } catch (error) {
        console.error('❌ Delete source error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete source',
            details: error.message
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// FETCHER ROUTES (HTML)
// ═══════════════════════════════════════════════════════════════

// Fetch and store from URL
router.post('/fetch-and-store', async (req, res) => {
    try {
        const { url, metadata } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL is required'
            });
        }

        console.log(`📥 Fetching content from: ${url}`);

        const result = await israeliSourcesFetcher.fetchAndStore(url, metadata || {});

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error
            });
        }

        res.json({
            success: true,
            message: 'Content fetched and stored successfully',
            result: result
        });
    } catch (error) {
        console.error('❌ Fetch and store error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch and store content',
            details: error.message
        });
    }
});

// Fetch multiple URLs
router.post('/fetch-multiple', async (req, res) => {
    try {
        const { sources } = req.body;

        if (!sources || !Array.isArray(sources) || sources.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Sources array is required'
            });
        }

        console.log(`📥 Fetching ${sources.length} sources...`);

        const results = await israeliSourcesFetcher.fetchMultiple(sources);

        res.json({
            success: true,
            message: 'Batch fetch completed',
            results: results
        });
    } catch (error) {
        console.error('❌ Fetch multiple error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch multiple sources',
            details: error.message
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// QUESTIONS ROUTES
// ═══════════════════════════════════════════════════════════════

// Get questions from question bank (Israeli sources)
router.get('/questions', async (req, res) => {
    try {
        const { grade, topic, limit = 10 } = req.query;

        console.log(`📖 Getting questions - Grade: ${grade || 'all'}, Topic: ${topic || 'all'}`);

        let query = `
      SELECT * FROM question_bank 
      WHERE source = 'israeli_source'
    `;

        const params = [];
        let paramCount = 1;

        if (grade) {
            query += ` AND grade_level = $${paramCount}`;
            params.push(parseInt(grade));
            paramCount++;
        }

        if (topic) {
            query += ` AND topic = $${paramCount}`;
            params.push(topic);
            paramCount++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
        params.push(parseInt(limit));

        const result = await pool.query(query, params);

        console.log(`✅ Retrieved ${result.rows.length} questions`);

        res.json({
            success: true,
            questions: result.rows || [],
            count: result.rows ? result.rows.length : 0
        });
    } catch (error) {
        console.error('❌ Get questions error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve questions',
            details: error.message
        });
    }
});

// Get statistics
router.get('/stats', async (req, res) => {
    try {
        console.log('📊 Calculating statistics...');

        const sourceStats = await pool.query(`
      SELECT 
        source_type,
        grade_level,
        status,
        COUNT(*) as source_count
      FROM israeli_sources
      GROUP BY source_type, grade_level, status
      ORDER BY source_type, grade_level
    `);

        const questionStats = await pool.query(`
      SELECT 
        grade_level,
        topic,
        COUNT(*) as question_count
      FROM question_bank
      WHERE source = 'israeli_source'
      GROUP BY grade_level, topic
      ORDER BY grade_level, topic
    `);

        const totalSources = await pool.query(`
      SELECT COUNT(*) as total FROM israeli_sources
    `);

        const totalQuestions = await pool.query(`
      SELECT COUNT(*) as total FROM question_bank WHERE source = 'israeli_source'
    `);

        res.json({
            success: true,
            summary: {
                totalSources: parseInt(totalSources.rows[0].total),
                totalQuestions: parseInt(totalQuestions.rows[0].total)
            },
            sourceStatistics: sourceStats.rows || [],
            questionStatistics: questionStats.rows || []
        });
    } catch (error) {
        console.error('❌ Stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve statistics',
            details: error.message
        });
    }
});

export default router;