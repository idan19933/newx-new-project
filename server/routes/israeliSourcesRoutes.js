// server/services/israeliSourcesCrawler.js - SMART CRAWLER WITH CLAUDE AI 🤖
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