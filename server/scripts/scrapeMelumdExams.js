// backend/scripts/scrapeMelumadExams.js
import axios from 'axios';
import * as cheerio from 'cheerio';
import pool from '../config/database.js';

const MELUMAD_URL = 'https://www.melumad.co.il/מבחני-בגרות-במתמטיקה/';

class MelumadExamScraper {
    constructor() {
        this.examsScraped = 0;
        this.examsFailed = 0;
    }

    /**
     * Main scraping function
     */
    async scrapeAll() {
        console.log('🕷️  Starting Melumad Bagrut Exams Scraper...\n');

        try {
            // Fetch main page
            const html = await this.fetchPage(MELUMAD_URL);
            const $ = cheerio.load(html);

            // Extract exam links
            const examLinks = this.extractExamLinks($);
            console.log(`📄 Found ${examLinks.length} exam links\n`);

            // Process each exam
            for (const link of examLinks) {
                await this.processExam(link);
                await this.delay(2000); // Respectful scraping
            }

            console.log('\n✅ Scraping completed!');
            console.log(`   Scraped: ${this.examsScraped}`);
            console.log(`   Failed: ${this.examsFailed}`);

        } catch (error) {
            console.error('❌ Scraping error:', error);
        } finally {
            await pool.end();
        }
    }

    /**
     * Fetch a page
     */
    async fetchPage(url) {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });
            return response.data;
        } catch (error) {
            console.error(`Failed to fetch ${url}:`, error.message);
            throw error;
        }
    }

    /**
     * Extract exam links from main page
     */
    extractExamLinks($) {
        const links = [];

        // Look for exam links (adjust selectors based on actual site structure)
        $('a[href*="pdf"], a[href*="מבחן"], a[href*="בגרות"]').each((i, elem) => {
            const href = $(elem).attr('href');
            const text = $(elem).text().trim();

            if (href && (href.includes('.pdf') || href.includes('מבחן'))) {
                links.push({
                    url: href.startsWith('http') ? href : `https://www.melumad.co.il${href}`,
                    title: text
                });
            }
        });

        return [...new Set(links.map(l => JSON.stringify(l)))].map(l => JSON.parse(l));
    }

    /**
     * Process individual exam
     */
    async processExam(linkData) {
        try {
            console.log(`\n📝 Processing: ${linkData.title}`);

            // Parse exam metadata from title
            const metadata = this.parseExamTitle(linkData.title);

            if (!metadata) {
                console.log('   ⏭️  Could not parse metadata, skipping');
                this.examsFailed++;
                return;
            }

            // Check if exam already exists
            const existing = await pool.query(
                'SELECT id FROM bagrut_exams WHERE exam_code = $1 AND exam_year = $2',
                [metadata.examCode, metadata.year]
            );

            if (existing.rows.length > 0) {
                console.log('   ⚠️  Exam already exists, skipping');
                return;
            }

            // Insert exam
            const result = await pool.query(
                `INSERT INTO bagrut_exams (
                    exam_name, exam_code, exam_date, exam_season, exam_year,
                    grade_level, units, pdf_url, source, source_url, is_active
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'melumad', $9, true)
                RETURNING id`,
                [
                    metadata.name,
                    metadata.examCode,
                    metadata.date,
                    metadata.season,
                    metadata.year,
                    metadata.gradeLevel,
                    metadata.units,
                    linkData.url,
                    MELUMAD_URL
                ]
            );

            console.log(`   ✅ Added exam (ID: ${result.rows[0].id})`);
            console.log(`      Grade: ${metadata.gradeLevel}, Units: ${metadata.units}, Year: ${metadata.year}`);

            this.examsScraped++;

        } catch (error) {
            console.error(`   ❌ Failed to process exam:`, error.message);
            this.examsFailed++;
        }
    }

    /**
     * Parse exam metadata from title
     * Examples:
     * - "מבחן 035804 - קיץ 2023 - 5 יחידות"
     * - "בגרות מתמטיקה - 4 יחידות - חורף 2024"
     */
    parseExamTitle(title) {
        try {
            const metadata = {
                name: title,
                examCode: null,
                date: null,
                season: null,
                year: null,
                gradeLevel: 12, // Default
                units: null
            };

            // Extract exam code (6 digits)
            const codeMatch = title.match(/\d{6}/);
            if (codeMatch) {
                metadata.examCode = codeMatch[0];
            }

            // Extract year
            const yearMatch = title.match(/20\d{2}/);
            if (yearMatch) {
                metadata.year = parseInt(yearMatch[0]);
            }

            // Extract season
            if (title.includes('קיץ') || title.includes('summer')) {
                metadata.season = 'summer';
            } else if (title.includes('חורף') || title.includes('winter')) {
                metadata.season = 'winter';
            } else if (title.includes('מיוחד') || title.includes('makeup')) {
                metadata.season = 'makeup';
            }

            // Extract units
            const unitsMatch = title.match(/([345])\s*יחידות?/);
            if (unitsMatch) {
                metadata.units = parseInt(unitsMatch[1]);
            }

            // Extract grade level (if mentioned)
            const gradeMatch = title.match(/כיתה\s*([י|יא|יב])/);
            if (gradeMatch) {
                const gradeMap = { 'י': 10, 'יא': 11, 'יב': 12 };
                metadata.gradeLevel = gradeMap[gradeMatch[1]] || 12;
            }

            // Validation
            if (!metadata.units || !metadata.year) {
                return null;
            }

            return metadata;

        } catch (error) {
            console.error('Error parsing title:', error);
            return null;
        }
    }

    /**
     * Delay helper for respectful scraping
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run scraper
const scraper = new MelumadExamScraper();
scraper.scrapeAll();