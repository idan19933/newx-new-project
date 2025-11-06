// server/services/mathCalculationService.js
// ==================== MATHEMATICAL CALCULATION SERVICE ====================
// שירות לחישובים מתמטיים מדויקים באמצעות mathjs ו-nerdamer

import { create, all } from 'mathjs';
import nerdamer from 'nerdamer';
import 'nerdamer/Algebra.js';
import 'nerdamer/Calculus.js';
import 'nerdamer/Solve.js';

const math = create(all);

class MathCalculationService {
    /**
     * 🎯 נקודת כניסה ראשית - פתור שאלה מתמטית
     * @param {string} question - טקסט השאלה
     * @returns {Object} - תוצאת החישוב
     */
    async solveQuestion(question, correctAnswer = null) {
        console.log('\n🔢 MATHEMATICAL CALCULATION SERVICE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 Question:', question.substring(0, 100) + '...');
        if (correctAnswer) {
            console.log('📋 Expected Answer:', correctAnswer);
        }

        try {
            const problemType = this.detectProblemType(question);
            console.log('📊 Problem Type:', problemType);

            if (problemType === 'unknown') {
                return { success: false, reason: 'unknown_problem_type', confidence: 0 };
            }

            const extracted = this.extractMathContent(question, problemType);

            if (!extracted.success) {
                return { success: false, reason: 'extraction_failed', confidence: 0 };
            }

            console.log('✅ Extracted successfully');

            let result;
            switch (problemType) {
                case 'derivative_optimization':
                    result = await this.solveDerivativeOptimization(extracted, question);
                    break;
                case 'polynomial_roots':
                    result = await this.solvePolynomialRoots(extracted);
                    break;
                case 'simple_calculation':
                    result = await this.solveSimpleCalculation(extracted);
                    break;
                default:
                    result = { success: false, reason: 'unsupported_type' };
            }

            // ✅ VALIDATE against correct answer if provided
            if (result.success && correctAnswer) {
                const validation = this.validateAgainstCorrectAnswer(result, correctAnswer);

                if (!validation.valid) {
                    console.log('   🚨 VALIDATION FAILED!');
                    console.log('      Reason:', validation.reason);

                    // ✅ LOWER CONFIDENCE dramatically
                    result.confidence = Math.min(result.confidence, 50);
                    result.validationFailed = true;
                    result.validationReason = validation.reason;
                    result.expectedAnswer = validation.expectedAnswer;
                } else {
                    console.log('   ✅ Validation passed!');
                }
            }

            console.log('📊 Final Result:', result.success ? '✅ SUCCESS' : '❌ FAILED');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            return result;

        } catch (error) {
            console.error('❌ Math calculation error:', error.message);
            return { success: false, reason: 'calculation_error', error: error.message, confidence: 0 };
        }
    }

    /**
     * 🔍 זהה את סוג הבעיה המתמטית
     */
    detectProblemType(question) {
        const text = question.toLowerCase();

        // אופטימיזציה עם נגזרות (נפוץ בכיתה יב')
        if ((text.includes('מקסימום') || text.includes('מינימום') || text.includes('קיצון')) &&
            (text.includes('רווח') || text.includes('נגזרת') || text.includes('r(') ||
                text.includes('f(') || text.includes('p(') || /[rfp]\(/.test(text))) {
            return 'derivative_optimization';
        }

        // משוואות פולינומיאליות
        if ((text.includes('משוואה') || text.includes('שורשים')) &&
            (text.includes('x²') || text.includes('x³') || text.includes('^'))) {
            return 'polynomial_roots';
        }

        // חישוב אריתמטי פשוט
        if (text.match(/\d+\s*[\+\-\*\/]\s*\d+/)) {
            return 'simple_calculation';
        }

        return 'unknown';
    }

    /**
     * 📝 חלץ ביטויים מתמטיים מהשאלה
     */
    extractMathContent(question, problemType) {
        try {
            if (problemType === 'derivative_optimization') {
                return this.extractDerivativeOptimization(question);
            }

            if (problemType === 'polynomial_roots') {
                return this.extractPolynomial(question);
            }

            if (problemType === 'simple_calculation') {
                return this.extractSimpleExpression(question);
            }

            return { success: false };

        } catch (error) {
            console.error('   ❌ Extraction error:', error.message);
            return { success: false };
        }
    }

    /**
     * 📐 חלץ בעיית נגזרת/אופטימיזציה
     */
    extractDerivativeOptimization(question) {
        // חפש הגדרת פונקציה: R(x) = ... או f(x) = ...
        const patterns = [
            /R\((?:x|p)\)\s*=\s*([^\n]+)/i,
            /f\((?:x|t)\)\s*=\s*([^\n]+)/i,
            /P\((?:x|n)\)\s*=\s*([^\n]+)/i,
            /N\((?:x|p)\)\s*=\s*([^\n]+)/i
        ];

        for (const pattern of patterns) {
            const match = question.match(pattern);
            if (match) {
                let expression = match[1].trim();

                // נקה ונרמל
                expression = this.normalizeExpression(expression);

                // זהה משתנה
                const variable = this.detectVariable(expression);

                console.log('   📐 Found function:', expression);
                console.log('   📊 Variable:', variable);

                return {
                    success: true,
                    type: 'derivative_optimization',
                    expression: expression,
                    variable: variable,
                    rawMatch: match[0]
                };
            }
        }

        return { success: false };
    }

    /**
     * 🔧 נרמול ביטוי מתמטי
     */
    normalizeExpression(expr) {
        return expr
            // חזקות עבריות/Unicode ל-^
            .replace(/²/g, '^2')
            .replace(/³/g, '^3')
            .replace(/⁴/g, '^4')
            // סמלי כפל
            .replace(/×/g, '*')
            .replace(/·/g, '*')
            // הסר רווחים סביב אופרטורים
            .replace(/\s*([+\-*/^])\s*/g, '$1')
            // הוסף * בין מספר למשתנה: 2x → 2*x
            .replace(/(\d)([a-z])/gi, '$1*$2')
            // הוסף * בין ) ו-(
            .replace(/\)\s*\(/g, ')*(')
            .trim();
    }

    /**
     * 🔤 זהה איזה משתנה משתמשים (x, p, t וכו')
     */
    detectVariable(expression) {
        const variables = expression.match(/[a-z]/gi) || [];
        const uniqueVars = [...new Set(variables.map(v => v.toLowerCase()))];

        // העדף משתנים נפוצים
        if (uniqueVars.includes('x')) return 'x';
        if (uniqueVars.includes('p')) return 'p';
        if (uniqueVars.includes('t')) return 't';
        if (uniqueVars.includes('n')) return 'n';

        return uniqueVars[0] || 'x';
    }

    /**
     * 🎯 פתור בעיית אופטימיזציה עם נגזרות
     */
    async solveDerivativeOptimization(extracted, originalQuestion) {
        try {
            const { expression, variable } = extracted;

            console.log('   🔢 Solving optimization problem...');
            console.log('   📐 Expression:', expression);
            console.log('   📊 Variable:', variable);

            // שלב 1: חשב נגזרת באמצעות nerdamer
            let derivative;
            try {
                derivative = nerdamer.diff(expression, variable).toString();
                console.log('   📈 Derivative:', derivative);
            } catch (derivError) {
                console.error('   ❌ Derivative calculation failed:', derivError.message);
                return {
                    success: false,
                    reason: 'derivative_failed',
                    confidence: 0
                };
            }

            // שלב 2: פתור נגזרת = 0
            let criticalPointsRaw;
            try {
                criticalPointsRaw = nerdamer.solve(`${derivative}=0`, variable).toString();
                console.log('   📍 Critical points (raw):', criticalPointsRaw);
            } catch (solveError) {
                console.error('   ❌ Solving derivative failed:', solveError.message);
                return {
                    success: false,
                    reason: 'solving_failed',
                    confidence: 0
                };
            }

            // פרס נקודות קריטיות
            const criticalPoints = this.parseCriticalPoints(criticalPointsRaw);
            console.log('   📍 Critical points (parsed):', criticalPoints);

            if (criticalPoints.length === 0) {
                return {
                    success: false,
                    reason: 'no_critical_points',
                    confidence: 50
                };
            }

            // שלב 3: העריך את הפונקציה בכל נקודה קריטית
            const evaluations = [];
            for (const point of criticalPoints) {
                try {
                    // החלף משתנה עם ערך
                    const substituted = nerdamer(expression, { [variable]: point });
                    const valueStr = substituted.toString();
                    const value = parseFloat(valueStr);

                    console.log(`   📊 At ${variable}=${point}: value = ${value}`);

                    evaluations.push({
                        point: point,
                        value: value,
                        isValid: !isNaN(value) && isFinite(value)
                    });
                } catch (evalError) {
                    console.error(`   ❌ Evaluation error at ${point}:`, evalError.message);
                    evaluations.push({
                        point: point,
                        value: null,
                        isValid: false
                    });
                }
            }

            // שלב 4: מצא מקסימום
            const validEvaluations = evaluations.filter(e => e.isValid);

            if (validEvaluations.length === 0) {
                return {
                    success: false,
                    reason: 'evaluation_failed',
                    confidence: 30
                };
            }

            // זהה אם מחפשים מקסימום או מינימום
            const questionLower = originalQuestion.toLowerCase();
            const seekingMaximum = questionLower.includes('מקסימום') ||
                questionLower.includes('maximum');
            const seekingMinimum = questionLower.includes('מינימום') ||
                questionLower.includes('minimum');

            let extremum;
            if (seekingMaximum || !seekingMinimum) {
                // ברירת מחדל: מקסימום
                extremum = validEvaluations.reduce((max, curr) =>
                    curr.value > max.value ? curr : max
                );
                console.log('   ✅ Maximum found:', extremum);
            } else {
                extremum = validEvaluations.reduce((min, curr) =>
                    curr.value < min.value ? curr : min
                );
                console.log('   ✅ Minimum found:', extremum);
            }

            // שלב 5: פרמט תשובה
            const answer = this.formatOptimizationAnswer(extremum, extracted, originalQuestion);

            return {
                success: true,
                answer: answer,
                workingSteps: [
                    `פונקציה: ${expression}`,
                    `נגזרת ראשונה: ${derivative}`,
                    `נקודות קריטיות: ${criticalPoints.join(', ')}`,
                    `הערכה: ${variable}=${extremum.point} → ${extremum.value}`,
                    `תשובה סופית: ${answer}`
                ],
                confidence: 95,
                method: 'symbolic_calculus',
                details: {
                    derivative: derivative,
                    criticalPoints: criticalPoints,
                    extremum: extremum,
                    allEvaluations: validEvaluations
                }
            };

        } catch (error) {
            console.error('   ❌ Optimization error:', error.message);
            return {
                success: false,
                reason: 'optimization_failed',
                error: error.message,
                confidence: 0
            };
        }
    }

    /**
     * 🔢 פרס נקודות קריטיות מפלט nerdamer
     */
    parseCriticalPoints(raw) {
        try {
            // הסר סוגריים ופצל
            const cleaned = raw.replace(/[\[\]]/g, '').trim();

            if (!cleaned) return [];

            const points = cleaned.split(',').map(p => {
                const trimmed = p.trim();
                const num = parseFloat(trimmed);
                return isNaN(num) ? null : num;
            }).filter(p => p !== null && isFinite(p));

            return points;

        } catch (error) {
            console.error('   ⚠️ Parse error:', error.message);
            return [];
        }
    }

    /**
     * 📝 פרמט תשובת אופטימיזציה לפי הקשר השאלה
     */
    formatOptimizationAnswer(extremum, extracted, originalQuestion) {
        const { point, value } = extremum;
        const { variable } = extracted;

        // פרמט מספרים יפה
        const pointFormatted = this.formatNumber(point);
        const valueFormatted = this.formatNumber(value);

        const questionLower = originalQuestion.toLowerCase();

        // זהה יחידות והקשר
        let answer = '';

        // אם יש שאלה על מחיר
        if (questionLower.includes('מחיר') || questionLower.includes('price')) {
            // בדוק אם מדובר במאות שקלים
            if (questionLower.includes('מאות') || questionLower.includes('hundreds')) {
                const actualPrice = point * 100;
                answer = `מחיר: ${actualPrice} שקלים`;
            } else {
                answer = `מחיר: ${pointFormatted} שקלים`;
            }
        }

        // אם יש שאלה על רווח
        if (questionLower.includes('רווח') || questionLower.includes('profit')) {
            // בדוק אם מדובר באלפי שקלים
            if (questionLower.includes('אלפי') || questionLower.includes('thousands')) {
                const actualProfit = value * 1000;
                if (answer) {
                    answer += `, רווח: ${this.formatNumber(actualProfit)} שקלים`;
                } else {
                    answer = `רווח: ${this.formatNumber(actualProfit)} שקלים`;
                }
            } else {
                if (answer) {
                    answer += `, רווח: ${valueFormatted}`;
                } else {
                    answer = `רווח: ${valueFormatted}`;
                }
            }
        }

        // אם לא זיהינו הקשר ספציפי
        if (!answer) {
            answer = `${variable}=${pointFormatted}, ערך=${valueFormatted}`;
        }

        return answer;
    }

    /**
     * 🔢 פרמט מספר (הסר עשרוניות מיותרות)
     */
    formatNumber(num) {
        if (num === Math.floor(num)) {
            return num.toString();
        }

        // עד 2 ספרות אחרי הנקודה העשרונית
        const formatted = num.toFixed(2).replace(/\.?0+$/, '');
        return formatted;
    }

    /**
     * 📊 חלץ משוואה פולינומית
     */
    extractPolynomial(question) {
        // חפש משוואה: ax² + bx + c = 0
        const match = question.match(/([^=]+)=\s*0/);

        if (match) {
            const expression = this.normalizeExpression(match[1]);
            const variable = this.detectVariable(expression);

            return {
                success: true,
                type: 'polynomial_roots',
                expression: expression,
                variable: variable
            };
        }

        return { success: false };
    }

    /**
     * 🎯 פתור משוואה פולינומית
     */
    async solvePolynomialRoots(extracted) {
        try {
            const { expression, variable } = extracted;

            console.log('   🔢 Solving polynomial equation...');

            const rootsRaw = nerdamer.solve(expression, variable).toString();
            console.log('   📍 Roots (raw):', rootsRaw);

            const roots = this.parseCriticalPoints(rootsRaw);
            console.log('   📍 Roots (parsed):', roots);

            if (roots.length === 0) {
                return {
                    success: false,
                    reason: 'no_roots',
                    confidence: 50
                };
            }

            return {
                success: true,
                answer: roots.map(r => `${variable}=${this.formatNumber(r)}`).join(', '),
                workingSteps: [
                    `משוואה: ${expression} = 0`,
                    `פתרון: ${roots.map(r => this.formatNumber(r)).join(', ')}`
                ],
                confidence: 95,
                method: 'polynomial_solver',
                details: { roots }
            };

        } catch (error) {
            console.error('   ❌ Polynomial error:', error.message);
            return {
                success: false,
                reason: 'solving_failed',
                confidence: 0
            };
        }
    }

    /**
     * ➕ חלץ ביטוי אריתמטי פשוט
     */
    extractSimpleExpression(question) {
        const match = question.match(/[\d\s\+\-\*\/\(\)\.]+/);

        if (match) {
            return {
                success: true,
                type: 'simple_calculation',
                expression: match[0].trim()
            };
        }

        return { success: false };
    }

    /**
     * 🎯 פתור חישוב פשוט
     */
    async solveSimpleCalculation(extracted) {
        try {
            const result = math.evaluate(extracted.expression);

            return {
                success: true,
                answer: this.formatNumber(result),
                workingSteps: [`${extracted.expression} = ${result}`],
                confidence: 100,
                method: 'arithmetic'
            };

        } catch (error) {
            return {
                success: false,
                reason: 'calculation_failed',
                confidence: 0
            };
        }
    }
    /**
     * 🔍 Validate result against known correct answer
     */
    validateAgainstCorrectAnswer(result, correctAnswer) {
        if (!result.success || !correctAnswer) {
            return { valid: true, reason: null };
        }

        // Clean both answers
        const cleanAnswer = (str) => String(str)
            .replace(/[א-ת\s]/g, '')
            .replace(/[₪$€£¥]/g, '')
            .replace(/[^\d.,\/-]/g, '')
            .trim();

        const ourAnswer = cleanAnswer(result.answer);
        const expectedAnswer = cleanAnswer(correctAnswer);

        console.log('   🔍 Validating:', {
            ourAnswer,
            expectedAnswer
        });

        // Extract primary numbers
        const extractMainNumber = (str) => {
            const matches = str.match(/\d+\.?\d*/g);
            return matches ? parseFloat(matches[0]) : null;
        };

        const ourNum = extractMainNumber(ourAnswer);
        const expectedNum = extractMainNumber(expectedAnswer);

        if (ourNum && expectedNum) {
            const diff = Math.abs(ourNum - expectedNum);
            const threshold = Math.max(Math.abs(ourNum), Math.abs(expectedNum)) * 0.1; // 10% tolerance

            if (diff > threshold) {
                console.log('   ⚠️ MISMATCH DETECTED!');
                console.log('      Our:', ourNum);
                console.log('      Expected:', expectedNum);
                console.log('      Diff:', diff);
                console.log('      Threshold:', threshold);

                return {
                    valid: false,
                    reason: 'significant_difference',
                    ourAnswer: ourNum,
                    expectedAnswer: expectedNum,
                    difference: diff
                };
            }
        }

        return { valid: true, reason: null };
    }
    /**
     *
     *
     * 📊 העריכה מורכבות של שאלה
     */
    assessComplexity(question) {
        let score = 0;
        const reasons = [];

        // פולינומים ממעלה 3 ומעלה
        if (/x³|x\^3|x⁴|x\^4|p³|p\^3/.test(question)) {
            score += 3;
            reasons.push('cubic_or_higher_polynomial');
        }

        // משתנים מרובים
        const variables = question.match(/[a-z]/gi) || [];
        const uniqueVars = new Set(variables.map(v => v.toLowerCase()));
        if (uniqueVars.size > 1) {
            score += 2;
            reasons.push('multiple_variables');
        }

        // פונקציות מורכבות
        if (/sin|cos|tan|log|ln|e\^|√/.test(question)) {
            score += 2;
            reasons.push('transcendental_functions');
        }

        // בעיות מילוליות ארוכות
        if (question.length > 200) {
            score += 1;
            reasons.push('long_word_problem');
        }

        // קבע רמה
        let level = 'simple';
        if (score >= 5) level = 'very_complex';
        else if (score >= 3) level = 'complex';
        else if (score >= 1) level = 'moderate';

        return {
            score,
            level,
            reasons,
            isComplex: score >= 3
        };
    }
}

export default new MathCalculationService();