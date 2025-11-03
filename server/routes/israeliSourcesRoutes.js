// server/routes/israeliSourcesRoutes.js
import express from 'express';
import israeliSourcesFetcher from '../services/israeliSourcesFetcher.js';
import pool from '../config/database.js';

const router = express.Router();

/**
 * GET /api/israeli-sources/status
 * Get system status and statistics
 */
router.get('/status', async (req, res) => {
    try {
        console.log('📊 Israeli sources status check...');

        // Get database statistics
        const sourcesCount = await pool.query(`
            SELECT COUNT(*) as total FROM scraping_sources
        `);

        const logsCount = await pool.query(`
            SELECT COUNT(*) as total FROM scraping_logs
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
                logsRecorded: parseInt(logsCount.rows[0].total)
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
 * Fetch and store a specific source
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

export default router;