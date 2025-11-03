// server/services/israeliSourcesFetcher.js - HTML ONLY (Skip PDF for now)
import pool from '../config/database.js';

class IsraeliSourcesFetcher {
    /**
     * Fetch content from URL - HTML text extraction only
     * PDF support temporarily disabled due to Node.js compatibility issues
     */
    async fetchAndStore(url, metadata = {}) {
        console.log(`📥 Fetching content from: ${url}`);

        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type') || '';
            console.log(`   📄 Content-Type: ${contentType}`);

            let content = '';
            let extractionMethod = 'html';

            // Check if it's a PDF
            if (contentType.includes('application/pdf')) {
                console.log(`   ⚠️ PDF detected - skipping for now (provide HTML URL or manual content instead)`);
                throw new Error('PDF extraction not available - please provide HTML page URL or add content manually');
            }

            // Extract from HTML
            const html = await response.text();
            console.log(`   ✅ Fetched ${html.length} characters of HTML`);

            // Extract text from HTML
            content = this.extractTextFromHTML(html);
            extractionMethod = 'html_text';

            console.log(`   ✅ Extracted ${content.length} characters of text`);

            if (content.length < 100) {
                console.warn(`   ⚠️ Warning: Very short content (${content.length} chars) - page might be JavaScript-rendered`);
            }

            // Extract metadata
            const title = metadata.title || this.extractTitle(html, content) || 'Untitled Source';
            const detectedGrade = metadata.grade || this.detectGrade(url, content);
            const sourceType = this.detectSourceType(url);

            // Store in database
            const query = `
                INSERT INTO israeli_sources (
                    title,
                    source_type,
                    source_url,
                    content,
                    grade_level,
                    subject,
                    status,
                    notes,
                    created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
                    RETURNING id
            `;

            const result = await pool.query(query, [
                title,
                sourceType,
                url,
                content,
                detectedGrade,
                metadata.subject || 'מתמטיקה',
                'active',
                `Extraction method: ${extractionMethod}`
            ]);

            const sourceId = result.rows[0].id;
            console.log(`   ✅ Stored as source ID: ${sourceId}`);

            // Log the fetch
            await pool.query(
                `INSERT INTO israeli_sources_log (
                    source_id, action, result, details, created_at
                ) VALUES ($1, 'fetch', 'success', $2, CURRENT_TIMESTAMP)`,
                [sourceId, JSON.stringify({
                    url,
                    contentLength: content.length,
                    extractionMethod,
                    contentType
                })]
            );

            return {
                success: true,
                sourceId,
                title,
                grade: detectedGrade,
                contentLength: content.length,
                extractionMethod
            };

        } catch (error) {
            console.error(`   ❌ Fetch failed:`, error.message);

            // Log the error
            await pool.query(
                `INSERT INTO israeli_sources_log (
                    source_id, action, result, error_message, created_at
                ) VALUES (NULL, 'fetch', 'error', $1, CURRENT_TIMESTAMP)`,
                [error.message]
            );

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Extract text from HTML
     */
    extractTextFromHTML(html) {
        return html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&[a-z]+;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Extract title from HTML or content
     */
    extractTitle(html, content) {
        // Try to get title from HTML <title> tag
        const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
        if (titleMatch && titleMatch[1].trim()) {
            return titleMatch[1].trim();
        }

        // Fallback to first line of content
        const contentTitleMatch = content.match(/^(.{10,100}?)(?:\n|$)/);
        return contentTitleMatch ? contentTitleMatch[1].trim() : null;
    }

    /**
     * Detect grade from URL or content
     */
    detectGrade(url, content) {
        // From URL
        const urlGradeMatch = url.match(/[\-_](\d+)[\-_]/i);
        if (urlGradeMatch) {
            const grade = parseInt(urlGradeMatch[1]);
            if (grade >= 7 && grade <= 12) return grade;
        }

        // From content - Hebrew
        const hebrewGradeMatch = content.match(/כיתה ([א-יאבגדהוזחט]|[\d]+)/i);
        if (hebrewGradeMatch) {
            return this.parseHebrewGrade(hebrewGradeMatch[1]);
        }

        // From content - English
        const gradeMatch = content.match(/grade (\d+)/i);
        if (gradeMatch) {
            const grade = parseInt(gradeMatch[1]);
            if (grade >= 7 && grade <= 12) return grade;
        }

        return null;
    }

    /**
     * Fetch multiple sources
     */
    async fetchMultiple(sources) {
        console.log(`📥 Fetching ${sources.length} sources...`);

        const results = [];

        for (const source of sources) {
            const result = await this.fetchAndStore(source.url, source.metadata || {});
            results.push({
                url: source.url,
                ...result
            });

            // Wait between requests
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        return {
            success: true,
            results,
            totalFetched: results.filter(r => r.success).length,
            totalFailed: results.filter(r => !r.success).length
        };
    }

    /**
     * Detect source type from URL
     */
    detectSourceType(url) {
        if (url.includes('rama.edu.gov.il') || url.includes('rama.cet.ac.il')) {
            return 'rama';
        } else if (url.includes('merchat-pedagogi')) {
            return 'merchat_pedagogi';
        } else if (url.includes('meyda.education.gov.il')) {
            return 'meyda';
        } else {
            return 'web_source';
        }
    }

    /**
     * Parse Hebrew grade notation
     */
    parseHebrewGrade(gradeStr) {
        const hebrewToNumber = {
            'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6,
            'ז': 7, 'ח': 8, 'ט': 9, 'י': 10, 'יא': 11, 'יב': 12
        };

        if (!isNaN(gradeStr)) {
            return parseInt(gradeStr);
        }

        return hebrewToNumber[gradeStr] || null;
    }
}

export default new IsraeliSourcesFetcher();