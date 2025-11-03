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

// ADD THESE ROUTES TO: server/routes/israeliSourcesRoutes.js

// Import the crawler at the top:
import israeliSourcesCrawler from '../services/israeliSourcesCrawler.js';

// ═══════════════════════════════════════════════════════════════
// 🤖 SMART CRAWLER ROUTES
// ═══════════════════════════════════════════════════════════════

// Quick scan - analyze homepage without crawling
router.post('/crawler/quick-scan', async (req, res) => {
    try {
        const { url, grade, subject } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL is required'
            });
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
            error: 'Failed to scan URL',
            details: error.message
        });
    }
});

// Smart crawl - crawl entire site intelligently
router.post('/crawler/smart-crawl', async (req, res) => {
    try {
        const { url, grade, subject, maxDepth, maxPages } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL is required'
            });
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
            results: results
        });
    } catch (error) {
        console.error('❌ Smart crawl error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to crawl site',
            details: error.message
        });// server/services/israeliSourcesCrawler.js - SMART CRAWLER WITH CLAUDE AI 🤖
        import Anthropic from '@anthropic-ai/sdk';
        import israeliSourcesFetcher from './israeliSourcesFetcher.js';

        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });

        class IsraeliSourcesCrawler {
            constructor() {
                this.visitedUrls = new Set();
                this.maxDepth = 2;
                this.maxPagesPerSite = 20;
                this.delay = 2000; // 2 seconds between requests
            }

            /**
             * 🤖 SMART CRAWL - Start from homepage and find relevant content
             */
            async smartCrawl(startUrl, options = {}) {
                const {
                    targetGrade = null,
                    targetSubject = 'מתמטיקה',
                    maxDepth = 2,
                    maxPages = 20
                } = options;

                this.maxDepth = maxDepth;
                this.maxPagesPerSite = maxPages;
                this.visitedUrls.clear();

                console.log('🤖 Starting Smart Crawl...');
                console.log(`   🎯 Target: ${targetSubject}${targetGrade ? ` - כיתה ${targetGrade}` : ''}`);
                console.log(`   📍 Start URL: ${startUrl}`);
                console.log(`   🔍 Max Depth: ${maxDepth}, Max Pages: ${maxPages}`);

                const results = {
                    startUrl,
                    pagesVisited: 0,
                    sourcesFound: 0,
                    sourcesFetched: 0,
                    errors: [],
                    sources: []
                };

                try {
                    await this.crawlRecursive(startUrl, 0, targetGrade, targetSubject, results);
                } catch (error) {
                    console.error('❌ Crawl error:', error);
                    results.errors.push({
                        url: startUrl,
                        error: error.message
                    });
                }

                console.log('\n✅ Smart Crawl Complete!');
                console.log(`   📄 Pages visited: ${results.pagesVisited}`);
                console.log(`   🎯 Sources found: ${results.sourcesFound}`);
                console.log(`   💾 Sources fetched: ${results.sourcesFetched}`);

                return results;
            }

            /**
             * 🔄 RECURSIVE CRAWL with depth limit
             */
            async crawlRecursive(url, depth, targetGrade, targetSubject, results) {
                // Stop conditions
                if (depth > this.maxDepth) {
                    console.log(`   ⏹️  Max depth reached (${depth})`);
                    return;
                }

                if (results.pagesVisited >= this.maxPagesPerSite) {
                    console.log(`   ⏹️  Max pages reached (${results.pagesVisited})`);
                    return;
                }

                if (this.visitedUrls.has(url)) {
                    console.log(`   ⏭️  Already visited: ${url}`);
                    return;
                }

                this.visitedUrls.add(url);
                results.pagesVisited++;

                console.log(`\n🔍 [Depth ${depth}] Visiting: ${url}`);

                try {
                    // Fetch page content
                    const response = await fetch(url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const html = await response.text();

                    // Extract links and analyze with Claude
                    const analysis = await this.analyzePageWithClaude(html, url, targetGrade, targetSubject);

                    console.log(`   📊 Analysis: ${analysis.relevantLinks.length} relevant links found`);

                    // Process content if this page is a direct source
                    if (analysis.isDirectSource) {
                        console.log(`   ✅ This is a direct source - fetching...`);
                        const fetchResult = await israeliSourcesFetcher.fetchAndStore(url, {
                            title: analysis.suggestedTitle,
                            grade: targetGrade || analysis.detectedGrade,
                            subject: targetSubject
                        });

                        if (fetchResult.success) {
                            results.sourcesFetched++;
                            results.sources.push({
                                url,
                                sourceId: fetchResult.sourceId,
                                title: fetchResult.title
                            });
                        }
                    }

                    // Recursively crawl relevant links
                    if (depth < this.maxDepth && analysis.relevantLinks.length > 0) {
                        // Sort by relevance score
                        const sortedLinks = analysis.relevantLinks
                            .sort((a, b) => b.relevanceScore - a.relevanceScore)
                            .slice(0, 5); // Top 5 most relevant

                        for (const link of sortedLinks) {
                            if (results.pagesVisited >= this.maxPagesPerSite) break;

                            console.log(`   🔗 Following: ${link.text} (score: ${link.relevanceScore})`);

                            await this.sleep(this.delay);
                            await this.crawlRecursive(link.url, depth + 1, targetGrade, targetSubject, results);
                        }
                    }

                } catch (error) {
                    console.error(`   ❌ Error: ${error.message}`);
                    results.errors.push({ url, error: error.message });
                }
            }

            /**
             * 🤖 ANALYZE PAGE WITH CLAUDE - Find relevant links intelligently
             */
            async analyzePageWithClaude(html, pageUrl, targetGrade, targetSubject) {
                // Extract links from HTML
                const linkMatches = html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi);
                const links = [];

                for (const match of linkMatches) {
                    let url = match[1];
                    const text = match[2].replace(/<[^>]*>/g, '').trim();

                    // Make absolute URL
                    if (url.startsWith('/')) {
                        const baseUrl = new URL(pageUrl);
                        url = `${baseUrl.protocol}//${baseUrl.host}${url}`;
                    } else if (!url.startsWith('http')) {
                        continue;
                    }

                    // Only same domain
                    try {
                        const linkDomain = new URL(url).hostname;
                        const pageDomain = new URL(pageUrl).hostname;
                        if (linkDomain !== pageDomain) continue;
                    } catch {
                        continue;
                    }

                    links.push({ url, text });
                }

                if (links.length === 0) {
                    return {
                        isDirectSource: false,
                        relevantLinks: [],
                        detectedGrade: null,
                        suggestedTitle: null
                    };
                }

                // Ask Claude to analyze
                const prompt = `אתה מומחה לזיהוי תכנים חינוכיים ישראליים.

🎯 משימה: נתח את הקישורים הבאים ומצא את הרלוונטיים ביותר.

📍 עמוד נוכחי: ${pageUrl}
🎓 מטרה: ${targetSubject}${targetGrade ? ` - כיתה ${targetGrade}` : ' (כל הכיתות)'}

📋 קישורים בדף (${Math.min(links.length, 50)} ראשונים):
${links.slice(0, 50).map((l, i) => `${i + 1}. [${l.text}](${l.url})`).join('\n')}

זהה:
1. האם העמוד הנוכחי הוא מקור ישיר (מבחן/תכנית לימודים)?
2. אילו קישורים מובילים למבחנים/תכניות לימוד רלוונטיים?
3. דרג כל קישור רלוונטי (0-100)

החזר JSON:
{
  "isDirectSource": true/false,
  "detectedGrade": 8,
  "suggestedTitle": "כותרת מוצעת",
  "relevantLinks": [
    {
      "index": 5,
      "relevanceScore": 95,
      "reason": "מבחן סוף שנה במתמטיקה כיתה ח"
    }
  ]
}`;

                try {
                    const response = await anthropic.messages.create({
                        model: 'claude-sonnet-4-20241022',
                        max_tokens: 2000,
                        messages: [{ role: 'user', content: prompt }]
                    });

                    const responseText = response.content[0].text;

                    // Parse JSON
                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                    if (!jsonMatch) {
                        return {
                            isDirectSource: false,
                            relevantLinks: [],
                            detectedGrade: null,
                            suggestedTitle: null
                        };
                    }

                    const analysis = JSON.parse(jsonMatch[0]);

                    // Map indices back to URLs
                    const relevantLinks = (analysis.relevantLinks || []).map(link => ({
                        url: links[link.index]?.url,
                        text: links[link.index]?.text,
                        relevanceScore: link.relevanceScore,
                        reason: link.reason
                    })).filter(link => link.url);

                    return {
                        isDirectSource: analysis.isDirectSource || false,
                        detectedGrade: analysis.detectedGrade,
                        suggestedTitle: analysis.suggestedTitle,
                        relevantLinks
                    };

                } catch (error) {
                    console.error('   ⚠️ Claude analysis failed:', error.message);
                    return {
                        isDirectSource: false,
                        relevantLinks: [],
                        detectedGrade: null,
                        suggestedTitle: null
                    };
                }
            }

            /**
             * 🎯 QUICK SCAN - Just analyze homepage, don't crawl
             */
            async quickScan(url, targetGrade = null, targetSubject = 'מתמטיקה') {
                console.log('🔍 Quick scanning:', url);

                try {
                    const response = await fetch(url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const html = await response.text();
                    const analysis = await this.analyzePageWithClaude(html, url, targetGrade, targetSubject);

                    console.log(`✅ Found ${analysis.relevantLinks.length} relevant links`);

                    return {
                        success: true,
                        isDirectSource: analysis.isDirectSource,
                        detectedGrade: analysis.detectedGrade,
                        suggestedTitle: analysis.suggestedTitle,
                        relevantLinks: analysis.relevantLinks.map(l => ({
                            url: l.url,
                            text: l.text,
                            score: l.relevanceScore,
                            reason: l.reason
                        }))
                    };

                } catch (error) {
                    console.error('❌ Quick scan failed:', error);
                    return {
                        success: false,
                        error: error.message
                    };
                }
            }

            sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
        }

        export default new IsraeliSourcesCrawler();
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