// server/routes/israeliSourcesRoutes.js - WITH RECLASSIFICATION
import express from 'express';
import pool from '../config/database.js';
import israeliSourcesFetcher from '../services/israeliSourcesFetcher.js';
import israeliSourcesProcessor from '../services/israeliSourcesProcessor.js';
import israeliSourcesCrawler from '../services/israeliSourcesCrawler.js';

const router = express.Router();

// ═══════════════════════════════════════════════════════════════
// STATUS & MONITORING
// ═══════════════════════════════════════════════════════════════

router.get('/status', async (req, res) => {
    try {
        console.log('📊 Checking system status...');

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

        const sourcesCount = parseInt(sourcesResult.rows[0]?.count || 0);
        const questionsCount = parseInt(questionsResult.rows[0]?.count || 0);

        console.log(`✅ Status: ${sourcesCount} sources, ${questionsCount} questions`);

        res.json({
            success: true,
            status: 'operational',
            database: {
                israeliSourcesStored: sourcesCount,
                questionsInQuestionBank: questionsCount
            }
        });
    } catch (error) {
        console.error('❌ Status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check status',
            details: error.message
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// PROCESSOR ROUTES
// ═══════════════════════════════════════════════════════════════

router.post('/process', async (req, res) => {
    try {
        console.log('🚀 Processing all sources...');

        const { sourceIds, maxQuestionsPerSource = 30, generateExtra = true } = req.body;

        const results = await israeliSourcesProcessor.processAllSources({
            sourceIds,
            maxQuestionsPerSource,
            generateExtra
        });

        res.json({
            success: true,
            message: 'Processing completed',
            results
        });
    } catch (error) {
        console.error('❌ Process error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process',
            details: error.message
        });
    }
});

router.post('/process/:sourceId', async (req, res) => {
    try {
        const sourceId = parseInt(req.params.sourceId);

        if (isNaN(sourceId)) {
            return res.status(400).json({ success: false, error: 'Invalid ID' });
        }

        console.log(`🚀 Processing source ${sourceId}...`);

        const source = await israeliSourcesFetcher.getSourceById(sourceId);
        if (!source) {
            return res.status(404).json({ success: false, error: 'Not found' });
        }

        const result = await israeliSourcesProcessor.processSource(source, 30, true);

        res.json({
            success: true,
            message: 'Processed successfully',
            result
        });
    } catch (error) {
        console.error('❌ Process error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process',
            details: error.message
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// ✅ NEW: RECLASSIFICATION ENDPOINT
// ═══════════════════════════════════════════════════════════════

router.post('/reclassify-all', async (req, res) => {
    try {
        console.log('🔄 Starting reclassification of all questions...');

        const { rows: questions } = await pool.query(`
            SELECT id, question_text, grade_level, topic, subtopic
            FROM question_bank
            WHERE source = 'israeli_source'
              AND is_active = true
        `);

        console.log(`📊 Found ${questions.length} questions to reclassify`);

        // Import classifier dynamically
        const { default: QuestionClassifier } = await import('../services/questionClassifier.js');

        let updated = 0;
        let failed = 0;
        const sampleResults = [];

        for (const q of questions) {
            try {
                const classification = QuestionClassifier.classifyQuestion(
                    q.question_text,
                    {
                        grade: q.grade_level,
                        topic: q.topic,
                        subtopic: q.subtopic
                    }
                );

                await pool.query(`
                    UPDATE question_bank
                    SET
                        grade_level = $1,
                        units = $2,
                        topic = $3,
                        subtopic = $4,
                        difficulty = $5
                    WHERE id = $6
                `, [
                    classification.grade,
                    classification.units,
                    classification.topic,
                    classification.subtopic,
                    classification.difficulty,
                    q.id
                ]);

                updated++;

                // Save first 5 for sample output
                if (sampleResults.length < 5) {
                    sampleResults.push({
                        id: q.id,
                        question: q.question_text.substring(0, 60) + '...',
                        before: {
                            grade: q.grade_level,
                            topic: q.topic,
                            subtopic: q.subtopic
                        },
                        after: classification
                    });
                }

                if (updated % 50 === 0) {
                    console.log(`   ✅ Processed ${updated}/${questions.length}...`);
                }

            } catch (error) {
                console.error(`   ❌ Failed question ${q.id}:`, error.message);
                failed++;
            }
        }

        console.log(`✅ Reclassification complete: ${updated} updated, ${failed} failed`);

        res.json({
            success: true,
            message: 'Reclassification completed successfully',
            stats: {
                total: questions.length,
                updated,
                failed
            },
            sample: sampleResults
        });

    } catch (error) {
        console.error('❌ Reclassification error:', error);
        res.status(500).json({
            success: false,
            error: 'Reclassification failed',
            details: error.message
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// SOURCE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

router.get('/stored-sources', async (req, res) => {
    try {
        const sources = await israeliSourcesFetcher.getAllSources();
        res.json({
            success: true,
            sources: sources || [],
            count: sources?.length || 0
        });
    } catch (error) {
        console.error('❌ Get sources error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get sources',
            details: error.message
        });
    }
});

router.get('/sources/:sourceId', async (req, res) => {
    try {
        const sourceId = parseInt(req.params.sourceId);
        if (isNaN(sourceId)) {
            return res.status(400).json({ success: false, error: 'Invalid ID' });
        }

        const source = await israeliSourcesFetcher.getSourceById(sourceId);
        if (!source) {
            return res.status(404).json({ success: false, error: 'Not found' });
        }

        res.json({ success: true, source });
    } catch (error) {
        console.error('❌ Get source error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get source',
            details: error.message
        });
    }
});

router.post('/add-source', async (req, res) => {
    try {
        const { title, source_type, source_url, content, grade_level, subject, notes } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                error: 'Title and content required'
            });
        }

        console.log(`➕ Adding: ${title}`);

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

        res.json({
            success: true,
            message: 'Added successfully',
            source: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Add error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add',
            details: error.message
        });
    }
});

router.delete('/sources/:sourceId', async (req, res) => {
    try {
        const sourceId = parseInt(req.params.sourceId);
        if (isNaN(sourceId)) {
            return res.status(400).json({ success: false, error: 'Invalid ID' });
        }

        console.log(`🗑️  Deleting source ${sourceId}...`);

        const deleted = await israeliSourcesFetcher.deleteSource(sourceId);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Not found' });
        }

        res.json({ success: true, message: 'Deleted' });
    } catch (error) {
        console.error('❌ Delete error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete',
            details: error.message
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// FETCHER ROUTES
// ═══════════════════════════════════════════════════════════════

router.post('/fetch-and-store', async (req, res) => {
    try {
        const { url, metadata } = req.body;

        if (!url) {
            return res.status(400).json({ success: false, error: 'URL required' });
        }

        console.log(`📥 Fetching: ${url}`);

        const result = await israeliSourcesFetcher.fetchAndStore(url, metadata || {});

        if (!result.success) {
            return res.status(400).json({ success: false, error: result.error });
        }

        res.json({
            success: true,
            message: 'Fetched and stored',
            result
        });
    } catch (error) {
        console.error('❌ Fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch',
            details: error.message
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// SMART CRAWLER ROUTES
// ═══════════════════════════════════════════════════════════════

router.post('/crawler/quick-scan', async (req, res) => {
    try {
        const { url, grade, subject } = req.body;

        if (!url) {
            return res.status(400).json({ success: false, error: 'URL required' });
        }

        console.log(`🔍 Quick scanning: ${url}`);

        const result = await israeliSourcesCrawler.quickScan(
            url,
            grade || null,
            subject || 'מתמטיקה'
        );

        res.json(result);
    } catch (error) {
        console.error('❌ Quick scan error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to scan',
            details: error.message
        });
    }
});

router.post('/crawler/smart-crawl', async (req, res) => {
    try {
        const { url, grade, subject, maxDepth, maxPages } = req.body;

        if (!url) {
            return res.status(400).json({ success: false, error: 'URL required' });
        }

        console.log(`🤖 Smart crawling: ${url}`);

        const results = await israeliSourcesCrawler.smartCrawl(url, {
            targetGrade: grade || null,
            targetSubject: subject || 'מתמטיקה',
            maxDepth: maxDepth || 2,
            maxPages: maxPages || 20
        });

        res.json({
            success: true,
            message: 'Crawl completed',
            results
        });
    } catch (error) {
        console.error('❌ Smart crawl error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to crawl',
            details: error.message
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// QUESTIONS ROUTES
// ═══════════════════════════════════════════════════════════════

router.get('/questions', async (req, res) => {
    try {
        const { grade, topic, limit = 10 } = req.query;

        let query = `SELECT * FROM question_bank WHERE source = 'israeli_source'`;
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

        res.json({
            success: true,
            questions: result.rows || [],
            count: result.rows?.length || 0
        });
    } catch (error) {
        console.error('❌ Get questions error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get questions',
            details: error.message
        });
    }
});

router.get('/stats', async (req, res) => {
    try {
        const [sourceStats, questionStats, totalSources, totalQuestions] = await Promise.all([
            pool.query(`
                SELECT source_type, grade_level, status, COUNT(*) as source_count
                FROM israeli_sources
                GROUP BY source_type, grade_level, status
                ORDER BY source_type, grade_level
            `),
            pool.query(`
                SELECT grade_level, topic, COUNT(*) as question_count
                FROM question_bank
                WHERE source = 'israeli_source'
                GROUP BY grade_level, topic
                ORDER BY grade_level, topic
            `),
            pool.query(`SELECT COUNT(*) as total FROM israeli_sources`),
            pool.query(`SELECT COUNT(*) as total FROM question_bank WHERE source = 'israeli_source'`)
        ]);

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
            error: 'Failed to get stats',
            details: error.message
        });
    }
});

export default router;