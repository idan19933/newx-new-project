// server/routes/learningRoutes.js - FULL VERSION WITH REAL AI
import express from 'express';
const router = express.Router();

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

        if (!topicName || !gradeLevel) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: topicName and gradeLevel'
            });
        }

        if (!process.env.ANTHROPIC_API_KEY) {
            console.error('❌ ANTHROPIC_API_KEY not configured');
            return res.status(500).json({
                success: false,
                error: 'API key not configured'
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
      "story": "סיפור או הקדמה מעניינת לנושא",
      "explanation": "הסבר מפורט של הנושא עם דוגמאות",
      "keyPoints": [
        "נקודת מפתח 1",
        "נקודת מפתח 2",
        "נקודת מפתח 3"
      ],
      "examples": [
        {
          "title": "דוגמה 1",
          "problem": "השאלה",
          "steps": [
            "שלב 1: הסבר",
            "שלב 2: חישוב",
            "שלב 3: תשובה"
          ],
          "solution": "פתרון מפורט",
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

חשוב:
1. צור 2-3 sections
2. כל section עם 2-3 דוגמאות פתורות במלואן
3. הסבר צעד אחר צעד
4. שפה פשוטה וברורה בעברית
5. החזר רק JSON, ללא טקסט נוסף`;

        console.log('🤖 Calling Claude API...');

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4000,
                temperature: 0.7,
                system: 'אתה מורה למתמטיקה מנוסה. צור תוכן לימודי איכותי בעברית. החזר רק JSON תקין.',
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Claude API Error:', response.status, errorData);
            return res.status(500).json({
                success: false,
                error: `API Error: ${response.status}`,
                details: errorData
            });
        }

        const data = await response.json();
        const contentText = data.content[0].text;

        console.log('✅ Got response from Claude');
        console.log('📄 Response length:', contentText.length);

        const cleanedText = cleanJsonText(contentText);

        let learningContent;
        try {
            learningContent = JSON.parse(cleanedText);
            console.log('✅ JSON parsed successfully');
            console.log('📊 Sections:', learningContent.sections?.length);
        } catch (parseError) {
            console.error('❌ JSON Parse Error:', parseError.message);
            console.log('📄 Failed text (first 500):', cleanedText.substring(0, 500));
            return res.status(500).json({
                success: false,
                error: 'Failed to parse AI response',
                rawResponse: cleanedText.substring(0, 500)
            });
        }

        console.log('✅ Returning learning content');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        res.json({
            success: true,
            content: learningContent
        });

    } catch (error) {
        console.error('❌ CRITICAL Error:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
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

        // Simple comparison (can be enhanced with AI)
        const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

        const feedback = isCorrect
            ? 'מעולה! התשובה שלך נכונה! 🎉'
            : `לא בדיוק. התשובה הנכונה היא: ${correctAnswer}. נסה שוב! 💪`;

        res.json({
            success: true,
            isCorrect,
            feedback
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

        if (!process.env.ANTHROPIC_API_KEY) {
            return res.status(500).json({
                success: false,
                error: 'API key not configured'
            });
        }

        const prompt = `אתה נקסון, מורה דיגיטלי ידידותי.

הקשר:
- נושא: ${context.topic}
${context.subtopic ? `- תת-נושא: ${context.subtopic}` : ''}
${context.sectionTitle ? `- סעיף: ${context.sectionTitle}` : ''}

${context.sectionContent ? `תוכן הסעיף:\n${context.sectionContent.substring(0, 500)}` : ''}

שאלת התלמיד: ${message}

ענה בצורה ידידותית ומועילה. הסבר בפשטות. אל תשתמש בסימנים מתמטיים מורכבים.`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1000,
                temperature: 0.7,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const reply = data.content[0].text;

        res.json({
            success: true,
            reply
        });

    } catch (error) {
        console.error('❌ Error in ask-nexon:', error);
        console.error('❌ Error in ask-nexon:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;