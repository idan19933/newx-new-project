// server/services/israeliSourcesFetcher.js - WEB CONTENT FETCHER
import pool from '../config/database.js';

class IsraeliSourcesFetcher {
    /**
     * Fetch content from URL and store in israeli_sources table
     */
    async fetchAndStore(url, metadata = {}) {
        console.log(`📥 Fetching content from: ${url}`);

        try {
            // Fetch the web page
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const html = await response.text();
            console.log(`   ✅ Fetched ${html.length} characters`);

            // Simple text extraction (remove HTML tags)
            let content = html
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/&nbsp;/g, ' ')
                .replace(/&[a-z]+;/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            console.log(`   ✅ Extracted ${content.length} characters of text`);

            // Extract title from HTML
            const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
            const title = metadata.title || (titleMatch ? titleMatch[1].trim() : 'Untitled Source');

            // Detect grade from URL or title
            const gradeMatch = url.match(/[\-_](\d+)[\-_]/i) || title.match(/כיתה ([א-יאבגדהוזחט]|[\d]+)/i);
            const detectedGrade = gradeMatch ? this.parseHebrewGrade(gradeMatch[1]) : metadata.grade || null;

            // Detect source type from URL
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
                    created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
                RETURNING id
            `;

            const result = await pool.query(query, [
                title,
                sourceType,
                url,
                content,
                detectedGrade,
                metadata.subject || 'מתמטיקה',
                'active'
            ]);

            const sourceId = result.rows[0].id;

            console.log(`   ✅ Stored as source ID: ${sourceId}`);

            // Log the fetch
            await pool.query(
                `INSERT INTO israeli_sources_log (
                    source_id, action, result, details, created_at
                ) VALUES ($1, 'fetch', 'success', $2, CURRENT_TIMESTAMP)`,
                [sourceId, JSON.stringify({ url, contentLength: content.length })]
            );

            return {
                success: true,
                sourceId,
                title,
                grade: detectedGrade,
                contentLength: content.length
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

            // Wait between requests to be polite
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

        // If it's already a number
        if (!isNaN(gradeStr)) {
            return parseInt(gradeStr);
        }

        // If it's Hebrew
        return hebrewToNumber[gradeStr] || null;
    }
}

export default new IsraeliSourcesFetcher();