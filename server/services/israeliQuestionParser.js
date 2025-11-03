// server/services/israeliQuestionParser.js
import { createRequire } from 'module';
import fs from 'fs';
import pool from '../config/database.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

class IsraeliQuestionParser {
    constructor() {
        // Hebrew question patterns
        this.questionPatterns = [
            /שאלה\s+(\d+)[:.]\s*(.+?)(?=שאלה\s+\d+|$)/gis,
            /(\d+)\.\s*(.+?)(?=\d+\.|$)/gis,
            /\((\d+)\)\s*(.+?)(?=\(\d+\)|$)/gis
        ];

        // Answer patterns
        this.answerPatterns = [
            /תשובה[:\s]+(.+?)(?=\n|$)/gi,
            /תשובות[:\s]+(.+?)(?=\n|$)/gi,
            /פתרון[:\s]+(.+?)(?=\n|$)/gi
        ];

        // Math patterns
        this.mathPatterns = {
            equation: /[xy]\s*[=+\-*/]\s*\d+/gi,
            integral: /∫.+?dx/gi,
            derivative: /\d*x\^?\d*/gi,
            fraction: /\d+\/\d+/gi
        };
    }

    // Parse PDF to text
    async parsePdf(pdfPath) {
        try {
            console.log(`📄 Parsing PDF: ${pdfPath}`);

            if (!fs.existsSync(pdfPath)) {
                throw new Error(`PDF file not found: ${pdfPath}`);
            }

            const dataBuffer = fs.readFileSync(pdfPath);
            const data = await pdfParse(dataBuffer);

            console.log(`   ✅ Extracted ${data.numpages} pages`);
            console.log(`   📝 Text length: ${data.text.length} characters`);

            return {
                success: true,
                text: data.text,
                pages: data.numpages,
                info: data.info
            };

        } catch (error) {
            console.error('❌ PDF parse error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Extract questions from text
    extractQuestions(text, sourceMetadata) {
        console.log('🔍 Extracting questions from text...');

        const questions = [];
        let questionNumber = 1;

        // Try each pattern
        for (const pattern of this.questionPatterns) {
            const matches = [...text.matchAll(pattern)];

            if (matches.length > 0) {
                console.log(`   Found ${matches.length} questions with pattern`);

                for (const match of matches) {
                    const questionText = match[2]?.trim();

                    if (questionText && questionText.length > 20) {
                        // Extract answer if embedded
                        const answerMatch = this.extractAnswer(questionText);

                        // Classify question type
                        const questionType = this.classifyQuestion(questionText);

                        // Extract math content
                        const mathContent = this.extractMathContent(questionText);

                        questions.push({
                            number: questionNumber++,
                            question: questionText,
                            answer: answerMatch?.answer || null,
                            type: questionType,
                            mathContent: mathContent,
                            difficulty: this.estimateDifficulty(questionText),
                            source: sourceMetadata.source || 'RAMA',
                            grade: sourceMetadata.grade || null,
                            year: sourceMetadata.year || null,
                            topic: this.extractTopic(questionText)
                        });
                    }
                }

                // If we found questions, don't try other patterns
                if (questions.length > 0) break;
            }
        }

        console.log(`   ✅ Extracted ${questions.length} questions`);
        return questions;
    }

    // Extract answer from question text
    extractAnswer(text) {
        for (const pattern of this.answerPatterns) {
            const match = text.match(pattern);
            if (match) {
                return {
                    answer: match[1].trim(),
                    hasAnswer: true
                };
            }
        }
        return null;
    }

    // Classify question type
    classifyQuestion(text) {
        const lowerText = text.toLowerCase();

        if (lowerText.includes('אינטגרל') || lowerText.includes('∫')) {
            return 'integral';
        } else if (lowerText.includes('נגזרת') || lowerText.includes('גזירה')) {
            return 'derivative';
        } else if (lowerText.includes('משוואה')) {
            return 'equation';
        } else if (lowerText.includes('גרף') || lowerText.includes('פונקציה')) {
            return 'function';
        } else if (lowerText.includes('גאומטרי') || lowerText.includes('משולש') || lowerText.includes('מעגל')) {
            return 'geometry';
        } else if (lowerText.includes('הסתברות')) {
            return 'probability';
        } else if (lowerText.includes('סטטיסטיקה') || lowerText.includes('ממוצע')) {
            return 'statistics';
        }

        return 'general';
    }

    // Extract mathematical content
    extractMathContent(text) {
        const content = {};

        for (const [type, pattern] of Object.entries(this.mathPatterns)) {
            const matches = text.match(pattern);
            if (matches) {
                content[type] = matches;
            }
        }

        return Object.keys(content).length > 0 ? content : null;
    }

    // Estimate difficulty based on complexity
    estimateDifficulty(text) {
        let score = 0;

        // Length-based
        if (text.length > 200) score += 1;
        if (text.length > 400) score += 1;

        // Complexity indicators
        const complexPatterns = [
            /אינטגרל/i,
            /נגזרת/i,
            /לוגריתם/i,
            /אקספוננציאלי/i,
            /טריגונומטרי/i,
            /∫|∂|∑|∏/
        ];

        complexPatterns.forEach(pattern => {
            if (pattern.test(text)) score += 1;
        });

        // Multi-step indicators
        if (text.includes('א.') && text.includes('ב.')) score += 1;
        if (text.includes('חשב') && text.includes('הוכח')) score += 1;

        // Difficulty mapping
        if (score <= 2) return 'easy';
        if (score <= 4) return 'medium';
        return 'hard';
    }

    // Extract topic from question
    extractTopic(text) {
        const topics = {
            'אלגברה': ['משוואה', 'ביטוי', 'פתרון'],
            'גאומטריה': ['משולש', 'מעגל', 'ריבוע', 'שטח', 'היקף'],
            'חשבון אינפיניטסימלי': ['נגזרת', 'אינטגרל', 'גבול', 'טור'],
            'טריגונומטריה': ['סינוס', 'קוסינוס', 'טנגנס', 'sin', 'cos'],
            'סטטיסטיקה': ['ממוצע', 'חציון', 'סטיית תקן', 'התפלגות'],
            'הסתברות': ['הסתברות', 'אירוע', 'משתנה אקראי']
        };

        const lowerText = text.toLowerCase();

        for (const [topic, keywords] of Object.entries(topics)) {
            if (keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
                return topic;
            }
        }

        return 'כללי';
    }

    // Convert to Nexon question format
    convertToNexonFormat(israeliQuestion) {
        return {
            question: israeliQuestion.question,
            correctAnswer: israeliQuestion.answer || 'לא צוין',

            // Map to your existing fields
            topic: this.mapToNexonTopic(israeliQuestion.topic),
            subtopic: israeliQuestion.type,
            difficulty: israeliQuestion.difficulty,

            // Metadata
            source: 'israeli_education',
            sourceDetails: {
                originalSource: israeliQuestion.source,
                grade: israeliQuestion.grade,
                year: israeliQuestion.year,
                questionNumber: israeliQuestion.number
            },

            // Generate hints (basic for now)
            hints: this.generateHints(israeliQuestion),

            // Generate explanation (basic for now)
            explanation: `שאלה מתוך ${israeliQuestion.source} לכיתה ${israeliQuestion.grade || '?'}`,

            // Israeli curriculum metadata
            israeliMetadata: {
                reformYear: israeliQuestion.year >= 2024 ? 'תשפ"ה' : 'קודם לרפורמה',
                examType: israeliQuestion.source === 'RAMA' ? 'מיצ"ב' : 'אחר'
            }
        };
    }

    // Map Israeli topic to Nexon topic structure
    mapToNexonTopic(israeliTopic) {
        const mapping = {
            'אלגברה': 'algebra',
            'גאומטריה': 'geometry',
            'חשבון אינפיניטסימלי': 'calculus',
            'טריגונומטריה': 'trigonometry',
            'סטטיסטיקה': 'statistics',
            'הסתברות': 'probability',
            'כללי': 'general'
        };

        return mapping[israeliTopic] || 'general';
    }

    // Generate basic hints
    generateHints(question) {
        const hints = [
            'קרא את השאלה בעיון וזהה את הנתונים',
            'חשוב על הנוסחאות או השיטות הרלוונטיות'
        ];

        // Add type-specific hint
        if (question.type === 'integral') {
            hints.push('זכור את כללי האינטגרציה הבסיסיים');
        } else if (question.type === 'geometry') {
            hints.push('שרטט את הצורה ורשום את הנתונים');
        } else if (question.type === 'equation') {
            hints.push('נסה לבודד את המשתנה באחד האגפים');
        }

        return hints;
    }

    // Save questions to database
    async saveToDatabase(questions) {
        console.log(`💾 Saving ${questions.length} questions to database...`);

        let saved = 0;
        let skipped = 0;

        for (const q of questions) {
            try {
                // Convert to Nexon format
                const nexonQuestion = this.convertToNexonFormat(q);

                // Check if already exists
                const existing = await pool.query(
                    'SELECT id FROM question_cache WHERE question = $1',
                    [nexonQuestion.question]
                );

                if (existing.rows.length > 0) {
                    skipped++;
                    continue;
                }

                // Insert into database
                await pool.query(`
                    INSERT INTO question_cache (
                        question, correct_answer, topic, subtopic, difficulty,
                        hints, explanation, source, metadata, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                `, [
                    nexonQuestion.question,
                    nexonQuestion.correctAnswer,
                    nexonQuestion.topic,
                    nexonQuestion.subtopic,
                    nexonQuestion.difficulty,
                    JSON.stringify(nexonQuestion.hints),
                    nexonQuestion.explanation,
                    nexonQuestion.source,
                    JSON.stringify(nexonQuestion.sourceDetails)
                ]);

                saved++;

            } catch (error) {
                console.error(`   ❌ Failed to save question:`, error.message);
            }
        }

        console.log(`   ✅ Saved: ${saved}`);
        console.log(`   ⏭️  Skipped (duplicates): ${skipped}`);

        return { saved, skipped };
    }

    // Complete pipeline: PDF → Questions → Database
    async processPdf(pdfPath, sourceMetadata) {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🇮🇱 PROCESSING ISRAELI EXAM PDF');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Step 1: Parse PDF
        const parseResult = await this.parsePdf(pdfPath);
        if (!parseResult.success) {
            return { success: false, error: parseResult.error };
        }

        // Step 2: Extract questions
        const questions = this.extractQuestions(parseResult.text, sourceMetadata);
        if (questions.length === 0) {
            return { success: false, error: 'No questions extracted' };
        }

        // Step 3: Save to database
        const saveResult = await this.saveToDatabase(questions);

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ PROCESSING COMPLETE');
        console.log(`📝 Extracted: ${questions.length} questions`);
        console.log(`💾 Saved: ${saveResult.saved} questions`);
        console.log(`⏭️  Skipped: ${saveResult.skipped} duplicates`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        return {
            success: true,
            extracted: questions.length,
            saved: saveResult.saved,
            skipped: saveResult.skipped,
            questions: questions
        };
    }
}

export default new IsraeliQuestionParser();