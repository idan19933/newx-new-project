// server/services/enhancedVisionProcessor.js
// Enhanced vision processing with equations, diagrams, and images

import Anthropic from '@anthropic-ai/sdk';
import pool from '../config/database.js';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * Enhanced extraction prompt for mathematical content
 */
const createEnhancedPrompt = (examMetadata) => `
אני שולח לך תמונה של מבחן מתמטיקה ישראלי.
רמת לימוד: כיתה ${examMetadata.gradeLevel}, ${examMetadata.units || 5} יחידות לימוד.

**חלץ בקפידה:**

## 1️⃣ שאלות:
- טקסט מלא של כל שאלה (כולל כל הסעיפים)
- נושא ותת-נושא
- רמת קושי (easy/medium/hard)

## 2️⃣ משוואות מתמטיות:
עבור כל משוואה, חלץ בפורמט LaTeX:
- f(x) = x^2 - 12x + 32 → "f(x) = x^2 - 12x + 32"
- g(x) = x + 2 → "g(x) = x + 2"
- \\frac{a}{b} → "\\\\frac{a}{b}"

## 3️⃣ גרפים ותרשימים:
- זהה אם יש גרף/תרשים (true/false)
- תאר את הגרף במילים
- חלץ נקודות מיוחדות (A, B, C וכו')

---

**החזר JSON:**

{
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "טקסט השאלה המלא בעברית",
      "topic": "אלגברה",
      "subtopic": "פונקציות ריבועיות",
      "difficulty": "medium",
      
      "equations": [
        {
          "latex": "f(x) = x^2 - 12x + 32",
          "description": "משוואת הפרבולה"
        }
      ],
      
      "hasDiagram": true,
      "diagramDescription": "גרף של פרבולה החותכת את ציר x בנקודות A ו-B",
      
      "hints": ["רמז 1", "רמז 2", "רמז 3"]
    }
  ]
}

**חשוב:**
- שמור על עברית תקנית
- חלץ כל המשוואות בפורמט LaTeX
- תאר בדיוק את הגרפים
- זהה נקודות מיוחדות (A, B, C)
`;

/**
 * Process exam image with enhanced extraction
 */
async function processExamImageEnhanced(imageBuffer, examMetadata) {
    try {
        console.log('🤖 Enhanced vision processing...');

        const base64Image = imageBuffer.toString('base64');

        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8000,
            messages: [{
                role: 'user',
                content: [
                    {
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: 'image/jpeg',
                            data: base64Image
                        }
                    },
                    {
                        type: 'text',
                        text: createEnhancedPrompt(examMetadata)
                    }
                ]
            }]
        });

        const responseText = message.content[0].text;

        // Extract JSON from response
        let extractedData;
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                extractedData = JSON.parse(jsonMatch[0]);
            } else {
                extractedData = JSON.parse(responseText);
            }
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.log('Raw response:', responseText);
            throw new Error('Failed to parse AI response');
        }

        const questions = extractedData.questions || [];
        const totalEquations = questions.reduce((sum, q) => sum + (q.equations?.length || 0), 0);
        const totalDiagrams = questions.filter(q => q.hasDiagram).length;

        console.log(`✅ Enhanced: ${questions.length} questions, ${totalEquations} equations, ${totalDiagrams} diagrams`);

        return {
            success: true,
            questions,
            totalEquations,
            totalDiagrams,
            containsDiagrams: totalDiagrams > 0,
            metadata: {
                extractedAt: new Date().toISOString(),
                model: 'claude-sonnet-4-20250514',
                enhanced: true
            }
        };

    } catch (error) {
        console.error('❌ Enhanced processing error:', error);
        throw error;
    }
}

/**
 * Save enhanced questions to database
 */
async function saveEnhancedQuestions(questions, uploadId, examMetadata) {
    try {
        console.log(`💾 Saving ${questions.length} enhanced questions...`);

        let savedCount = 0;
        const questionIds = [];

        for (const q of questions) {
            const result = await pool.query(
                `INSERT INTO question_bank (
                    question_text,
                    topic,
                    subtopic,
                    difficulty,
                    correct_answer,
                    explanation,
                    hints,
                    solution_steps,
                    has_image,
                    equations,
                    has_diagrams,
                    diagram_description,
                    raw_math_content,
                    metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING id`,
                [
                    q.questionText,
                    q.topic,
                    q.subtopic,
                    q.difficulty || 'medium',
                    q.correctAnswer || null,
                    q.explanation || null,
                    JSON.stringify(q.hints || []),
                    JSON.stringify(q.solutionSteps || []),
                    q.hasDiagram || false,
                    JSON.stringify(q.equations || []),
                    q.hasDiagram || false,
                    q.diagramDescription || null,
                    JSON.stringify(q),
                    JSON.stringify({
                        uploadId: uploadId.toString(),
                        questionNumber: q.questionNumber,
                        ...examMetadata
                    })
                ]
            );

            questionIds.push(result.rows[0].id);
            savedCount++;
        }

        console.log(`✅ Saved ${savedCount} enhanced questions`);

        return {
            success: true,
            savedCount,
            questionIds
        };

    } catch (error) {
        console.error('❌ Save enhanced questions error:', error);
        throw error;
    }
}

/**
 * Extract solutions from solution page
 */
async function extractSolutions(imageBuffer, examGroupId) {
    try {
        console.log(`🔍 Extracting solutions for group: ${examGroupId}...`);

        const base64Image = imageBuffer.toString('base64');

        const prompt = `
אני שולח לך תמונה של עמוד פתרונות למבחן מתמטיקה.
חלץ את כל הפתרונות מהתמונה.

עבור כל פתרון:
1. מספר השאלה
2. הפתרון המלא (שלב אחר שלב)
3. התשובה הסופית

החזר JSON:
[
  {
    "questionNumber": 1,
    "fullSolution": "פתרון מפורט...",
    "finalAnswer": "42"
  }
]
`;

        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            messages: [{
                role: 'user',
                content: [
                    {
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: 'image/jpeg',
                            data: base64Image
                        }
                    },
                    {
                        type: 'text',
                        text: prompt
                    }
                ]
            }]
        });

        const responseText = message.content[0].text;
        const solutions = JSON.parse(responseText);

        // Match solutions to questions
        let matchedCount = 0;
        for (const solution of solutions) {
            const result = await pool.query(`
                SELECT q.id 
                FROM question_bank q
                JOIN exam_uploads e ON q.metadata->>'uploadId' = e.id::text
                WHERE e.exam_group_id = $1
                AND q.question_text LIKE $2
                LIMIT 1
            `, [examGroupId, `%${solution.questionNumber}%`]);

            if (result.rows.length > 0) {
                const questionId = result.rows[0].id;

                await pool.query(`
                    UPDATE question_bank
                    SET 
                        full_solution = $1,
                        correct_answer = $2,
                        has_solution = true
                    WHERE id = $3
                `, [solution.fullSolution, solution.finalAnswer, questionId]);

                matchedCount++;
                console.log(`✅ Matched solution for question #${solution.questionNumber}`);
            }
        }

        console.log(`✅ Processed ${solutions.length} solutions, matched ${matchedCount}`);

        return {
            success: true,
            extractedCount: solutions.length,
            matchedCount
        };

    } catch (error) {
        console.error('❌ Solution extraction error:', error);
        throw error;
    }
}

export default {
    processExamImageEnhanced,
    saveEnhancedQuestions,
    extractSolutions
};