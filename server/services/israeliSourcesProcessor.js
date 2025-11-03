// server/services/israeliSourcesProcessor.js - FULLY FIXED VERSION
import Anthropic from '@anthropic-ai/sdk';
import pool from '../config/database.js';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

class IsraeliSourcesProcessor {
    async processAllSources(options = {}) {
        const { sourceIds, maxQuestionsPerSource = 30, generateExtra = true } = options;
        console.log('🔍 Starting Israeli sources processing...');

        try {
            let query = `SELECT * FROM israeli_sources WHERE status = 'active'`;
            const params = [];
            if (sourceIds && sourceIds.length > 0) {
                query += ` AND id = ANY($1)`;
                params.push(sourceIds);
            }
            query += ` ORDER BY last_scraped_at NULLS FIRST LIMIT 10`;

            const result = await pool.query(query, params);
            const sources = result.rows;
            console.log(`📚 Found ${sources.length} sources to process`);

            const results = {
                totalSources: sources.length,
                totalQuestionsExtracted: 0,
                totalQuestionsGenerated: 0,
                totalQuestionsSaved: 0,
                sourceResults: []
            };

            for (const source of sources) {
                try {
                    console.log(`\n📖 Processing: ${source.title}`);
                    if (source.grade_level) console.log(`   🎓 Target Grade: ${source.grade_level}`);

                    const sourceResult = await this.processSource(source, maxQuestionsPerSource, generateExtra);
                    results.sourceResults.push(sourceResult);
                    results.totalQuestionsExtracted += sourceResult.questionsExtracted;
                    results.totalQuestionsGenerated += sourceResult.questionsGenerated || 0;
                    results.totalQuestionsSaved += sourceResult.questionsSaved;

                    await pool.query('UPDATE israeli_sources SET last_scraped_at = CURRENT_TIMESTAMP WHERE id = $1', [source.id]);
                } catch (error) {
                    console.error(`❌ Error processing source ${source.id}:`, error);
                    results.sourceResults.push({
                        sourceId: source.id,
                        title: source.title,
                        questionsExtracted: 0,
                        questionsGenerated: 0,
                        questionsSaved: 0,
                        success: false,
                        error: error.message
                    });
                }
            }

            console.log('\n✅ Processing complete!');
            console.log(`📊 Total extracted: ${results.totalQuestionsExtracted}`);
            console.log(`🎨 Total generated: ${results.totalQuestionsGenerated}`);
            console.log(`💾 Total saved: ${results.totalQuestionsSaved}`);
            return results;
        } catch (error) {
            console.error('❌ Processing error:', error);
            throw error;
        }
    }

    async processSource(source, maxQuestions, generateExtra) {
        const result = {
            sourceId: source.id,
            title: source.title,
            sourceType: source.source_type,
            targetGrade: source.grade_level || 'auto-detect',
            questionsExtracted: 0,
            questionsGenerated: 0,
            questionsSaved: 0,
            duplicatesSkipped: 0,
            success: true
        };

        try {
            console.log(`   📝 Step 1: Extracting existing questions...`);
            const extractedQuestions = await this.extractQuestionsWithClaude(source, maxQuestions);
            console.log(`   ✅ Extracted ${extractedQuestions.length} existing questions`);
            result.questionsExtracted = extractedQuestions.length;

            let generatedQuestions = [];
            if (generateExtra) {
                console.log(`   🎨 Step 2: Generating additional questions...`);
                const targetCount = Math.max(maxQuestions - extractedQuestions.length, 10);
                generatedQuestions = await this.generateQuestionsFromCurriculum(source, targetCount);
                console.log(`   ✅ Generated ${generatedQuestions.length} new questions`);
                result.questionsGenerated = generatedQuestions.length;
            }

            const allQuestions = [...extractedQuestions, ...generatedQuestions];
            console.log(`   💾 Saving ${allQuestions.length} total questions...`);

            for (const questionData of allQuestions) {
                try {
                    const dupCheck = await pool.query('SELECT id FROM question_bank WHERE question_text = $1', [questionData.question]);
                    if (dupCheck.rows.length > 0) {
                        result.duplicatesSkipped++;
                        continue;
                    }
                    await this.saveNormalizedQuestion(questionData, source, questionData.isGenerated || false);
                    result.questionsSaved++;
                } catch (saveError) {
                    console.error('   ⚠️ Failed to save question:', saveError.message);
                }
            }

            console.log(`   ✅ Saved ${result.questionsSaved} new questions`);
            if (result.duplicatesSkipped > 0) {
                console.log(`   ℹ️ Skipped ${result.duplicatesSkipped} duplicates`);
            }
        } catch (error) {
            result.success = false;
            result.error = error.message;
            console.error(`   ❌ Processing failed:`, error.message);
        }
        return result;
    }

    // ✅ IMPROVED JSON PARSING - 8 STRATEGIES!
    safeParseJSON(text) {
        console.log(`   🔍 Parsing JSON from ${text.length} chars...`);

        // Strategy 1: Direct parse
        try {
            const parsed = JSON.parse(text);
            console.log('   ✅ Strategy 1: Direct parse succeeded');
            return parsed;
        } catch (e) {
            console.log('   ⚠️ Strategy 1 failed');
        }

        // Strategy 2: Remove markdown code blocks
        try {
            const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            const parsed = JSON.parse(cleaned);
            console.log('   ✅ Strategy 2: Markdown removal succeeded');
            return parsed;
        } catch (e) {
            console.log('   ⚠️ Strategy 2 failed');
        }

        // Strategy 3: Extract array with regex
        try {
            const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (arrayMatch) {
                const parsed = JSON.parse(arrayMatch[0]);
                console.log('   ✅ Strategy 3: Array regex succeeded');
                return parsed;
            }
        } catch (e) {
            console.log('   ⚠️ Strategy 3 failed');
        }

        // Strategy 4: Find first [ to last ]
        try {
            const firstBracket = text.indexOf('[');
            const lastBracket = text.lastIndexOf(']');
            if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
                const jsonStr = text.substring(firstBracket, lastBracket + 1);
                const parsed = JSON.parse(jsonStr);
                console.log('   ✅ Strategy 4: Bracket extraction succeeded');
                return parsed;
            }
        } catch (e) {
            console.log('   ⚠️ Strategy 4 failed');
        }

        // Strategy 5: Find first { to last }
        try {
            const firstBrace = text.indexOf('{');
            const lastBrace = text.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                const jsonStr = text.substring(firstBrace, lastBrace + 1);
                const parsed = JSON.parse(jsonStr);
                console.log('   ✅ Strategy 5: Brace extraction succeeded');
                return parsed;
            }
        } catch (e) {
            console.log('   ⚠️ Strategy 5 failed');
        }

        // Strategy 6: Fix incomplete JSON (missing closing bracket)
        try {
            if (text.includes('[') && !text.trim().endsWith(']')) {
                let attempt = text.trim();
                const lastComma = attempt.lastIndexOf(',');
                if (lastComma > 0) {
                    attempt = attempt.substring(0, lastComma) + ']';
                    const parsed = JSON.parse(attempt);
                    console.log('   ✅ Strategy 6: Incomplete JSON fix succeeded');
                    return parsed;
                }
            }
        } catch (e) {
            console.log('   ⚠️ Strategy 6 failed');
        }

        // Strategy 7: Extract between specific markers
        try {
            const lines = text.split('\n');
            let jsonStart = -1;
            let jsonEnd = -1;

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim().startsWith('[')) jsonStart = i;
                if (lines[i].trim().endsWith(']')) jsonEnd = i;
            }

            if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd >= jsonStart) {
                const jsonStr = lines.slice(jsonStart, jsonEnd + 1).join('\n');
                const parsed = JSON.parse(jsonStr);
                console.log('   ✅ Strategy 7: Line-by-line extraction succeeded');
                return parsed;
            }
        } catch (e) {
            console.log('   ⚠️ Strategy 7 failed');
        }

        // Strategy 8: Aggressive cleanup and retry
        try {
            let cleaned = text
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .replace(/^\s+/gm, '')
                .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control chars
                .trim();

            // Find array
            const match = cleaned.match(/\[[\s\S]*\]/);
            if (match) {
                const parsed = JSON.parse(match[0]);
                console.log('   ✅ Strategy 8: Aggressive cleanup succeeded');
                return parsed;
            }
        } catch (e) {
            console.log('   ⚠️ Strategy 8 failed');
        }

        // All failed - log for debugging
        console.error('   ❌ All JSON parsing strategies failed');
        console.error('   📄 First 500 chars:', text.substring(0, 500));
        console.error('   📄 Last 500 chars:', text.substring(Math.max(0, text.length - 500)));

        return null;
    }

    async extractQuestionsWithClaude(source, maxQuestions) {
        const content = source.content || '';
        const contentPreview = content.substring(0, 15000);
        const targetGrade = source.grade_level || null;

        const prompt = `אתה מומחה לחילוץ שאלות מתמטיקה ממקורות ישראליים.

חלץ עד ${maxQuestions} שאלות **קיימות** מהתוכן הבא. אם אין שאלות מפורשות, צור שאלות מתאימות מהתוכן.

${contentPreview}

חשוב: החזר **רק** JSON array, ללא טקסט נוסף לפני או אחרי!

[
  {
    "question": "השאלה המלאה",
    "correctAnswer": "התשובה הנכונה",
    "explanation": "הסבר קצר",
    "hints": ["רמז 1"],
    "solution_steps": ["שלב פתרון 1"],
    "topic": "אלגברה/גיאומטריה/וכו",
    "subtopic": "תת-נושא",
    "grade": ${targetGrade || 8},
    "difficulty": "easy/medium/hard",
    "keywords": ["מילת מפתח"]
  }
]`;

        try {
            const response = await anthropic.messages.create({
                model: 'claude-sonnet-4-5-20250929',
                max_tokens: 10000,
                messages: [{ role: 'user', content: prompt }]
            });

            const responseText = response.content[0].text;
            console.log(`   📤 Claude response: ${responseText.length} chars`);

            const questions = this.safeParseJSON(responseText);

            if (!questions) {
                console.log('   ⚠️ No questions found');
                return [];
            }

            if (!Array.isArray(questions)) {
                console.log('   ⚠️ Response is not an array');
                return [];
            }

            console.log(`   ✅ Parsed ${questions.length} questions successfully`);

            return questions
                .filter(q => q.question && q.difficulty)
                .map(q => this.normalizeExtractedQuestion(q, source, false));
        } catch (error) {
            console.error('   ❌ Claude extraction error:', error.response?.status || error.message);
            return [];
        }
    }

    async generateQuestionsFromCurriculum(source, targetCount) {
        const content = source.content || '';
        const contentPreview = content.substring(0, 15000);
        const targetGrade = source.grade_level || 8;

        const prompt = `צור ${targetCount} שאלות מתמטיקה **חדשות** לכיתה ${targetGrade} בהתבסס על התוכן הבא:

${contentPreview}

חשוב: החזר **רק** JSON array, ללא טקסט נוסף!

[
  {
    "question": "שאלה מלאה ומפורטת",
    "correctAnswer": "תשובה נכונה",
    "explanation": "הסבר מפורט",
    "hints": ["רמז 1", "רמז 2"],
    "solution_steps": ["שלב 1", "שלב 2"],
    "topic": "נושא ראשי",
    "subtopic": "תת-נושא",
    "grade": ${targetGrade},
    "difficulty": "easy/medium/hard",
    "keywords": ["מילה 1", "מילה 2"]
  }
]`;

        try {
            const response = await anthropic.messages.create({
                model: 'claude-sonnet-4-5-20250929',
                max_tokens: 12000,
                temperature: 0.8,
                messages: [{ role: 'user', content: prompt }]
            });

            const responseText = response.content[0].text;
            console.log(`   📤 Claude response: ${responseText.length} chars`);

            const questions = this.safeParseJSON(responseText);

            if (!questions) {
                console.log('   ⚠️ Generation failed - no valid JSON');
                return [];
            }

            if (!Array.isArray(questions)) {
                console.log('   ⚠️ Generation failed - not an array');
                return [];
            }

            console.log(`   ✅ Generated ${questions.length} questions successfully`);

            return questions
                .filter(q => q.question && q.correctAnswer && q.difficulty)
                .map(q => this.normalizeExtractedQuestion(q, source, true));
        } catch (error) {
            console.error('   ❌ Claude generation error:', error.response?.status || error.message);
            return [];
        }
    }

    normalizeExtractedQuestion(rawQuestion, source, isGenerated = false) {
        const finalGrade = source.grade_level || rawQuestion.grade || 8;
        return {
            question: (rawQuestion.question || '').trim(),
            correctAnswer: (rawQuestion.correctAnswer || '').trim(),
            explanation: rawQuestion.explanation || '',
            hints: Array.isArray(rawQuestion.hints) ? rawQuestion.hints : [],
            solution_steps: Array.isArray(rawQuestion.solution_steps) ? rawQuestion.solution_steps : [],
            topic: rawQuestion.topic || 'כללי',
            subtopic: rawQuestion.subtopic || '',
            grade: finalGrade,
            difficulty: rawQuestion.difficulty || 'medium',
            keywords: Array.isArray(rawQuestion.keywords) ? rawQuestion.keywords : [],
            isGenerated: isGenerated
        };
    }

    async saveNormalizedQuestion(questionData, source, isGenerated) {
        const query = `INSERT INTO question_bank (
            question_text, question_type, topic, subtopic, grade_level, difficulty,
            correct_answer, wrong_answers, explanation, solution_steps, hints, source,
            cognitive_level, keywords, suitable_for_personalities, quality_score,
            is_verified, is_active, source_metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                           RETURNING id`;

        const result = await pool.query(query, [
            questionData.question,
            'open_ended',
            questionData.topic,
            questionData.subtopic || null,
            questionData.grade,
            questionData.difficulty,
            questionData.correctAnswer,
            JSON.stringify([]),
            questionData.explanation,
            JSON.stringify(questionData.solution_steps || []),
            JSON.stringify(questionData.hints || []),
            'israeli_source',
            'apply',
            questionData.keywords || [],
            ['nexon'],
            isGenerated ? 65 : 70,
            false,
            true,
            JSON.stringify({
                sourceId: source.id,
                sourceTitle: source.title,
                sourceType: source.source_type,
                sourceUrl: source.source_url,
                sourceGrade: source.grade_level,
                extractedAt: new Date().toISOString(),
                isGenerated: isGenerated,
                generationMethod: isGenerated ? 'claude_curriculum_based' : 'claude_extraction'
            })
        ]);

        return result.rows[0].id;
    }
}

export default new IsraeliSourcesProcessor();