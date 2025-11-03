// server/services/israeliSourcesFetcher.js - ENHANCED WITH PDF DOWNLOAD
import pool from '../config/database.js';
import pdf from 'pdf-parse';
class IsraeliSourcesFetcher {
    /**
     * Fetch content from URL - handles both HTML pages and downloadable PDFs
     */
    async fetchAndStore(url, metadata = {}) {
        console.log(`📥 Fetching content from: ${url}`);

        try {
            // Step 1: Fetch the main page
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

            // CASE 1: Direct PDF download
            if (contentType.includes('application/pdf')) {
                console.log(`   📑 Detected direct PDF download`);
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                content = await this.extractPDFText(buffer);
                extractionMethod = 'pdf_direct';
            }
            // CASE 2: HTML page (might contain PDF links)
            else {
                const html = await response.text();
                console.log(`   ✅ Fetched ${html.length} characters of HTML`);

                // Look for PDF download links
                const pdfLinks = this.findPDFLinks(html, url);

                if (pdfLinks.length > 0) {
                    console.log(`   🔗 Found ${pdfLinks.length} PDF link(s)`);
                    console.log(`   📥 Downloading first PDF: ${pdfLinks[0]}`);

                    // Download and extract first PDF
                    content = await this.downloadAndExtractPDF(pdfLinks[0]);
                    extractionMethod = 'pdf_from_link';
                } else {
                    // No PDF found, extract text from HTML
                    console.log(`   📝 No PDF links found, extracting HTML text`);
                    content = this.extractTextFromHTML(html);
                    extractionMethod = 'html_text';
                }
            }

            console.log(`   ✅ Extracted ${content.length} characters of text (method: ${extractionMethod})`);

            if (content.length < 100) {
                console.warn(`   ⚠️ Warning: Very short content (${content.length} chars)`);
            }

            // Extract metadata
            const title = metadata.title || this.extractTitle(content) || 'Untitled Source';
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
     * Find PDF links in HTML
     */
    findPDFLinks(html, baseUrl) {
        const pdfLinks = [];

        // Pattern 1: Direct .pdf links
        const directPdfRegex = /href=["']([^"']*\.pdf[^"']*)["']/gi;
        let match;
        while ((match = directPdfRegex.exec(html)) !== null) {
            pdfLinks.push(this.resolveUrl(match[1], baseUrl));
        }

        // Pattern 2: Links with "download" or "file" keywords
        const downloadRegex = /href=["']([^"']*(?:download|file|doc)[^"']*)["']/gi;
        while ((match = downloadRegex.exec(html)) !== null) {
            const link = match[1];
            if (link.includes('.pdf') || link.includes('file')) {
                pdfLinks.push(this.resolveUrl(link, baseUrl));
            }
        }

        // Pattern 3: data-href or data-url attributes (for JS-loaded links)
        const dataRegex = /data-(?:href|url|file)=["']([^"']*\.pdf[^"']*)["']/gi;
        while ((match = dataRegex.exec(html)) !== null) {
            pdfLinks.push(this.resolveUrl(match[1], baseUrl));
        }

        // Remove duplicates
        return [...new Set(pdfLinks)];
    }

    /**
     * Resolve relative URLs to absolute
     */
    resolveUrl(link, baseUrl) {
        try {
            if (link.startsWith('http://') || link.startsWith('https://')) {
                return link;
            }
            const base = new URL(baseUrl);
            if (link.startsWith('//')) {
                return base.protocol + link;
            }
            if (link.startsWith('/')) {
                return base.origin + link;
            }
            return new URL(link, baseUrl).href;
        } catch (e) {
            return link;
        }
    }

    /**
     * Download and extract text from PDF
     */
    async downloadAndExtractPDF(pdfUrl) {
        try {
            console.log(`   📥 Downloading PDF: ${pdfUrl}`);

            const response = await fetch(pdfUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (!response.ok) {
                throw new Error(`PDF download failed: ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            console.log(`   ✅ Downloaded ${buffer.length} bytes`);

            return await this.extractPDFText(buffer);

        } catch (error) {
            console.error(`   ❌ PDF download failed:`, error.message);
            throw error;
        }
    }

    /**
     * Extract text from PDF buffer
     */
    async extractPDFText(buffer) {
        try {
            const data = await pdf(buffer);
            const text = data.text;

            console.log(`   📄 Extracted ${text.length} characters from PDF (${data.numpages} pages)`);

            return text
                .replace(/\s+/g, ' ')
                .trim();

        } catch (error) {
            console.error(`   ❌ PDF extraction failed:`, error.message);
            throw new Error(`Failed to extract PDF text: ${error.message}`);
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
     * Extract title from content
     */
    extractTitle(content) {
        // Look for Hebrew title patterns
        const titleMatch = content.match(/^(.{10,100}?)(?:\n|$)/);
        return titleMatch ? titleMatch[1].trim() : null;
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