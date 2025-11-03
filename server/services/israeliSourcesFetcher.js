// server/services/israeliSourcesFetcher.js
import fetch from 'node-fetch';
import pool from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import israeliQuestionParser from './israeliQuestionParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== ISRAELI EDUCATION SOURCES ====================
const ISRAELI_SOURCES = {
    // RAMA (הרשות הארצית למדידה והערכה בחינוך)
    rama: [
        {
            id: 'rama_math_8_2024',
            name: 'מתמטיקה כיתה ח\' תשפ"ד',
            url: 'https://rama.edu.gov.il/assessments/math-heb-8-2024',
            pdfUrl: 'https://meyda.education.gov.il/files/Rama/00-MAT-017-8th-SOF-mipuy-pnimi.pdf',
            grade: 8,
            year: 2024,
            source: 'RAMA',
            type: 'exam'
        },
        {
            id: 'rama_math_9_2026',
            name: 'מבחן במתמטיקה לכיתה ט\' תשפ"ו',
            url: 'https://rama.edu.gov.il/assessments/tnufa-math-9-2026',
            grade: 9,
            year: 2026,
            source: 'RAMA',
            type: 'exam'
        },
        {
            id: 'rama_math_5_2024',
            name: 'מתמטיקה לכיתה ה\'',
            url: 'https://rama.edu.gov.il/assessments/math-grade5',
            grade: 5,
            year: 2024,
            source: 'RAMA',
            type: 'assessment'
        }
    ],

    // Ministry of Education - Merchat Pedagogi (מרחב פדגוגי)
    merchatPedagogi: [
        {
            id: 'pop_tests_middle',
            name: 'מאגר מבחנים - חטיבת ביניים',
            url: 'https://pop.education.gov.il/tchumey_daat/matmatika/chativat-beynayim/teaching-mathematics/tests-exams/',
            grades: [7, 8, 9],
            source: 'Ministry_Merchat',
            type: 'test_bank'
        },
        {
            id: 'pop_assessment_tasks',
            name: 'מאגר משימות הערכה',
            url: 'https://pop.education.gov.il/tchumey_daat/matmatika/yesodi/oraat-math/assessment-tasks/',
            grades: [3, 4, 5, 6, 7, 8],
            source: 'Ministry_Merchat',
            type: 'assessment_tasks'
        }
    ],

    // Direct PDF links from Meyda
    meydaPdfs: [
        {
            id: 'meyda_math_8_internal',
            name: 'מיפוי פנימי מתמטיקה כיתה ח\'',
            url: 'https://meyda.education.gov.il/files/Rama/00-MAT-017-8th-SOF-mipuy-pnimi.pdf',
            grade: 8,
            source: 'Meyda',
            type: 'pdf'
        }
    ]
};

// ==================== VERIFY URL ====================
export async function verifyUrl(url) {
    try {
        console.log(`🔍 Verifying: ${url}`);

        const response = await fetch(url, {
            method: 'HEAD',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const result = {
            url,
            status: response.status,
            ok: response.ok,
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length'),
            accessible: response.ok
        };

        if (response.ok) {
            console.log(`   ✅ Accessible (${response.status})`);
        } else {
            console.log(`   ❌ Not accessible (${response.status})`);
        }

        return result;

    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return {
            url,
            accessible: false,
            error: error.message
        };
    }
}

// ==================== VERIFY ALL SOURCES ====================
export async function verifyAllSources() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 VERIFYING ISRAELI EDUCATION SOURCES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const results = {
        rama: [],
        merchatPedagogi: [],
        meydaPdfs: [],
        summary: {
            total: 0,
            accessible: 0,
            failed: 0
        }
    };

    // Verify RAMA sources
    console.log('📚 RAMA Sources:');
    for (const source of ISRAELI_SOURCES.rama) {
        const result = await verifyUrl(source.url);
        results.rama.push({
            ...source,
            verification: result
        });
        results.summary.total++;
        if (result.accessible) results.summary.accessible++;
        else results.summary.failed++;

        // Also verify PDF URL if exists
        if (source.pdfUrl) {
            const pdfResult = await verifyUrl(source.pdfUrl);
            results.rama.push({
                ...source,
                name: source.name + ' (PDF)',
                url: source.pdfUrl,
                verification: pdfResult
            });
            results.summary.total++;
            if (pdfResult.accessible) results.summary.accessible++;
            else results.summary.failed++;
        }
    }

    // Verify Merchat Pedagogi sources
    console.log('\n📚 Merchat Pedagogi Sources:');
    for (const source of ISRAELI_SOURCES.merchatPedagogi) {
        const result = await verifyUrl(source.url);
        results.merchatPedagogi.push({
            ...source,
            verification: result
        });
        results.summary.total++;
        if (result.accessible) results.summary.accessible++;
        else results.summary.failed++;
    }

    // Verify Meyda PDFs
    console.log('\n📚 Meyda PDF Sources:');
    for (const source of ISRAELI_SOURCES.meydaPdfs) {
        const result = await verifyUrl(source.url);
        results.meydaPdfs.push({
            ...source,
            verification: result
        });
        results.summary.total++;
        if (result.accessible) results.summary.accessible++;
        else results.summary.failed++;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 VERIFICATION SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Accessible: ${results.summary.accessible}/${results.summary.total}`);
    console.log(`❌ Failed: ${results.summary.failed}/${results.summary.total}`);
    console.log(`📈 Success Rate: ${((results.summary.accessible / results.summary.total) * 100).toFixed(1)}%`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return results;
}

// ==================== DOWNLOAD PDF ====================
export async function downloadPdf(url, filename) {
    try {
        console.log(`📥 Downloading: ${url}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const buffer = await response.buffer();

        // Save to temp directory
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const filepath = path.join(tempDir, filename);
        fs.writeFileSync(filepath, buffer);

        console.log(`   ✅ Saved: ${filepath} (${(buffer.length / 1024).toFixed(1)} KB)`);

        return {
            success: true,
            filepath,
            size: buffer.length
        };

    } catch (error) {
        console.log(`   ❌ Download failed: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

// ==================== FETCH AND STORE ====================
export async function fetchAndStore(sourceId) {
    try {
        console.log(`\n🔄 Fetching source: ${sourceId}`);

        // Find source
        let source = null;
        for (const category of Object.values(ISRAELI_SOURCES)) {
            const found = category.find(s => s.id === sourceId);
            if (found) {
                source = found;
                break;
            }
        }

        if (!source) {
            throw new Error(`Source not found: ${sourceId}`);
        }

        // Verify URL first
        const verification = await verifyUrl(source.url);
        if (!verification.accessible) {
            throw new Error(`Source not accessible: ${verification.error || verification.status}`);
        }

        // Save source info to database
        const query = `
            INSERT INTO scraping_sources (
                url, name, source_type, last_scraped, is_active
            ) VALUES ($1, $2, $3, NOW(), true)
            ON CONFLICT (url) 
            DO UPDATE SET last_scraped = NOW()
            RETURNING id
        `;

        const result = await pool.query(query, [
            source.url,
            source.name,
            source.type
        ]);

        console.log(`   ✅ Source saved to database (ID: ${result.rows[0].id})`);

        // If PDF URL exists, download it
        if (source.pdfUrl || source.type === 'pdf') {
            const pdfUrl = source.pdfUrl || source.url;
            const filename = `${sourceId}_${Date.now()}.pdf`;
            const downloadResult = await downloadPdf(pdfUrl, filename);

            if (downloadResult.success) {
                // Log the download
                await pool.query(
                    `INSERT INTO scraping_logs (
                        source_id, status, items_found, items_saved, error_message
                    ) VALUES ($1, 'success', 1, 1, $2)`,
                    [result.rows[0].id, `PDF downloaded: ${downloadResult.filepath}`]
                );

                return {
                    success: true,
                    sourceId: result.rows[0].id,
                    downloaded: true,
                    filepath: downloadResult.filepath,
                    message: 'PDF downloaded successfully',
                    source: source
                };
            }
        }

        return {
            success: true,
            sourceId: result.rows[0].id,
            downloaded: false,
            message: 'Source registered successfully',
            source: source
        };

    } catch (error) {
        console.error(`❌ Fetch and store failed:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ==================== FETCH AND PROCESS (NEW) ====================
export async function fetchAndProcess(sourceId) {
    try {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🚀 COMPLETE PIPELINE: FETCH + PROCESS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Step 1: Fetch and download
        const fetchResult = await fetchAndStore(sourceId);

        if (!fetchResult.success) {
            return fetchResult;
        }

        // Step 2: If PDF was downloaded, process it
        if (fetchResult.downloaded && fetchResult.filepath) {
            const processResult = await israeliQuestionParser.processPdf(
                fetchResult.filepath,
                {
                    source: fetchResult.source.source || 'RAMA',
                    grade: fetchResult.source.grade || null,
                    year: fetchResult.source.year || 2024
                }
            );

            return {
                success: true,
                fetch: fetchResult,
                process: processResult,
                summary: {
                    downloaded: true,
                    extracted: processResult.extracted || 0,
                    saved: processResult.saved || 0,
                    skipped: processResult.skipped || 0
                }
            };
        }

        return {
            success: true,
            fetch: fetchResult,
            message: 'Fetched but no PDF to process'
        };

    } catch (error) {
        console.error('❌ Pipeline error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ==================== GET ALL SOURCES ====================
export function getAllSources() {
    return ISRAELI_SOURCES;
}

export default {
    verifyUrl,
    verifyAllSources,
    downloadPdf,
    fetchAndStore,
    fetchAndProcess,
    getAllSources
};