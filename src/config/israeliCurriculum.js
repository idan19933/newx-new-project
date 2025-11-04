// src/config/israeliCurriculum.js - COMPREHENSIVE ISRAELI MATH CURRICULUM
// Updated for תשפ"ה (2024-2025) Reform

export const ISRAELI_CURRICULUM = {
    // ========================================
    // כיתה ז׳ - Grade 7
    // ========================================
    grade_7: {
        id: 'grade_7',
        name: 'כיתה ז׳',
        nameEn: 'Grade 7',
        emoji: '🎯',
        topics: [
            {
                id: 'integers',
                name: 'מספרים שלמים',
                nameEn: 'Integers',
                icon: '➕',
                difficulty: 'beginner',
                subtopics: [
                    { id: 'positive-negative', name: 'מספרים חיוביים ושליליים', nameEn: 'Positive and Negative Numbers' },
                    { id: 'number-line', name: 'ציר המספרים', nameEn: 'Number Line' },
                    { id: 'comparing-integers', name: 'השוואת מספרים שלמים', nameEn: 'Comparing Integers' },
                    { id: 'absolute-value', name: 'ערך מוחלט', nameEn: 'Absolute Value' },
                    { id: 'addition-subtraction', name: 'חיבור וחיסור', nameEn: 'Addition and Subtraction' },
                    { id: 'multiplication-division', name: 'כפל וחילוק', nameEn: 'Multiplication and Division' },
                    { id: 'order-of-operations', name: 'סדר פעולות חשבון', nameEn: 'Order of Operations' },
                    { id: 'integer-word-problems', name: 'בעיות מילוליות במספרים שלמים', nameEn: 'Integer Word Problems' }
                ]
            },
            {
                id: 'fractions',
                name: 'שברים',
                nameEn: 'Fractions',
                icon: '¾',
                difficulty: 'beginner',
                subtopics: [
                    { id: 'fraction-basics', name: 'יסודות השברים', nameEn: 'Fraction Basics' },
                    { id: 'proper-improper', name: 'שברים פשוטים ולא פשוטים', nameEn: 'Proper and Improper Fractions' },
                    { id: 'equivalent-fractions', name: 'שברים שקולים', nameEn: 'Equivalent Fractions' },
                    { id: 'simplifying-fractions', name: 'צמצום שברים', nameEn: 'Simplifying Fractions' },
                    { id: 'comparing-fractions', name: 'השוואת שברים', nameEn: 'Comparing Fractions' },
                    { id: 'adding-fractions', name: 'חיבור שברים', nameEn: 'Adding Fractions' },
                    { id: 'subtracting-fractions', name: 'חיסור שברים', nameEn: 'Subtracting Fractions' },
                    { id: 'multiplying-fractions', name: 'כפל שברים', nameEn: 'Multiplying Fractions' },
                    { id: 'dividing-fractions', name: 'חילוק שברים', nameEn: 'Dividing Fractions' },
                    { id: 'mixed-numbers', name: 'מספרים מעורבים', nameEn: 'Mixed Numbers' },
                    { id: 'fraction-word-problems', name: 'בעיות מילוליות בשברים', nameEn: 'Fraction Word Problems' }
                ]
            },
            {
                id: 'decimals',
                name: 'מספרים עשרוניים',
                nameEn: 'Decimals',
                icon: '0.5',
                difficulty: 'beginner',
                subtopics: [
                    { id: 'decimal-basics', name: 'יסודות העשרוניים', nameEn: 'Decimal Basics' },
                    { id: 'place-value', name: 'ערך מקומי', nameEn: 'Place Value' },
                    { id: 'comparing-decimals', name: 'השוואת עשרוניים', nameEn: 'Comparing Decimals' },
                    { id: 'rounding-decimals', name: 'עיגול עשרוניים', nameEn: 'Rounding Decimals' },
                    { id: 'adding-decimals', name: 'חיבור עשרוניים', nameEn: 'Adding Decimals' },
                    { id: 'subtracting-decimals', name: 'חיסור עשרוניים', nameEn: 'Subtracting Decimals' },
                    { id: 'multiplying-decimals', name: 'כפל עשרוניים', nameEn: 'Multiplying Decimals' },
                    { id: 'dividing-decimals', name: 'חילוק עשרוניים', nameEn: 'Dividing Decimals' },
                    { id: 'fraction-decimal-conversion', name: 'המרה בין שברים לעשרוניים', nameEn: 'Fraction-Decimal Conversion' }
                ]
            },
            {
                id: 'percentages',
                name: 'אחוזים',
                nameEn: 'Percentages',
                icon: '%',
                difficulty: 'beginner',
                subtopics: [
                    { id: 'percent-basics', name: 'מושג האחוז', nameEn: 'Percentage Concept' },
                    { id: 'percent-decimal-fraction', name: 'אחוזים, עשרוניים ושברים', nameEn: 'Percent, Decimal, Fraction' },
                    { id: 'finding-percentage', name: 'חישוב אחוזים ממספר', nameEn: 'Finding Percentage of a Number' },
                    { id: 'finding-whole', name: 'מציאת השלם מאחוז', nameEn: 'Finding the Whole from Percent' },
                    { id: 'percent-increase', name: 'עלייה באחוזים', nameEn: 'Percentage Increase' },
                    { id: 'percent-decrease', name: 'ירידה באחוזים', nameEn: 'Percentage Decrease' },
                    { id: 'percent-word-problems', name: 'בעיות מילוליות באחוזים', nameEn: 'Percent Word Problems' },
                    { id: 'discount-tax', name: 'הנחה ומע״מ', nameEn: 'Discount and Tax' }
                ]
            },
            {
                id: 'algebra-intro',
                name: 'יסודות האלגברה',
                nameEn: 'Algebra Basics',
                icon: 'x',
                difficulty: 'intermediate',
                subtopics: [
                    { id: 'variables', name: 'משתנים', nameEn: 'Variables' },
                    { id: 'algebraic-expressions', name: 'ביטויים אלגבריים', nameEn: 'Algebraic Expressions' },
                    { id: 'evaluating-expressions', name: 'הצבה בביטויים', nameEn: 'Evaluating Expressions' },
                    { id: 'combining-like-terms', name: 'איחוד איברים דומים', nameEn: 'Combining Like Terms' },
                    { id: 'simplifying-expressions', name: 'צמצום ביטויים', nameEn: 'Simplifying Expressions' },
                    { id: 'distributive-property', name: 'חוק הפילוג', nameEn: 'Distributive Property' },
                    { id: 'one-step-equations', name: 'משוואות בשלב אחד', nameEn: 'One-Step Equations' },
                    { id: 'two-step-equations', name: 'משוואות בשני שלבים', nameEn: 'Two-Step Equations' },
                    { id: 'equation-word-problems', name: 'בעיות מילוליות במשוואות', nameEn: 'Equation Word Problems' }
                ]
            },
            {
                id: 'geometry-basic',
                name: 'גאומטריה בסיסית',
                nameEn: 'Basic Geometry',
                icon: '📐',
                difficulty: 'beginner',
                subtopics: [
                    { id: 'points-lines-planes', name: 'נקודות, קווים ומישורים', nameEn: 'Points, Lines, Planes' },
                    { id: 'angles-basics', name: 'יסודות הזוויות', nameEn: 'Angle Basics' },
                    { id: 'measuring-angles', name: 'מדידת זוויות', nameEn: 'Measuring Angles' },
                    { id: 'angle-types', name: 'סוגי זוויות', nameEn: 'Types of Angles' },
                    { id: 'complementary-supplementary', name: 'זוויות משלימות ונגדיות', nameEn: 'Complementary and Supplementary' },
                    { id: 'triangles-intro', name: 'מבוא למשולשים', nameEn: 'Introduction to Triangles' },
                    { id: 'triangle-types', name: 'סוגי משולשים', nameEn: 'Types of Triangles' },
                    { id: 'triangle-angles', name: 'זוויות במשולש', nameEn: 'Triangle Angles' },
                    { id: 'quadrilaterals', name: 'מרובעים', nameEn: 'Quadrilaterals' },
                    { id: 'perimeter', name: 'היקף', nameEn: 'Perimeter' },
                    { id: 'area-rectangles', name: 'שטח מלבנים', nameEn: 'Area of Rectangles' },
                    { id: 'area-triangles', name: 'שטח משולשים', nameEn: 'Area of Triangles' }
                ]
            },
            {
                id: 'ratios',
                name: 'יחסים',
                nameEn: 'Ratios',
                icon: ':',
                difficulty: 'intermediate',
                subtopics: [
                    { id: 'ratio-basics', name: 'מושג היחס', nameEn: 'Ratio Concept' },
                    { id: 'equivalent-ratios', name: 'יחסים שקולים', nameEn: 'Equivalent Ratios' },
                    { id: 'simplifying-ratios', name: 'צמצום יחסים', nameEn: 'Simplifying Ratios' },
                    { id: 'ratio-word-problems', name: 'בעיות מילוליות ביחסים', nameEn: 'Ratio Word Problems' },
                    { id: 'unit-rates', name: 'שיעורים', nameEn: 'Unit Rates' },
                    { id: 'scale-drawings', name: 'רישומים בקנה מידה', nameEn: 'Scale Drawings' }
                ]
            },
            {
                id: 'statistics-intro',
                name: 'סטטיסטיקה בסיסית',
                nameEn: 'Basic Statistics',
                icon: '📊',
                difficulty: 'beginner',
                subtopics: [
                    { id: 'data-collection', name: 'איסוף נתונים', nameEn: 'Data Collection' },
                    { id: 'frequency-tables', name: 'טבלאות שכיחות', nameEn: 'Frequency Tables' },
                    { id: 'bar-graphs', name: 'גרפים עמודיים', nameEn: 'Bar Graphs' },
                    { id: 'line-graphs', name: 'גרפי קו', nameEn: 'Line Graphs' },
                    { id: 'pie-charts', name: 'גרפים עוגה', nameEn: 'Pie Charts' },
                    { id: 'mean-average', name: 'ממוצע', nameEn: 'Mean (Average)' },
                    { id: 'median', name: 'חציון', nameEn: 'Median' },
                    { id: 'mode', name: 'שכיח', nameEn: 'Mode' },
                    { id: 'range', name: 'טווח', nameEn: 'Range' }
                ]
            }
        ]
    },

    // ========================================
    // כיתה ח׳ - Grade 8
    // ========================================
    grade_8: {
        id: 'grade_8',
        name: 'כיתה ח׳',
        nameEn: 'Grade 8',
        emoji: '🚀',
        topics: [
            {
                id: 'linear-equations',
                name: 'משוואות לינאריות',
                nameEn: 'Linear Equations',
                icon: '📈',
                difficulty: 'intermediate',
                subtopics: [
                    { id: 'multi-step-equations', name: 'משוואות מרובות שלבים', nameEn: 'Multi-Step Equations' },
                    { id: 'equations-fractions', name: 'משוואות עם שברים', nameEn: 'Equations with Fractions' },
                    { id: 'equations-decimals', name: 'משוואות עם עשרוניים', nameEn: 'Equations with Decimals' },
                    { id: 'equations-brackets', name: 'משוואות עם סוגריים', nameEn: 'Equations with Brackets' },
                    { id: 'variables-both-sides', name: 'משתנים בשני אגפים', nameEn: 'Variables on Both Sides' },
                    { id: 'solving-for-variable', name: 'פתרון למשתנה', nameEn: 'Solving for a Variable' },
                    { id: 'literal-equations', name: 'משוואות מילוליות', nameEn: 'Literal Equations' },
                    { id: 'word-problems-equations', name: 'בעיות מילוליות', nameEn: 'Word Problems' }
                ]
            },
            {
                id: 'inequalities',
                name: 'אי-שוויונות',
                nameEn: 'Inequalities',
                icon: '<',
                difficulty: 'intermediate',
                subtopics: [
                    { id: 'inequality-basics', name: 'יסודות אי-שוויונות', nameEn: 'Inequality Basics' },
                    { id: 'solving-inequalities', name: 'פתרון אי-שוויונות', nameEn: 'Solving Inequalities' },
                    { id: 'graphing-inequalities', name: 'ייצוג גרפי של אי-שוויונות', nameEn: 'Graphing Inequalities' },
                    { id: 'compound-inequalities', name: 'אי-שוויונות מורכבות', nameEn: 'Compound Inequalities' },
                    { id: 'inequality-word-problems', name: 'בעיות מילוליות באי-שוויונות', nameEn: 'Inequality Word Problems' }
                ]
            },
            {
                id: 'systems-of-equations',
                name: 'מערכות משוואות',
                nameEn: 'Systems of Equations',
                icon: '⚖️',
                difficulty: 'intermediate',
                subtopics: [
                    { id: 'systems-basics', name: 'מבוא למערכות', nameEn: 'Introduction to Systems' },
                    { id: 'solving-graphing', name: 'פתרון גרפי', nameEn: 'Solving by Graphing' },
                    { id: 'solving-substitution', name: 'פתרון בהצבה', nameEn: 'Solving by Substitution' },
                    { id: 'solving-elimination', name: 'פתרון בחיסור/חיבור', nameEn: 'Solving by Elimination' },
                    { id: 'systems-word-problems', name: 'בעיות מילוליות במערכות', nameEn: 'Systems Word Problems' }
                ]
            },
            {
                id: 'proportions',
                name: 'פרופורציה ויחסים',
                nameEn: 'Proportions and Ratios',
                icon: '=',
                difficulty: 'intermediate',
                subtopics: [
                    { id: 'proportions-basics', name: 'מושג הפרופורציה', nameEn: 'Proportion Concept' },
                    { id: 'solving-proportions', name: 'פתרון פרופורציות', nameEn: 'Solving Proportions' },
                    { id: 'direct-proportion', name: 'פרופורציה ישרה', nameEn: 'Direct Proportion' },
                    { id: 'inverse-proportion', name: 'פרופורציה הפוכה', nameEn: 'Inverse Proportion' },
                    { id: 'proportion-word-problems', name: 'בעיות מילוליות בפרופורציה', nameEn: 'Proportion Word Problems' },
                    { id: 'percent-proportion', name: 'אחוזים ופרופורציה', nameEn: 'Percent and Proportion' }
                ]
            },
            {
                id: 'exponents',
                name: 'חזקות',
                nameEn: 'Exponents',
                icon: 'x²',
                difficulty: 'intermediate',
                subtopics: [
                    { id: 'exponent-basics', name: 'יסודות חזקות', nameEn: 'Exponent Basics' },
                    { id: 'product-rule', name: 'כפל חזקות', nameEn: 'Product Rule' },
                    { id: 'quotient-rule', name: 'חילוק חזקות', nameEn: 'Quotient Rule' },
                    { id: 'power-of-power', name: 'חזקה של חזקה', nameEn: 'Power of a Power' },
                    { id: 'zero-exponent', name: 'חזקה אפס', nameEn: 'Zero Exponent' },
                    { id: 'negative-exponents', name: 'חזקות שליליות', nameEn: 'Negative Exponents' },
                    { id: 'scientific-notation', name: 'סימון מדעי', nameEn: 'Scientific Notation' }
                ]
            },
            {
                id: 'polynomials',
                name: 'פולינומים',
                nameEn: 'Polynomials',
                icon: 'x²+x',
                difficulty: 'advanced',
                subtopics: [
                    { id: 'polynomial-basics', name: 'מושג הפולינום', nameEn: 'Polynomial Concept' },
                    { id: 'adding-polynomials', name: 'חיבור פולינומים', nameEn: 'Adding Polynomials' },
                    { id: 'subtracting-polynomials', name: 'חיסור פולינומים', nameEn: 'Subtracting Polynomials' },
                    { id: 'multiplying-monomials', name: 'כפל מונומים', nameEn: 'Multiplying Monomials' },
                    { id: 'expand-brackets', name: 'פתיחת סוגריים', nameEn: 'Expanding Brackets' },
                    { id: 'distributive-advanced', name: 'חוק הפילוג מתקדם', nameEn: 'Advanced Distributive Property' },
                    { id: 'common-factor', name: 'הוצאת גורם משותף', nameEn: 'Common Factor' },
                    { id: 'factoring-basics', name: 'פירוק לגורמים בסיסי', nameEn: 'Basic Factoring' }
                ]
            },
            {
                id: 'functions-intro',
                name: 'מבוא לפונקציות',
                nameEn: 'Introduction to Functions',
                icon: 'f(x)',
                difficulty: 'intermediate',
                subtopics: [
                    { id: 'function-concept', name: 'מושג הפונקציה', nameEn: 'Function Concept' },
                    { id: 'function-notation', name: 'סימון פונקציות', nameEn: 'Function Notation' },
                    { id: 'evaluating-functions', name: 'הצבה בפונקציות', nameEn: 'Evaluating Functions' },
                    { id: 'domain-range', name: 'תחום ותמונה', nameEn: 'Domain and Range' },
                    { id: 'function-tables', name: 'טבלאות פונקציות', nameEn: 'Function Tables' }
                ]
            },
            {
                id: 'linear-functions',
                name: 'פונקציות לינאריות',
                nameEn: 'Linear Functions',
                icon: '📈',
                difficulty: 'intermediate',
                subtopics: [
                    { id: 'coordinate-plane', name: 'מערכת צירים', nameEn: 'Coordinate Plane' },
                    { id: 'plotting-points', name: 'סימון נקודות', nameEn: 'Plotting Points' },
                    { id: 'linear-graphs', name: 'גרפים לינאריים', nameEn: 'Linear Graphs' },
                    { id: 'slope', name: 'שיפוע', nameEn: 'Slope' },
                    { id: 'slope-formula', name: 'נוסחת השיפוע', nameEn: 'Slope Formula' },
                    { id: 'y-intercept', name: 'נקודת חיתוך עם ציר Y', nameEn: 'Y-Intercept' },
                    { id: 'slope-intercept-form', name: 'צורת שיפוע-חיתוך', nameEn: 'Slope-Intercept Form' },
                    { id: 'graphing-linear-equations', name: 'שרטוט משוואות לינאריות', nameEn: 'Graphing Linear Equations' },
                    { id: 'writing-linear-equations', name: 'כתיבת משוואות לינאריות', nameEn: 'Writing Linear Equations' }
                ]
            },
            {
                id: 'similarity-congruence',
                name: 'דמיון וחפיפה',
                nameEn: 'Similarity and Congruence',
                icon: '△',
                difficulty: 'intermediate',
                subtopics: [
                    { id: 'congruence-concept', name: 'מושג החפיפה', nameEn: 'Congruence Concept' },
                    { id: 'congruent-triangles', name: 'משולשים חופפים', nameEn: 'Congruent Triangles' },
                    { id: 'similarity-concept', name: 'מושג הדמיון', nameEn: 'Similarity Concept' },
                    { id: 'similar-triangles', name: 'משולשים דומים', nameEn: 'Similar Triangles' },
                    { id: 'similarity-ratio', name: 'יחס דמיון', nameEn: 'Similarity Ratio' },
                    { id: 'thales-theorem', name: 'משפט תאלס', nameEn: 'Thales Theorem' },
                    { id: 'similarity-applications', name: 'יישומי דמיון', nameEn: 'Similarity Applications' }
                ]
            },
            {
                id: 'pythagorean-theorem',
                name: 'משפט פיתגורס',
                nameEn: 'Pythagorean Theorem',
                icon: 'a²+b²',
                difficulty: 'intermediate',
                subtopics: [
                    { id: 'pythagorean-basics', name: 'מושג משפט פיתגורס', nameEn: 'Pythagorean Concept' },
                    { id: 'finding-hypotenuse', name: 'מציאת היתר', nameEn: 'Finding Hypotenuse' },
                    { id: 'finding-leg', name: 'מציאת ניצב', nameEn: 'Finding a Leg' },
                    { id: 'pythagorean-word-problems', name: 'בעיות מילוליות בפיתגורס', nameEn: 'Pythagorean Word Problems' },
                    { id: 'distance-formula', name: 'נוסחת המרחק', nameEn: 'Distance Formula' }
                ]
            },
            {
                id: 'volume-surface-area',
                name: 'נפח ושטח פנים',
                nameEn: 'Volume and Surface Area',
                icon: '📦',
                difficulty: 'intermediate',
                subtopics: [
                    { id: 'volume-prisms', name: 'נפח מנסרות', nameEn: 'Volume of Prisms' },
                    { id: 'volume-cylinders', name: 'נפח גלילים', nameEn: 'Volume of Cylinders' },
                    { id: 'surface-area-prisms', name: 'שטח פנים מנסרות', nameEn: 'Surface Area of Prisms' },
                    { id: 'surface-area-cylinders', name: 'שטח פנים גלילים', nameEn: 'Surface Area of Cylinders' }
                ]
            },
            {
                id: 'data-analysis',
                name: 'ניתוח נתונים',
                nameEn: 'Data Analysis',
                icon: '📊',
                difficulty: 'intermediate',
                subtopics: [
                    { id: 'scatter-plots', name: 'גרפי פיזור', nameEn: 'Scatter Plots' },
                    { id: 'line-of-best-fit', name: 'קו המגמה', nameEn: 'Line of Best Fit' },
                    { id: 'correlation', name: 'מתאם', nameEn: 'Correlation' },
                    { id: 'box-plots', name: 'תרשימי קופסה', nameEn: 'Box Plots' },
                    { id: 'quartiles', name: 'רבעונים', nameEn: 'Quartiles' }
                ]
            }
        ]
    },

    // ========================================
    // כיתה ט׳ - Grade 9
    // ========================================
    grade_9: {
        id: 'grade_9',
        name: 'כיתה ט׳',
        nameEn: 'Grade 9',
        emoji: '🎓',
        topics: [
            {
                id: 'quadratic-equations',
                name: 'משוואות ריבועיות',
                nameEn: 'Quadratic Equations',
                icon: 'x²',
                difficulty: 'advanced',
                subtopics: [
                    { id: 'quadratic-basics', name: 'מושג המשוואה הריבועית', nameEn: 'Quadratic Equation Concept' },
                    { id: 'quadratic-standard-form', name: 'צורה סטנדרטית', nameEn: 'Standard Form' },
                    { id: 'solving-by-square-root', name: 'פתרון בשורש', nameEn: 'Solving by Square Root' },
                    { id: 'quadratic-factoring', name: 'פתרון בפירוק לגורמים', nameEn: 'Solving by Factoring' },
                    { id: 'completing-the-square', name: 'השלמה לריבוע', nameEn: 'Completing the Square' },
                    { id: 'quadratic-formula', name: 'נוסחת השורשים', nameEn: 'Quadratic Formula' },
                    { id: 'discriminant', name: 'דיסקרימיננטה', nameEn: 'Discriminant' },
                    { id: 'quadratic-word-problems', name: 'בעיות מילוליות', nameEn: 'Word Problems' }
                ]
            },
            {
                id: 'quadratic-functions',
                name: 'פונקציות ריבועיות',
                nameEn: 'Quadratic Functions',
                icon: 'y=x²',
                difficulty: 'advanced',
                subtopics: [
                    { id: 'parabola-basics', name: 'מושג הפרבולה', nameEn: 'Parabola Concept' },
                    { id: 'graphing-parabolas', name: 'שרטוט פרבולות', nameEn: 'Graphing Parabolas' },
                    { id: 'vertex', name: 'קודקוד', nameEn: 'Vertex' },
                    { id: 'axis-of-symmetry', name: 'ציר סימטריה', nameEn: 'Axis of Symmetry' },
                    { id: 'vertex-form', name: 'צורת קודקוד', nameEn: 'Vertex Form' },
                    { id: 'transformations', name: 'טרנספורמציות', nameEn: 'Transformations' },
                    { id: 'intercepts', name: 'נקודות חיתוך', nameEn: 'Intercepts' }
                ]
            },
            {
                id: 'powers-roots',
                name: 'חזקות ושורשים',
                nameEn: 'Powers and Roots',
                icon: '√',
                difficulty: 'intermediate',
                subtopics: [
                    { id: 'square-roots', name: 'שורש ריבועי', nameEn: 'Square Root' },
                    { id: 'cube-roots', name: 'שורש שלישי', nameEn: 'Cube Root' },
                    { id: 'nth-roots', name: 'שורש n-י', nameEn: 'nth Root' },
                    { id: 'power-rules-review', name: 'חזרה חוקי חזקות', nameEn: 'Power Rules Review' },
                    { id: 'rational-exponents', name: 'חזקות רציונליות', nameEn: 'Rational Exponents' },
                    { id: 'simplifying-roots', name: 'פישוט שורשים', nameEn: 'Simplifying Roots' },
                    { id: 'operations-with-roots', name: 'פעולות בשורשים', nameEn: 'Operations with Roots' },
                    { id: 'rationalizing-denominator', name: 'רציונליזציה של מכנה', nameEn: 'Rationalizing Denominator' }
                ]
            },
            {
                id: 'polynomials-advanced',
                name: 'פולינומים מתקדם',
                nameEn: 'Advanced Polynomials',
                icon: 'P(x)',
                difficulty: 'advanced',
                subtopics: [
                    { id: 'polynomial-operations', name: 'פעולות בפולינומים', nameEn: 'Polynomial Operations' },
                    { id: 'multiplying-binomials', name: 'כפל בינומים', nameEn: 'Multiplying Binomials' },
                    { id: 'special-products', name: 'נוסחאות כפל מקוצר', nameEn: 'Special Products' },
                    { id: 'difference-of-squares', name: 'הפרש ריבועים', nameEn: 'Difference of Squares' },
                    { id: 'perfect-square-trinomial', name: 'ריבוע בינום', nameEn: 'Perfect Square Trinomial' },
                    { id: 'factoring-trinomials', name: 'פירוק טרינומים', nameEn: 'Factoring Trinomials' },
                    { id: 'factoring-by-grouping', name: 'פירוק בקיבוץ', nameEn: 'Factoring by Grouping' },
                    { id: 'polynomial-division', name: 'חילוק פולינומים', nameEn: 'Polynomial Division' }
                ]
            },
            {
                id: 'rational-expressions',
                name: 'ביטויים רציונליים',
                nameEn: 'Rational Expressions',
                icon: 'x/y',
                difficulty: 'advanced',
                subtopics: [
                    { id: 'rational-basics', name: 'יסודות ביטויים רציונליים', nameEn: 'Rational Expression Basics' },
                    { id: 'simplifying-rational', name: 'צמצום ביטויים רציונליים', nameEn: 'Simplifying Rational Expressions' },
                    { id: 'multiplying-rational', name: 'כפל ביטויים רציונליים', nameEn: 'Multiplying Rational Expressions' },
                    { id: 'dividing-rational', name: 'חילוק ביטויים רציונליים', nameEn: 'Dividing Rational Expressions' },
                    { id: 'adding-rational', name: 'חיבור ביטויים רציונליים', nameEn: 'Adding Rational Expressions' },
                    { id: 'subtracting-rational', name: 'חיסור ביטויים רציונליים', nameEn: 'Subtracting Rational Expressions' },
                    { id: 'complex-fractions', name: 'שברים מורכבים', nameEn: 'Complex Fractions' },
                    { id: 'rational-equations', name: 'משוואות רציונליות', nameEn: 'Rational Equations' }
                ]
            },
            {
                id: 'circles',
                name: 'מעגלים',
                nameEn: 'Circles',
                icon: '⭕',
                difficulty: 'intermediate',
                subtopics: [
                    { id: 'circle-basics', name: 'יסודות המעגל', nameEn: 'Circle Basics' },
                    { id: 'circle-parts', name: 'חלקי המעגל', nameEn: 'Parts of a Circle' },
                    { id: 'circumference', name: 'היקף מעגל', nameEn: 'Circumference' },
                    { id: 'circle-area', name: 'שטח מעגל', nameEn: 'Circle Area' },
                    { id: 'arcs', name: 'קשתות', nameEn: 'Arcs' },
                    { id: 'sectors', name: 'גזרות', nameEn: 'Sectors' },
                    { id: 'central-angles', name: 'זוויות מרכזיות', nameEn: 'Central Angles' },
                    { id: 'inscribed-angles', name: 'זוויות היקפיות', nameEn: 'Inscribed Angles' }
                ]
            },
            {
                id: 'solid-geometry',
                name: 'גאומטריה במרחב',
                nameEn: 'Solid Geometry',
                icon: '📦',
                difficulty: 'intermediate',
                subtopics: [
                    { id: 'prisms', name: 'מנסרות', nameEn: 'Prisms' },
                    { id: 'cylinders', name: 'גלילים', nameEn: 'Cylinders' },
                    { id: 'pyramids', name: 'פירמידות', nameEn: 'Pyramids' },
                    { id: 'cones', name: 'חרוטים', nameEn: 'Cones' },
                    { id: 'spheres', name: 'כדורים', nameEn: 'Spheres' },
                    { id: 'volume-advanced', name: 'נפח מתקדם', nameEn: 'Advanced Volume' },
                    { id: 'surface-area-advanced', name: 'שטח פנים מתקדם', nameEn: 'Advanced Surface Area' }
                ]
            },
            {
                id: 'trigonometry-intro',
                name: 'טריגונומטריה בסיסית',
                nameEn: 'Basic Trigonometry',
                icon: '∠',
                difficulty: 'advanced',
                subtopics: [
                    { id: 'right-triangles', name: 'משולשים ישרי זווית', nameEn: 'Right Triangles' },
                    { id: 'trig-ratios', name: 'יחסים טריגונומטריים', nameEn: 'Trigonometric Ratios' },
                    { id: 'sine', name: 'סינוס', nameEn: 'Sine' },
                    { id: 'cosine', name: 'קוסינוס', nameEn: 'Cosine' },
                    { id: 'tangent', name: 'טנגנס', nameEn: 'Tangent' },
                    { id: 'finding-sides', name: 'מציאת צלעות', nameEn: 'Finding Sides' },
                    { id: 'finding-angles', name: 'מציאת זוויות', nameEn: 'Finding Angles' },
                    { id: 'trig-word-problems', name: 'בעיות מילוליות', nameEn: 'Trig Word Problems' }
                ]
            },
            {
                id: 'probability',
                name: 'הסתברות',
                nameEn: 'Probability',
                icon: '🎲',
                difficulty: 'intermediate',
                subtopics: [
                    { id: 'probability-basics', name: 'יסודות הסתברות', nameEn: 'Probability Basics' },
                    { id: 'theoretical-probability', name: 'הסתברות תיאורטית', nameEn: 'Theoretical Probability' },
                    { id: 'experimental-probability', name: 'הסתברות ניסיונית', nameEn: 'Experimental Probability' },
                    { id: 'sample-space', name: 'מרחב המדגם', nameEn: 'Sample Space' },
                    { id: 'independent-events', name: 'אירועים בלתי תלויים', nameEn: 'Independent Events' },
                    { id: 'dependent-events', name: 'אירועים תלויים', nameEn: 'Dependent Events' },
                    { id: 'compound-events', name: 'אירועים מורכבים', nameEn: 'Compound Events' },
                    { id: 'permutations', name: 'תמורות', nameEn: 'Permutations' },
                    { id: 'combinations', name: 'צירופים', nameEn: 'Combinations' }
                ]
            },
            {
                id: 'sequences-intro',
                name: 'מבוא לסדרות',
                nameEn: 'Introduction to Sequences',
                icon: '1,2,3...',
                difficulty: 'intermediate',
                subtopics: [
                    { id: 'sequence-basics', name: 'מושג הסדרה', nameEn: 'Sequence Concept' },
                    { id: 'arithmetic-sequences', name: 'סדרות חשבוניות', nameEn: 'Arithmetic Sequences' },
                    { id: 'arithmetic-formula', name: 'נוסחת האיבר הכללי', nameEn: 'General Term Formula' },
                    { id: 'geometric-sequences', name: 'סדרות הנדסיות', nameEn: 'Geometric Sequences' },
                    { id: 'geometric-formula', name: 'נוסחת סדרה הנדסית', nameEn: 'Geometric Formula' }
                ]
            }
        ]
    },

    // ========================================
    // כיתה י׳ - 3 יחידות - תשפ"ה UPDATED
    // ========================================
    grade_10_3: {
        id: 'grade_10_3',
        name: 'כיתה י׳ - 3 יחידות',
        nameEn: 'Grade 10 - 3 Units',
        emoji: '📚',
        implementationYear: 'תשפ"ה',
        reformNotes: {
            removed: ['מסלולים (Routes)', 'ריצופים (Mosaics)'],
            emphasis: [
                'רלוונטיות לחיי היומיום',
                'הבנה וחשיבה מתמטית',
                'אוריינות מתמטית',
                'שילוב כל הנושאים באשכולות'
            ]
        },
        clusters: [
            {
                id: 'science-society',
                name: 'אשכול מדע וחברה',
                nameEn: 'Science & Society Cluster',
                description: 'הסקת מסקנות ממידע בהקשרים חברתיים ומדעיים'
            },
            {
                id: 'economic-financial',
                name: 'אשכול כלכלי-פיננסי',
                nameEn: 'Economic-Financial Cluster',
                description: 'פתרון משימות כלכליות והבנת תופעות פיננסיות'
            },
            {
                id: 'orientation',
                name: 'אשכול התמצאות במישור ובמרחב',
                nameEn: 'Orientation in Plane & Space Cluster',
                description: 'היקפים, שטחים, וחישובים מרחביים'
            }
        ],
        topics: [
            {
                id: 'statistics-data-processing',
                name: 'עיבוד מידע בכלים סטטיסטיים',
                nameEn: 'Statistical Data Processing',
                icon: '📊',
                difficulty: 'intermediate',
                cluster: 'science-society',
                subtopics: [
                    { id: 'data-representation-3', name: 'ייצוגים שונים של מידע', nameEn: 'Different Data Representations' },
                    { id: 'data-conversion', name: 'מעבר בין ייצוגים', nameEn: 'Converting Between Representations' },
                    { id: 'measures-center-3', name: 'מדדי מרכז', nameEn: 'Measures of Center' },
                    { id: 'measures-spread-3', name: 'מדדי פיזור', nameEn: 'Measures of Spread' },
                    { id: 'drawing-conclusions', name: 'הסקת מסקנות ממידע', nameEn: 'Drawing Conclusions from Data' }
                ]
            },
            {
                id: 'probability-3-new',
                name: 'הסתברות',
                nameEn: 'Probability',
                icon: '🎲',
                difficulty: 'intermediate',
                cluster: 'science-society',
                subtopics: [
                    { id: 'probability-basics-3', name: 'יסודות הסתברות', nameEn: 'Probability Basics' },
                    { id: 'calculating-probability', name: 'חישוב הסתברויות', nameEn: 'Calculating Probabilities' },
                    { id: 'probability-applications', name: 'יישומי הסתברות', nameEn: 'Probability Applications' }
                ]
            },
            {
                id: 'perimeters-contexts',
                name: 'היקפים בהקשרים',
                nameEn: 'Perimeters in Context',
                icon: '📐',
                difficulty: 'intermediate',
                cluster: 'orientation',
                subtopics: [
                    { id: 'perimeter-calculations', name: 'חישובי היקפים', nameEn: 'Perimeter Calculations' },
                    { id: 'perimeter-real-world', name: 'היקפים בהקשרים חברתיים ומדעיים', nameEn: 'Perimeters in Social & Scientific Contexts' }
                ]
            },
            {
                id: 'areas-3',
                name: 'שטחים',
                nameEn: 'Areas',
                icon: '□',
                difficulty: 'intermediate',
                cluster: 'orientation',
                subtopics: [
                    { id: 'area-rectangles-3', name: 'שטח מלבנים', nameEn: 'Area of Rectangles' },
                    { id: 'area-triangles-3', name: 'שטח משולשים', nameEn: 'Area of Triangles' },
                    { id: 'area-composite', name: 'שטח צורות מורכבות', nameEn: 'Area of Composite Shapes' },
                    { id: 'area-applications', name: 'יישומי שטחים', nameEn: 'Area Applications' }
                ]
            },
            {
                id: 'economic-tasks',
                name: 'משימות כלכליות',
                nameEn: 'Economic Tasks',
                icon: '💰',
                difficulty: 'intermediate',
                cluster: 'economic-financial',
                subtopics: [
                    { id: 'buying-selling', name: 'קנייה ומכירה', nameEn: 'Buying and Selling' },
                    { id: 'profit-loss', name: 'רווח והפסד', nameEn: 'Profit and Loss' },
                    { id: 'salary-calculation', name: 'שכר עבודה', nameEn: 'Salary Calculation' },
                    { id: 'discount-tax-3', name: 'הנחה ומע״מ', nameEn: 'Discount and Tax' }
                ]
            },
            {
                id: 'linear-model-economic',
                name: 'מודל לינארי לייצוג תופעות כלכליות',
                nameEn: 'Linear Model for Economic Phenomena',
                icon: '📈',
                difficulty: 'intermediate',
                cluster: 'economic-financial',
                subtopics: [
                    { id: 'linear-relationships', name: 'קשרים לינאריים', nameEn: 'Linear Relationships' },
                    { id: 'linear-models-economy', name: 'מודלים לינאריים בכלכלה', nameEn: 'Linear Models in Economics' },
                    { id: 'interpreting-slope-intercept', name: 'פרשנות שיפוע וחיתוך', nameEn: 'Interpreting Slope and Intercept' }
                ]
            },
            {
                id: 'statistical-processing-economic',
                name: 'עיבוד סטטיסטי של מידע כלכלי',
                nameEn: 'Statistical Processing of Economic Data',
                icon: '📊',
                difficulty: 'intermediate',
                cluster: 'economic-financial',
                subtopics: [
                    { id: 'economic-data-analysis', name: 'ניתוח נתונים כלכליים', nameEn: 'Economic Data Analysis' },
                    { id: 'economic-conclusions', name: 'הסקת מסקנות כלכליות', nameEn: 'Drawing Economic Conclusions' }
                ]
            }
        ]
    },

    // ========================================
    // כיתה יא׳ - 3 יחידות - תשפ"ה UPDATED
    // ========================================
    grade_11_3: {
        id: 'grade_11_3',
        name: 'כיתה יא׳ - 3 יחידות',
        nameEn: 'Grade 11 - 3 Units',
        emoji: '📖',
        implementationYear: 'תשפ"ה',
        examInfo: {
            examCode: '35371',
            duration: '2:15',
            structure: '6 שאלות - 2 מכל אשכול',
            weight: '35% מהציון המסכם'
        },
        clusters: [
            {
                id: 'science-society-11',
                name: 'אשכול מדע וחברה',
                nameEn: 'Science & Society Cluster',
                questionCount: 2
            },
            {
                id: 'economic-financial-11',
                name: 'אשכול כלכלי-פיננסי',
                nameEn: 'Economic-Financial Cluster',
                questionCount: 2
            },
            {
                id: 'orientation-11',
                name: 'אשכול התמצאות במישור ובמרחב',
                nameEn: 'Orientation Cluster',
                questionCount: 2
            }
        ],
        topics: [
            {
                id: 'exponential-processes-society',
                name: 'תהליכים מעריכיים - מדע וחברה',
                nameEn: 'Exponential Processes - Science & Society',
                icon: '2ˣ',
                difficulty: 'intermediate',
                cluster: 'science-society-11',
                subtopics: [
                    { id: 'exponential-growth-society', name: 'גדילה מעריכית', nameEn: 'Exponential Growth' },
                    { id: 'exponential-decay-society', name: 'דעיכה מעריכית', nameEn: 'Exponential Decay' },
                    { id: 'exponential-applications-society', name: 'יישומים בהקשר חברתי ומדעי', nameEn: 'Applications in Social & Scientific Context' }
                ]
            },
            {
                id: 'advanced-probability-3',
                name: 'חישוב מתקדם של הסתברות',
                nameEn: 'Advanced Probability Calculation',
                icon: '🎲',
                difficulty: 'intermediate',
                cluster: 'science-society-11',
                subtopics: [
                    { id: 'compound-probability', name: 'הסתברות מורכבת', nameEn: 'Compound Probability' },
                    { id: 'conditional-events', name: 'אירועים מותנים', nameEn: 'Conditional Events' },
                    { id: 'probability-trees', name: 'עצי הסתברות', nameEn: 'Probability Trees' }
                ]
            },
            {
                id: 'advanced-statistics-3',
                name: 'כלים סטטיסטיים מתקדמים',
                nameEn: 'Advanced Statistical Tools',
                icon: '📊',
                difficulty: 'intermediate',
                cluster: 'science-society-11',
                subtopics: [
                    { id: 'standard-deviation-3', name: 'סטיית תקן', nameEn: 'Standard Deviation' },
                    { id: 'quartiles-3', name: 'רבעונים', nameEn: 'Quartiles' },
                    { id: 'deciles', name: 'עשירונים', nameEn: 'Deciles' },
                    { id: 'data-interpretation-advanced', name: 'פרשנות נתונים מתקדמת', nameEn: 'Advanced Data Interpretation' }
                ]
            },
            {
                id: 'exponential-financial',
                name: 'תהליכים מעריכיים - כלכלי פיננסי',
                nameEn: 'Exponential Processes - Financial',
                icon: '💰',
                difficulty: 'intermediate',
                cluster: 'economic-financial-11',
                subtopics: [
                    { id: 'compound-interest-11', name: 'ריבית דריבית', nameEn: 'Compound Interest' },
                    { id: 'financial-growth', name: 'גדילה כלכלית', nameEn: 'Financial Growth' },
                    { id: 'financial-decay', name: 'דעיכה כלכלית', nameEn: 'Financial Decay' },
                    { id: 'investment-calculations', name: 'חישובי השקעות', nameEn: 'Investment Calculations' }
                ]
            },
            {
                id: 'statistical-tools-financial',
                name: 'כלים סטטיסטיים - עיבוד מידע כלכלי',
                nameEn: 'Statistical Tools - Financial Data',
                icon: '📊',
                difficulty: 'intermediate',
                cluster: 'economic-financial-11',
                subtopics: [
                    { id: 'financial-data-processing', name: 'עיבוד נתונים כלכליים', nameEn: 'Financial Data Processing' },
                    { id: 'standard-deviation-financial', name: 'סטיית תקן במידע כלכלי', nameEn: 'Standard Deviation in Financial Data' },
                    { id: 'financial-analysis', name: 'ניתוח כלכלי', nameEn: 'Financial Analysis' }
                ]
            },
            {
                id: 'ratio-proportion-11',
                name: 'יחס ופרופורציה',
                nameEn: 'Ratio and Proportion',
                icon: ':',
                difficulty: 'intermediate',
                cluster: 'orientation-11',
                subtopics: [
                    { id: 'ratio-applications-11', name: 'יישומי יחס', nameEn: 'Ratio Applications' },
                    { id: 'proportion-problems-11', name: 'בעיות פרופורציה', nameEn: 'Proportion Problems' },
                    { id: 'direct-inverse-proportion', name: 'פרופורציה ישרה והפוכה', nameEn: 'Direct and Inverse Proportion' }
                ]
            },
            {
                id: 'scale-maps',
                name: 'קנה מידה - מפות וסרטוטים',
                nameEn: 'Scale - Maps and Drawings',
                icon: '🗺️',
                difficulty: 'intermediate',
                cluster: 'orientation-11',
                subtopics: [
                    { id: 'scale-reading', name: 'קריאת קנה מידה', nameEn: 'Reading Scale' },
                    { id: 'scale-calculations', name: 'חישובים בקנה מידה', nameEn: 'Scale Calculations' },
                    { id: 'map-applications', name: 'יישומי מפות', nameEn: 'Map Applications' }
                ]
            },
            {
                id: 'similar-triangles-applications',
                name: 'שימוש בדמיון משולשים',
                nameEn: 'Using Similar Triangles',
                icon: '△',
                difficulty: 'intermediate',
                cluster: 'orientation-11',
                subtopics: [
                    { id: 'similarity-ratio-11', name: 'יחס דמיון', nameEn: 'Similarity Ratio' },
                    { id: 'practical-similarity', name: 'פתרון שאלות גיאומטריות מעשיות', nameEn: 'Practical Geometric Problems' },
                    { id: 'thales-applications', name: 'יישומי משפט תאלס', nameEn: 'Thales Theorem Applications' }
                ]
            },
            {
                id: 'trigonometry-practical',
                name: 'שימוש בטריגונומטריה למעשי',
                nameEn: 'Practical Trigonometry',
                icon: '∠',
                difficulty: 'intermediate',
                cluster: 'orientation-11',
                subtopics: [
                    { id: 'trig-plane-problems', name: 'פתרון בעיות במישור', nameEn: 'Solving Plane Problems' },
                    { id: 'heights-distances', name: 'מדידת גבהים ומרחקים', nameEn: 'Measuring Heights and Distances' },
                    { id: 'practical-applications-trig', name: 'יישומים מעשיים', nameEn: 'Practical Applications' }
                ]
            }
        ]
    },

    // ========================================
    // כיתה י׳ - 4 יחידות - תשפ"ה UPDATED
    // ========================================
    grade_10_4: {
        id: 'grade_10_4',
        name: 'כיתה י׳ - 4 יחידות',
        nameEn: 'Grade 10 - 4 Units',
        emoji: '🎯',
        implementationYear: 'תשפ"ה',
        reformNotes: {
            emphasis: [
                'הוראה איכותנית מבוססת הבנה',
                'חקירה איכותנית',
                'שילוב נושאי גאומטריה',
                'רמת סיבוכיות מועטה בגאומטריה של המישור',
                'שימוש מועט בפרמטרים בחדו"א בכיתה י׳'
            ],
            geometry: {
                approach: 'שלושת תחומי הגאומטריה נלמדים בצורה משולבת',
                excludedGrade10: ['מעגל (נדחה לכיתה יא׳)'],
                complexity: 'רמת סיבוכיות מועטה בשאלות גיאומטריה של המישור'
            }
        },
        topics: [
            {
                id: 'pre-calculus-4',
                name: 'קדם אנליזה',
                nameEn: 'Pre-Calculus',
                icon: 'f(x)',
                difficulty: 'advanced',
                subtopics: [
                    { id: 'functions-review-4', name: 'חזרה פונקציות', nameEn: 'Functions Review' },
                    { id: 'function-transformations-4', name: 'טרנספורמציות פונקציות', nameEn: 'Function Transformations' },
                    { id: 'composite-functions-4', name: 'הרכבת פונקציות', nameEn: 'Composite Functions' },
                    { id: 'inverse-functions-4', name: 'פונקציות הפוכות', nameEn: 'Inverse Functions' }
                ]
            },
            {
                id: 'differential-calculus-intro-4',
                name: 'חשבון דיפרנציאלי',
                nameEn: 'Differential Calculus',
                icon: "f'(x)",
                difficulty: 'advanced',
                pedagogicalNote: 'שימוש מועט בפרמטרים בכיתה י׳',
                subtopics: [
                    { id: 'derivative-concept-4', name: 'מושג הנגזרת', nameEn: 'Derivative Concept' },
                    { id: 'derivative-definition-4', name: 'הגדרת הנגזרת', nameEn: 'Derivative Definition' },
                    { id: 'tangent-line-4', name: 'משוואת משיק', nameEn: 'Tangent Line' },
                    { id: 'derivative-polynomial', name: 'נגזרת פונקציית פולינום', nameEn: 'Derivative of Polynomial Functions' },
                    { id: 'derivative-root', name: 'נגזרת פונקציית שורש', nameEn: 'Derivative of Root Functions' },
                    { id: 'extremum-problems-4', name: 'בעיות ערך קיצון', nameEn: 'Extremum Problems', note: 'דגש על חקירה איכותנית' }
                ]
            },
            {
                id: 'exponential-functions-4',
                name: 'פונקציות מעריכיות',
                nameEn: 'Exponential Functions',
                icon: '2ˣ',
                difficulty: 'advanced',
                subtopics: [
                    { id: 'exponential-concept-4', name: 'מושג הפונקציה המעריכית', nameEn: 'Exponential Concept' },
                    { id: 'exponential-properties-4', name: 'תכונות פונקציות מעריכיות', nameEn: 'Exponential Properties' },
                    { id: 'exponential-graphs-4', name: 'גרפים של פונקציות מעריכיות', nameEn: 'Exponential Graphs' },
                    { id: 'exponential-growth-decay-4', name: 'גידול ודעיכה', nameEn: 'Growth and Decay' },
                    { id: 'exponential-equations-4', name: 'משוואות מעריכיות', nameEn: 'Exponential Equations' },
                    { id: 'compound-interest-4', name: 'ריבית דריבית', nameEn: 'Compound Interest' },
                    { id: 'number-e-4', name: 'המספר e', nameEn: 'The Number e' }
                ]
            },
            {
                id: 'logarithms-4',
                name: 'לוגריתמים',
                nameEn: 'Logarithms',
                icon: 'log',
                difficulty: 'advanced',
                subtopics: [
                    { id: 'log-basics-4', name: 'מושג הלוגריתם', nameEn: 'Logarithm Concept' },
                    { id: 'log-definition-4', name: 'הגדרת לוגריתם', nameEn: 'Logarithm Definition' },
                    { id: 'log-properties-4', name: 'תכונות לוגריתמים', nameEn: 'Logarithm Properties' },
                    { id: 'log-rules-4', name: 'חוקי לוגריתמים', nameEn: 'Logarithm Rules' },
                    { id: 'log-equations-4', name: 'משוואות לוגריתמיות', nameEn: 'Logarithmic Equations' },
                    { id: 'natural-log-4', name: 'לוגריתם טבעי', nameEn: 'Natural Logarithm' },
                    { id: 'log-graphs-4', name: 'גרפים לוגריתמיים', nameEn: 'Logarithmic Graphs' },
                    { id: 'log-applications-4', name: 'יישומי לוגריתמים', nameEn: 'Logarithm Applications' }
                ]
            },
            {
                id: 'sequences-series-4',
                name: 'סדרות וטורים',
                nameEn: 'Sequences and Series',
                icon: 'Σ',
                difficulty: 'advanced',
                subtopics: [
                    { id: 'sequences-review-4', name: 'חזרה סדרות', nameEn: 'Sequences Review' },
                    { id: 'arithmetic-series-4', name: 'טורים חשבוניים', nameEn: 'Arithmetic Series' },
                    { id: 'geometric-series-4', name: 'טורים הנדסיים', nameEn: 'Geometric Series' },
                    { id: 'infinite-series-4', name: 'טורים אינסופיים', nameEn: 'Infinite Series' },
                    { id: 'convergence-4', name: 'התכנסות', nameEn: 'Convergence' },
                    { id: 'sigma-notation-4', name: 'סימון סיגמא', nameEn: 'Sigma Notation' }
                ]
            },
            {
                id: 'geometry-integrated-4',
                name: 'גאומטריה משולבת',
                nameEn: 'Integrated Geometry',
                icon: '📐',
                difficulty: 'advanced',
                pedagogicalNote: 'שלושת תחומי הגאומטריה נלמדים בצורה משולבת. ללא מעגל בכיתה י׳',
                approach: 'integrated',
                excludes: ['מעגל'],
                topics: [
                    {
                        id: 'analytic-geometry-4-no-circle',
                        name: 'גאומטריה אנליטית (ללא מעגל)',
                        nameEn: 'Analytic Geometry (No Circle)',
                        subtopics: [
                            { id: 'distance-midpoint-4', name: 'מרחק ונקודת אמצע', nameEn: 'Distance and Midpoint' },
                            { id: 'linear-equations-advanced-4', name: 'משוואות לינאריות מתקדם', nameEn: 'Advanced Linear Equations' },
                            { id: 'parallel-perpendicular-4', name: 'ישרים מקבילים ומאונכים', nameEn: 'Parallel and Perpendicular Lines' },
                            { id: 'parabola-equations-4', name: 'משוואת פרבולה', nameEn: 'Parabola Equations' }
                        ]
                    },
                    {
                        id: 'plane-geometry-4-no-circle',
                        name: 'גאומטריה במישור (ללא מעגל)',
                        nameEn: 'Plane Geometry (No Circle)',
                        note: 'רמת סיבוכיות מועטה',
                        subtopics: [
                            { id: 'triangles-4', name: 'משולשים', nameEn: 'Triangles' },
                            { id: 'similarity-4', name: 'דמיון', nameEn: 'Similarity' },
                            { id: 'pythagorean-4', name: 'משפט פיתגורס', nameEn: 'Pythagorean Theorem' },
                            { id: 'quadrilaterals-4', name: 'מרובעים', nameEn: 'Quadrilaterals' }
                        ]
                    },
                    {
                        id: 'trigonometry-plane-4',
                        name: 'טריגונומטריה במישור',
                        nameEn: 'Plane Trigonometry',
                        note: 'ניתן להתחיל ממעגל היחידה או ממשולש ישר זווית',
                        subtopics: [
                            { id: 'unit-circle-or-right-triangle', name: 'מעגל היחידה / משולש ישר זווית', nameEn: 'Unit Circle / Right Triangle' },
                            { id: 'trig-functions-4', name: 'פונקציות טריגונומטריות', nameEn: 'Trigonometric Functions' },
                            { id: 'trig-identities-basic-4', name: 'זהויות טריגונומטריות בסיסיות', nameEn: 'Basic Trig Identities' },
                            { id: 'sine-cosine-rules-4', name: 'חוקי הסינוסים והקוסינוסים', nameEn: 'Sine and Cosine Rules' }
                        ]
                    }
                ]
            },
            {
                id: 'statistics-4',
                name: 'סטטיסטיקה',
                nameEn: 'Statistics',
                icon: '📊',
                difficulty: 'advanced',
                subtopics: [
                    { id: 'measures-center-4', name: 'מדדי מרכז', nameEn: 'Measures of Center' },
                    { id: 'measures-spread-4', name: 'מדדי פיזור', nameEn: 'Measures of Spread' },
                    { id: 'standard-deviation-4', name: 'סטיית תקן', nameEn: 'Standard Deviation' },
                    { id: 'data-analysis-4', name: 'ניתוח נתונים', nameEn: 'Data Analysis' }
                ]
            },
            {
                id: 'probability-4',
                name: 'הסתברות',
                nameEn: 'Probability',
                icon: '🎲',
                difficulty: 'advanced',
                subtopics: [
                    { id: 'probability-review-4', name: 'חזרה הסתברות', nameEn: 'Probability Review' },
                    { id: 'conditional-probability-4', name: 'הסתברות מותנית', nameEn: 'Conditional Probability' },
                    { id: 'independence-4', name: 'אירועים בלתי תלויים', nameEn: 'Independence' },
                    { id: 'bayes-theorem-intro-4', name: 'משפט בייס - מבוא', nameEn: 'Bayes Theorem Intro' },
                    { id: 'random-variables-intro-4', name: 'משתנים מקריים - מבוא', nameEn: 'Random Variables Intro' },
                    { id: 'expected-value-4', name: 'תוחלת', nameEn: 'Expected Value' },
                    { id: 'variance-intro-4', name: 'שונות - מבוא', nameEn: 'Variance Intro' }
                ]
            }
        ]
    },

    // ========================================
    // כיתה יא׳ - 4 יחידות - תשפ"ה UPDATED
    // ========================================
    grade_11_4: {
        id: 'grade_11_4',
        name: 'כיתה יא׳ - 4 יחידות',
        nameEn: 'Grade 11 - 4 Units',
        emoji: '🔬',
        implementationYear: 'תשפ"ה',
        examInfo: {
            examCode: '471',
            duration: '3:30',
            structure: '3 פרקים: 2 מתוך 3 (סטטיסטיקה/הסתברות), 1 מתוך 2 (גאומטריה), 2 מתוך 3 (חדו"א)',
            weight: '40% מהציון המסכם'
        },
        reformNotes: {
            circle: 'השלמת נושא המעגל שלא נלמד בכיתה י׳',
            extremumProblems: 'בעיות קיצון יעסקו רק בבעיות גיאומטריות או בעיות גרפיות (תשפ"ה-תשפ"ז)',
            geometry: 'ממשיכים לשלב את כל הנושאים בגאומטריה'
        },
        topics: [
            {
                id: 'differential-calculus-11-4',
                name: 'חשבון דיפרנציאלי',
                nameEn: 'Differential Calculus',
                icon: "f'(x)",
                difficulty: 'advanced',
                subtopics: [
                    { id: 'derivative-review-11-4', name: 'חזרה נגזרות', nameEn: 'Derivative Review' },
                    { id: 'power-rule-4', name: 'כלל החזקה', nameEn: 'Power Rule' },
                    { id: 'product-rule-4', name: 'כלל המכפלה', nameEn: 'Product Rule' },
                    { id: 'quotient-rule-4', name: 'כלל המנה', nameEn: 'Quotient Rule' },
                    { id: 'chain-rule-4', name: 'כלל השרשרת', nameEn: 'Chain Rule' },
                    { id: 'implicit-differentiation-4', name: 'גזירה סתומה', nameEn: 'Implicit Differentiation' },
                    { id: 'higher-derivatives-4', name: 'נגזרות מסדר גבוה', nameEn: 'Higher Order Derivatives' },
                    { id: 'logarithmic-differentiation-4', name: 'גזירה לוגריתמית', nameEn: 'Logarithmic Differentiation' }
                ]
            },
            {
                id: 'derivative-applications-11-4',
                name: 'יישומי נגזרת',
                nameEn: 'Derivative Applications',
                icon: '📈',
                difficulty: 'advanced',
                subtopics: [
                    { id: 'tangent-normal-4', name: 'משיק ונורמל', nameEn: 'Tangent and Normal' },
                    { id: 'increasing-decreasing-4', name: 'עלייה וירידה', nameEn: 'Increasing and Decreasing' },
                    { id: 'critical-points-4', name: 'נקודות קיצון', nameEn: 'Critical Points' },
                    { id: 'max-min-problems-4', name: 'בעיות מקסימום ומינימום', nameEn: 'Max-Min Problems', note: 'רק בעיות גיאומטריות או גרפיות' },
                    { id: 'concavity-4', name: 'קעירות וקמירות', nameEn: 'Concavity' },
                    { id: 'inflection-points-4', name: 'נקודות פיתול', nameEn: 'Inflection Points' },
                    { id: 'curve-sketching-4', name: 'שרטוט עקומות', nameEn: 'Curve Sketching' },
                    { id: 'related-rates-4', name: 'קצבי שינוי', nameEn: 'Related Rates' }
                ]
            },
            {
                id: 'limits-continuity-4',
                name: 'גבולות ורציפות',
                nameEn: 'Limits and Continuity',
                icon: 'lim',
                difficulty: 'advanced',
                subtopics: [
                    { id: 'function-limits-4', name: 'גבול פונקציה', nameEn: 'Function Limits' },
                    { id: 'limit-techniques-4', name: 'טכניקות חישוב גבולות', nameEn: 'Limit Techniques' },
                    { id: 'continuity-4', name: 'רציפות', nameEn: 'Continuity' },
                    { id: 'discontinuities-4', name: 'אי-רציפויות', nameEn: 'Discontinuities' },
                    { id: 'intermediate-value-4', name: 'משפט ערך הביניים', nameEn: 'Intermediate Value Theorem' }
                ]
            },
            {
                id: 'integral-intro-4',
                name: 'חשבון אינטגרלי (ללא פונקציות עם שורש)',
                nameEn: 'Integral Calculus (No Root Functions)',
                icon: '∫',
                difficulty: 'advanced',
                note: 'אינטגרל של פונקציה רציונלית - מכנה עד ממעלה 2 לכל היותר',
                subtopics: [
                    { id: 'antiderivative-concept-4', name: 'מושג האנטי-נגזרת', nameEn: 'Antiderivative Concept' },
                    { id: 'indefinite-integral-4', name: 'אינטגרל לא מסוים', nameEn: 'Indefinite Integral' },
                    { id: 'basic-integrals-4', name: 'אינטגרלים בסיסיים', nameEn: 'Basic Integrals' },
                    { id: 'integration-techniques-basic-4', name: 'שיטות אינטגרציה בסיסיות', nameEn: 'Basic Integration Techniques' },
                    { id: 'definite-integrals-intro', name: 'אינטגרלים מסוימים', nameEn: 'Definite Integrals' },
                    { id: 'area-under-curve-intro', name: 'שטח מתחת לעקומה', nameEn: 'Area Under Curve' }
                ]
            },
            {
                id: 'geometry-integrated-11-4',
                name: 'גאומטריה משולבת (כולל מעגל)',
                nameEn: 'Integrated Geometry (Including Circle)',
                icon: '📐',
                difficulty: 'advanced',
                pedagogicalNote: 'השלמת נושא המעגל. שלושת תחומי הגאומטריה נלמדים בצורה משולבת',
                note: 'רמת סיבוכיות בשאלות גיאומטריה במישור מועטה',
                topics: [
                    {
                        id: 'analytic-geometry-11-4',
                        name: 'גאומטריה אנליטית (כולל מעגל)',
                        nameEn: 'Analytic Geometry (Including Circle)',
                        subtopics: [
                            { id: 'circle-equations-11-4', name: 'משוואת מעגל', nameEn: 'Circle Equations', note: 'נושא חדש בכיתה יא׳' },
                            { id: 'circle-properties-analytic', name: 'תכונות מעגל אנליטי', nameEn: 'Analytic Circle Properties' },
                            { id: 'distance-midpoint-11-4', name: 'מרחק ונקודת אמצע', nameEn: 'Distance and Midpoint' },
                            { id: 'linear-advanced-11-4', name: 'ישרים מתקדם', nameEn: 'Advanced Lines' }
                        ]
                    },
                    {
                        id: 'plane-geometry-11-4',
                        name: 'גאומטריה במישור (כולל מעגל)',
                        nameEn: 'Plane Geometry (Including Circle)',
                        subtopics: [
                            { id: 'circle-plane-11-4', name: 'מעגל במישור', nameEn: 'Circle in Plane', note: 'נושא חדש בכיתה יא׳' },
                            { id: 'circle-theorems', name: 'משפטים במעגל', nameEn: 'Circle Theorems' },
                            { id: 'triangles-advanced-4', name: 'משולשים מתקדם', nameEn: 'Advanced Triangles' },
                            { id: 'similarity-advanced-4', name: 'דמיון מתקדם', nameEn: 'Advanced Similarity' }
                        ]
                    },
                    {
                        id: 'trigonometry-11-4',
                        name: 'טריגונומטריה במישור',
                        nameEn: 'Plane Trigonometry',
                        subtopics: [
                            { id: 'unit-circle-complete', name: 'מעגל היחידה מלא', nameEn: 'Complete Unit Circle' },
                            { id: 'trig-all-angles', name: 'טריגונומטריה לכל זווית', nameEn: 'Trigonometry for All Angles' },
                            { id: 'trig-identities-4', name: 'זהויות טריגונומטריות', nameEn: 'Trigonometric Identities' },
                            { id: 'sine-cosine-advanced', name: 'חוקי סינוסים וקוסינוסים מתקדם', nameEn: 'Advanced Sine and Cosine Laws' }
                        ]
                    }
                ]
            },
            {
                id: 'conic-sections-4',
                name: 'חתכי חרוט',
                nameEn: 'Conic Sections',
                icon: '⭕',
                difficulty: 'advanced',
                subtopics: [
                    { id: 'circles-analytic-4', name: 'מעגלים - גאומטריה אנליטית', nameEn: 'Circles - Analytic Geometry' },
                    { id: 'parabolas-4', name: 'פרבולות', nameEn: 'Parabolas' },
                    { id: 'ellipses-4', name: 'אליפסות', nameEn: 'Ellipses' },
                    { id: 'hyperbolas-4', name: 'היפרבולות', nameEn: 'Hyperbolas' }
                ]
            },
            {
                id: 'statistics-11-4',
                name: 'סטטיסטיקה',
                nameEn: 'Statistics',
                icon: '📊',
                difficulty: 'advanced',
                subtopics: [
                    { id: 'normal-distribution-4', name: 'התפלגות נורמלית', nameEn: 'Normal Distribution' },
                    { id: 'linear-regression', name: 'רגרסיה לינארית', nameEn: 'Linear Regression' },
                    { id: 'correlation-coefficient', name: 'מקדם מתאם', nameEn: 'Correlation Coefficient' },
                    { id: 'statistical-inference-intro', name: 'מבוא להסקה סטטיסטית', nameEn: 'Intro to Statistical Inference' }
                ]
            },
            {
                id: 'probability-11-4',
                name: 'הסתברות',
                nameEn: 'Probability',
                icon: '🎲',
                difficulty: 'advanced',
                note: 'לא נדרשת התפלגות בינומית (נוסחת ברנולי) בתשפ"ה',
                subtopics: [
                    { id: 'discrete-distributions-4', name: 'התפלגויות בדידות', nameEn: 'Discrete Distributions' },
                    { id: 'expected-value-variance-4', name: 'תוחלת ושונות', nameEn: 'Expected Value and Variance' },
                    { id: 'conditional-advanced', name: 'הסתברות מותנית מתקדם', nameEn: 'Advanced Conditional Probability' },
                    { id: 'bayes-theorem-4', name: 'משפט בייס', nameEn: 'Bayes Theorem' }
                ]
            }
        ]
    },

    // ========================================
    // כיתה י׳ - 5 יחידות - תשפ"ה UPDATED
    // ========================================
    grade_10_5: {
        id: 'grade_10_5',
        name: 'כיתה י׳ - 5 יחידות',
        nameEn: 'Grade 10 - 5 Units',
        emoji: '🏆',
        implementationYear: 'תשפ"ה',
        reformNotes: {
            emphasis: [
                'דגש על חקירה איכותנית',
                'הנגזרת כקצב שינוי',
                'האינטגרל כפונקציית הצטברות',
                'ספירליות בהוראה',
                'שימוש בטכנולוגיה'
            ],
            geometry: {
                approach: 'ניתן להתחיל טריגונומטריה ממעגל היחידה או ממשולש ישר זווית',
                note: 'נושאים בטכניקה אלגברית מומלץ ללמד לפי הקשר וצורך'
            },
            extremum: 'ניתן ללמד בעיות ערך קיצון כחלק מיישומי הנגזרת או לקראת סוף השנה'
        },
        topics: [
            {
                id: 'functions-composition-5',
                name: 'הרכבת פונקציות',
                nameEn: 'Function Composition',
                icon: 'f∘g',
                difficulty: 'expert',
                subtopics: [
                    { id: 'composition-basics-5', name: 'יסודות הרכבה', nameEn: 'Composition Basics' },
                    { id: 'composition-properties-5', name: 'תכונות הרכבה', nameEn: 'Composition Properties' },
                    { id: 'composition-graphs-5', name: 'גרפים של הרכבות', nameEn: 'Composition Graphs' },
                    { id: 'decomposition-5', name: 'פירוק פונקציות', nameEn: 'Function Decomposition' }
                ]
            },
            {
                id: 'inverse-functions-5',
                name: 'פונקציות הפוכות',
                nameEn: 'Inverse Functions',
                icon: 'f⁻¹',
                difficulty: 'expert',
                subtopics: [
                    { id: 'inverse-concept-5', name: 'מושג הפונקציה ההפוכה', nameEn: 'Inverse Concept' },
                    { id: 'finding-inverses-5', name: 'מציאת פונקציה הפוכה', nameEn: 'Finding Inverses' },
                    { id: 'inverse-properties-5', name: 'תכונות פונקציה הפוכה', nameEn: 'Inverse Properties' },
                    { id: 'inverse-graphs-5', name: 'גרפים של פונקציות הפוכות', nameEn: 'Inverse Graphs' },
                    { id: 'one-to-one-5', name: 'פונקציות חד-חד ערכיות', nameEn: 'One-to-One Functions' }
                ]
            },
            {
                id: 'complex-numbers-intro-5',
                name: 'מספרים מרוכבים',
                nameEn: 'Complex Numbers',
                icon: 'i',
                difficulty: 'expert',
                subtopics: [
                    { id: 'imaginary-unit-5', name: 'היחידה המדומה', nameEn: 'Imaginary Unit' },
                    { id: 'complex-basics-5', name: 'יסודות מספרים מרוכבים', nameEn: 'Complex Basics' },
                    { id: 'complex-operations-5', name: 'פעולות במספרים מרוכבים', nameEn: 'Complex Operations' },
                    { id: 'complex-conjugate-5', name: 'מספר צמוד', nameEn: 'Complex Conjugate' },
                    { id: 'complex-plane-5', name: 'המישור המרוכב', nameEn: 'Complex Plane' },
                    { id: 'absolute-value-complex-5', name: 'ערך מוחלט מרוכב', nameEn: 'Complex Absolute Value' }
                ]
            },
            {
                id: 'polynomial-theory-5',
                name: 'תורת הפולינומים',
                nameEn: 'Polynomial Theory',
                icon: 'P(x)',
                difficulty: 'expert',
                subtopics: [
                    { id: 'polynomial-division-advanced-5', name: 'חילוק פולינומים מתקדם', nameEn: 'Advanced Polynomial Division' },
                    { id: 'remainder-theorem-5', name: 'משפט השארית', nameEn: 'Remainder Theorem' },
                    { id: 'factor-theorem-5', name: 'משפט הגורם', nameEn: 'Factor Theorem' },
                    { id: 'rational-root-theorem-5', name: 'משפט השורש הרציונלי', nameEn: 'Rational Root Theorem' },
                    { id: 'fundamental-theorem-5', name: 'המשפט היסודי של האלגברה', nameEn: 'Fundamental Theorem of Algebra' }
                ]
            },
            {
                id: 'sequences-limits-5',
                name: 'סדרות וגבולות',
                nameEn: 'Sequences and Limits',
                icon: 'lim',
                difficulty: 'expert',
                subtopics: [
                    { id: 'limit-concept-5', name: 'מושג הגבול', nameEn: 'Limit Concept' },
                    { id: 'sequence-limits-5', name: 'גבול סדרה', nameEn: 'Sequence Limits' },
                    { id: 'limit-laws-5', name: 'חוקי גבולות', nameEn: 'Limit Laws' },
                    { id: 'infinite-limits-5', name: 'גבולות אינסופיים', nameEn: 'Infinite Limits' },
                    { id: 'squeeze-theorem-5', name: 'משפט הסנדוויץ׳', nameEn: 'Squeeze Theorem' }
                ]
            },
            {
                id: 'derivatives-intro-5',
                name: 'נגזרות - מבוא',
                nameEn: 'Introduction to Derivatives',
                icon: "f'(x)",
                difficulty: 'expert',
                pedagogicalNote: 'דגש על חקירה איכותנית, הנגזרת כקצב שינוי',
                subtopics: [
                    { id: 'derivative-concept-5', name: 'מושג הנגזרת', nameEn: 'Derivative Concept' },
                    { id: 'derivative-definition-5', name: 'הגדרת הנגזרת', nameEn: 'Derivative Definition' },
                    { id: 'derivative-rate-of-change', name: 'הנגזרת כקצב שינוי', nameEn: 'Derivative as Rate of Change' },
                    { id: 'derivative-interpretation-5', name: 'פרשנות גיאומטרית', nameEn: 'Geometric Interpretation' },
                    { id: 'tangent-line-5', name: 'משוואת משיק', nameEn: 'Tangent Line' },
                    { id: 'derivative-basic-functions-5', name: 'נגזרות פונקציות בסיסיות', nameEn: 'Derivatives of Basic Functions' },
                    { id: 'derivative-rules-basic-5', name: 'כללי גזירה בסיסיים', nameEn: 'Basic Derivative Rules' }
                ]
            },
            {
                id: 'trigonometry-identities-5',
                name: 'זהויות טריגונומטריות',
                nameEn: 'Trigonometric Identities',
                icon: '∠',
                difficulty: 'expert',
                subtopics: [
                    { id: 'pythagorean-identity-5', name: 'זהות פיתגורס', nameEn: 'Pythagorean Identity' },
                    { id: 'sum-difference-formulas-5', name: 'נוסחאות סכום והפרש', nameEn: 'Sum and Difference Formulas' },
                    { id: 'double-angle-formulas-5', name: 'נוסחאות זווית כפולה', nameEn: 'Double Angle Formulas' },
                    { id: 'half-angle-formulas-5', name: 'נוסחאות חצי זווית', nameEn: 'Half Angle Formulas' },
                    { id: 'product-to-sum-5', name: 'מכפלה לסכום', nameEn: 'Product to Sum' }
                ]
            },
            {
                id: 'vectors-2d-5',
                name: 'וקטורים במישור',
                nameEn: '2D Vectors',
                icon: '→',
                difficulty: 'expert',
                subtopics: [
                    { id: 'vector-algebra-5', name: 'אלגברת וקטורים', nameEn: 'Vector Algebra' },
                    { id: 'dot-product-5', name: 'מכפלה סקלרית', nameEn: 'Dot Product' },
                    { id: 'vector-projections-5', name: 'הטלות וקטוריות', nameEn: 'Vector Projections' },
                    { id: 'vector-equations-5', name: 'משוואות וקטוריות', nameEn: 'Vector Equations' },
                    { id: 'parametric-equations-5', name: 'משוואות פרמטריות', nameEn: 'Parametric Equations' }
                ]
            },
            {
                id: 'sequences-series-intro-5',
                name: 'סדרות וטורים',
                nameEn: 'Sequences and Series',
                icon: 'Σ',
                difficulty: 'expert',
                subtopics: [
                    { id: 'arithmetic-sequences-5', name: 'סדרות חשבוניות', nameEn: 'Arithmetic Sequences' },
                    { id: 'geometric-sequences-5', name: 'סדרות הנדסיות', nameEn: 'Geometric Sequences' },
                    { id: 'general-sequences', name: 'סדרות כלליות', nameEn: 'General Sequences' },
                    { id: 'recursive-sequences-5', name: 'כלל הנסיגה', nameEn: 'Recursive Rule' },
                    { id: 'series-basics-5', name: 'יסודות טורים', nameEn: 'Series Basics' }
                ]
            },
            {
                id: 'probability-5',
                name: 'הסתברות',
                nameEn: 'Probability',
                icon: '🎲',
                difficulty: 'expert',
                subtopics: [
                    { id: 'probability-comprehensive-5', name: 'הסתברות מקיפה', nameEn: 'Comprehensive Probability' },
                    { id: 'conditional-probability-5', name: 'הסתברות מותנית', nameEn: 'Conditional Probability' },
                    { id: 'bayes-intro-5', name: 'משפט בייס - מבוא', nameEn: 'Bayes Theorem Intro' }
                ]
            },
            {
                id: 'induction-5',
                name: 'אינדוקציה',
                nameEn: 'Mathematical Induction',
                icon: '∴',
                difficulty: 'expert',
                subtopics: [
                    { id: 'induction-principle', name: 'עקרון האינדוקציה', nameEn: 'Induction Principle' },
                    { id: 'induction-proofs', name: 'הוכחות באינדוקציה', nameEn: 'Induction Proofs' },
                    { id: 'induction-applications', name: 'יישומי אינדוקציה', nameEn: 'Induction Applications' }
                ]
            }
        ]
    },

    // ========================================
    // כיתה יא׳ - 5 יחידות - תשפ"ה UPDATED
    // ========================================
    grade_11_5: {
        id: 'grade_11_5',
        name: 'כיתה יא׳ - 5 יחידות',
        nameEn: 'Grade 11 - 5 Units',
        emoji: '🏆',
        implementationYear: 'תשפ"ה',
        examInfo: {
            examCode: '571',
            duration: '3:45',
            structure: 'פרק 1 (חובה): שאלות קצרות. פרקים 2-4: בחירה מתוך אופציות',
            weight: 'משקל משמעותי בציון הבגרות'
        },
        reformNotes: {
            circle: 'השלמת נושא המעגל שלא נלמד בכיתה י׳',
            extremumProblems: 'בעיות קיצון יעסקו בבעיות גיאומטריות או בעיות גרפיות (תשפ"ה-תשפ"ז)',
            geometry: 'בגאומטריה לא יהיו פרמטרים (תשפ"ה-תשפ"ז)',
            geometryExam: 'בבחינות הבגרות: שאלות משני נושאים בלבד מבין 3 (מישור, אנליטית, טריג)',
            calculus: 'לא נדרשת חקירה של פונקציית מנה עם שורש'
        },
        topics: [
            {
                id: 'advanced-derivatives-11-5',
                name: 'נגזרות מתקדמות',
                nameEn: 'Advanced Derivatives',
                icon: "f'(x)",
                difficulty: 'expert',
                subtopics: [
                    { id: 'all-derivative-rules-5', name: 'כל כללי הגזירה', nameEn: 'All Derivative Rules' },
                    { id: 'trig-derivatives-5', name: 'נגזרות פונקציות טריגונומטריות', nameEn: 'Trig Derivatives' },
                    { id: 'exponential-derivatives-5', name: 'נגזרות פונקציות מעריכיות', nameEn: 'Exponential Derivatives' },
                    { id: 'log-derivatives-5', name: 'נגזרות פונקציות לוגריתמיות', nameEn: 'Logarithmic Derivatives' },
                    { id: 'inverse-trig-derivatives-5', name: 'נגזרות פונקציות טריג. הפוכות', nameEn: 'Inverse Trig Derivatives' },
                    { id: 'parametric-derivatives-5', name: 'נגזרות פרמטריות', nameEn: 'Parametric Derivatives' }
                ]
            },
            {
                id: 'derivative-applications-expert',
                name: 'יישומי נגזרת מתקדמים',
                nameEn: 'Advanced Derivative Applications',
                icon: '📈',
                difficulty: 'expert',
                note: 'בעיות קיצון: רק גיאומטריות או גרפיות (תשפ"ה-תשפ"ז)',
                subtopics: [
                    { id: 'extremum-geometric', name: 'בעיות קיצון גיאומטריות', nameEn: 'Geometric Extremum Problems' },
                    { id: 'extremum-graphical', name: 'בעיות קיצון גרפיות', nameEn: 'Graphical Extremum Problems' },
                    { id: 'curve-analysis-expert', name: 'חקירת פונקציות מתקדמת', nameEn: 'Advanced Function Analysis', note: 'לא נדרשת חקירה של פונקציית מנה עם שורש' },
                    { id: 'related-rates-expert', name: 'קצבי שינוי מתקדם', nameEn: 'Advanced Related Rates' }
                ]
            },
            {
                id: 'integral-calculus-11-5',
                name: 'חשבון אינטגרלי',
                nameEn: 'Integral Calculus',
                icon: '∫',
                difficulty: 'expert',
                pedagogicalNote: 'האינטגרל כפונקציית הצטברות',
                subtopics: [
                    { id: 'antiderivatives-expert', name: 'אנטי-נגזרות', nameEn: 'Antiderivatives' },
                    { id: 'integration-techniques-expert', name: 'שיטות אינטגרציה', nameEn: 'Integration Techniques' },
                    { id: 'definite-integrals-5', name: 'אינטגרלים מסוימים', nameEn: 'Definite Integrals' },
                    { id: 'ftc-5', name: 'המשפט היסודי של החשבון האינטגרלי', nameEn: 'Fundamental Theorem of Calculus' },
                    { id: 'integral-as-accumulation', name: 'האינטגרל כפונקציית הצטברות', nameEn: 'Integral as Accumulation Function' },
                    { id: 'area-calculations-5', name: 'חישובי שטחים', nameEn: 'Area Calculations' }
                ]
            },
            {
                id: 'complex-numbers-advanced-11-5',
                name: 'מספרים מרוכבים מתקדם',
                nameEn: 'Advanced Complex Numbers',
                icon: 'z',
                difficulty: 'expert',
                subtopics: [
                    { id: 'polar-form-5', name: 'צורה קוטבית', nameEn: 'Polar Form' },
                    { id: 'de-moivre-5', name: 'נוסחת דה-מואבר', nameEn: "De Moivre's Formula" },
                    { id: 'complex-roots-5', name: 'שורשים מרוכבים', nameEn: 'Complex Roots' },
                    { id: 'complex-equations-5', name: 'משוואות במרוכבים', nameEn: 'Complex Equations' },
                    { id: 'complex-functions-5', name: 'פונקציות מרוכבות', nameEn: 'Complex Functions' }
                ]
            },
            {
                id: 'sequences-series-advanced-11-5',
                name: 'סדרות וטורים מתקדם',
                nameEn: 'Advanced Sequences and Series',
                icon: 'Σ',
                difficulty: 'expert',
                subtopics: [
                    { id: 'recursive-sequences-advanced', name: 'סדרות רקורסיביות מתקדם', nameEn: 'Advanced Recursive Sequences' },
                    { id: 'series-tests-5', name: 'מבחני התכנסות', nameEn: 'Convergence Tests' },
                    { id: 'power-series-5', name: 'טורי חזקות', nameEn: 'Power Series' },
                    { id: 'taylor-series-intro-5', name: 'טור טיילור - מבוא', nameEn: 'Taylor Series Intro' }
                ]
            },
            {
                id: 'geometry-expert-11-5',
                name: 'גאומטריה מתקדמת',
                nameEn: 'Advanced Geometry',
                icon: '📐',
                difficulty: 'expert',
                pedagogicalNote: 'ללא פרמטרים בגאומטריה (תשפ"ה-תשפ"ז). בבחינות: שאלות משני נושאים בלבד',
                note: 'השלמת נושא המעגל',
                topics: [
                    {
                        id: 'analytic-geometry-expert',
                        name: 'גאומטריה אנליטית (כולל מעגל)',
                        nameEn: 'Analytic Geometry (Including Circle)',
                        subtopics: [
                            { id: 'circle-complete-5', name: 'מעגל - השלמה', nameEn: 'Circle - Completion', note: 'נושא חדש בכיתה יא׳' },
                            { id: 'conic-sections-expert', name: 'חתכי חרוט מתקדם', nameEn: 'Advanced Conic Sections' },
                            { id: 'analytic-applications-5', name: 'יישומים אנליטיים', nameEn: 'Analytic Applications' }
                        ]
                    },
                    {
                        id: 'plane-geometry-expert',
                        name: 'גאומטריה במישור (כולל מעגל)',
                        nameEn: 'Plane Geometry (Including Circle)',
                        subtopics: [
                            { id: 'circle-theorems-expert', name: 'משפטים במעגל מתקדם', nameEn: 'Advanced Circle Theorems' },
                            { id: 'geometric-proofs-5', name: 'הוכחות גיאומטריות', nameEn: 'Geometric Proofs' }
                        ]
                    },
                    {
                        id: 'trigonometry-expert',
                        name: 'טריגונומטריה מתקדמת',
                        nameEn: 'Advanced Trigonometry',
                        note: 'כולל משפט הסינוסים',
                        subtopics: [
                            { id: 'trig-identities-expert', name: 'זהויות טריגונומטריות מתקדמות', nameEn: 'Advanced Trig Identities' },
                            { id: 'sine-law-expert', name: 'משפט הסינוסים', nameEn: 'Law of Sines' },
                            { id: 'cosine-law-expert', name: 'משפט הקוסינוסים', nameEn: 'Law of Cosines' },
                            { id: 'trig-applications-expert', name: 'יישומים טריגונומטריים מתקדמים', nameEn: 'Advanced Trig Applications' }
                        ]
                    }
                ]
            },
            {
                id: 'vectors-3d-11-5',
                name: 'וקטורים במרחב',
                nameEn: '3D Vectors',
                icon: '→',
                difficulty: 'expert',
                subtopics: [
                    { id: '3d-coordinates-5', name: 'מערכת צירים תלת-ממדית', nameEn: '3D Coordinate System' },
                    { id: 'vectors-3d-operations-5', name: 'פעולות בוקטורים במרחב', nameEn: '3D Vector Operations' },
                    { id: 'cross-product-5', name: 'מכפלה וקטורית', nameEn: 'Cross Product' },
                    { id: 'scalar-triple-product-5', name: 'מכפלה משולשת', nameEn: 'Scalar Triple Product' },
                    { id: 'lines-in-space-5', name: 'ישרים במרחב', nameEn: 'Lines in Space' },
                    { id: 'planes-5', name: 'מישורים', nameEn: 'Planes' },
                    { id: 'distance-3d-5', name: 'מרחקים במרחב', nameEn: '3D Distances' }
                ]
            },
            {
                id: 'matrices-intro-5',
                name: 'מטריצות - מבוא',
                nameEn: 'Introduction to Matrices',
                icon: '[ ]',
                difficulty: 'expert',
                subtopics: [
                    { id: 'matrix-basics-5', name: 'יסודות מטריצות', nameEn: 'Matrix Basics' },
                    { id: 'matrix-operations-5', name: 'פעולות במטריצות', nameEn: 'Matrix Operations' },
                    { id: 'matrix-multiplication-5', name: 'כפל מטריצות', nameEn: 'Matrix Multiplication' },
                    { id: 'determinants-5', name: 'דטרמיננטות', nameEn: 'Determinants' },
                    { id: 'inverse-matrices-5', name: 'מטריצות הפוכות', nameEn: 'Inverse Matrices' },
                    { id: 'systems-matrices-5', name: 'פתרון מערכות במטריצות', nameEn: 'Solving Systems with Matrices' }
                ]
            },
            {
                id: 'probability-advanced-11-5',
                name: 'הסתברות מתקדמת',
                nameEn: 'Advanced Probability',
                icon: '🎲',
                difficulty: 'expert',
                subtopics: [
                    { id: 'bayes-theorem-5', name: 'משפט בייס', nameEn: 'Bayes Theorem' },
                    { id: 'random-variables-5', name: 'משתנים מקריים', nameEn: 'Random Variables' },
                    { id: 'continuous-distributions-5', name: 'התפלגויות רציפות', nameEn: 'Continuous Distributions' },
                    { id: 'normal-distribution-5', name: 'התפלגות נורמלית', nameEn: 'Normal Distribution' },
                    { id: 'central-limit-theorem-5', name: 'משפט הגבול המרכזי', nameEn: 'Central Limit Theorem' }
                ]
            }
        ]
    },

    // ========================================
    // כיתה יב׳ - 3 יחידות
    // ========================================
    grade_12_3: {
        id: 'grade_12_3',
        name: 'כיתה יב׳ - 3 יחידות',
        nameEn: 'Grade 12 - 3 Units',
        emoji: '🎓',
        examInfo: {
            examCode: '173 + 35371',
            totalWeight: '60% (25% + 35%)',
            note: 'מבחן כיתה י׳ אופציונלי (25%) + מבחן כיתה יא׳ (35%)'
        },
        topics: [
            {
                id: 'bagrut-review-algebra-3',
                name: 'חזרה לבגרות - אלגברה',
                nameEn: 'Bagrut Review - Algebra',
                icon: 'x',
                difficulty: 'intermediate',
                subtopics: [
                    { id: 'equations-comprehensive-3', name: 'משוואות - חזרה מקיפה', nameEn: 'Equations Comprehensive' },
                    { id: 'functions-comprehensive-3', name: 'פונקציות - חזרה מקיפה', nameEn: 'Functions Comprehensive' },
                    { id: 'word-problems-comprehensive-3', name: 'בעיות מילוליות', nameEn: 'Word Problems' }
                ]
            },
            {
                id: 'bagrut-review-clusters',
                name: 'חזרה אשכולות',
                nameEn: 'Cluster Review',
                icon: '🎯',
                difficulty: 'intermediate',
                subtopics: [
                    { id: 'science-society-review', name: 'אשכול מדע וחברה', nameEn: 'Science & Society Cluster' },
                    { id: 'economic-review', name: 'אשכול כלכלי-פיננסי', nameEn: 'Economic-Financial Cluster' },
                    { id: 'orientation-review', name: 'אשכול התמצאות', nameEn: 'Orientation Cluster' }
                ]
            },
            {
                id: 'bagrut-practice-3',
                name: 'תרגול מבחני בגרות',
                nameEn: 'Bagrut Exam Practice',
                icon: '📝',
                difficulty: 'intermediate',
                subtopics: [
                    { id: 'past-exams-3', name: 'מבחנים קודמים', nameEn: 'Past Exams' },
                    { id: 'exam-strategies-3', name: 'אסטרטגיות למבחן', nameEn: 'Exam Strategies' },
                    { id: 'time-management-3', name: 'ניהול זמן', nameEn: 'Time Management' }
                ]
            }
        ]
    },

    // ========================================
    // כיתה יב׳ - 4 יחידות
    // ========================================
    // ========================================
// כיתה יב׳ - 4 יחידות - UPDATED
// ========================================
    // ========================================
// כיתה יב׳ - 4 יחידות - COMPLETE WITH ALL DB TOPICS
// ========================================
    grade_12_4: {
        id: 'grade_12_4',
        name: 'כיתה יב׳ - 4 יחידות',
        nameEn: 'Grade 12 - 4 Units',
        emoji: '🎓',
        examInfo: {
            examCode: '471',
            weight: '60% מהציון המסכם',
            duration: '3:30'
        },
        topics: [
            // Top 3 topics by question count
            {
                id: 'general-review',
                name: '📝 כללי - חזרה מקיפה',
                nameEn: 'General Review',
                icon: '📝',
                difficulty: 'advanced',
                questionCount: 26
            },
            {
                id: 'algebra',
                name: 'x אלגברה',
                nameEn: 'Algebra',
                icon: 'x',
                difficulty: 'advanced',
                questionCount: 24,
                subtopics: [
                    { id: 'linear-equations-12', name: 'משוואות לינאריות', nameEn: 'Linear Equations' },
                    { id: 'algebraic-expressions-12', name: 'ביטויים אלגבריים', nameEn: 'Algebraic Expressions' }
                ]
            },
            {
                id: 'geometry',
                name: '📐 גיאומטריה',
                nameEn: 'Geometry',
                icon: '📐',
                difficulty: 'advanced',
                questionCount: 21,
                subtopics: [
                    { id: 'circle-area-perimeter', name: 'מעגל - שטח והיקף', nameEn: 'Circle - Area and Perimeter' },
                    { id: 'triangle-area-12', name: 'שטח משולש', nameEn: 'Triangle Area' },
                    { id: 'pythagorean-12', name: 'משפט פיתגורס', nameEn: 'Pythagorean Theorem' },
                    { id: 'quadrilateral-area', name: 'שטח מרובעים', nameEn: 'Quadrilateral Area' },
                    { id: 'angles-12', name: 'זוויות', nameEn: 'Angles' }
                ]
            },
            {
                id: 'statistics-probability',
                name: '📊 סטטיסטיקה והסתברות',
                nameEn: 'Statistics & Probability',
                icon: '📊',
                difficulty: 'advanced',
                questionCount: 13,
                subtopics: [
                    { id: 'arithmetic-mean', name: 'ממוצע חשבוני', nameEn: 'Arithmetic Mean' },
                    { id: 'basic-probability', name: 'הסתברות בסיסית', nameEn: 'Basic Probability' },
                    { id: 'median-12', name: 'חציון', nameEn: 'Median' }
                ]
            },
            {
                id: 'integrals',
                name: '∫ חשבון אינטגרלי',
                nameEn: 'Integral Calculus',
                icon: '∫',
                difficulty: 'advanced',
                questionCount: 7,
                subtopics: [
                    { id: 'area-under-curve-12', name: 'שטח מתחת לעקומה', nameEn: 'Area Under Curve' },
                    { id: 'volume-12', name: 'נפח', nameEn: 'Volume' },
                    { id: 'area-between-curves-12', name: 'שטח בין עקומות', nameEn: 'Area Between Curves' }
                ]
            },
            {
                id: 'sequences',
                name: '1,2,3... סדרות',
                nameEn: 'Sequences',
                icon: '1,2,3...',
                difficulty: 'advanced',
                questionCount: 3,
                subtopics: [
                    { id: 'arithmetic-sequences-12', name: 'סדרות חשבוניות', nameEn: 'Arithmetic Sequences' }
                ]
            },
            {
                id: 'functions',
                name: 'f(x) פונקציות',
                nameEn: 'Functions',
                icon: 'f(x)',
                difficulty: 'advanced',
                questionCount: 3,
                subtopics: [
                    { id: 'domain-12', name: 'תחום הגדרה', nameEn: 'Domain' }
                ]
            },
            {
                id: 'differential-calculus',
                name: "f'(x) חשבון דיפרנציאלי",
                nameEn: 'Differential Calculus',
                icon: "f'(x)",
                difficulty: 'advanced',
                questionCount: 2,
                subtopics: [
                    { id: 'polynomial-derivatives-12', name: 'נגזרות של פולינומים', nameEn: 'Polynomial Derivatives' }
                ]
            }
        ]
    },

    // ========================================
    // כיתה יב׳ - 5 יחידות
    // ========================================
    grade_12_5: {
        id: 'grade_12_5',
        name: 'כיתה יב׳ - 5 יחידות',
        nameEn: 'Grade 12 - 5 Units',
        emoji: '🏆',
        examInfo: {
            examCode: '571',
            weight: 'משקל משמעותי בציון הבגרות',
            duration: '3:45'
        },
        topics: [
            {
                id: 'integrals-advanced-12-5',
                name: 'אינטגרלים מתקדמים',
                nameEn: 'Advanced Integrals',
                icon: '∫',
                difficulty: 'expert',
                subtopics: [
                    { id: 'integration-techniques-12', name: 'שיטות אינטגרציה', nameEn: 'Integration Techniques' },
                    { id: 'trig-substitution-12', name: 'הצבות טריגונומטריות', nameEn: 'Trigonometric Substitution' },
                    { id: 'partial-fractions-12', name: 'פירוק לשברים חלקיים', nameEn: 'Partial Fractions' },
                    { id: 'improper-integrals-12', name: 'אינטגרלים לא אמיתיים', nameEn: 'Improper Integrals' },
                    { id: 'numerical-integration-12', name: 'אינטגרציה נומרית', nameEn: 'Numerical Integration' }
                ]
            },
            {
                id: 'differential-equations-12-5',
                name: 'משוואות דיפרנציאליות',
                nameEn: 'Differential Equations',
                icon: "dy/dx",
                difficulty: 'expert',
                subtopics: [
                    { id: 'separable-equations-12', name: 'משוואות פרידות', nameEn: 'Separable Equations' },
                    { id: 'exact-equations-12', name: 'משוואות מדויקות', nameEn: 'Exact Equations' },
                    { id: 'linear-first-order-12', name: 'משוואות לינאריות מסדר ראשון', nameEn: 'First Order Linear' },
                    { id: 'homogeneous-equations-12', name: 'משוואות הומוגניות', nameEn: 'Homogeneous Equations' },
                    { id: 'second-order-de-12', name: 'משוואות מסדר שני', nameEn: 'Second Order DE' },
                    { id: 'de-systems-12', name: 'מערכות משוואות דיפרנציאליות', nameEn: 'Systems of DE' },
                    { id: 'applications-de-advanced-12', name: 'יישומים מתקדמים', nameEn: 'Advanced Applications' }
                ]
            },
            {
                id: 'vectors-advanced-12-5',
                name: 'וקטורים במרחב - מתקדם',
                nameEn: 'Advanced 3D Vectors',
                icon: '→',
                difficulty: 'expert',
                subtopics: [
                    { id: 'vector-calculus-intro-12', name: 'חשבון וקטורי - מבוא', nameEn: 'Vector Calculus Intro' },
                    { id: 'parametric-curves-12', name: 'עקומות פרמטריות במרחב', nameEn: 'Parametric Curves in Space' },
                    { id: 'vector-functions-12', name: 'פונקציות וקטוריות', nameEn: 'Vector Functions' },
                    { id: 'arc-length-3d-12', name: 'אורך קשת במרחב', nameEn: 'Arc Length in 3D' },
                    { id: 'curvature-12', name: 'עקמומיות', nameEn: 'Curvature' }
                ]
            },
            {
                id: 'series-advanced-12-5',
                name: 'טורים מתקדמים',
                nameEn: 'Advanced Series',
                icon: 'Σ',
                difficulty: 'expert',
                subtopics: [
                    { id: 'convergence-tests-advanced-12', name: 'מבחני התכנסות מתקדמים', nameEn: 'Advanced Convergence Tests' },
                    { id: 'power-series-advanced-12', name: 'טורי חזקות', nameEn: 'Power Series' },
                    { id: 'taylor-maclaurin-12', name: 'טורי טיילור ומקלורן', nameEn: 'Taylor and Maclaurin Series' },
                    { id: 'fourier-series-intro-12', name: 'טורי פורייה - מבוא', nameEn: 'Fourier Series Intro' }
                ]
            },
            {
                id: 'multivariable-intro-12-5',
                name: 'פונקציות של מספר משתנים - מבוא',
                nameEn: 'Multivariable Functions Intro',
                icon: 'f(x,y)',
                difficulty: 'expert',
                subtopics: [
                    { id: 'functions-two-variables-12', name: 'פונקציות של שני משתנים', nameEn: 'Functions of Two Variables' },
                    { id: 'partial-derivatives-12', name: 'נגזרות חלקיות', nameEn: 'Partial Derivatives' },
                    { id: 'gradient-12', name: 'גרדיאנט', nameEn: 'Gradient' },
                    { id: 'double-integrals-intro-12', name: 'אינטגרלים כפולים - מבוא', nameEn: 'Double Integrals Intro' }
                ]
            },
            {
                id: 'probability-statistics-advanced-12-5',
                name: 'הסתברות וסטטיסטיקה מתקדמת',
                nameEn: 'Advanced Probability and Statistics',
                icon: '📊',
                difficulty: 'expert',
                subtopics: [
                    { id: 'continuous-distributions-advanced-12', name: 'התפלגויות רציפות מתקדמות', nameEn: 'Advanced Continuous Distributions' },
                    { id: 'joint-distributions-12', name: 'התפלגויות משותפות', nameEn: 'Joint Distributions' },
                    { id: 'moment-generating-functions-12', name: 'פונקציות יוצרות מומנטים', nameEn: 'Moment Generating Functions' },
                    { id: 'hypothesis-testing-12', name: 'בדיקת השערות', nameEn: 'Hypothesis Testing' },
                    { id: 'confidence-intervals-12', name: 'רווחי סמך', nameEn: 'Confidence Intervals' }
                ]
            },
            {
                id: 'bagrut-review-5-comprehensive',
                name: 'חזרה מקיפה לבגרות 5 יחידות',
                nameEn: 'Comprehensive Bagrut Review 5 Units',
                icon: '📝',
                difficulty: 'expert',
                subtopics: [
                    { id: 'comprehensive-calculus-12', name: 'חשבון אינפיניטסימלי מקיף', nameEn: 'Comprehensive Calculus' },
                    { id: 'comprehensive-algebra-12', name: 'אלגברה מקיפה', nameEn: 'Comprehensive Algebra' },
                    { id: 'comprehensive-geometry-12', name: 'גאומטריה אנליטית מקיפה', nameEn: 'Comprehensive Analytic Geometry' },
                    { id: 'bagrut-5-practice-12', name: 'תרגול מבחני בגרות מתקדמים', nameEn: 'Advanced Bagrut Practice' }
                ]
            }
        ]
    }
};

// ===== CURRICULUM METADATA =====
export const CURRICULUM_METADATA = {
    reformYear: 'תשפ"ה (2024-2025)',
    lastUpdated: '2024-10-20',
    source: 'משרד החינוך - המזכירות הפדגוגית',

    keyChanges: {
        grade_10_3: [
            'הסרת נושאי מסלולים וריצופים',
            'ארגון בשלושה אשכולות: מדע וחברה, כלכלי-פיננסי, התמצאות במישור ובמרחב',
            'דגש על רלוונטיות לחיי היומיום',
            'הבנה וחשיבה מתמטית'
        ],
        grade_11_3: [
            'המשך האשכולות מכיתה י׳',
            'תהליכים מעריכיים (גדילה ודעיכה)',
            'סטטיסטיקה מתקדמת - סטיית תקן, רבעונים, עשירונים'
        ],
        grade_10_4: [
            'גאומטריה משולבת (ללא מעגל בכיתה י׳)',
            'רמת סיבוכיות מועטה בגאומטריה של המישור',
            'שימוש מועט בפרמטרים בחדו"א בכיתה י׳',
            'דגש על חקירה איכותנית'
        ],
        grade_11_4: [
            'השלמת נושא המעגל',
            'בעיות קיצון: רק גיאומטריות או גרפיות (תשפ"ה-תשפ"ז)',
            'אינטגרל של פונקציה רציונלית - מכנה עד ממעלה 2',
            'לא נדרשת התפלגות בינומית בתשפ"ה'
        ],
        grade_10_5: [
            'דגש על חקירה איכותנית',
            'הנגזרת כקצב שינוי',
            'ניתן להתחיל טריגונומטריה ממעגל היחידה או ממשולש ישר זווית',
            'נושאים בטכניקה אלגברית לפי הקשר וצורך'
        ],
        grade_11_5: [
            'השלמת נושא המעגל',
            'בעיות קיצון: רק גיאומטריות או גרפיות (תשפ"ה-תשפ"ז)',
            'בגאומטריה לא יהיו פרמטרים (תשפ"ה-תשפ"ז)',
            'בבחינות: שאלות משני נושאים בלבד בגאומטריה',
            'לא נדרשת חקירה של פונקציית מנה עם שורש'
        ]
    },

    examStructure: {
        grade_10_3: {
            code: '173',
            optional: true,
            weight: '25%',
            note: 'נתון לשיקול בית הספר - מבחן מסכם, הערכה חלופית או שילוב'
        },
        grade_11_3: {
            code: '35371',
            weight: '35%',
            duration: '2:15',
            questions: 6,
            structure: '2 שאלות מכל אשכול (מדע וחברה, כלכלי-פיננסי, התמצאות)'
        },
        grade_11_4: {
            code: '471',
            weight: '40%',
            duration: '3:30',
            structure: 'פרק 1: סטטיסטיקה/הסתברות (2/3), פרק 2: גאומטריה (1/2), פרק 3: חדו"א (2/3)'
        },
        grade_11_5: {
            code: '571',
            duration: '3:45',
            structure: 'פרק 1 חובה (שאלות קצרות), פרקים 2-4 בחירה'
        }
    },

    pedagogicalPrinciples: [
        'הבנה עמוקה על פני טכניקה',
        'קישוריות בין תחומים',
        'עידוד השיח המתמטי',
        'גיוון בדרכי הוראה',
        'שימוש בטכנולוגיה',
        'ספירליות בהוראה',
        'רלוונטיות לחיי היומיום (במיוחד 3 יח״ל)'
    ]
};

// ===== HELPER FUNCTIONS =====

export function getGradeConfig(gradeId) {
    return ISRAELI_CURRICULUM[gradeId] || null;
}

export function getTopicsByGrade(gradeId) {
    const grade = ISRAELI_CURRICULUM[gradeId];
    return grade ? grade.topics : [];
}

export function getSubtopics(gradeId, topicId) {
    const grade = ISRAELI_CURRICULUM[gradeId];
    if (!grade) return [];

    const topic = grade.topics.find(t => t.id === topicId);
    return topic ? topic.subtopics : [];
}

export function findTopicByName(gradeId, topicName) {
    const grade = ISRAELI_CURRICULUM[gradeId];
    if (!grade) return null;

    return grade.topics.find(t =>
        t.name === topicName || t.nameEn === topicName
    );
}

export function getAllGrades() {
    return Object.values(ISRAELI_CURRICULUM);
}

// FIXED VERSION - at the bottom of israeliCurriculum.js
export function getUserGradeId(userGrade, userTrack) {
    // 🔥 FIX: Normalize grade format first
    let gradeNumber = userGrade;

    // If it's already in 'gradeX' format, extract the number
    if (typeof userGrade === 'string' && userGrade.startsWith('grade')) {
        gradeNumber = userGrade.replace('grade', '');
    }

    // Build the correct grade ID
    let gradeId = `grade_${gradeNumber}`;

    // For high school (10-12), add track suffix
    const gradeNum = parseInt(gradeNumber);
    if (gradeNum >= 10 && userTrack) {
        if (userTrack.includes('3')) gradeId += '_3';
        else if (userTrack.includes('4')) gradeId += '_4';
        else if (userTrack.includes('5')) gradeId += '_5';
    }

    console.log('🔍 getUserGradeId:', { userGrade, gradeNumber, gradeId });
    return gradeId;
}

// Count total subtopics for a grade
export function countSubtopics(gradeId) {
    const grade = ISRAELI_CURRICULUM[gradeId];
    if (!grade) return 0;

    return grade.topics.reduce((total, topic) => {
        return total + (topic.subtopics ? topic.subtopics.length : 0);
    }, 0);
}

// Get all topics across all grades
export function getAllTopics() {
    const allTopics = [];
    Object.values(ISRAELI_CURRICULUM).forEach(grade => {
        grade.topics.forEach(topic => {
            allTopics.push({
                ...topic,
                grade: grade.name,
                gradeId: grade.id
            });
        });
    });
    return allTopics;
}

// Search topics by keyword
export function searchTopics(keyword) {
    const results = [];
    const lowerKeyword = keyword.toLowerCase();

    Object.values(ISRAELI_CURRICULUM).forEach(grade => {
        grade.topics.forEach(topic => {
            if (topic.name.toLowerCase().includes(lowerKeyword) ||
                topic.nameEn.toLowerCase().includes(lowerKeyword)) {
                results.push({
                    ...topic,
                    grade: grade.name,
                    gradeId: grade.id
                });
            }

            // Also search in subtopics
            topic.subtopics?.forEach(subtopic => {
                if (subtopic.name.toLowerCase().includes(lowerKeyword) ||
                    subtopic.nameEn.toLowerCase().includes(lowerKeyword)) {
                    results.push({
                        ...subtopic,
                        parentTopic: topic.name,
                        grade: grade.name,
                        gradeId: grade.id
                    });
                }
            });
        });
    });

    return results;
}

// Get reform notes for a specific grade
export function getReformNotes(gradeId) {
    const grade = ISRAELI_CURRICULUM[gradeId];
    return grade?.reformNotes || null;
}

// Get exam information for a grade
export function getExamInfo(gradeId) {
    const grade = ISRAELI_CURRICULUM[gradeId];
    return grade?.examInfo || null;
}

// Get clusters for 3-unit tracks
export function getClusters(gradeId) {
    const grade = ISRAELI_CURRICULUM[gradeId];
    return grade?.clusters || null;
}

// Check if a topic is excluded in current year
export function isTopicExcluded(gradeId, topicId, year = 'תשפ"ה') {
    const grade = ISRAELI_CURRICULUM[gradeId];
    if (!grade?.reformNotes?.removed) return false;

    return grade.reformNotes.removed.some(removed =>
        removed.toLowerCase().includes(topicId.toLowerCase())
    );
}

// Get pedagogical notes for a topic
export function getPedagogicalNote(gradeId, topicId) {
    const grade = ISRAELI_CURRICULUM[gradeId];
    if (!grade) return null;

    const topic = grade.topics.find(t => t.id === topicId);
    return topic?.pedagogicalNote || null;
}

// Get all changes for reform year
export function getReformChanges() {
    return CURRICULUM_METADATA.keyChanges;
}

// Get exam structure information
export function getExamStructure() {
    return CURRICULUM_METADATA.examStructure;
}

// Default export
export default ISRAELI_CURRICULUM;