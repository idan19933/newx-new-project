// server/services/visionProcessorService.js
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pool from '../config/database.js';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

class VisionProcessorService {
    /**
     * 🎯 עיבוד תמונת מבחן והפקת שאלות
     */
    async processExamImage(imageData, metadata) {
        try {
            console.log('📸 Processing exam image with Claude Vision...');

            const { examTitle, gradeLevel, subject, units, examType } = metadata;

            // המרת התמונה ל-base64
            const imageBase64 = imageData.toString('base64');
            const mediaType = this.detectMediaType(imageData);

            // שלח ל-Claude Vision API
            const response = await anthropic.messages.create({
                model: 'claude-sonnet-4-5-20250929',
                max_tokens: 4096,
                temperature: 0.3,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: mediaType,
                                    data: imageBase64,
                                },
                            },
                            {
                                type: 'text',
                                text: this.buildVisionPrompt(metadata)
                            }
                        ],
                    },
                ],
            });

            console.log('✅ Claude Vision response received');

            // חלץ את התוכן
            const content = response.content[0].text;

            // Parse JSON
            const parsedData = this.parseVisionResponse(content);

            console.log(`📊 Extracted ${parsedData.questions.length} questions from image`);

            return {
                success: true,
                questions: parsedData.questions,
                metadata: parsedData.metadata,
                rawResponse: content
            };

        } catch (error) {
            console.error('❌ Vision processing error:', error);
            throw error;
        }
    }

    /**
     * 📝 בניית פרומפט לחילוץ שאלות מתמונה
     */
    buildVisionPrompt(metadata) {
        const { examTitle, gradeLevel, subject, units, examType } = metadata;

        return `אתה מערכת AI מומחית בחילוץ שאלות מתמטיקה ממבחני בגרות ישראליים.

📋 **פרטי המבחן:**
- כותרת: ${examTitle || 'מבחן מתמטיקה'}
- כיתה: ${gradeLevel || '12'}
- נושא: ${subject || 'מתמטיקה'}
- רמה: ${units || '5'} יחידות
- סוג: ${examType || 'בגרוּת'}

🎯 **המשימה שלך:**
1. **חלץ את כל השאלות** מהתמונה בדיוק כפי שהן מופיעות
2. **זהה תרשימים וציורים** - תאר אותם במדויק
3. **סווג כל שאלה** - נושא, תת-נושא, רמת קושי
4. **שמור על עברית תקינה** - כולל ניקוד אם יש

📤 **פורמט הפלט - JSON בלבד:**

\`\`\`json
{
  "examInfo": {
    "title": "כותרת המבחן המלאה",
    "date": "תאריך אם מופיע",
    "totalQuestions": מספר,
    "instructions": "הוראות כלליות אם יש"
  },
  "questions": [
    {
      "questionNumber": מספר השאלה,
      "questionText": "טקסט השאלה המלא בעברית",
      "hasImage": true/false,
      "imageDescription": "תיאור מפורט של התרשים/ציור אם יש",
      "imagePosition": "inline/below/side",
      "subQuestions": [
        {
          "letter": "א/ב/ג/ד",
          "text": "טקסט השאלה המשנה",
          "points": נקודות אם מצוין,
          "hasFormula": true/false,
          "formula": "נוסחה אם יש"
        }
      ],
      "topic": "נושא ראשי (אלגברה/גאומטריה/חשבון דיפרנציאלי/אינטגרלים וכו')",
      "subtopic": "תת-נושא ספציפי",
      "difficulty": "easy/medium/hard",
      "estimatedTime": זמן משוער בדקות,
      "tags": ["תגיות", "רלוונטיות"],
      "solution": {
        "hasInImage": true/false,
        "solutionText": "פתרון אם מופיע בתמונה"
      }
    }
  ],
  "additionalNotes": "הערות נוספות או מידע חשוב"
}
\`\`\`

⚠️ **חשוב מאוד:**
- אל תמציא שאלות - רק מה שמופיע בתמונה
- שמור על דיוק מתמטי מוחלט
- אם יש תרשים - תאר אותו במדויק (צירים, נקודות, פונקציות)
- זהה נוסחאות וכתוב אותן בצורה ברורה
- אם משהו לא ברור - ציין זאת ב-additionalNotes

תחליף את התמונה עכשיו וחלץ את כל השאלות בפורמט JSON המדויק שלמעלה.`;
    }

    /**
     * 🔍 זיהוי סוג התמונה
     */
    detectMediaType(buffer) {
        const header = buffer.toString('hex', 0, 4).toUpperCase();

        if (header.startsWith('FFD8FF')) return 'image/jpeg';
        if (header.startsWith('89504E47')) return 'image/png';
        if (header.startsWith('47494638')) return 'image/gif';
        if (header.startsWith('52494646')) return 'image/webp';

        return 'image/jpeg'; // default
    }

    /**
     * 📊 Parse תגובת Claude Vision
     */
    parseVisionResponse(content) {
        try {
            // Remove markdown code blocks if present
            let jsonContent = content.trim();

            if (jsonContent.startsWith('```json')) {
                jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (jsonContent.startsWith('```')) {
                jsonContent = jsonContent.replace(/```\n?/g, '');
            }

            const parsed = JSON.parse(jsonContent);
            return parsed;

        } catch (error) {
            console.error('❌ Failed to parse Vision response:', error);
            console.log('Raw content:', content);
            throw new Error('Failed to parse AI response');
        }
    }

    /**
     * 💾 שמירת שאלות שחולצו מתמונה
     */
    async saveExtractedQuestions(questions, uploadId, metadata) {
        try {
            const savedQuestions = [];
            let savedCount = 0;

            for (const question of questions) {
                try {
                    const result = await pool.query(
                        `INSERT INTO question_bank (
                            question_text,
                            correct_answer,
                            hints,
                            explanation,
                            solution_steps,
                            topic,
                            subtopic,
                            difficulty,
                            grade_level,
                            units,
                            source,
                            has_image,
                            image_data,
                            keywords,
                            metadata,
                            created_at,
                            is_active
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), true)
                        RETURNING id`,
                        [
                            this.formatQuestionText(question),
                            question.solution?.solutionText || 'ממתין לפתרון',
                            JSON.stringify(this.generateHints(question)),
                            question.solution?.solutionText || '',
                            JSON.stringify(this.generateSolutionSteps(question)),
                            question.topic || 'כללי',
                            question.subtopic || '',
                            question.difficulty || 'medium',
                            metadata.gradeLevel || 12,
                            metadata.units || null,
                            'admin_upload',
                            question.hasImage || false,
                            JSON.stringify({
                                description: question.imageDescription,
                                position: question.imagePosition,
                                uploadId: uploadId
                            }),
                            JSON.stringify(question.tags || []),
                            JSON.stringify({
                                originalNumber: question.questionNumber,
                                uploadId: uploadId,
                                examTitle: metadata.examTitle,
                                extractedAt: new Date().toISOString()
                            })
                        ]
                    );

                    savedQuestions.push(result.rows[0].id);
                    savedCount++;

                } catch (error) {
                    console.error(`❌ Failed to save question ${question.questionNumber}:`, error);
                }
            }

            console.log(`✅ Saved ${savedCount}/${questions.length} questions to database`);

            return {
                success: true,
                savedCount,
                questionIds: savedQuestions
            };

        } catch (error) {
            console.error('❌ Error saving extracted questions:', error);
            throw error;
        }
    }

    /**
     * 📝 עיצוב טקסט השאלה
     */
    formatQuestionText(question) {
        let text = `שאלה ${question.questionNumber}:\n\n`;
        text += question.questionText + '\n\n';

        if (question.hasImage && question.imageDescription) {
            text += `[תרשים: ${question.imageDescription}]\n\n`;
        }

        if (question.subQuestions && question.subQuestions.length > 0) {
            question.subQuestions.forEach(sq => {
                text += `${sq.letter}. ${sq.text}\n`;
                if (sq.points) {
                    text += `   (${sq.points} נקודות)\n`;
                }
            });
        }

        return text.trim();
    }

    /**
     * 💡 יצירת רמזים אוטומטית
     */
    generateHints(question) {
        const hints = [];

        if (question.topic) {
            hints.push(`💡 רמז 1: השאלה עוסקת ב${question.topic}`);
        }

        if (question.hasImage) {
            hints.push(`🎨 רמז 2: שים לב לתרשים - ${question.imageDescription?.substring(0, 50)}...`);
        }

        if (question.subQuestions && question.subQuestions.length > 0) {
            hints.push(`📋 רמז 3: השאלה מחולקת ל-${question.subQuestions.length} סעיפים - פתור אותם בזה אחר זה`);