// server/services/questionClassifier.js
// Smart multi-level question classifier for Israeli curriculum

class QuestionClassifier {
    /**
     * Main classification function
     * Returns: { grade, units, topic, subtopic, difficulty }
     */
    classifyQuestion(questionText, existingMetadata = {}) {
        const text = questionText.toLowerCase();

        // Step 1: Detect Grade
        const grade = this.detectGrade(text, existingMetadata.grade);

        // Step 2: Detect Units (for grades 10-12)
        const units = this.detectUnits(text, grade, existingMetadata.units);

        // Step 3: Detect Topic & Subtopic
        const { topic, subtopic } = this.detectTopicSubtopic(text);

        // Step 4: Detect Difficulty
        const difficulty = this.detectDifficulty(text, grade, units, topic);

        return {
            grade,
            units,
            topic,
            subtopic,
            difficulty
        };
    }

    /**
     * Detect grade from content
     */
    detectGrade(text, existingGrade) {
        // Grade 12 indicators (most specific first)
        const grade12Keywords = [
            'נגזרת', 'אינטגרל', 'גבול', 'לימיט', 'dy/dx', 'dx',
            'חשבון דיפרנציאלי', 'חשבון אינטגרלי',
            'נקודות קיצון', 'נקודות פיתול', 'משיק לעקומה',
            'שטח בין עקומות', 'נפח גוף סיבוב', 'פונקציה קדומה',
            'גבול באינסוף', 'קצב שינוי רגעי'
        ];

        // Grade 11-12 indicators
        const grade11Keywords = [
            'לוגריתם', 'אקספוננ', 'log', 'ln', 'e^',
            'טריגונומטריה', 'sin', 'cos', 'tan',
            'פונקציה מעריכית', 'חזקות שליליות'
        ];

        // Grade 10 indicators
        const grade10Keywords = [
            'פונקציה ריבועית', 'פרבולה', 'משוואה ריבועית',
            'נוסחת השורשים', 'דיסקרימיננטה', 'x²'
        ];

        // Grade 9 indicators
        const grade9Keywords = [
            'משוואות לינאריות מורכבות', 'מערכת משוואות',
            'יחס ופרופורציה', 'משפט פיתגורס'
        ];

        // Check from highest to lowest grade
        if (grade12Keywords.some(kw => text.includes(kw))) return 12;
        if (grade11Keywords.some(kw => text.includes(kw))) return 11;
        if (grade10Keywords.some(kw => text.includes(kw))) return 10;
        if (grade9Keywords.some(kw => text.includes(kw))) return 9;

        // Default to existing or 8
        return existingGrade || 8;
    }

    /**
     * Detect units (3, 4, or 5) for grades 10-12
     */
    detectUnits(text, grade, existingUnits) {
        // Units only apply to grades 10-12
        if (grade < 10) return null;

        // 5 Units indicators (most advanced)
        const units5Keywords = [
            'נגזרת של פונקציה מורכבת',
            'אינטגרל מסוים מורכב',
            'נפח גוף סיבוב',
            'שטח בין שלוש עקומות',
            'נקודות פיתול',
            'אופטימיזציה',
            'גבולות באינסוף',
            'כלל לופיטל',
            'סדרות אינסופיות',
            'טריגונומטריה הפוכה',
            'אינטגרל בחלקים',
            'אינטגרל בהצבה'
        ];

        // 4 Units indicators (intermediate calculus)
        const units4Keywords = [
            'נגזרת',
            'אינטגרל',
            'גבול',
            'נקודות קיצון',
            'משיק לעקומה',
            'שטח מתחת לעקומה',
            'לוגריתם',
            'אקספוננ',
            'טריגונומטריה'
        ];

        // 3 Units indicators (basic/intermediate)
        const units3Keywords = [
            'פונקציה ליניארית',
            'פונקציה ריבועית',
            'משוואה ריבועית',
            'פרבולה',
            'גרף',
            'יחס',
            'אחוזים'
        ];

        // Count advanced concepts
        const advanced5Count = units5Keywords.filter(kw => text.includes(kw)).length;
        const advanced4Count = units4Keywords.filter(kw => text.includes(kw)).length;

        // Decision logic
        if (advanced5Count >= 1) return 5; // Any 5-units keyword = 5 units
        if (advanced4Count >= 1 && grade >= 11) return 4; // Calculus basics = 4 units
        if (advanced4Count >= 1 && grade === 10) return 4; // Grade 10 with calculus = 4 units
        if (units3Keywords.some(kw => text.includes(kw))) return 3;

        // Default based on grade
        if (existingUnits) return existingUnits;
        if (grade === 12) return 4;
        if (grade === 11) return 3;
        return null;
    }

    /**
     * Detect topic and subtopic with comprehensive mapping
     */
    detectTopicSubtopic(text) {
        const topicMap = {
            'חשבון דיפרנציאלי': {
                keywords: ['נגזרת', 'משיק', 'קצב שינוי', 'dy/dx', 'גבול', 'קיצון', 'פיתול'],
                subtopics: {
                    'נגזרות של פולינומים': ['נגזרת', 'x²', 'x³', 'פולינום', 'חזקה'],
                    'נגזרות של פונקציות מורכבות': ['פונקציה מורכבת', 'שרשור', 'כלל השרשרת'],
                    'נגזרות של פונקציות טריגונומטריות': ['נגזרת', 'sin', 'cos', 'tan'],
                    'נגזרות של פונקציות אקספוננציאליות': ['נגזרת', 'e^', 'אקספוננ'],
                    'נגזרות של פונקציות לוגריתמיות': ['נגזרת', 'ln', 'log', 'לוגריתם'],
                    'נקודות קיצון': ['מקסימום', 'מינימום', 'קיצון', 'נקודת קיצון'],
                    'נקודות פיתול': ['פיתול', 'קעור', 'קמור', 'נקודת פיתול'],
                    'משיק לעקומה': ['משיק', 'משוואת משיק', 'ישר משיק'],
                    'גבולות בסיסיים': ['גבול', 'לימיט', 'שואף'],
                    'גבולות באינסוף': ['גבול באינסוף', 'כאשר x שואף לאינסוף'],
                    'אופטימיזציה': ['אופטימיזציה', 'מינימום', 'מקסימום', 'ערך קיצון']
                }
            },
            'חשבון אינטגרלי': {
                keywords: ['אינטגרל', '∫', 'שטח', 'נפח', 'פונקציה קדומה'],
                subtopics: {
                    'אינטגרל לא מסוים': ['אינטגרל לא מסוים', 'פונקציה קדומה'],
                    'אינטגרל מסוים': ['אינטגרל מסוים', 'חשבו את האינטגרל'],
                    'אינטגרלים בסיסיים': ['∫x', '∫cos', '∫sin', 'אינטגרל בסיסי'],
                    'שטח מתחת לעקומה': ['שטח', 'מתחת ל', 'עקומה'],
                    'שטח בין עקומות': ['שטח בין', 'שתי עקומות', 'בין הפונקציות'],
                    'נפח גוף סיבוב': ['נפח', 'גוף סיבוב', 'מסתובב סביב'],
                    'אינטגרל בחלקים': ['אינטגרל בחלקים', 'integration by parts'],
                    'אינטגרל בהצבה': ['אינטגרל בהצבה', 'הצבה'],
                    'ערך ממוצע של פונקציה': ['ערך ממוצע', 'ממוצע של פונקציה']
                }
            },
            'אלגברה': {
                keywords: ['משוואה', 'אי-שווון', 'ביטוי', 'פתור', 'x', 'y'],
                subtopics: {
                    'משוואות לינאריות': ['משוואה', 'ליניארי', 'x +', 'x -'],
                    'משוואות ריבועיות': ['ריבועית', 'x²', 'דיסקרימיננטה', 'נוסחת השורשים'],
                    'משוואות אקספוננציאליות': ['אקספוננ', '^x', 'e^', '2^x'],
                    'משוואות לוגריתמיות': ['לוגריתם', 'log', 'ln'],
                    'מערכות משוואות': ['מערכת', 'שתי משוואות', 'שלוש משוואות'],
                    'אי-שוויונות': ['אי-שווון', '>', '<', '≥', '≤'],
                    'אי-שוויונות רציונליים': ['אי-שווון', 'חלוק', 'רציונלי', 'שבר'],
                    'ביטויים אלגבריים': ['פשטו', 'ביטוי', 'סוגריים'],
                    'ערך מוחלט': ['ערך מוחלט', '|x|', 'מוחלט']
                }
            },
            'גיאומטריה': {
                keywords: ['משולש', 'מעגל', 'זווית', 'שטח', 'היקף', 'נפח'],
                subtopics: {
                    'משפט פיתגורס': ['פיתגורס', 'ישר זווית', 'ניצב', 'יתר'],
                    'מעגל - שטח והיקף': ['מעגל', 'רדיוס', 'קוטר', 'היקף מעגל', 'πr²'],
                    'שטח משולש': ['שטח משולש', 'גובה', 'בסיס'],
                    'שטח מרובעים': ['שטח מרובע', 'ריבוע', 'מלבן', 'טרפז', 'מקבילית'],
                    'נפח': ['נפח', 'קובייה', 'תיבה', 'גליל', 'קונוס'],
                    'דמיון': ['דמיון', 'דומים', 'יחס דמיון'],
                    'זוויות': ['זווית', 'זוויות', 'סכום זוויות']
                }
            },
            'טריגונומטריה': {
                keywords: ['sin', 'cos', 'tan', 'סינוס', 'קוסינוס', 'טנגנס'],
                subtopics: {
                    'יחסים טריגונומטריים בסיסיים': ['sin', 'cos', 'tan', 'יחס'],
                    'משוואות טריגונומטריות': ['פתור', 'sin(x)', 'cos(x)', 'tan(x)'],
                    'זהויות טריגונומטריות': ['זהות', 'sin²', 'cos²', 'sin² + cos² = 1'],
                    'גרפים של פונקציות טריגונומטריות': ['גרף', 'sin', 'cos', 'מחזור'],
                    'טריגונומטריה הפוכה': ['arcsin', 'arccos', 'arctan', 'הפוך']
                }
            },
            'פונקציות': {
                keywords: ['פונקציה', 'f(x)', 'גרף', 'תחום', 'תמונה'],
                subtopics: {
                    'פונקציות לינאריות': ['ליניארי', 'y = mx + b', 'שיפוע'],
                    'פונקציות ריבועיות': ['ריבועית', 'פרבולה', 'x²', 'קודקוד'],
                    'פונקציות מעריכיות': ['מעריכית', 'אקספוננ', 'e^x', '2^x'],
                    'פונקציות לוגריתמיות': ['לוגריתמ', 'log', 'ln'],
                    'תחום הגדרה': ['תחום', 'תחום הגדרה'],
                    'תמונה': ['תמונה', 'טווח', 'range'],
                    'גרפים': ['גרף', 'ציור גרף', 'תרשים'],
                    'פונקציה הופכית': ['הופכית', 'inverse', 'f⁻¹']
                }
            },
            'סטטיסטיקה והסתברות': {
                keywords: ['ממוצע', 'הסתברות', 'חציון', 'שכיחות', 'סטטיסטיקה'],
                subtopics: {
                    'ממוצע חשבוני': ['ממוצע', 'חשבוני', 'average'],
                    'חציון': ['חציון', 'median'],
                    'שכיחות': ['שכיחות', 'mode'],
                    'הסתברות בסיסית': ['הסתברות', 'סיכוי', 'probability'],
                    'הסתברות מותנית': ['הסתברות מותנית', 'בהינתן', 'conditional']
                }
            },
            'סדרות': {
                keywords: ['סדרה', 'איבר', 'n-ה', 'סכום'],
                subtopics: {
                    'סדרות חשבוניות': ['סדרה חשבונית', 'הפרש קבוע', 'd'],
                    'סדרות הנדסיות': ['סדרה הנדסית', 'מנה קבועה', 'q'],
                    'סכום סדרה': ['סכום', 'Sn', 'סכום איברים']
                }
            },
            'אחוזים': {
                keywords: ['אחוז', '%', 'הנחה', 'עלייה', 'ירידה'],
                subtopics: {
                    'חישובי אחוזים בסיסיים': ['כמה אחוזים', 'חשב אחוז'],
                    'הנחות ותוספות': ['הנחה', 'תוספת', 'עלייה', 'ירידה'],
                    'אחוזים מצטברים': ['מצטבר', 'שינוי', 'גידול']
                }
            }
        };

        // Find matching topic
        let bestMatch = { topic: 'כללי', subtopic: null, score: 0 };

        for (const [topic, data] of Object.entries(topicMap)) {
            const keywordMatches = data.keywords.filter(kw => text.includes(kw)).length;

            if (keywordMatches > 0) {
                // Find matching subtopic
                for (const [subtopic, keywords] of Object.entries(data.subtopics)) {
                    const subtopicMatches = keywords.filter(kw => text.includes(kw)).length;

                    const score = keywordMatches + (subtopicMatches * 2);
                    if (score > bestMatch.score) {
                        bestMatch = { topic, subtopic, score };
                    }
                }

                // Topic match without specific subtopic
                if (keywordMatches > bestMatch.score && !bestMatch.subtopic) {
                    bestMatch = { topic, subtopic: null, score: keywordMatches };
                }
            }
        }

        return { topic: bestMatch.topic, subtopic: bestMatch.subtopic };
    }

    /**
     * Detect difficulty intelligently
     */
    detectDifficulty(text, grade, units, topic) {
        let score = 0;

        // Grade contribution
        if (grade >= 12) score += 2;
        else if (grade >= 10) score += 1;

        // Units contribution
        if (units === 5) score += 3;
        else if (units === 4) score += 2;
        else if (units === 3) score += 1;

        // Topic difficulty
        const hardTopics = ['חשבון דיפרנציאלי', 'חשבון אינטגרלי'];
        const mediumTopics = ['טריגונומטריה', 'אלגברה'];

        if (hardTopics.includes(topic)) score += 2;
        else if (mediumTopics.includes(topic)) score += 1;

        // Complexity indicators
        const complexityIndicators = [
            'מורכב', 'שרשור', 'אופטימיזציה', 'הוכח', 'נמק',
            'הסבר', 'בחלקים', 'בהצבה', 'מתקדם'
        ];
        const complexityCount = complexityIndicators.filter(ind => text.includes(ind)).length;
        score += Math.min(complexityCount, 2);

        // Multiple steps
        if (text.includes('שלב') || text.includes('תחילה') || text.includes('לאחר מכן')) {
            score += 1;
        }

        // Length factor
        if (text.length > 200) score += 1;
        if (text.length > 400) score += 1;

        // Final classification
        if (score >= 7) return 'hard';
        if (score >= 4) return 'medium';
        return 'easy';
    }
}

export default new QuestionClassifier();