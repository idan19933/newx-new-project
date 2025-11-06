// server/services/calculus-validator.js
class CalculusValidator {

    /**
     * 🎯 Detect what the question is really asking
     */
    analyzeCalculusQuestion(question) {
        const q = question.toLowerCase();

        // Pattern 1: "מתי [משהו] מקסימלי/מינימלי"
        // Need to find what that "something" is

        const patterns = {
            // Looking for max/min of the function itself
            functionMaxMin: /מתי.*?(?:נפח|שטח|רווח|עלות|מרחק)\s+(?:מקסימלי|מינימלי|גדול ביותר|קטן ביותר)/i,

            // Looking for max/min of the RATE (derivative)
            rateMaxMin: /מתי.*?(?:קצב|מהירות|שיעור).*?(?:מקסימלי|מינימלי|גדול ביותר|קטן ביותר)/i,

            // Calculate rate at specific time
            rateAtTime: /(?:קצב|מהירות|שיעור).*?(?:אחרי|בזמן|ב[-\s]*t\s*=)/i
        };

        if (patterns.rateMaxMin.test(q)) {
            return {
                type: 'rate_extremum',
                description: 'Finding max/min of RATE (need second derivative)',
                needsSecondDerivative: true,
                explanation: 'כשמחפשים מקסימום של קצב (V\'(t)), צריך לפתור V\'\'(t) = 0'
            };
        }

        if (patterns.functionMaxMin.test(q)) {
            return {
                type: 'function_extremum',
                description: 'Finding max/min of FUNCTION (need first derivative)',
                needsSecondDerivative: false,
                explanation: 'כשמחפשים מקסימום של פונקציה (V(t)), צריך לפתור V\'(t) = 0'
            };
        }

        if (patterns.rateAtTime.test(q)) {
            return {
                type: 'rate_at_time',
                description: 'Calculate rate at specific time',
                needsSecondDerivative: false,
                explanation: 'צריך לחשב את V\'(t) בנקודה נתונה'
            };
        }

        return {
            type: 'unknown',
            description: 'Cannot determine question type',
            needsSecondDerivative: false
        };
    }

    /**
     * 🔍 Validate answer based on question type
     */
    validateCalculusAnswer(question, studentAnswer, correctAnswer) {
        const analysis = this.analyzeCalculusQuestion(question);

        console.log('📊 Calculus Question Analysis:', analysis);

        // Extract numbers from both answers
        const extractNumbers = (str) => {
            const matches = String(str).match(/\d+\.?\d*/g);
            return matches ? matches.map(n => parseFloat(n)) : [];
        };

        const studentNums = extractNumbers(studentAnswer);
        const correctNums = extractNumbers(correctAnswer);

        console.log('   Student numbers:', studentNums);
        console.log('   Correct numbers:', correctNums);

        // Check for common mistake: using V'(t)=0 instead of V''(t)=0
        if (analysis.type === 'rate_extremum') {
            // For V(t) = 8t² - t³, common mistake is:
            // Wrong: V'(t) = 16t - 3t² = 0 → t = 0 or t = 16/3
            // Right: V''(t) = 16 - 6t = 0 → t = 8/3

            const commonMistake1 = 16/3; // 5.33
            const commonMistake2 = 0;
            const correctValue = 8/3; // 2.67

            if (studentNums.some(n => Math.abs(n - commonMistake1) < 0.1)) {
                return {
                    isCorrect: false,
                    commonMistake: true,
                    mistakeType: 'used_first_derivative',
                    feedback: 'נראה שפתרת V\'(t) = 0 במקום V\'\'(t) = 0. כשמחפשים מקסימום של קצב (V\'(t)), צריך לפתור את הנגזרת השנייה V\'\'(t) = 0!',
                    hint: 'קצב המילוי = V\'(t). מקסימום של V\'(t) → צריך V\'\'(t) = 0'
                };
            }

            if (correctNums.some(n => Math.abs(n - correctValue) < 0.1)) {
                return {
                    isCorrect: true,
                    commonMistake: false,
                    feedback: 'מצוין! השתמשת בנגזרת השנייה נכון! 🎉'
                };
            }
        }

        return {
            isCorrect: false,
            commonMistake: false,
            feedback: 'התשובה לא נכונה. בדוק את החישובים שלך.'
        };
    }
}

export default new CalculusValidator();