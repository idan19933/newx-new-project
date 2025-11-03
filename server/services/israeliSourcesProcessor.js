// server/services/israeliSourcesProcessor.js - PROCESS & NORMALIZE SCRAPED QUESTIONS
import Anthropic from '@anthropic-ai/sdk';
import pool from '../config/database.js';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

class IsraeliSourcesProcessor {
    /**
     * Scrape and process questions from all Israeli sources
     */
    async processAllSources(options = {}) {
        const { sourceIds, maxQuestionsPerSource = 30 } = options;

        console.log('🔍 Starting Israeli sources processing...');

        try {
            // Get sources to process
            let query = `
                SELECT * FROM israeli_sources
                WHERE status = 'active'
            `;

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
                totalQuestionsSaved: 0,
                sourceResults: []
            };

            // Process each source
            for (const source of sources) {
                try {
                    console.log(`\n📖 Processing: ${source.title}`);

                    const sourceResult = await this.processSource(source, maxQuestionsPerSource);

                    results.sourceResults.push(sourceResult);
                    results.totalQuestionsExtracted += sourceResult.questionsExtracted;
                    results.totalQuestionsSaved += sourceResult.questionsSaved;

                    // Update last_scraped_at
                    await pool.query(
                        `UPDATE israeli_sources
                         SET last_scraped_at = CURRENT_TIMESTAMP
                         WHERE id = $1`,
                        [source.id]
                    );

                    // Log success
                    await pool.query(
                        `INSERT INTO israeli_sources_log (
                            source_id, action, result, details, created_at
                        ) VALUES ($1, 'process_questions', 'success', $2, CURRENT_TIMESTAMP)`,
                        [source.id, JSON.stringify(sourceResult)]
                    );

                } catch (error) {
                    console.error(`❌ Error processing source ${source.id}:`, error);

                    results.sourceResults.push({
                        sourceId: source.id,
                        title: source.title,
                        questionsExtracted: 0,
                        questionsSaved: 0,
                        success: false,
                        error: error.message
                    });
                }
            }

            console.log('\n✅ Processing complete!');
            console.log(`📊 Total extracted: ${results.totalQuestionsExtracted}`);
            console.log(`💾 Total saved: ${results.totalQuestionsSaved}`);

            return results;

        } catch (error) {
            console.error('❌ Processing error:', error);
            throw error;
        }
    }

    /**
     * Process a single source
     */
    async processSource(source, maxQuestions) {
        const result = {
            sourceId: source.id,
            title: source.title,
            sourceType: source.source_type,
            questionsExtracted: 0,
            questionsSaved: 0,
            duplicatesSkipped: 0,
            success: true
        };

        try {
            // Extract questions using Claude
            const extractedQuestions = await this.extractQuestionsWithClaude(
                source,
                maxQuestions
            );

            console.log(`   📝 Extracted ${extractedQuestions.length} questions`);
            result.questionsExtracted = extractedQuestions.length;

            // Save each question with UNIFIED FORMAT
            for (const questionData of extractedQuestions) {
                try {
                    // Check for duplicates
                    const dupCheck = await pool.query(
                        'SELECT id FROM question_bank WHERE question_text = $1',
                        [questionData.question]
                    );

                    if (dupCheck.rows.length > 0) {
                        result.duplicatesSkipped++;
                        continue;
                    }

                    // Save with UNIFIED FORMAT
                    await this.saveNormalizedQuestion(questionData, source);

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
            console.error(`   ❌ Extraction failed:`, error.message);
        }

        return result;
    }

    /**
     * Extract questions from source using Claude
     */
    async extractQuestionsWithClaude(source, maxQuestions) {
        const content = source.content || '';
        const contentPreview = content.substring(0, 15000);

        const prompt = `אתה מומחה לחילוץ שאלות מתמטיות ממקורות חינוכיים ישראליים.

חלץ עד ${maxQuestions} שאלות תרגול מהמקור הבא:

📚 כותרת: ${source.title}
📁 סוג: ${source.source_type}

תוכן:
${contentPreview}

לכל שאלה, זהה:
1. נוסח השאלה המלא
2. התשובה הנכונה
3. רמת קושי (easy/medium/hard)
4. נושא (אלגברה, גיאומטריה, משוואות, פונקציות, וכו')
5. תת-נושא אם קיים
6. כיתה מתאימה (7-12)
7. הסבר לפתרון
8. רמזים (2-3)
9. צעדי פתרון

החזר **רק** JSON array בפורמט זה (בדיוק!):
[
  {
    "question": "נוסח השאלה המלא",
    "correctAnswer": "התשובה הנכונה המדויקת",
    "explanation": "הסבר מפורט של הפתרון",
    "hints": ["רמז 1", "רמז 2", "רמז 3"],
    "solution_steps": ["שלב 1", "שלב 2", "שלב 3"],
    "topic": "נושא ראשי",
    "subtopic": "תת-נושא (או ריק)",
    "grade": 9,
    "difficulty": "medium",
    "keywords": ["מילת מפתח 1", "מילת מפתח 2"]
  }
]

אם לא ניתן לחלץ שאלות, החזר: []`;

        try {
            const response = await anthropic.messages.create({
                model: 'claude-sonnet-4-5-20250929',
                max_tokens: 4000,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            });

            const responseText = response.content[0].text;

            // Parse JSON
            let cleanedText = responseText.trim()
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '');

            const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                console.log('   ⚠️ No questions found in source');
                return [];
            }

            const questions = JSON.parse(jsonMatch[0]);

            if (!Array.isArray(questions)) {
                console.log('   ⚠️ Invalid response format');
                return [];
            }

            // Validate and clean questions
            return questions
                .filter(q => q.question && q.correctAnswer && q.difficulty)
                .map(q => this.normalizeExtractedQuestion(q));

        } catch (error) {
            console.error('   ❌ Claude extraction error:', error);
            return [];
        }
    }

    /**
     * Normalize extracted question to unified format
     */
    normalizeExtractedQuestion(rawQuestion) {
        return {
            question: rawQuestion.question.trim(),
            correctAnswer: rawQuestion.correctAnswer.trim(),
            explanation: rawQuestion.explanation || '',
            hints: Array.isArray(rawQuestion.hints) ? rawQuestion.hints : [],
            solution_steps: Array.isArray(rawQuestion.solution_steps) ? rawQuestion.solution_steps : [],
            topic: rawQuestion.topic || 'כללי',
            subtopic: rawQuestion.subtopic || '',
            grade: rawQuestion.grade || 9,
            difficulty: rawQuestion.difficulty || 'medium',
            keywords: Array.isArray(rawQuestion.keywords) ? rawQuestion.keywords : []
        };
    }

    /**
     * Save normalized question to question_bank
     */
    async saveNormalizedQuestion(questionData, source) {
        const query = `
            INSERT INTO question_bank (
                question_text,
                question_type,
                topic,
                subtopic,
                grade_level,
                difficulty,
                correct_answer,
                wrong_answers,
                explanation,
                solution_steps,
                hints,
                source,
                cognitive_level,
                keywords,
                suitable_for_personalities,
                quality_score,
                is_verified,
                is_active,
                source_metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                RETURNING id
        `;

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
            70, // Initial quality score
            false, // Needs verification
            true, // Is active
            JSON.stringify({
                sourceId: source.id,
                sourceTitle: source.title,
                sourceType: source.source_type,
                sourceUrl: source.source_url,
                extractedAt: new Date().toISOString()
            })
        ]);

        return result.rows[0].id;
    }
}

export default new IsraeliSourcesProcessor();