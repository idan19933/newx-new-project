// backend/services/examVerificationService.js
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

class ExamVerificationService {
    /**
     * Verify student's answer using Claude AI
     */
    async verifyAnswer(answerData) {
        const {
            questionText,
            correctAnswer,
            studentAnswer,
            solutionSteps,
            topic,
            maxPoints
        } = answerData;

        try {
            const prompt = this.buildVerificationPrompt(
                questionText,
                correctAnswer,
                studentAnswer,
                solutionSteps,
                topic,
                maxPoints
            );

            const response = await anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 2000,
                temperature: 0.3,
                system: this.getSystemPrompt(),
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            });

            const content = response.content[0].text;
            return this.parseVerificationResponse(content, maxPoints);

        } catch (error) {
            console.error('AI Verification Error:', error);
            return {
                isCorrect: null,
                pointsEarned: 0,
                feedback: 'שגיאה בבדיקת התשובה. אנא נסה שוב.',
                confidence: 0,
                needsReview: true,
                detailedFeedback: null
            };
        }
    }

    /**
     * Get system prompt for verification
     */
    getSystemPrompt() {
        return `אתה מורה מומחה למתמטיקה בישראל, המתמחה בבדיקת מבחני בגרות.
תפקידך הוא לבדוק תשובות של תלמידים ולתת משוב מפורט ומדויק.

כללי בדיקה:
1. בדוק את הנכונות המתמטית של התשובה
2. בדוק את שלבי הפתרון - גם אם התשובה הסופית נכונה
3. תן ציון חלקי אם יש שלבים נכונים אבל התשובה הסופית שגויה
4. זהה טעויות חישוב, טעויות קונספטואליות, וטעויות בכתיבה מתמטית
5. תן משוב בונה ועידוד
6. אם התשובה לא ברורה או לא קריאה, ציין זאת

פורמט התשובה (JSON):
{
  "isCorrect": true/false/null,
  "pointsEarned": <מספר>,
  "feedback": "<משוב קצר בעברית>",
  "confidence": <0-100>,
  "needsReview": true/false,
  "detailedFeedback": {
    "strengths": ["נקודה 1", "נקודה 2"],
    "mistakes": ["טעות 1", "טעות 2"],
    "suggestions": ["המלצה 1", "המלצה 2"]
  }
}`;
    }

    /**
     * Build verification prompt
     */
    buildVerificationPrompt(questionText, correctAnswer, studentAnswer, solutionSteps, topic, maxPoints) {
        let prompt = `בדוק את התשובה של התלמיד למבחן בגרות במתמטיקה.

**השאלה:**
${questionText}

**התשובה הנכונה:**
${correctAnswer}

${solutionSteps ? `**שלבי פתרון מומלצים:**
${JSON.stringify(solutionSteps, null, 2)}` : ''}

**תשובת התלמיד:**
${studentAnswer}

**נושא:** ${topic}
**נקודות מקסימליות:** ${maxPoints}

בדוק את התשובה והחזר JSON בפורמט שצוין.`;

        return prompt;
    }

    /**
     * Parse AI response
     */
    parseVerificationResponse(content, maxPoints) {
        try {
            // Try to extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);

                // Ensure pointsEarned doesn't exceed maxPoints
                parsed.pointsEarned = Math.min(parsed.pointsEarned || 0, maxPoints);

                return parsed;
            }

            // Fallback if JSON not found
            return {
                isCorrect: content.includes('נכון') || content.includes('תשובה נכונה'),
                pointsEarned: content.includes('נכון') ? maxPoints : 0,
                feedback: content.substring(0, 200),
                confidence: 50,
                needsReview: true,
                detailedFeedback: null
            };

        } catch (error) {
            console.error('Error parsing verification response:', error);
            return {
                isCorrect: null,
                pointsEarned: 0,
                feedback: 'שגיאה בפרשנות התשובה',
                confidence: 0,
                needsReview: true,
                detailedFeedback: null
            };
        }
    }

    /**
     * Verify answer from image (OCR + verification)
     */
    async verifyAnswerFromImage(imageBase64, questionData) {
        try {
            const prompt = `בדוק את התשובה הכתובה ביד בתמונה למבחן בגרות.

**השאלה:**
${questionData.questionText}

**התשובה הנכונה:**
${questionData.correctAnswer}

בדוק את התשובה בתמונה והחזר JSON בפורמט שצוין.`;

            const response = await anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 2000,
                temperature: 0.3,
                system: this.getSystemPrompt(),
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: 'image/jpeg',
                                data: imageBase64
                            }
                        },
                        {
                            type: 'text',
                            text: prompt
                        }
                    ]
                }]
            });

            const content = response.content[0].text;
            return this.parseVerificationResponse(content, questionData.maxPoints);

        } catch (error) {
            console.error('Image Verification Error:', error);
            return {
                isCorrect: null,
                pointsEarned: 0,
                feedback: 'שגיאה בזיהוי התמונה. אנא נסה שוב.',
                confidence: 0,
                needsReview: true,
                detailedFeedback: null
            };
        }
    }

    /**
     * Grade entire exam
     */
    async gradeExam(examData, studentAnswers) {
        const results = [];
        let totalScore = 0;
        let maxScore = 0;

        for (const answer of studentAnswers) {
            const question = examData.questions.find(q => q.id === answer.questionId);
            if (!question) continue;

            const verification = await this.verifyAnswer({
                questionText: question.question_text,
                correctAnswer: question.correct_answer,
                studentAnswer: answer.answer,
                solutionSteps: question.solution_steps,
                topic: question.topic,
                maxPoints: question.points
            });

            results.push({
                questionId: question.id,
                questionNumber: question.question_number,
                ...verification
            });

            totalScore += verification.pointsEarned;
            maxScore += question.points;
        }

        return {
            results,
            totalScore,
            maxScore,
            percentage: maxScore > 0 ? ((totalScore / maxScore) * 100).toFixed(2) : 0,
            overallFeedback: this.generateOverallFeedback(results, totalScore, maxScore)
        };
    }

    /**
     * Generate overall exam feedback
     */
    generateOverallFeedback(results, totalScore, maxScore) {
        const percentage = (totalScore / maxScore) * 100;

        if (percentage >= 90) {
            return '🌟 ביצוע מעולה! אתה שולט בחומר!';
        } else if (percentage >= 80) {
            return '👍 עבודה טובה! יש לך הבנה טובה של החומר.';
        } else if (percentage >= 70) {
            return '💪 לא רע! המשך לתרגל ותשתפר.';
        } else if (percentage >= 60) {
            return '📚 צריך עוד תרגול. המשך לעבוד!';
        } else {
            return '🎯 אל תתייאש! חזור על החומר ונסה שוב.';
        }
    }
}

export default new ExamVerificationService();