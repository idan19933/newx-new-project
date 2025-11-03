// server/routes/israeliSourcesRoutes.js
import express from 'express';
import israeliSourcesFetcher from '../services/israeliSourcesFetcher.js';
import israeliQuestionParser from '../services/israeliQuestionParser.js';
import israeliSourcesProcessor from '../services/israeliSourcesProcessor.js';  // ✅ ADD THIS
import pool from '../config/database.js';

const router = express.Router();

// ==================== EXISTING ROUTES (PDF Fetching System) ====================

/**
 * GET /api/israeli-sources/status
 * Get system status and statistics
 */
router.get('/status', async (req, res) => {
    try {
        console.log('📊 Israeli sources status check...');

        // Get database statistics from BOTH systems
        const sourcesCount = await pool.query(`
            SELECT COUNT(*) as total FROM scraping_sources
        `);

        const israeliSourcesCount = await pool.query(`
            SELECT COUNT(*) as total FROM israeli_sources
        `);

        const logsCount = await pool.query(`
            SELECT COUNT(*) as total FROM scraping_logs
        `);

        const questionsCount = await pool.query(`
            SELECT COUNT(*) as total FROM question_cache 
            WHERE source = 'israeli_education'
        `);

        const questionBankCount = await pool.query(`
            SELECT COUNT(*) as total FROM question_bank 
            WHERE source = 'israeli_source'
        `);

        // Get available sources
        const sources = israeliSourcesFetcher.getAllSources();
        const totalAvailable = sources.rama.length +
            sources.merchatPedagogi.length +
            sources.meydaPdfs.length;

        res.json({
            success: true,
            status: 'operational',
            database: {
                sourcesStored: parseInt(sourcesCount.rows[0].total),
                israeliSourcesStored: parseInt(israeliSourcesCount.rows[0].total),
                logsRecorded: parseInt(logsCount.rows[0].total),
                questionsFromIsraeliSources: parseInt(questionsCount.rows[0].total),
                questionsInQuestionBank: parseInt(questionBankCount.rows[0].total)
            },
            available: {
                rama: sources.rama.length,
                merchatPedagogi: sources.merchatPedagogi.length,
                meydaPdfs: sources.meydaPdfs.length,
                total: totalAvailable
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Status error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/israeli-sources/verify-all
 * Verify all Israeli education source URLs
 */
router.get('/verify-all', async (req, res) => {
    try {
        console.log('🔍 Starting Israeli sources verification...');

        const results = await israeliSourcesFetcher.verifyAllSources();

        res.json({
            success: true,
            results,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Verification error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/israeli-sources/list
 * Get all available Israeli sources
 */
router.get('/list', (req, res) => {
    try {
        const sources = israeliSourcesFetcher.getAllSources();

        res.json({
            success: true,
            sources,
            count: {
                rama: sources.rama.length,
                merchatPedagogi: sources.merchatPedagogi.length,
                meydaPdfs: sources.meydaPdfs.length,
                total: sources.rama.length + sources.merchatPedagogi.length + sources.meydaPdfs.length
            }
        });

    } catch (error) {
        console.error('❌ List sources error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/israeli-sources/fetch/:sourceId
 * Fetch and download a specific source
 */
router.post('/fetch/:sourceId', async (req, res) => {
    try {
        const { sourceId } = req.params;

        console.log(`📥 Fetching source: ${sourceId}`);

        const result = await israeliSourcesFetcher.fetchAndStore(sourceId);

        if (result.success) {
            res.json({
                success: true,
                ...result
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        console.error('❌ Fetch error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/israeli-sources/fetch-and-process/:sourceId
 * 🚀 COMPLETE PIPELINE: Download PDF + Extract Questions + Save to DB
 */
router.post('/fetch-and-process/:sourceId', async (req, res) => {
    try {
        const { sourceId } = req.params;

        console.log(`🚀 Complete pipeline for: ${sourceId}`);

        const result = await israeliSourcesFetcher.fetchAndProcess(sourceId);

        res.json(result);

    } catch (error) {
        console.error('❌ Pipeline error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/israeli-sources/process-pdf
 * Process an already downloaded PDF
 */
router.post('/process-pdf', async (req, res) => {
    try {
        const { pdfPath, source, grade, year } = req.body;

        if (!pdfPath) {
            return res.status(400).json({
                success: false,
                error: 'PDF path required'
            });
        }

        console.log(`📄 Processing PDF: ${pdfPath}`);

        const result = await israeliQuestionParser.processPdf(pdfPath, {
            source: source || 'RAMA',
            grade: grade || null,
            year: year || new Date().getFullYear()
        });

        res.json(result);

    } catch (error) {
        console.error('❌ Process PDF error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/israeli-sources/questions
 * Get questions from Israeli sources
 */
router.get('/questions', async (req, res) => {
    try {
        const { limit = 50, grade, difficulty, source = 'both' } = req.query;

        let query, params;

        // Choose which table to query
        if (source === 'question_bank' || source === 'both') {
            query = `
                SELECT 
                    id,
                    question_text as question,
                    correct_answer,
                    topic,
                    subtopic,
                    difficulty,
                    source,
                    grade_level,
                    explanation,
                    hints,
                    solution_steps,
                    source_metadata as metadata,
                    created_at
                FROM question_bank
                WHERE source = 'israeli_source'
            `;

            params = [];
            let paramCount = 1;

            if (grade) {
                query += ` AND grade_level = $${paramCount}`;
                params.push(parseInt(grade));
                paramCount++;
            }

            if (difficulty) {
                query += ` AND difficulty = $${paramCount}`;
                params.push(difficulty);
                paramCount++;
            }

            query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
            params.push(limit);

            const result = await pool.query(query, params);

            return res.json({
                success: true,
                questions: result.rows,
                count: result.rows.length,
                source: 'question_bank'
            });
        } else {
            // Original question_cache query
            query = `
                SELECT 
                    id,
                    question,
                    correct_answer,
                    topic,
                    subtopic,
                    difficulty,
                    source,
                    metadata,
                    created_at
                FROM question_cache
                WHERE source = 'israeli_education'
            `;

            params = [];
            let paramCount = 1;

            if (grade) {
                query += ` AND metadata->>'grade' = $${paramCount}`;
                params.push(grade);
                paramCount++;
            }

            if (difficulty) {
                query += ` AND difficulty = $${paramCount}`;
                params.push(difficulty);
                paramCount++;
            }

            query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
            params.push(limit);

            const result = await pool.query(query, params);

            return res.json({
                success: true,
                questions: result.rows,
                count: result.rows.length,
                source: 'question_cache'
            });
        }

    } catch (error) {
        console.error('❌ Get questions error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/israeli-sources/logs
 * Get scraping logs
 */
router.get('/logs', async (req, res) => {
    try {
        const { limit = 50 } = req.query;

        const result = await pool.query(`
            SELECT 
                l.id,
                l.source_id,
                s.name as source_name,
                l.status,
                l.items_found,
                l.items_saved,
                l.error_message,
                l.created_at
            FROM scraping_logs l
            LEFT JOIN scraping_sources s ON l.source_id = s.id
            ORDER BY l.created_at DESC
            LIMIT $1
        `, [limit]);

        res.json({
            success: true,
            logs: result.rows,
            count: result.rows.length
        });

    } catch (error) {
        console.error('❌ Get logs error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==================== NEW ROUTES (Claude-Based Question Processor) ====================

/**
 * POST /api/israeli-sources/process
 * Process and extract questions from stored Israeli sources using Claude
 */
router.post('/process', async (req, res) => {
    try {
        console.log('🔄 Starting Israeli sources processing with Claude...');

        const { sourceIds, maxQuestionsPerSource = 30 } = req.body;

        const results = await israeliSourcesProcessor.processAllSources({
            sourceIds,
            maxQuestionsPerSource
        });

        res.json({
            success: true,
            results,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Processing error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/israeli-sources/stored-sources
 * Get sources from israeli_sources table (content already stored)
 */
router.get('/stored-sources', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id, 
                title, 
                source_type, 
                source_url, 
                status,
                last_scraped_at,
                created_at,
                (SELECT COUNT(*) 
                 FROM question_bank qb 
                 WHERE qb.source_metadata->>'sourceId' = israeli_sources.id::text
                ) as questions_count
            FROM israeli_sources
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            sources: result.rows,
            count: result.rows.length
        });

    } catch (error) {
        console.error('❌ Get stored sources error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;