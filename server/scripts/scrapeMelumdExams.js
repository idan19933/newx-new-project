import axios from 'axios';
import * as cheerio from 'cheerio';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const DATABASE_URL = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    max: 5
});

const MELUMAD_URL = 'https://www.melumad.co.il/מבחני-בגרות-במתמטיקה/';

const EXAM_METADATA = {
    '801': { units: 3, grade: 11, name: 'שאלון 801 - 3 יח״ל יא׳' },
    '802': { units: 4, grade: 11, name: 'שאלון 802 - 4 יח״ל יא׳' },
    '803': { units: 4, grade: 12, name: 'שאלון 803 - 4 יח״ל יב׳' },
    '804': { units: 4, grade: 12, name: 'שאלון 804 - 4 יח״ל יב׳' },
    '805': { units: 4, grade: 12, name: 'שאלון 805 - 4 יח״ל יב׳' },
    '806': { units: 5, grade: 12, name: 'שאלון 806 - 5 יח״ל יב׳' },
    '807': { units: 5, grade: 12, name: 'שאלון 807 - 5 יח״ל יב׳' }
};

class MelumadBrowserScraper {
    constructor() {
        this.added = 0;
        this.skipped = 0;
    }

    async scrapeAll() {
        console.log('🕷️  Melumad Browser-Based Scraper\n');
        console.log('📚 Using browser console data extraction method\n');

        try {
            await pool.query('SELECT 1');
            console.log('✅ Database connected\n');

            const html = await this.fetchPage(MELUMAD_URL);
            const $ = cheerio.load(html);

            // Extract exams using the same logic as browser console
            const exams = {};

            $('a[href*="fileserv.melumad"]').each((i, link) => {
                const $link = $(link);
                const href = $link.attr('href');
                const text = $link.text().trim();

                // Find exam code in parent
                let examCode = null;
                const $parent = $link.closest('tr, .row, div, td');

                if ($parent.length) {
                    const parentText = $parent.text();
                    const match = parentText.match(/(?:801|802|803|804|805|806|807)/);
                    if (match) examCode = match[0];
                }

                if (examCode) {
                    if (!exams[examCode]) exams[examCode] = [];
                    exams[examCode].push({ text, url: href });
                }
            });

            console.log(`📊 Found ${Object.keys(exams).length} exam codes\n`);

            // Process each exam
            for (const [examCode, pdfs] of Object.entries(exams)) {
                const metadata = EXAM_METADATA[examCode];
                if (!metadata) {
                    console.log(`⚠️  Unknown exam code: ${examCode}, skipping`);
                    continue;
                }

                console.log(`\n📝 Processing ${metadata.name} (${pdfs.length} PDFs)...`);

                for (const pdf of pdfs) {
                    await this.insertPDF(examCode, pdf, metadata);
                }
            }

            console.log('\n' + '='.repeat(50));
            console.log('✅ Scraping completed!');
            console.log('='.repeat(50));
            console.log(`   ✅ Added: ${this.added}`);
            console.log(`   ⏭️  Skipped: ${this.skipped}`);
            console.log('='.repeat(50) + '\n');

        } catch (error) {
            console.error('❌ Error:', error.message);
        } finally {
            await pool.end();
        }
    }

    async insertPDF(examCode, pdf, metadata) {
        try {
            // Check if exists
            const existing = await pool.query(
                'SELECT id FROM bagrut_exams WHERE exam_code = $1 AND pdf_url = $2',
                [examCode, pdf.url]
            );

            if (existing.rows.length > 0) {
                console.log(`   ⏭️  ${pdf.text}: already exists`);
                this.skipped++;
                return;
            }

            const typeName = {
                'שאלון': 'שאלון',
                'פתרון': 'פתרון',
                'משרד החינוך': 'משרד החינוך',
                'מיקוד': 'מיקוד',
                'מבנה': 'מבנה'
            }[pdf.text] || pdf.text;

            const examName = `${metadata.name} - ${typeName}`;

            await pool.query(
                `INSERT INTO bagrut_exams (
                    exam_name, exam_code, grade_level, units,
                    pdf_url, source, source_url, is_active
                ) VALUES ($1, $2, $3, $4, $5, 'melumad', $6, true)`,
                [examName, examCode, metadata.grade, metadata.units, pdf.url, MELUMAD_URL]
            );

            console.log(`   ✅ ${typeName}: added`);
            this.added++;

        } catch (error) {
            console.error(`   ❌ Insert failed: ${error.message}`);
        }
    }

    async fetchPage(url) {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000
        });
        return response.data;
    }
}

// Run
const scraper = new MelumadBrowserScraper();
scraper.scrapeAll().catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
});