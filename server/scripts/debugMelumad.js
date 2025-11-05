import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

const MELUMAD_URL = 'https://www.melumad.co.il/מבחני-בגרות-במתמטיקה/';

console.log('🔍 Analyzing page structure...\n');

try {
    const response = await axios.get(MELUMAD_URL);
    const $ = cheerio.load(response.data);

    // Find structure: each exam should have PDFs nearby
    const exams = [];

    // Strategy: Find elements that contain "שאלון XXX"
    $('*').each((i, elem) => {
        const text = $(elem).text();
        const match = text.match(/שאלון\s*(\d{3})/);

        if (match) {
            const examCode = match[1];
            const section = $(elem).closest('div, section, article');

            // Find PDF links in this section
            const pdfs = [];
            section.find('a[href*="pdf"]').each((j, pdfElem) => {
                const href = $(pdfElem).attr('href');
                const pdfText = $(pdfElem).text().trim();

                if (href && pdfText) {
                    pdfs.push({ href, text: pdfText });
                }
            });

            if (pdfs.length > 0) {
                exams.push({
                    examCode,
                    examText: text.substring(0, 100),
                    pdfs
                });
            }
        }
    });

    console.log(`📊 Found ${exams.length} exams with PDFs\n`);

    // Show first 5
    exams.slice(0, 5).forEach((exam, i) => {
        console.log(`${i + 1}. שאלון ${exam.examCode}`);
        console.log(`   Context: ${exam.examText}`);
        console.log(`   PDFs: ${exam.pdfs.length}`);
        exam.pdfs.forEach(pdf => {
            console.log(`   - ${pdf.text}: ${pdf.href.substring(0, 60)}...`);
        });
        console.log('');
    });

    // Save
    fs.writeFileSync('exam-pdf-structure.json', JSON.stringify(exams, null, 2));
    console.log('✅ Saved to exam-pdf-structure.json\n');

} catch (error) {
    console.error('❌ Error:', error.message);
}