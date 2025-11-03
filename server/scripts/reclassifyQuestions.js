// server/scripts/reclassifyQuestions.js
import pool from '../config/database.js';
import QuestionClassifier from '../services/questionClassifier.js';

async function reclassifyAllQuestions() {
    console.log('🔄 Starting reclassification of all questions...\n');

    try {
        // Get all Israeli source questions
        const result = await pool.query(`
            SELECT id, question_text, grade_level, topic, subtopic
            FROM question_bank 
            WHERE source = 'israeli_source' 
            AND is_active = true
        `);

        const questions = result.rows;
        console.log(`📊 Found ${questions.length} questions to reclassify\n`);

        let updated = 0;
        let failed = 0;

        for (const q of questions) {
            try {
                // Classify
                const classification = QuestionClassifier.classifyQuestion(
                    q.question_text,
                    {
                        grade: q.grade_level,
                        topic: q.topic,
                        subtopic: q.subtopic
                    }
                );

                // Update database
                await pool.query(`
                    UPDATE question_bank 
                    SET 
                        grade_level = $1,
                        units = $2,
                        topic = $3,
                        subtopic = $4,
                        difficulty = $5
                    WHERE id = $6
                `, [
                    classification.grade,
                    classification.units,
                    classification.topic,
                    classification.subtopic,
                    classification.difficulty,
                    q.id
                ]);

                updated++;

                if (updated % 50 === 0) {
                    console.log(`   ✅ Processed ${updated}/${questions.length} questions...`);
                }

            } catch (error) {
                console.error(`   ❌ Failed to reclassify question ${q.id}:`, error.message);
                failed++;
            }
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Reclassification complete!');
        console.log(`📊 Updated: ${updated} questions`);
        console.log(`❌ Failed: ${failed} questions`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('💥 Reclassification failed:', error);
    } finally {
        await pool.end();
    }
}

reclassifyAllQuestions();