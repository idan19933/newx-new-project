import axios from 'axios';
import fs from 'fs';

const PDF_URL = 'https://fileserv.melumad.co.il/simplepdf/NnFLT3pUNVo1dml4REJYdXI3ZjF4TXBRSkMyMHMrczlIMWhMMTJKYVJVaXFIUDBTVjVJbEp5WkRFdVEvdnBFYg==:ZGU3YzhjYzgxMjgxYjAzYg==?permissions=U1J1V0JlSU40dHhod1RCWTFBWmxnRlYxN3FDdHBsdGpFTDNVUmttaVN1N21rMzVmengwNVViMThRVkU2dkJBeQ==:ZmI0OThlZjkwZmNlZmY2Ng==';

async function downloadPDF() {
    console.log('📥 Downloading PDF from Melumad...\n');

    try {
        const response = await axios.get(PDF_URL, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        console.log(`✅ Downloaded ${response.data.length} bytes`);

        // Save to file
        fs.writeFileSync('test-exam.pdf', response.data);
        console.log('✅ Saved to test-exam.pdf\n');

        // Check if it's actually a PDF
        const magic = response.data.slice(0, 5).toString('utf-8');
        console.log('📄 File header:', magic);

        if (magic === '%PDF-') {
            console.log('✅ Valid PDF file!');
            console.log('\n🔍 Open test-exam.pdf manually to see if it works');
            console.log('💡 If you can read it, we can extract questions from it!');
        } else {
            console.log('❌ Not a valid PDF - might be encrypted/protected');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
        }
    }
}

downloadPDF();