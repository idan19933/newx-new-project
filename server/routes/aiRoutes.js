// server/routes/aiRoutes.js - COMPLETE AI ROUTES
import express from 'express';
import claudeApi from '../utils/claudeApiHelper.js';

const router = express.Router();

// ============================================================
// POST /api/ai/generate-question - Generate practice question
// ============================================================
router.post('/generate-question', async (req, res) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧠 POST /api/ai/generate-question');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
        const {
            topic,
            subtopic,
            difficulty = 'medium',
            grade,
            gradeLevel,
            userId
        } = req.body;

        console.log('📝 Request:', {
            topic: topic?.name,
            subtopic: subtopic?.name,
            difficulty,
            grade: grade || gradeLevel
        });

        if (!topic?.name) {
            return res.status(400).json({
                success: false,
                error: 'Missing topic name'
            });
        }

        const userGrade = grade || gradeLevel || '9';

        // Build prompt for question generation
        const prompt = `אתה נקסון, מורה למתמטיקה המתמחה בתכנית הלימודים הישראלית.

צור שאלת תרגול עבור:
- נושא: ${topic.name}
${subtopic ? `- תת-נושא: ${subtopic.name}` : ''}
- כיתה: ${userGrade}
- רמת קושי: ${difficulty}

**כללי LaTeX חשובים:**
- נוסחאות בתוך טקסט: $x + 5$
- נוסחאות בלוק (משוואות): $$x^2 + 5x + 6 = 0$$
- חזקות: $x^2$, $a^3$
- שברים: $\\frac{a}{b}$
- שורשים: $\\sqrt{x}$, $\\sqrt[3]{x}$
- סימנים: $\\geq$, $\\leq$, $\\neq$

דוגמאות לשימוש נכון:
✅ "פתור את המשוואה $2x + 5 = 15$"
✅ "חשב את השטח של ריבוע בעל צלע $x + 3$"
✅ "הנוסחה היא $$A = \\frac{1}{2}bh$$"
❌ אל תשתמש ב-HTML או טקסט רגיל למתמטיקה

צור שאלה מעניינת עם הקשר מהחיים האמיתיים.

החזר JSON בפורמט זה בדיוק:
{
  "question": "השאלה עם LaTeX: פתור $2x + 3 = 7$",
  "correctAnswer": "התשובה הנכונה: $x = 2$",
  "hints": [
    "רמז 1 עם LaTeX אם נדרש: $2x = 4$",
    "רמז 2"
  ],
  "explanation": "הסבר מפורט עם שלבים:\n1. מעבירים את 3: $2x = 7 - 3$\n2. מחשבים: $2x = 4$\n3. מחלקים ב-2: $x = 2$",
  "difficulty": "medium",
  "topic": "${topic.name}",
  "points": 10
}

חשוב: החזר **רק** JSON תקין, ללא טקסט נוסף לפני או אחרי!`;

        console.log('🤖 Calling Claude API...');

        // Call Claude API with retry
        const result = await claudeApi.complete(
            prompt,
            'אתה מורה למתמטיקה מקצועי. החזר רק JSON תקין עם LaTeX למתמטיקה.',
            {
                maxTokens: 1500,
                temperature: 0.8,
                maxRetries: 5,
                onRetry: (attempt, max) => {
                    console.log(`   🔄 Retry ${attempt}/${max}`);
                }
            }
        );

        if (!result.success) {
            throw new Error(result.error || 'Failed to generate question');
        }

        console.log('✅ Got response from Claude');

        // Parse JSON from response
        let questionData;
        try {
            const cleanedText = result.text
                .trim()
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '');

            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                questionData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }

            // Add metadata
            questionData.questionId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            questionData.generatedAt = new Date().toISOString();
            questionData.userId = userId;

            console.log('✅ Question generated successfully');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            res.json({
                success: true,
                ...questionData
            });

        } catch (parseError) {
            console.error('❌ JSON Parse Error:', parseError.message);
            console.log('📄 Failed text:', result.text.substring(0, 500));

            // Fallback question
            const fallbackQuestion = {
                questionId: `q_${Date.now()}`,
                question: `שאלת תרגול ב${topic.name}: חשב את הערך של $x$ במשוואה $2x + 5 = 15$`,
                correctAnswer: '$x = 5$',
                hints: ['העבר את 5 לצד השני', 'חלק את שני הצדדים ב-2'],
                explanation: 'פתרון:\n1. $2x = 15 - 5$\n2. $2x = 10$\n3. $x = 5$',
                difficulty: difficulty,
                topic: topic.name,
                points: 10,
                isFallback: true
            };

            res.json({
                success: true,
                ...fallbackQuestion
            });
        }

    } catch (error) {
        console.error('❌ CRITICAL Error:', error.message);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate question'
        });
    }
});

// ============================================================
// POST /api/ai/verify-answer - Check student's answer
// ============================================================
router.post('/verify-answer', async (req, res) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ POST /api/ai/verify-answer');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
        const {
            question,
            userAnswer,
            correctAnswer,
            topic,
            subtopic,
            userId,
            questionId,
            difficulty
        } = req.body;

        console.log('📝 Verification Request:', {
            question: question?.substring(0, 50),
            userAnswer,
            correctAnswer,
            topic
        });

        if (!question || !userAnswer || !correctAnswer) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Simple normalization check first
        const normalizeAnswer = (ans) => {
            return ans.toString()
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '')
                .replace(/[$()]/g, '')
                .replace(/,/g, '.')
                .replace(/×/g, '*')
                .replace(/÷/g, '/');
        };

        const userNormalized = normalizeAnswer(userAnswer);
        const correctNormalized = normalizeAnswer(correctAnswer);

        console.log('🔍 Normalized:', {
            user: userNormalized,
            correct: correctNormalized
        });

        // Quick check - if exactly the same
        if (userNormalized === correctNormalized) {
            console.log('✅ Quick match - answers are identical');
            return res.json({
                success: true,
                isCorrect: true,
                feedback: '🎉 מצוין! התשובה שלך נכונה לחלוטין!',
                pointsEarned: 10
            });
        }

        // Use Claude for deeper verification
        const prompt = `אתה נקסון, מורה למתמטיקה מנוסה.

בדוק את תשובת התלמיד:

**השאלה:**
${question}

**תשובת התלמיד:**
${userAnswer}

**התשובה הנכונה:**
${correctAnswer}

**כללי בדיקה:**
1. אם התשובות זהות מבחינה מתמטית - זה נכון (גם אם יש הבדלי כתיב קלים)
2. אם התלמיד טעה בחישוב אבל השיטה נכונה - ציין זאת
3. תן משוב מעודד גם אם לא נכון

**כללי LaTeX:**
- השתמש ב-LaTeX לכל מתמטיקה
- דוגמה: "התשובה הנכונה היא $x = 5$"
- בהסבר: "שלב 1: $2x = 10$"

החזר JSON:
{
  "isCorrect": true/false,
  "feedback": "משוב קצר (1-2 משפטים) עם LaTeX",
  "explanation": "הסבר מפורט רק אם לא נכון, עם שלבי פתרון באמצעות LaTeX",
  "correctAnswer": "התשובה הנכונה עם LaTeX",
  "pointsEarned": 10 אם נכון, 5 אם קרוב, 0 אם לא נכון
}

דוגמה לתשובה טובה:
{
  "isCorrect": true,
  "feedback": "נכון מאוד! השתמשת בשיטה הנכונה וקיבלת $x = 5$",
  "pointsEarned": 10
}

או אם לא נכון:
{
  "isCorrect": false,
  "feedback": "לא בדיוק. יש טעות קלה בחישוב.",
  "explanation": "הפתרון הנכון:\\n1. מעבירים את 3 לצד השני: $2x = 15 - 3$\\n2. מחשבים: $2x = 12$\\n3. מחלקים ב-2: $x = 6$",
  "correctAnswer": "$x = 6$",
  "pointsEarned": 3
}

החזר **רק** JSON תקין!`;

        console.log('🤖 Calling Claude for verification...');

        const result = await claudeApi.complete(
            prompt,
            'אתה מורה מתמטיקה מקצועי. החזר רק JSON תקין עם LaTeX.',
            {
                maxTokens: 1000,
                temperature: 0.3,
                maxRetries: 5,
                onRetry: (attempt, max) => {
                    console.log(`   🔄 Retry ${attempt}/${max}`);
                }
            }
        );

        if (!result.success) {
            throw new Error(result.error);
        }

        console.log('✅ Got verification from Claude');

        // Parse response
        let verificationData;
        try {
            const cleanedText = result.text
                .trim()
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '');

            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                verificationData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON in response');
            }

            console.log('✅ Verification completed:', verificationData.isCorrect ? 'CORRECT' : 'INCORRECT');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            res.json({
                success: true,
                ...verificationData
            });

        } catch (parseError) {
            console.error('❌ Parse error:', parseError.message);

            // Fallback verification
            const isCorrect = userNormalized.includes(correctNormalized) ||
                correctNormalized.includes(userNormalized);

            res.json({
                success: true,
                isCorrect,
                feedback: isCorrect
                    ? '✅ נכון! התשובה שלך מקובלת.'
                    : `❌ לא בדיוק. התשובה הנכונה היא: ${correctAnswer}`,
                correctAnswer,
                pointsEarned: isCorrect ? 10 : 0
            });
        }

    } catch (error) {
        console.error('❌ Verification error:', error.message);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        res.status(500).json({
            success: false,
            error: error.message || 'Failed to verify answer'
        });
    }
});

// ============================================================
// POST /api/ai/get-hint - Get hint for current question
// ============================================================
router.post('/get-hint', async (req, res) => {
    try {
        const { question, currentAttempt, topic } = req.body;

        if (!question) {
            return res.status(400).json({
                success: false,
                error: 'Missing question'
            });
        }

        const prompt = `אתה נקסון, מורה למתמטיקה.

תן רמז מועיל לשאלה הזו (אל תיתן את התשובה המלאה):

**השאלה:**
${question}

**ניסיון נוכחי של התלמיד:** ${currentAttempt || 'טרם ניסה'}

תן רמז שיעזור לתלמיד להתקדם, עם LaTeX למתמטיקה.

החזר JSON:
{
  "hint": "הרמז עם LaTeX: נסה להעביר את $3$ לצד השני...",
  "level": "basic/medium/advanced"
}

רק JSON!`;

        const result = await claudeApi.complete(
            prompt,
            'מורה מתמטיקה. החזר רק JSON.',
            {
                maxTokens: 300,
                temperature: 0.7,
                maxRetries: 3
            }
        );

        if (!result.success) {
            throw new Error(result.error);
        }

        const cleanedText = result.text
            .trim()
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '');

        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        const hintData = jsonMatch ? JSON.parse(jsonMatch[0]) : { hint: 'נסה לחשוב על השלב הראשון בפתרון...' };

        res.json({
            success: true,
            ...hintData
        });

    } catch (error) {
        console.error('❌ Hint error:', error);
        res.json({
            success: true,
            hint: 'חשוב על הכללים הבסיסיים של הנושא. מה השלב הראשון?',
            level: 'basic'
        });
    }
});

export default router;