// server/services/israeliSourcesProcessor.js - WITH CORRECT MODEL
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

    safeParseJSON(text) {
        try { return JSON.parse(text); } catch (e) { }
        try {
            const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
        } catch (e) { }
        try {
            let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            const jsonMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
        } catch (e) { }
        try {
            if (text.includes('[') && !text.trim().endsWith(']')) {
                let attempt = text.trim();
                const lastComma = attempt.lastIndexOf(',');
                if (lastComma > 0) {
                    attempt = attempt.substring(0, lastComma) + ']';
                    return JSON.parse(attempt);
                }
            }
        } catch (e) { }
        console.error('   ⚠️ All JSON parsing strategies failed');
        return null;
    }

    async extractQuestionsWithClaude(source, maxQuestions) {
        const content = source.content || '';
        const contentPreview = content.substring(0, 15000);
        const targetGrade = source.grade_level || null;

        const prompt = `אתה מומחה לחילוץ שאלות מתמטיקה ממקורות ישראליים.

חלץ עד ${maxQuestions} שאלות **קיימות** מהתוכן הבא:

${contentPreview}

החזר JSON array בלבד:
[
  {
    "question": "השאלה",
    "correctAnswer": "תשובה",
    "explanation": "הסבר",
    "hints": ["רמז"],
    "solution_steps": ["שלב"],
    "topic": "נושא",
    "subtopic": "תת-נושא",
    "grade": ${targetGrade || 8},
    "difficulty": "medium",
    "keywords": ["מילה"]
  }
]`;

        try {
            const response = await anthropic.messages.create({
                model: 'claude-sonnet-4-20241022',  // ✅ CORRECT MODEL!
                max_tokens: 4000,
                messages: [{ role: 'user', content: prompt }]
            });

            const responseText = response.content[0].text;
            console.log(`   📤 Claude response: ${responseText.length} chars`);

            const questions = this.safeParseJSON(responseText);
            if (!questions || !Array.isArray(questions)) {
                console.log('   ⚠️ No questions found');
                return [];
            }

            return questions
                .filter(q => q.question && q.difficulty)
                .map(q => this.normalizeExtractedQuestion(q, source, false));
        } catch (error) {
            console.error('   ❌ Claude extraction error:', error.message);
            return [];
        }
    }

    async generateQuestionsFromCurriculum(source, targetCount) {
        const content = source.content || '';
        const contentPreview = content.substring(0, 15000);
        const targetGrade = source.grade_level || 8;

        const prompt = `צור ${targetCount} שאלות מתמטיקה חדשות לכיתה ${targetGrade} בהתבסס על:

${contentPreview}

החזר JSON array בלבד:
[
  {
    "question": "שאלה",
    "correctAnswer": "תשובה",
    "explanation": "הסבר",
    "hints": ["רמז 1", "רמז 2"],
    "solution_steps": ["שלב 1", "שלב 2"],
    "topic": "נושא",
    "subtopic": "תת-נושא",
    "grade": ${targetGrade},
    "difficulty": "medium",
    "keywords": ["מילה 1", "מילה 2"]
  }
]`;

        try {
            const response = await anthropic.messages.create({
                model: 'claude-sonnet-4-20241022',  // ✅ CORRECT MODEL!
                max_tokens: 8000,
                temperature: 0.8,
                messages: [{ role: 'user', content: prompt }]
            });

            const responseText = response.content[0].text;
            console.log(`   📤 Claude response: ${responseText.length} chars`);

            const questions = this.safeParseJSON(responseText);
            if (!questions || !Array.isArray(questions)) {
                console.log('   ⚠️ Generation failed');
                return [];
            }

            console.log(`   ✅ Parsed ${questions.length} questions`);
            return questions
                .filter(q => q.question && q.correctAnswer && q.difficulty)
                .map(q => this.normalizeExtractedQuestion(q, source, true));
        } catch (error) {
            console.error('   ❌ Claude generation error:', error.message);
            return [];
        }
    }

    normalizeExtractedQuestion(rawQuestion, source, isGenerated = false) {
        const finalGrade = source.grade_level || rawQuestion.grade || 8;
        return {
            question: rawQuestion.question.trim(),
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
            questionData.question, 'open_ended', questionData.topic, questionData.subtopic || null,
            questionData.grade, questionData.difficulty, questionData.correctAnswer, JSON.stringify([]),
            questionData.explanation, JSON.stringify(questionData.solution_steps || []),
            JSON.stringify(questionData.hints || []), 'israeli_source', 'apply', questionData.keywords || [],
            ['nexon'], isGenerated ? 65 : 70, false, true,
            JSON.stringify({
                sourceId: source.id, sourceTitle: source.title, sourceType: source.source_type,
                sourceUrl: source.source_url, sourceGrade: source.grade_level,
                extractedAt: new Date().toISOString(), isGenerated: isGenerated,
                generationMethod: isGenerated ? 'claude_curriculum_based' : 'claude_extraction'
            })
        ]);
        return result.rows[0].id;
    }
}

export default new IsraeliSourcesProcessor();