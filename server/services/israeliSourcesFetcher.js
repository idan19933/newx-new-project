// server/services/israeliSourcesFetcher.js - WITH PDF SUPPORT via Claude
import pool from '../config/database.js';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

class IsraeliSourcesFetcher {
    /**
     * Get all sources from database
     */
    async getAllSources() {
        try {
            const query = `
                SELECT
                    id,
                    title,
                    source_type,
                    source_url,
                    grade_level,
                    subject,
                    status,
                    LENGTH(content) as content_length,
                    notes,
                    last_scraped_at,
                    created_at,
                    updated_at
                FROM israeli_sources
                ORDER BY created_at DESC
            `;

            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('❌ [GetAllSources] Error:', error);
            throw error;
        }
    }

    /**
     * Get source by ID
     */
    async getSourceById(sourceId) {
        try {
            const query = `SELECT * FROM israeli_sources WHERE id = $1`;
            const result = await pool.query(query, [sourceId]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('❌ [GetSourceById] Error:', error);
            throw error;
        }
    }

    /**
     * Fetch content from URL - NOW WITH PDF SUPPORT!
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

            let content;
            let extractionMethod;

            // PDF SUPPORT - Extract via Claude!
            if (contentType.includes('application/pdf') || url.toLowerCase().endsWith('.pdf')) {
                console.log('   📄 PDF detected - extracting with Claude...');

                // Download PDF as buffer
                const pdfBuffer = await response.arrayBuffer();
                const base64Pdf = Buffer.from(pdfBuffer).toString('base64');

                // Use Claude to extract text from PDF
                content = await this.extractPdfWithClaude(base64Pdf, url);
                extractionMethod = 'claude_pdf';

                console.log(`   ✅ Extracted ${content.length} characters from PDF`);
            } else {
                // HTML extraction
                const html = await response.text();
                content = this.extractTextFromHTML(html);
                extractionMethod = 'html';
                console.log(`   ✅ Extracted ${content.length} characters from HTML`);
            }

            const title = metadata.title || this.extractTitle(content, url) || 'Untitled Source';
            const detectedGrade = metadata.grade || this.detectGrade(url, content);
            const sourceType = this.detectSourceType(url);

            const query = `
                INSERT INTO israeli_sources (
                    title, source_type, source_url, content, grade_level,
                    subject, status, notes, created_at
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
                `Extracted via ${extractionMethod}`
            ]);

            const sourceId = result.rows[0].id;
            console.log(`   ✅ Stored as source ID: ${sourceId}`);

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
            return { success: false, error: error.message };
        }
    }

    /**
     * NEW: Extract text from PDF using Claude
     */
    async extractPdfWithClaude(base64Pdf, sourceUrl) {
        try {
            const response = await anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4000,
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'document',
                            source: {
                                type: 'base64',
                                media_type: 'application/pdf',
                                data: base64Pdf
                            }
                        },
                        {
                            type: 'text',
                            text: `אנא חלץ את כל הטקסט מהמסמך הזה. 

זהו מסמך חינוכי ישראלי (תכנית לימודים או מבחן במתמטיקה).

החזר את כל הטקסט בעברית בדיוק כמו שהוא כתוב, כולל:
- כותרות
- שאלות ומספורן
- הסברים
- דוגמאות
- נוסחאות (בעברית או בסימונים מתמטיים)

שמור על המבנה המקורי ככל האפשר.`
                        }
                    ]
                }]
            });

            return response.content[0].text;
        } catch (error) {
            console.error('   ❌ Claude PDF extraction failed:', error.message);
            throw new Error(`Failed to extract PDF: ${error.message}`);
        }
    }

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

    extractTitle(content, url) {
        // Try to find title in first few lines
        const lines = content.split('\n').filter(l => l.trim().length > 10);
        if (lines.length > 0) {
            return lines[0].substring(0, 100);
        }

        // Fallback: use URL
        const urlParts = url.split('/');
        const filename = urlParts[urlParts.length - 1];
        return filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');
    }

    detectGrade(url, content) {
        // Check URL first
        const urlGradeMatch = url.match(/[\-_](\d+)[\-_]/i);
        if (urlGradeMatch) {
            const grade = parseInt(urlGradeMatch[1]);
            if (grade >= 7 && grade <= 12) return grade;
        }

        // Check content for Hebrew grade markers
        const hebrewGradeMatch = content.match(/כיתה ([א-יאבגדהוזחט]|[\d]+)/i);
        if (hebrewGradeMatch) {
            return this.parseHebrewGrade(hebrewGradeMatch[1]);
        }

        const gradeMatch = content.match(/grade (\d+)/i);
        if (gradeMatch) {
            const grade = parseInt(gradeMatch[1]);
            if (grade >= 7 && grade <= 12) return grade;
        }

        return null;
    }

    async fetchMultiple(sources) {
        console.log(`📥 Fetching ${sources.length} sources...`);
        const results = [];

        for (const source of sources) {
            const result = await this.fetchAndStore(source.url, source.metadata || {});
            results.push({ url: source.url, ...result });
            await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limiting
        }

        return {
            success: true,
            results,
            totalFetched: results.filter(r => r.success).length,
            totalFailed: results.filter(r => !r.success).length
        };
    }

    detectSourceType(url) {
        if (url.includes('rama.edu.gov.il') || url.includes('rama.cet.ac.il') || url.includes('meyda.education.gov.il/files/Rama')) {
            return 'rama';
        } else if (url.includes('merchat-pedagogi')) {
            return 'merchat_pedagogi';
        } else if (url.includes('meyda.education.gov.il')) {
            return 'meyda';
        } else {
            return 'web_source';
        }
    }

    parseHebrewGrade(gradeStr) {
        const hebrewToNumber = {
            'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6,
            'ז': 7, 'ח': 8, 'ט': 9, 'י': 10, 'יא': 11, 'יב': 12
        };
        if (!isNaN(gradeStr)) return parseInt(gradeStr);
        return hebrewToNumber[gradeStr] || null;
    }

    async updateSource(sourceId, updates) {
        try {
            const allowedFields = ['title', 'content', 'grade_level', 'subject', 'status', 'notes'];
            const setClauses = [];
            const values = [];
            let paramCount = 1;

            for (const [key, value] of Object.entries(updates)) {
                if (allowedFields.includes(key)) {
                    setClauses.push(`${key} = $${paramCount}`);
                    values.push(value);
                    paramCount++;
                }
            }

            if (setClauses.length === 0) {
                throw new Error('No valid fields to update');
            }

            setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

            const query = `
                UPDATE israeli_sources
                SET ${setClauses.join(', ')}
                WHERE id = $${paramCount}
                    RETURNING *
            `;

            values.push(sourceId);
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('❌ [UpdateSource] Error:', error);
            throw error;
        }
    }

    async deleteSource(sourceId) {
        try {
            const query = `DELETE FROM israeli_sources WHERE id = $1 RETURNING id`;
            const result = await pool.query(query, [sourceId]);
            return result.rowCount > 0;
        } catch (error) {
            console.error('❌ [DeleteSource] Error:', error);
            throw error;
        }
    }
}

export default new IsraeliSourcesFetcher();