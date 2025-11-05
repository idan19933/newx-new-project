// Backend: services/enhancedExamExtractor.js
// Enhanced exam extraction with equations, diagrams, and images

const Anthropic = require('@anthropic-ai/sdk');
const admin = require('firebase-admin');
const sharp = require('sharp'); // For image processing
const axios = require('axios');

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * Enhanced extraction prompt for Claude
 * Detects: equations, diagrams, images, and structured content
 */
const ENHANCED_EXTRACTION_PROMPT = (exam) => `
אני שולח לך תמונה של מבחן מתמטיקה ישראלי.
רמת לימוד: כיתה ${exam.grade_level}, ${exam.units} יחידות לימוד.

**חשוב מאוד:** חלץ את כל המידע הבא בקפידה:

## 1️⃣ שאלות:
- טקסט מלא של כל שאלה (כולל כל הסעיפים)
- נושא ותת-נושא
- רמת קושי

## 2️⃣ משוואות מתמטיות:
עבור כל משוואה בשאלה, חלץ אותה בפורמט LaTeX.
דוגמאות:
- f(x) = x^2 - 12x + 32 → "f(x) = x^2 - 12x + 32"
- g(x) = x + 2 → "g(x) = x + 2"
- \\frac{a}{b} → "\\frac{a}{b}"

## 3️⃣ גרפים ותרשימים:
זהה אם יש בשאלה:
- גרף של פונקציה (כן/לא)
- תרשים או ציור (כן/לא)
- תאור מילולי של הגרף/תרשים

## 4️⃣ נקודות מיוחדות:
אם יש גרף, חלץ:
- נקודות חיתוך עם צירים (למשל: A, B, C)
- נקודות מקסימום/מינימום
- משוואת הפונקציה אם ניתן

---

**החזר JSON בפורמט הזה:**

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
        },
        {
          "latex": "g(x) = x + 2",
          "description": "משוואת הישר"
        }
      ],
      
      "hasDiagram": true,
      "diagramDescription": "גרף של פרבולה החותכת את ציר x בנקודות A ו-B, וחותכת ישר g(x) בנקודה C",
      
      "points": [
        {"name": "A", "x": "unknown", "y": 0, "description": "נקודת חיתוך עם ציר x"},
        {"name": "B", "x": "unknown", "y": 0, "description": "נקודת חיתוך עם ציר x"},
        {"name": "C", "x": "unknown", "y": "unknown", "description": "נקודת חיתוך בין הפרבולה והישר"}
      ],
      
      "subQuestions": [
        {
          "letter": "א",
          "text": "איזה מין הפונקציות f(x) או g(x), מתארת את הפרבולה?",
          "requiresDiagram": true
        },
        {
          "letter": "ב",
          "text": "מהו אורך הקטע בציור הקטע בצורה הסביבה?",
          "requiresDiagram": true
        }
      ],
      
      "hints": [
        "רמז 1: זהה את הפונקציה הריבועית",
        "רמז 2: השתמש בנקודות החיתוך"
      ]
    }
  ]
}

**חשוב:**
- שמור על עברית תקנית
- חלץ את כל המשוואות בפורמט LaTeX
- תאר בדיוק את הגרפים והתרשימים
- זהה את כל נקודות הציון בגרף (A, B, C וכו')
`;

/**
 * Main extraction function with enhanced AI
 */
async function extractEnhancedExam(uploadId, imageUrl, exam) {
    try {
        console.log(`🤖 Enhanced extraction for exam ${uploadId}...`);

        // Call Claude API with enhanced prompt
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8000,
            messages: [{
                role: 'user',
                content: [
                    {
                        type: 'image',
                        source: {
                            type: 'url',
                            url: imageUrl
                        }
                    },
                    {
                        type: 'text',
                        text: ENHANCED_EXTRACTION_PROMPT(exam)
                    }
                ]
            }]
        });

        const responseText = message.content[0].text;

        // Try to extract JSON from response
        let extractedData;
        try {
            // Remove markdown code blocks if present
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                extractedData = JSON.parse(jsonMatch[0]);
            } else {
                extractedData = JSON.parse(responseText);
            }
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.log('Raw response:', responseText);
            throw new Error('Failed to parse AI response as JSON');
        }

        console.log(`✅ Extracted ${extractedData.questions.length} questions`);

        return extractedData;

    } catch (error) {
        console.error('❌ Enhanced extraction error:', error);
        throw error;
    }
}

/**
 * Save questions with equations and diagrams to database
 */
async function saveEnhancedQuestions(pool, uploadId, extractedData) {
    try {
        let savedCount = 0;

        for (const q of extractedData.questions) {
            // Insert question
            const result = await pool.query(`
                INSERT INTO questions (
                    exam_upload_id,
                    question_text,
                    topic,
                    subtopic,
                    difficulty,
                    has_image,
                    hints,
                    equations,
                    has_diagrams,
                    diagram_description,
                    raw_math_content
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING id
            `, [
                uploadId,
                q.questionText,
                q.topic,
                q.subtopic,
                q.difficulty,
                q.hasDiagram || false,
                JSON.stringify(q.hints || []),
                JSON.stringify(q.equations || []),
                q.hasDiagram || false,
                q.diagramDescription || null,
                JSON.stringify(q.subQuestions || [])
            ]);

            const questionId = result.rows[0].id;
            savedCount++;

            console.log(`✅ Saved question ${q.questionNumber} (ID: ${questionId})`);
        }

        // Update exam stats
        await pool.query(`
            UPDATE exam_uploads 
            SET 
                questions_extracted = $1,
                contains_diagrams = $2,
                processing_metadata = $3
            WHERE id = $4
        `, [
            savedCount,
            extractedData.questions.some(q => q.hasDiagram),
            JSON.stringify({
                totalEquations: extractedData.questions.reduce((sum, q) => sum + (q.equations?.length || 0), 0),
                totalDiagrams: extractedData.questions.filter(q => q.hasDiagram).length,
                extractedAt: new Date().toISOString()
            }),
            uploadId
        ]);

        console.log(`✅ Saved ${savedCount} enhanced questions`);
        return savedCount;

    } catch (error) {
        console.error('❌ Save enhanced questions error:', error);
        throw error;
    }
}

/**
 * Extract diagram/image from original exam image
 * Uses image coordinates to crop specific sections
 */
async function extractDiagramFromImage(imageUrl, questionId, bounds = null) {
    try {
        console.log(`🖼️  Extracting diagram for question ${questionId}...`);

        // Download image
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data);

        // If bounds provided, crop the image
        let processedImage = sharp(imageBuffer);

        if (bounds) {
            processedImage = processedImage.extract({
                left: bounds.x,
                top: bounds.y,
                width: bounds.width,
                height: bounds.height
            });
        }

        // Convert to PNG for best quality
        const outputBuffer = await processedImage.png().toBuffer();

        // Upload to Firebase Storage
        const bucket = admin.storage().bucket();
        const fileName = `diagrams/question_${questionId}_${Date.now()}.png`;
        const file = bucket.file(fileName);

        await file.save(outputBuffer, {
            metadata: {
                contentType: 'image/png',
                metadata: {
                    questionId: questionId.toString(),
                    extractedAt: new Date().toISOString()
                }
            }
        });

        await file.makePublic();
        const diagramUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        console.log(`✅ Diagram extracted: ${diagramUrl}`);
        return diagramUrl;

    } catch (error) {
        console.error('❌ Diagram extraction error:', error);
        return null;
    }
}

/**
 * Full enhanced processing pipeline
 */
async function processExamEnhanced(pool, uploadId, imageUrl, exam) {
    try {
        console.log(`🚀 Starting enhanced processing for exam ${uploadId}...`);

        // Step 1: Extract with AI
        const extractedData = await extractEnhancedExam(uploadId, imageUrl, exam);

        // Step 2: Save to database
        const questionCount = await saveEnhancedQuestions(pool, uploadId, extractedData);

        // Step 3: Mark as completed
        await pool.query(
            'UPDATE exam_uploads SET status = $1, processed_at = NOW() WHERE id = $2',
            ['completed', uploadId]
        );

        console.log(`✅ Enhanced processing complete: ${questionCount} questions`);

        return {
            success: true,
            questionsExtracted: questionCount,
            containsDiagrams: extractedData.questions.some(q => q.hasDiagram)
        };

    } catch (error) {
        console.error(`❌ Enhanced processing error for exam ${uploadId}:`, error);

        await pool.query(
            'UPDATE exam_uploads SET status = $1, error_message = $2 WHERE id = $3',
            ['failed', error.message, uploadId]
        );

        throw error;
    }
}

module.exports = {
    extractEnhancedExam,
    saveEnhancedQuestions,
    extractDiagramFromImage,
    processExamEnhanced
};