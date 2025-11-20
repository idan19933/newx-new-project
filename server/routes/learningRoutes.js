// server/routes/learningRoutes.js - UPDATED WITH CLAUDE API HELPER
import express from 'express';
import claudeApi from '../utils/claudeApiHelper.js';

const router = express.Router();

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function cleanJsonText(rawText) {
    let jsonText = rawText.trim();

    if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
    }

    const jsonStart = jsonText.indexOf('{');
    const jsonEnd = jsonText.lastIndexOf('}') + 1;

    if (jsonStart !== -1 && jsonEnd > jsonStart) {
        jsonText = jsonText.substring(jsonStart, jsonEnd);
    }

    return jsonText;
}

// Fallback content generator
function getFallbackLearningContent(topicName, subtopicName, gradeLevel) {
    console.log('📝 Generating fallback learning content');

    return {
        sections: [
            {
                title: topicName || 'נושא כללי',
                subtitle: subtopicName || 'הקדמה לנושא',
                story: `ברוכים הבאים ללימוד ${topicName || 'הנושא'}! זהו נושא חשוב במתמטיקה של כיתה ${gradeLevel}.`,
                explanation: `${topicName || 'הנושא'} הוא נושא מרכזי במתמטיקה.
                
בסעיף זה נלמד את היסודות החשובים ביותר.

**מושגי יסוד:**
${topicName} כולל מספר מושגים חשובים שנצטרך להכיר.

**שימושים:**
נושא זה משמש בפתרון בעיות מתמטיות שונות.`,
                keyPoints: [
                    `הבנת המושג ${topicName || 'הבסיסי'}`,
                    'דוגמאות ותרגול',
                    'יישום בפתרון בעיות',
                    'זיהוי שגיאות נפוצות'
                ],
                examples: [
                    {
                        title: 'דוגמה בסיסית',
                        problem: `בעיה לדוגמה ב${topicName || 'נושא'}`,
                        steps: [
                            'שלב 1: הבנת הנתון',
                            'שלב 2: בחירת השיטה המתאימה',
                            'שלב 3: ביצוע החישובים',
                            'שלב 4: בדיקת התשובה'
                        ],
                        solution: 'זהו פתרון לדוגמה. בתרגול האמיתי נקבל פתרונות מפורטים יותר.',
                        answer: 'תשובה לדוגמה'
                    }
                ],
                quiz: {
                    question: `שאלת הבנה בסיסית ב${topicName || 'נושא'}`,
                    hint: 'חשוב על המושגים שלמדנו',
                    answer: 'תשובה לדוגמה'
                }
            },
            {
                title: 'תרגול והעמקה',
                subtitle: 'בואו נתרגל את מה שלמדנו',
                story: 'עכשיו כשהבנו את היסודות, בואו נתרגל עם דוגמאות נוספות.',
                explanation: `תרגול הוא המפתח להצלחה במתמטיקה.
                
**טיפים לתרגול:**
- התחילו מהפשוט למורכב
- בדקו כל שלב לפני שממשיכים
- אל תפחדו לטעות - כך לומדים!

**שימו לב:**
בתרגול אמיתי עם AI תקבלו שאלות מותאמות אישית לרמתכם.`,
                keyPoints: [
                    'תרגול עצמאי',
                    'בדיקה עצמית',
                    'זיהוי נקודות לשיפור'
                ],
                examples: [
                    {
                        title: 'דוגמה מתקדמת יותר',
                        problem: 'בעיה מעט יותר מורכבת',
                        steps: [
                            'שלב 1: פירוק הבעיה לחלקים',
                            'שלב 2: פתרון כל חלק',
                            'שלב 3: חיבור החלקים',
                            'שלב 4: בדיקה סופית'
                        ],
                        solution: 'פתרון מפורט יותר לדוגמה מורכבת.',
                        answer: 'תשובה מפורטת'
                    }
                ],
                quiz: {
                    question: 'שאלת הבנה מתקדמת',
                    hint: 'השתמש במה שלמדת בשני הסעיפים',
                    answer: 'תשובה מתקדמת'
                }
            }
        ],
        metadata: {
            isFallback: true,
            reason: 'Claude API unavailable',
            topic: topicName,
            subtopic: subtopicName,
            grade: gradeLevel
        }
    };
}

// ============================================================
// POST /api/learning/get-content - Generate learning content
// ============================================================
router.post('/get-content', async (req, res) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📚 POST /api/learning/get-content');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
        const {
            topicId,
            subtopicId,
            topicName,
            subtopicName,
            gradeLevel,
            userId,
            mode = 'lecture',
            requestFullExamples = true,
            numExamples = 3
        } = req.body;

        console.log('📝 Request:', {
            topicName,
            subtopicName,
            gradeLevel,
            userId,
            mode,
            numExamples
        });

        // ✅ Validate required fields
        if (!topicName || !gradeLevel) {
            console.error('❌ Missing required fields');
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: topicName and gradeLevel'
            });
        }

        // Build the prompt
        const prompt = `אתה נקסון, מורה דיגיטלי למתמטיקה ידידותי ומקצועי.

צור תוכן לימודי מלא עבור:
- נושא: ${topicName}
${subtopicName ? `- תת-נושא: ${subtopicName}` : ''}
- כיתה: ${gradeLevel}
- מספר דוגמאות: ${numExamples}

החזר JSON במבנה הזה בדיוק:
{
  "sections": [
    {
      "title": "כותרת הסעיף",
      "subtitle": "תת-כותרת",
      "story": "סיפור או הקדמה מעניינת לנושא (2-3 משפטים)",
      "explanation": "הסבר מפורט של הנושא עם דוגמאות (5-8 משפטים)",
      "keyPoints": [
        "נקודת מפתח 1",
        "נקודת מפתח 2",
        "נקודת מפתח 3"
      ],
      "examples": [
        {
          "title": "דוגמה 1",
          "problem": "השאלה או הבעיה",
          "steps": [
            "שלב 1: הסבר מפורט",
            "שלב 2: חישוב או פעולה",
            "שלב 3: המשך הפתרון"
          ],
          "solution": "פתרון מפורט צעד אחר צעד",
          "answer": "התשובה הסופית"
        }
      ],
      "quiz": {
        "question": "שאלת בדיקה",
        "hint": "רמז מועיל",
        "answer": "התשובה הנכונה"
      }
    }
  ]
}

חשוב מאוד:
1. צור 2-3 sections
2. כל section עם 2-3 דוגמאות פתורות במלואן
3. הסבר צעד אחר צעד בצורה ברורה
4. שפה פשוטה וברורה בעברית
5. החזר **רק** JSON תקין, ללא טקסט נוסף כלל
6. אל תוסיף הערות או הסברים מחוץ ל-JSON`;

        console.log('🤖 Calling Claude API with smart retry logic...');

        // ✅ Use Claude API Helper with 5 retries
        let learningContent;
        try {
            const result = await claudeApi.complete(
                prompt,
                'אתה מורה למתמטיקה מנוסה. צור תוכן לימודי איכותי בעברית. החזר רק JSON תקין ללא כל טקסט נוסף.',
                {
                    maxTokens: 4000,
                    temperature: 0.7,
                    maxRetries: 5,
                    timeout: 120000, // 2 minutes
                    onRetry: (attempt, max, delay) => {
                        console.log(`   🔄 Retry ${attempt}/${max} after ${Math.round(delay)}ms (Claude overloaded)`);
                    }
                }
            );

            if (!result.success) {
                throw new Error(result.error || 'Failed to generate content');
            }

            console.log('✅ Got response from Claude');
            console.log('   Attempts:', result.attempts);
            console.log('📄 Response length:', result.text.length);

            const cleanedText = cleanJsonText(result.text);

            try {
                learningContent = JSON.parse(cleanedText);
                console.log('✅ JSON parsed successfully');
                console.log('📊 Sections:', learningContent.sections?.length);
            } catch (parseError) {
                console.error('❌ JSON Parse Error:', parseError.message);
                console.log('📄 Failed text (first 500):', cleanedText.substring(0, 500));
                throw new Error('Failed to parse AI response');
            }

        } catch (error) {
            console.error('❌ Claude API failed after all retries:', error.message);

            // ✅ Use fallback content
            console.log('🔄 Using fallback content');
            learningContent = getFallbackLearningContent(topicName, subtopicName, gradeLevel);
        }

        console.log('✅ Returning learning content');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        res.json({
            success: true,
            content: learningContent
        });

    } catch (error) {
        console.error('❌ CRITICAL Error:', error.message);
        console.error('Stack:', error.stack);

        // ✅ Last resort: return fallback
        try {
            const { topicName, subtopicName, gradeLevel } = req.body;
            const fallback = getFallbackLearningContent(
                topicName || 'מתמטיקה',
                subtopicName,
                gradeLevel || '9'
            );

            return res.json({
                success: true,
                content: fallback,
                warning: 'Using fallback content due to API error'
            });
        } catch (fallbackError) {
            return res.status(500).json({
                success: false,
                error: error.message || 'Internal server error'
            });
        }
    }
});

// ============================================================
// POST /api/learning/check-quiz - Check quiz answer
// ============================================================
router.post('/check-quiz', async (req, res) => {
    try {
        const { question, correctAnswer, userAnswer, topic, userId } = req.body;

        console.log('🔍 Checking quiz answer:', {
            question: question?.substring(0, 50),
            userAnswer,
            correctAnswer
        });

        if (!question || !correctAnswer || !userAnswer) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // ✅ Normalize and compare answers
        const normalizeAnswer = (ans) => {
            return ans.toString().trim().toLowerCase()
                .replace(/\s+/g, '')
                .replace(/[.,;:]/g, '');
        };

        const userNormalized = normalizeAnswer(userAnswer);
        const correctNormalized = normalizeAnswer(correctAnswer);

        const isCorrect = userNormalized === correctNormalized;

        const feedback = isCorrect
            ? 'מעולה! התשובה שלך נכונה! 🎉'
            : `לא בדיוק. התשובה הנכונה היא: ${correctAnswer}. נסה שוב! 💪`;

        res.json({
            success: true,
            isCorrect,
            feedback,
            correctAnswer: isCorrect ? null : correctAnswer
        });

    } catch (error) {
        console.error('❌ Error checking quiz:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================================
// POST /api/learning/ask-nexon - Chat with Nexon
// ============================================================
router.post('/ask-nexon', async (req, res) => {
    try {
        const { message, context, userId, conversationHistory } = req.body;

        console.log('💬 Nexon chat:', {
            message: message?.substring(0, 50),
            topic: context?.topic,
            userId
        });

        if (!message || !context) {
            return res.status(400).json({
                success: false,
                error: 'Missing message or context'
            });
        }

        const prompt = `אתה נקסון, מורה דיגיטלי ידידותי.

הקשר:
- נושא: ${context.topic}
${context.subtopic ? `- תת-נושא: ${context.subtopic}` : ''}
${context.sectionTitle ? `- סעיף: ${context.sectionTitle}` : ''}

${context.sectionContent ? `תוכן הסעיף:\n${context.sectionContent.substring(0, 500)}` : ''}

שאלת התלמיד: ${message}

ענה בצורה ידידותית ומועילה בעברית. הסבר בפשטות. השתמש בשפה מתמטית ברורה.`;

        console.log('🤖 Calling Claude for chat...');

        // ✅ Use Claude API Helper
        const result = await claudeApi.complete(
            prompt,
            '',
            {
                maxTokens: 1000,
                temperature: 0.7,
                maxRetries: 5,
                onRetry: (attempt, max) => {
                    console.log(`   🔄 Chat retry ${attempt}/${max}`);
                }
            }
        );

        if (!result.success) {
            throw new Error(result.error);
        }

        console.log('✅ Chat response generated');

        res.json({
            success: true,
            reply: result.text
        });

    } catch (error) {
        console.error('❌ Error in ask-nexon:', error);

        // ✅ Fallback response
        const fallbackReply = 'מצטער, אני לא זמין כרגע. אבל אתה יכול להמשיך עם החומר הלימודי או לנסה שוב בעוד רגע. 🤔';

        res.json({
            success: true,
            reply: fallbackReply,
            warning: 'Using fallback response'
        });
    }
});

export default router;