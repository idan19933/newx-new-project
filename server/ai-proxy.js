// server/ai-proxy.js - SMART TOPIC-BASED QUESTION GENERATION
import { formatMathAnswer, compareMathExpressions } from './utils/mathFormatter.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import personalitySystem from './services/personalityLoader.js';
import questionHistoryManager from './services/questionHistory.js';
import SVGGenerator from './services/svgGenerator.js';
import { bucket } from './config/firebase-admin.js';

import curriculumRoutes from './routes/curriculumRoutes.js';
import learningRoutes from './routes/learningRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import nexonRoutes from './routes/nexonRoutes.js';
import notebookRoutes from './routes/notebookRoutes.js';
import aiAnalysisRoutes from './routes/aiAnalysisRoutes.js';
import performanceRoutes from './routes/performanceRoutes.js';  // ✅ הוסף שורה זו
import adaptiveDifficultyRoutes from './routes/adaptiveDifficultyRoutes.js';
import enhancedQuestionsRouter from './routes/enhancedQuestions.js';
import * as cronManager from './services/cronJobs.js';
import israeliSourcesRoutes from './routes/israeliSourcesRoutes.js';
import adaptiveRoutes from './routes/adaptive.js';
import notebookService from './services/notebookService.js';
import smartQuestionService from './services/smartQuestionService.js';
import userRoutes from './routes/userRoutes.js';
import pool from './config/database.js';


import ISRAELI_CURRICULUM, {
    getGradeConfig,
    getReformNotes,
    getExamInfo,
    getClusters,
    getPedagogicalNote,
    CURRICULUM_METADATA
} from './config/israeliCurriculum.js';

// Only load .env in development
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parser - MUST come before logging
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// SIMPLE TEST ROUTE
app.get('/test', (req, res) => {
    console.error('?? TEST ROUTE HIT!');
    res.json({ success: true, message: 'Server is reachable!' });
});
// ==================== REGISTER ROUTES ====================
console.log('📍 Registering routes...');
app.use('/api/users', userRoutes);
app.use('/api/notebook', notebookRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api', nexonRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/adaptive', adaptiveDifficultyRoutes);//
app.use('/api/questions', enhancedQuestionsRouter);  // ← חדש!
app.use('/api/israeli-sources', israeliSourcesRoutes);
app.use('/api/adaptive', adaptiveRoutes);

console.log('✅ All routes registered!');
app.post('/api/test-progress', (req, res) => {
    console.error('?? TEST PROGRESS ROUTE HIT!');
    res.json({ success: true, message: 'Test progress endpoint works!' });
});




// LOG ALL INCOMING REQUESTS
app.use((req, res, next) => {
    console.log('='.repeat(60));
    console.error('?? INCOMING REQUEST');
    console.error('?? Method:', req.method);
    console.error('?? URL:', req.url);
    console.log('Body:', JSON.stringify(req.body));
    console.log('='.repeat(60));
    next();
});

// ==================== MULTER CONFIGURATION ====================
// ==================== MULTER CONFIGURATION - ENHANCED ====================
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        console.log('📁 File upload attempt:');
        console.log('   Original name:', file.originalname);
        console.log('   MIME type:', file.mimetype);

        // Check if it's an Excel file
        const isExcel = file.originalname.toLowerCase().endsWith('.xlsx') ||
            file.originalname.toLowerCase().endsWith('.xls');

        const excelMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/octet-stream',
            'application/zip'
        ];

        // Check if it's an image file
        const isImage = file.mimetype.startsWith('image/');

        const imageMimeTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/gif'
        ];

        const validExcel = isExcel || excelMimeTypes.includes(file.mimetype);
        const validImage = isImage || imageMimeTypes.includes(file.mimetype);

        if (validExcel || validImage) {
            console.log('   ✅ File accepted');
            cb(null, true);
        } else {
            console.log('   ❌ File rejected');
            cb(new Error('Only Excel and Image files allowed!'), false);
        }
    }
});

// ==================== HELPER: CLEAN JSON ====================
// ==================== HELPER: CLEAN JSON - ENHANCED ====================
function cleanJsonText(rawText) {
    let jsonText = rawText.trim();

    // Remove markdown code blocks
    if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
    }

    // Find JSON boundaries
    const jsonStart = jsonText.indexOf('{');
    const jsonEnd = jsonText.lastIndexOf('}') + 1;

    if (jsonStart !== -1 && jsonEnd > jsonStart) {
        jsonText = jsonText.substring(jsonStart, jsonEnd);
    }

    // 🔥 FIX 1: Remove control characters EXCEPT newlines in specific contexts
    jsonText = jsonText
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');

    // 🔥 FIX 2: Fix newlines inside string values
    // This regex finds strings and replaces \n with \\n inside them
    jsonText = jsonText.replace(
        /"([^"\\]|\\.)*"/g,
        match => match.replace(/\n/g, '\\n').replace(/\r/g, '\\r')
    );

    // 🔥 FIX 3: Fix common JSON syntax errors
    jsonText = jsonText
        // Fix trailing commas before } or ]
        .replace(/,(\s*[}\]])/g, '$1')
        // Fix missing commas between properties (common Claude error)
        .replace(/("\s*:\s*"[^"]*")\s*("\w+"\s*:)/g, '$1,$2')
        .replace(/("\s*:\s*\d+)\s*("\w+"\s*:)/g, '$1,$2')
        .replace(/("\s*:\s*true|false)\s*("\w+"\s*:)/g, '$1,$2')
        // Fix unescaped quotes in Hebrew text
        .replace(/:\\s*"([^"]*?)"([^,}\]]*?)"/g, (match, p1, p2) => {
            if (p2.includes('"')) {
                return `: "${p1}\\"${p2}"`;
            }
            return match;
        });

    // 🔥 FIX 4: Validate and repair structure
    try {
        // Try to parse - if it works, return as-is
        JSON.parse(jsonText);
        return jsonText;
    } catch (e) {
        console.log('⚠️ JSON still invalid, attempting deep repair...');
        console.log('   Error:', e.message);
        console.log('   Position:', e.message.match(/position (\d+)/)?.[1]);

        // Log the problematic area
        const errorPos = parseInt(e.message.match(/position (\d+)/)?.[1] || '0');
        if (errorPos > 0) {
            const start = Math.max(0, errorPos - 50);
            const end = Math.min(jsonText.length, errorPos + 50);
            console.log('   Context:', jsonText.substring(start, end));
        }

        // Last resort: Try to fix specific common patterns
        jsonText = jsonText
            // Fix Hebrew quotes that break JSON
            .replace(/״/g, '\\"')
            .replace(/׳/g, "'")
            // Fix double quotes in values
            .replace(/"([^"]*)"([^"]*?)"/g, (match, p1, p2) => {
                if (p2.includes(':') || p2.includes(',') || p2.includes('}')) {
                    return `"${p1}"${p2}`;
                }
                return `"${p1}${p2.replace(/"/g, '\\"')}"`;
            });

        return jsonText;
    }
}

// ==================== TOPIC CLASSIFICATION SYSTEM ====================
function classifyTopic(topicName, subtopicName) {
    const topic = String(topicName || '').toLowerCase();
    const subtopic = String(subtopicName || '').toLowerCase();

    const isPureGeometry = (
        (topic.includes('גאומטריה') || topic.includes('geometry')) &&
        (subtopic.includes('נקודות') || subtopic.includes('קווים') ||
            subtopic.includes('מישורים') || subtopic.includes('points') ||
            subtopic.includes('lines') || subtopic.includes('planes'))
    );

    const isAppliedGeometry = (
        (topic.includes('גאומטריה') || topic.includes('geometry')) &&
        (subtopic.includes('משולש') || subtopic.includes('ריבוע') ||
            subtopic.includes('מעגל') || subtopic.includes('שטח') ||
            subtopic.includes('היקף') || subtopic.includes('triangle') ||
            subtopic.includes('rectangle') || subtopic.includes('circle') ||
            subtopic.includes('area') || subtopic.includes('perimeter'))
    );

    const isStatistics = (
        topic.includes('סטטיסטיקה') || topic.includes('statistics') ||
        topic.includes('גרפים') || topic.includes('graphs') ||
        subtopic.includes('פיזור') || subtopic.includes('scatter') ||
        subtopic.includes('רבעון') || subtopic.includes('quartile')
    );

    const isAlgebra = (
        topic.includes('אלגברה') || topic.includes('algebra') ||
        subtopic.includes('משוואות') || subtopic.includes('equations')
    );

    return {
        isPureGeometry,
        isAppliedGeometry,
        isStatistics,
        isAlgebra,
        allowsRealWorld: !isPureGeometry,
        requiresAbstract: isPureGeometry,
        requiresData: isStatistics
    };
}

// ==================== CURRICULUM-AWARE CONTEXT BUILDER ====================
function buildCurriculumContext(gradeId, topic, subtopic) {
    const gradeConfig = getGradeConfig(gradeId);
    if (!gradeConfig) return '';

    let context = `\n📚 CURRICULUM CONTEXT (תשפ"ה Reform):\n`;
    context += `Grade: ${gradeConfig.name} (${gradeConfig.nameEn})\n`;

    if (gradeConfig.implementationYear) {
        context += `Reform Year: ${gradeConfig.implementationYear}\n`;
    }

    const reformNotes = getReformNotes(gradeId);
    if (reformNotes) {
        if (reformNotes.emphasis) {
            context += `\n🎯 Pedagogical Emphasis:\n`;
            reformNotes.emphasis.forEach(e => context += `  - ${e}\n`);
        }
        if (reformNotes.removed) {
            context += `\n❌ Excluded Topics:\n`;
            reformNotes.removed.forEach(r => context += `  - ${r}\n`);
        }
    }

    const clusters = getClusters(gradeId);
    if (clusters) {
        context += `\n🎨 Learning Clusters:\n`;
        clusters.forEach(c => {
            context += `  - ${c.name}: ${c.description}\n`;
        });
    }

    const topicId = topic?.id || '';
    if (topicId) {
        const pedNote = getPedagogicalNote(gradeId, topicId);
        if (pedNote) {
            context += `\n📝 Topic Note: ${pedNote}\n`;
        }
    }

    if (subtopic) {
        const subtopicName = subtopic.name || '';
        if (subtopicName) {
            context += `\n🔍 Specific Subtopic: ${subtopicName}\n`;
            if (subtopic.note) {
                context += `   Note: ${subtopic.note}\n`;
            }
        }
    }

    context += `\n`;
    return context;
}

// ==================== ENHANCED SYSTEM PROMPT ====================
function buildEnhancedSystemPrompt(studentProfile, gradeId, topic, subtopic) {
    const { grade, mathFeeling } = studentProfile || {};

    let prompt = '';

    // Personality
    if (personalitySystem.loaded) {
        const personality = personalitySystem.data.corePersonality;
        prompt += `אתה ${personality.teacher_name}, ${personality.description}.\n`;
        prompt += `${personality.teaching_approach}\n\n`;
    } else {
        prompt += `אתה נקסון, מורה דיגיטלי למתמטיקה.\n\n`;
    }

    // Student context
    if (grade) {
        prompt += `התלמיד בכיתה ${grade}.\n`;
    }

    if (mathFeeling === 'struggle') {
        prompt += `התלמיד מתקשה - היה סבלני מאוד, תן הסברים צעד-צעד.\n`;
    } else if (mathFeeling === 'love') {
        prompt += `התלמיד אוהב מתמטיקה - אתגר אותו!\n`;
    }

    // 🔥 CRITICAL: Core principles
    prompt += `\n🎯 עקרונות חובה:\n`;
    prompt += `✓ יצור שאלות ייחודיות ומגוונות\n`;
    prompt += `✓ עקוב אחר תכנית הלימודים הישראלית (תשפ"ה)\n`;
    prompt += `✓ השתמש בעברית ברורה וטבעית\n`;
    prompt += `✓ החזר JSON תקין בלבד\n`;
    prompt += `✓ אל תחזור על שאלות קודמות\n`;
    prompt += `✓ כל שאלה = חווייה חדשה\n\n`;

    return prompt;
}

// ==================== VALIDATE QUESTION HAS RAW DATA ====================
function validateQuestionHasRawData(parsed, topic, subtopic) {
    const questionText = parsed?.question || '';

    if (!questionText || typeof questionText !== 'string') {
        return { valid: true };
    }

    const graphTopics = [
        'פונקציות', 'גרפים', 'Functions', 'Graphs',
        'סטטיסטיקה', 'Statistics', 'נתונים', 'Data',
        'פיזור', 'Scatter', 'רבעונים', 'Quartiles',
        'תחום בין-רבעוני', 'IQR', 'היסטוגרמה', 'Histogram'
    ];

    const topicName = String(topic?.name || '');
    const topicNameEn = String(topic?.nameEn || '');
    const subtopicName = String(subtopic?.name || '');
    const subtopicNameEn = String(subtopic?.nameEn || '');

    const needsGraph = graphTopics.some(t =>
        topicName.includes(t) ||
        topicNameEn.includes(t) ||
        subtopicName.includes(t) ||
        subtopicNameEn.includes(t)
    );

    if (!needsGraph) {
        return { valid: true };
    }

    console.log('🔍 Validating question has raw data...');

    const forbiddenPatterns = [
        /ממוצע.*הוא/,
        /ממוצע.*הכללי/,
        /נע בין.*\d+-\d+/,
        /גרף.*מראה/,
        /גרף.*מציג/,
        /הגרף.*שלו.*מציג/,
        /הגרף.*שלפניכם/,
        /בגרף.*שלפניכם/,
        /גרף.*הפיזור.*שלפניכם/,
        /תרשים.*מציג/,
        /טבלה.*מציגה/,
        /הקשר בין/,
        /מתואר.*גרף/,
        /מוצגות.*בגרף/,
        /מופיעים.*בגרף/,
        /התוצאות.*מוצגות/,
        /הנתונים.*מוצגים/,
        /נתונים.*אלה.*מוצגים/,
        /מוצגים.*בגרף.*פיזור/,
        /נתוני.*הסקר.*מראים/,
        /נתונים.*אלה/i,
        /להלן.*הנתונים/i,
        /בגרף.*הבא/,
        /בגרף.*הפיזור.*הבא/,
        /שם.*התלמיד.*\|/,
        /\d+-\d+\s*\|/,
        /\d+\+\s*\|/,
        /טבלה.*הבאה/,
        /\|.*\|.*\|/,
        /[א-ת]+\s*\d*\s*:\s*\d+\s*שעות/i,
        /תלמיד\s*\d+\s*:\s*\d+/i,
        /[א-ת]+:\s*\d+\s*שעות,\s*[א-ת]+:\s*\d+\s*שעות/
    ];

    const hasForbiddenPattern = forbiddenPatterns.some(pattern =>
        pattern.test(questionText)
    );

    if (hasForbiddenPattern) {
        console.log('❌ Question has FORBIDDEN pattern');
        return {
            valid: false,
            reason: 'Contains forbidden patterns'
        };
    }

    const hasTwoLabeledLists = /\(x\)\s*:\s*[0-9,\s]+/i.test(questionText) &&
        /\(y\)\s*:\s*[0-9,\s]+/i.test(questionText);

    if (hasTwoLabeledLists) {
        console.log('✅ Question has TWO labeled lists');
        return { valid: true };
    }

    const commaNumbers = questionText.match(/\d+(?:\.\d+)?(?:\s*,\s*\d+(?:\.\d+)?){9,}/g);

    if (commaNumbers && commaNumbers.length > 0) {
        console.log('✅ Question has comma-separated numbers');
        return { valid: true };
    }

    console.log('❌ Question does NOT have proper raw data');
    return {
        valid: false,
        reason: 'Missing proper data format'
    };
}

// ==================== FORCE REWRITE ====================
function forceRewriteGraphDescription(parsed, topic, subtopic) {
    const questionText = parsed?.question || '';

    if (!questionText || typeof questionText !== 'string') {
        return parsed;
    }

    const forbiddenPatterns = [
        /הגרף.*מציג/i,
        /התרשים.*מציג/i,
        /הגרף.*מראה/i,
        /התוצאות.*מוצגות/i,
        /הנתונים.*מוצגים/i,
        /נתונים.*אלה.*מוצגים/i,
        /נתוני.*הסקר.*מראים/i,
        /נתונים.*אלה/i,
        /להלן.*הנתונים/i,
        /הגרף.*שלו.*מציג/i,
        /מוצגים.*בגרף.*פיזור/i
    ];

    const hasGraphDescription = forbiddenPatterns.some(pattern => pattern.test(questionText));

    const anyLabelPattern = /([א-ת]+\s*\d*)\s*:\s*(\d+)\s*שעות/g;
    const anyLabelMatches = [...questionText.matchAll(anyLabelPattern)];
    const hasLabelValueFormat = anyLabelMatches.length >= 3;

    if (!hasGraphDescription && !hasLabelValueFormat) {
        return parsed;
    }

    console.log('🚨 FORCING COMPLETE REWRITE');

    const questionLower = questionText.toLowerCase();
    const isSport = questionLower.includes('ספורט') || questionLower.includes('חוג');
    const isGrades = questionLower.includes('ציון');

    const numPoints = 20 + Math.floor(Math.random() * 4);
    const xValues = [];
    const yValues = [];

    let rewrittenQuestion = '';
    let xLabel = 'X';
    let yLabel = 'Y';

    if (isSport && isGrades) {
        for (let i = 0; i < numPoints; i++) {
            xValues.push(Math.floor(1 + Math.random() * 7));
            yValues.push(Math.floor(65 + Math.random() * 30));
        }

        rewrittenQuestion = `נאספו נתונים על ${numPoints} תלמידים - מספר שעות ספורט שבועיות והציון במתמטיקה:

שעות ספורט שבועיות (x): ${xValues.join(', ')}
ציון במתמטיקה (y): ${yValues.join(', ')}

צרו גרף פיזור והסבירו מה ניתן ללמוד על הקשר בין המשתנים.`;

        xLabel = 'שעות ספורט';
        yLabel = 'ציון במתמטיקה';

    } else {
        for (let i = 0; i < numPoints; i++) {
            xValues.push(Math.floor(10 + Math.random() * 40));
            yValues.push(Math.floor(50 + Math.random() * 50));
        }

        rewrittenQuestion = `נתונות ${numPoints} נקודות עם שני משתנים:

משתנה X: ${xValues.join(', ')}
משתנה Y: ${yValues.join(', ')}

צרו גרף פיזור וקבעו את סוג המתאם בין המשתנים.`;

        xLabel = 'X';
        yLabel = 'Y';
    }

    const points = xValues.map((x, idx) => ({
        x: x,
        y: yValues[idx],
        label: `נקודה ${idx + 1}`
    }));

    const visualData = {
        type: 'scatter',
        points: points,
        xRange: [Math.min(...xValues) - 2, Math.max(...xValues) + 2],
        yRange: [Math.min(...yValues) - 2, Math.max(...yValues) + 2],
        color: '#9333ea',
        label: 'גרף פיזור',
        xLabel: xLabel,
        yLabel: yLabel
    };

    parsed.question = rewrittenQuestion;
    parsed.visualData = visualData;

    console.log('✅ Question REWRITTEN');
    return parsed;
}

// ==================== VISUAL DATA EXTRACTION ====================
function ensureVisualDataForGraphQuestions(parsed, topic, subtopic) {
    try {
        const questionText = parsed?.question || '';

        if (!questionText || typeof questionText !== 'string') {
            console.log('⚠️ Invalid question text');
            return parsed;
        }

        console.log('\n🔥🔥🔥 EXTRACTION V2 STARTING 🔥🔥🔥');
        console.log('Question (first 200):', questionText.substring(0, 200));
        console.log('AI visualData:', parsed.visualData ? 'EXISTS' : 'NULL');

        if (parsed.visualData && (parsed.visualData.data?.length > 0 || parsed.visualData.points?.length > 0)) {
            console.log('✅ visualData already complete');
            return parsed;
        }

        console.log('\n🔎 METHOD 1: X-Y labeled lists');

        const patterns = [
            { x: /([^\n:]+?)\s*\(x\)\s*:\s*([0-9,\s.]+)/i, y: /([^\n:]+?)\s*\(y\)\s*:\s*([0-9,\s.]+)/i },
            { x: /([^\n:]+?)\s*\(x\)\s*\:\s*([0-9,\s.]+)/i, y: /([^\n:]+?)\s*\(y\)\s*\:\s*([0-9,\s.]+)/i },
            { x: /([א-ת\s]+)\(x\)\s*:\s*([0-9,\s.]+)/i, y: /([א-ת\s]+)\(y\)\s*:\s*([0-9,\s.]+)/i }
        ];

        for (let i = 0; i < patterns.length; i++) {
            const xMatch = questionText.match(patterns[i].x);
            const yMatch = questionText.match(patterns[i].y);

            if (xMatch && yMatch) {
                console.log(`✓ Pattern ${i + 1} matched!`);

                const xLabel = xMatch[1].trim();
                const yLabel = yMatch[1].trim();

                const xValues = xMatch[2]
                    .split(/[,،\s]+/)
                    .map(n => parseFloat(n.trim()))
                    .filter(n => !isNaN(n) && isFinite(n));

                const yValues = yMatch[2]
                    .split(/[,،\s]+/)
                    .map(n => parseFloat(n.trim()))
                    .filter(n => !isNaN(n) && isFinite(n));

                console.log(`   X: ${xValues.length} values →`, xValues.slice(0, 5));
                console.log(`   Y: ${yValues.length} values →`, yValues.slice(0, 5));

                if (xValues.length >= 4 && yValues.length >= 4) {
                    const minLength = Math.min(xValues.length, yValues.length);
                    const points = xValues.slice(0, minLength).map((x, idx) => ({
                        x: x,
                        y: yValues[idx],
                        label: `נקודה ${idx + 1}`
                    }));

                    const visualData = {
                        type: 'scatter',
                        points: points,
                        xRange: [Math.min(...xValues.slice(0, minLength)) - 1, Math.max(...xValues.slice(0, minLength)) + 1],
                        yRange: [Math.min(...yValues.slice(0, minLength)) - 1, Math.max(...yValues.slice(0, minLength)) + 1],
                        color: '#9333ea',
                        label: 'גרף פיזור',
                        xLabel: xLabel,
                        yLabel: yLabel
                    };

                    console.log('✅✅✅ SUCCESS! Scatter plot created');
                    console.log('🔥🔥🔥 EXTRACTION COMPLETE 🔥🔥🔥\n');
                    return { ...parsed, visualData };
                }
            }
        }

        console.log('⚠️ Could not extract any valid data');
        console.log('🔥🔥🔥 EXTRACTION FAILED 🔥🔥🔥\n');

    } catch (error) {
        console.error('❌ EXTRACTION ERROR:', error.message);
    }

    return parsed;
}

// ==================== DETECT GEOMETRY QUESTIONS ====================
// ==================== DETECT GEOMETRY QUESTIONS - FIXED ====================
// ==================== DETECT GEOMETRY QUESTIONS - FIXED V2 ====================
// ==================== DETECT GEOMETRY QUESTIONS - FIXED V3 WITH HEIGHT FILTERING ====================
// ==================== DETECT GEOMETRY QUESTIONS - COMPLETE FIXED VERSION ====================
function detectGeometryVisual(parsed, topic, subtopic) {
    const questionText = (parsed?.question || '').toLowerCase();

    if (!questionText || typeof questionText !== 'string') {
        return parsed;
    }

    const geometryKeywords = [
        'משולש', 'triangle', 'ריבוע', 'square', 'מלבן', 'rectangle',
        'עיגול', 'circle', 'מעגל', 'זווית', 'angle', 'צלע', 'side',
        'ניצב', 'right', 'שווה צלעות', 'equilateral', 'היקף', 'perimeter',
        'שטח', 'area', 'רדיוס', 'radius', 'קוטר', 'diameter',
        'שווה שוקיים', 'isosceles', 'שוקיים', 'שווה-שוקיים'
    ];

    const isGeometry = geometryKeywords.some(keyword => questionText.includes(keyword));
    if (!isGeometry) return parsed;

    console.log('🔺 Geometry question detected');
    console.log('   Question:', parsed.question);

    // 🔥 STEP 1: Extract and exclude angles
    const anglePatterns = [
        /זווית.*?(\d+)°/gi,
        /זווית.*?(\d+)\s*מעלות/gi,
        /(\d+)°/g,
        /angle.*?(\d+)/gi
    ];

    const angleNumbers = new Set();
    anglePatterns.forEach(pattern => {
        let match;
        const regex = new RegExp(pattern);
        while ((match = regex.exec(parsed.question)) !== null) {
            angleNumbers.add(parseFloat(match[1]));
        }
    });
    console.log('   🚫 Angles to exclude:', Array.from(angleNumbers));

    // 🔥 STEP 2: Extract and exclude height
    const heightPatterns = [
        /גובה.*?(\d+)/gi,
        /height.*?(\d+)/gi
    ];

    const heightNumbers = new Set();
    heightPatterns.forEach(pattern => {
        let match;
        const regex = new RegExp(pattern);
        while ((match = regex.exec(parsed.question)) !== null) {
            heightNumbers.add(parseFloat(match[1]));
        }
    });
    console.log('   🚫 Heights to exclude:', Array.from(heightNumbers));

    // 🔥 STEP 3: Extract ALL numbers, then filter out angles and heights
    const allNumbers = (parsed.question || '')
        .match(/\d+(\.\d+)?/g)
        ?.map(n => parseFloat(n))
        .filter(n => !angleNumbers.has(n) && !heightNumbers.has(n) && n > 0 && n < 1000) || [];

    console.log('   ✅ Valid numbers (after filtering):', allNumbers);

    let visualData = null;

    // ==================== TRIANGLE DETECTION ====================
    if (questionText.includes('משולש') || questionText.includes('triangle')) {
        console.log('   → Triangle detected');

        // Detect triangle type
        const isRight = questionText.includes('ניצב') || questionText.includes('right') ||
            questionText.includes('ישר-זווית') || questionText.includes('ישר זווית');
        const isEquilateral = questionText.includes('שווה צלעות') || questionText.includes('equilateral');
        const isIsosceles = questionText.includes('שווה שוקיים') || questionText.includes('שווה-שוקיים') ||
            questionText.includes('isosceles') || questionText.includes('שוקיים');

        let type = 'scalene';
        if (isRight) type = 'right';
        else if (isEquilateral) type = 'equilateral';
        else if (isIsosceles) type = 'isosceles';

        console.log('   Triangle type:', type);

        let sideA, sideB, sideC;

        // 🔥 ENHANCED ISOSCELES EXTRACTION
        if (isIsosceles) {
            console.log('   → Processing ISOSCELES triangle');

            // 🔥 METHOD 1: Look for explicit "בסיס" and "שוקיים" keywords
            const basePatterns = [
                /(?:אורך\s+ה?)?בסיס(?:\s+הוא)?\s+(\d+)/i,
                /בסיס\s+(\d+)/i,
                /base\s+(\d+)/i
            ];

            const legPatterns = [
                /(?:אורך\s+ה?)?שוקיים(?:\s+הוא)?\s+(\d+)/i,
                /שוקיים\s+(\d+)/i,
                /legs?\s+(\d+)/i
            ];

            let base = null;
            let leg = null;

            // Try to find base
            for (const pattern of basePatterns) {
                const match = parsed.question.match(pattern);
                if (match) {
                    base = parseFloat(match[1]);
                    console.log('   ✅ Found BASE from keyword:', base);
                    break;
                }
            }

            // Try to find legs
            for (const pattern of legPatterns) {
                const match = parsed.question.match(pattern);
                if (match) {
                    leg = parseFloat(match[1]);
                    console.log('   ✅ Found LEGS from keyword:', leg);
                    break;
                }
            }

            // 🔥 METHOD 2: Fallback - use position in filtered numbers
            if (!base || !leg) {
                console.log('   → Using fallback method');

                if (allNumbers.length >= 2) {
                    // First number is usually base, second is legs
                    base = allNumbers[0];
                    leg = allNumbers[1];
                    console.log('   ✅ Fallback - Base:', base, 'Legs:', leg);
                } else if (allNumbers.length === 1) {
                    // Only one number - make equilateral
                    base = allNumbers[0];
                    leg = allNumbers[0];
                    console.log('   ⚠️ Only one number - using equilateral');
                } else {
                    // No numbers - use defaults
                    base = 8;
                    leg = 10;
                    console.log('   ⚠️ No numbers found - using defaults');
                }
            }

            // Ensure we have valid numbers
            if (!angleNumbers.has(base) && !heightNumbers.has(base) &&
                !angleNumbers.has(leg) && !heightNumbers.has(leg)) {
                sideA = base;    // Base (BC)
                sideB = leg;     // Left leg (AB)
                sideC = leg;     // Right leg (AC)
                console.log('   ✅ FINAL ISOSCELES - Base:', sideA, 'Legs:', sideB, sideC);
            } else {
                // Validation failed - use defaults
                sideA = 8;
                sideB = 10;
                sideC = 10;
                console.log('   ⚠️ Validation failed - using defaults');
            }
        }
        // EQUILATERAL
        else if (isEquilateral) {
            sideA = allNumbers[0] || 8;
            sideB = sideA;
            sideC = sideA;
            console.log('   ✅ Equilateral - All sides:', sideA);
        }
        // RIGHT TRIANGLE
        else if (isRight) {
            sideA = allNumbers[0] || 3;
            sideB = allNumbers[1] || 4;
            sideC = allNumbers[2] || 5;
            console.log('   ✅ Right triangle - Sides:', sideA, sideB, sideC);
        }
        // SCALENE
        else {
            sideA = allNumbers[0] || 6;
            sideB = allNumbers[1] || 8;
            sideC = allNumbers[2] || 7;
            console.log('   ✅ Scalene - Sides:', sideA, sideB, sideC);
        }

        console.log('   📏 FINAL TRIANGLE - A:', sideA, 'B:', sideB, 'C:', sideC);

        visualData = {
            type: 'svg-triangle',
            svgData: {
                type: type,
                sideA: sideA,
                sideB: sideB,
                sideC: sideC,
                showLabels: true,
                showAngles: questionText.includes('זווית') || questionText.includes('angle')
            }
        };
    }
    // ==================== RECTANGLE ====================
    else if (questionText.includes('מלבן') || questionText.includes('rectangle')) {
        const width = allNumbers[0] || 5;
        const height = allNumbers[1] || 3;
        visualData = {
            type: 'svg-rectangle',
            svgData: { width, height, showLabels: true }
        };
    }
    // ==================== CIRCLE ====================
    else if (questionText.includes('עיגול') || questionText.includes('מעגל') || questionText.includes('circle')) {
        const radius = allNumbers[0] || 5;
        visualData = {
            type: 'svg-circle',
            svgData: { radius, showLabels: true }
        };
    }

    if (visualData) {
        console.log('✅ Visual created:', visualData.type);
        console.log('   📊 Data:', JSON.stringify(visualData.svgData, null, 2));
        parsed.visualData = visualData;
    }

    return parsed;
}

// ==================== HEALTH CHECK ====================
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Nexon AI Server - Smart Topic-Based Questions',
        personalityLoaded: personalitySystem.loaded,
        curriculumLoaded: true,
        questionHistoryActive: true,
        visualGenerationActive: true,
        reformYear: CURRICULUM_METADATA.reformYear,
        firebaseStorage: bucket ? 'available' : 'unavailable'
    });
});

// ==================== 🔥 SMART TOPIC-BASED QUESTION PROMPT ====================
// ==================== 🔥 SMART TOPIC-BASED QUESTION PROMPT ====================
// ==================== 🔥 SMART TOPIC-BASED QUESTION PROMPT ====================
// ==================== 🔥 SMART TOPIC-BASED QUESTION PROMPT - COMPLETE ====================
// ==================== 🔥 COMPLETE buildDynamicQuestionPrompt WITH EXAMPLE FILTERING ====================
function buildDynamicQuestionPrompt(topic, subtopic, difficulty, studentProfile, gradeId) {
    try {
        if (!topic || typeof topic !== 'object') {
            console.error('❌ Invalid topic object:', topic);
            throw new Error('Invalid topic object');
        }

        const topicName = String(topic?.name || 'Unknown Topic');
        const subtopicName = String(subtopic?.name || '');
        const studentGrade = String(studentProfile?.grade || '7');

        console.log('✅ Building prompt - Topic:', topicName, '/ Subtopic:', subtopicName);

        const classification = classifyTopic(topicName, subtopicName);

        // 🔥 FIX 1: START WITH CURRICULUM CONTEXT
        let prompt = buildCurriculumContext(gradeId, topic, subtopic);

        prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        prompt += `🎯 יצירת שאלה חדשה ומקורית\n`;
        prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        prompt += `נושא ראשי: ${topicName}\n`;
        if (subtopicName) {
            prompt += `תת-נושא (זה המוקד העיקרי): ${subtopicName}\n`;
            prompt += `⚠️ השאלה חייבת להיות ישירות על "${subtopicName}"\n`;
        }
        prompt += `רמת קושי: ${difficulty}\n`;
        prompt += `כיתה: ${studentGrade}\n`;
        prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

        // 🔥 FIX 2: SHOW RECENT QUESTIONS PROMINENTLY
        const studentId = studentProfile?.studentId || studentProfile?.name || 'anonymous';
        const topicId = topic?.id || topicName;
        const recentQuestions = questionHistoryManager.getRecentQuestions(studentId, topicId, 10);

        if (recentQuestions && recentQuestions.length > 0) {
            prompt += `🚨 אסור לחזור על שאלות קודמות:\n`;
            prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            recentQuestions.forEach((q, idx) => {
                const preview = q.question.substring(0, 100).replace(/\n/g, ' ');
                prompt += `${idx + 1}. ${preview}...\n`;
            });
            prompt += `\n⚠️⚠️⚠️ צור משהו שונה לחלוטין:\n`;
            prompt += `- הקשר שונה\n`;
            prompt += `- מספרים שונים\n`;
            prompt += `- זווית גישה שונה\n`;
            prompt += `- נוסח שונה\n`;
            prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        }

        // 🔥 FIX 3: GEOMETRY RULES (if applicable)
        if (classification.isPureGeometry) {
            prompt += `📐 גאומטריה טהורה - חובה:\n`;
            prompt += `✓ התחל ב"נתון/נתונה/נתונים"\n`;
            prompt += `✓ אסור הקשרים מהחיים האמיתיים\n`;
            prompt += `✓ דוגמאות: "נתון מישור α", "נתונות נקודות A, B"\n\n`;
        }

        if (classification.isAppliedGeometry) {
            prompt += `📏 גאומטריה יישומית:\n`;
            prompt += `✓ התחל: "נתון משולש...", "נתון ריבוע..."\n`;
            prompt += `✓ שאל על: שטח, היקף, גובה, צלע\n\n`;

            prompt += `🚨 חוקים למשולשים:\n`;
            prompt += `• משולש שווה-שוקיים: רק בסיס + שוקיים (2 מספרים)\n`;
            prompt += `  ❌ אסור לתת גובה!\n`;
            prompt += `  ✅ "נתון משולש שווה-שוקיים, בסיס 12, שוקיים 15"\n`;
            prompt += `• משולש ישר-זווית: שני ניצבים\n`;
            prompt += `• משולש כללי: בסיס + גובה (מותר)\n\n`;
        }

        // 🔥 FIX 4: FILTER EXAMPLES AGGRESSIVELY
        if (personalitySystem.loaded) {
            const topicGuideline = personalitySystem.getTopicGuideline(topicName);
            if (topicGuideline?.curriculum_requirements) {
                prompt += `📚 דרישות תכנית לימודים:\n${topicGuideline.curriculum_requirements}\n\n`;
            }

            try {
                let examples = personalitySystem.getExamplesForTopic(topicName, difficulty);

                if (examples && examples.length > 0) {
                    // 🔥 AGGRESSIVE FILTERING
                    const isTriangleTopic = topicName.includes('משולש') || topicName.includes('triangle') ||
                        topicName.includes('גאומטריה') || subtopicName.includes('משולש');

                    if (isTriangleTopic) {
                        console.log('   🔍 Filtering triangle examples...');

                        examples = examples.filter(ex => {
                            const q = String(ex?.question || '');
                            if (!q) return false;

                            const isIsosceles = /שווה[- ]?שוקיים|isosceles/i.test(q);
                            if (!isIsosceles) return true;

                            // Reject if mentions height as given
                            const badPatterns = [
                                /אם\s+גובה/i,
                                /וגובה\s+המשולש/i,
                                /גובה\s+המשולש\s+(?:לבסיס\s+)?(?:הוא|הינו)\s+\d+/i,
                                /,\s*גובה\s+\d+/i,
                                /\.\s*גובה\s+\d+/i
                            ];

                            const isBad = badPatterns.some(p => p.test(q));
                            if (isBad) {
                                console.log('   ❌ Filtered:', q.substring(0, 60));
                                return false;
                            }
                            return true;
                        });

                        console.log(`   📊 ${examples.length} examples after filtering`);
                    }

                    // 🔥 ALSO FILTER BY RECENT QUESTIONS
                    if (recentQuestions && recentQuestions.length > 0) {
                        examples = examples.filter(ex => {
                            const exQ = String(ex?.question || '').toLowerCase();
                            return !recentQuestions.some(recent => {
                                const recentQ = recent.question.toLowerCase();
                                // Check for similar context/numbers
                                const exNums = exQ.match(/\d+/g) || [];
                                const recentNums = recentQ.match(/\d+/g) || [];
                                const numOverlap = exNums.filter(n => recentNums.includes(n)).length;
                                return numOverlap > 2; // More than 2 same numbers = too similar
                            });
                        });
                    }

                    if (examples.length > 0) {
                        const shuffled = examples.sort(() => 0.5 - Math.random());
                        const selected = shuffled.slice(0, Math.min(2, examples.length));

                        prompt += `📚 סגנונות לדוגמה (צור משהו שונה!):\n`;
                        selected.forEach((ex, i) => {
                            prompt += `${i + 1}. ${ex.question}\n`;
                        });
                        prompt += `\n⚠️ השאלה שלך חייבת להיות ייחודית לגמרי!\n`;

                        if (isTriangleTopic) {
                            prompt += `\n🚨 למשולש שווה-שוקיים:\n`;
                            prompt += `גם אם אתה רואה דוגמאות ישנות עם "גובה" - אל תחקה!\n`;
                            prompt += `השתמש רק: "בסיס X, שוקיים Y" (2 מספרים)\n`;
                        }
                        prompt += `\n`;
                    } else {
                        console.log('   ⚠️ All examples filtered out - creating fresh');
                    }
                }
            } catch (exampleError) {
                console.error('⚠️ Error loading examples:', exampleError.message);
            }
        }

        // 🔥 FIX 5: ADD VARIATION STRATEGIES
        if (!classification.isPureGeometry) {
            const strategies = [
                'גישה מתמטית טהורה: "נתון..."',
                'סיפור מהחיים: בית ספר, ספורט, קניות',
                'אתגר רב-שלבי',
                'גילוי תבנית',
                'השוואה בין מצבים'
            ];
            const randomStrategy = strategies[Math.floor(Math.random() * strategies.length)];
            prompt += `🎲 אסטרטגיה: ${randomStrategy}\n`;
            prompt += `🔢 השתמש במספרים מעניינים ומגוונים\n\n`;
        }

        // Statistics requirements
        if (classification.isStatistics) {
            prompt += `📊 נתונים סטטיסטיים:\n`;
            prompt += `✅ לפחות 20 נקודות מידע\n`;
            prompt += `✅ פורמט: "משתנה X: 12, 15, 18, 21...\n`;
            prompt += `          משתנה Y: 45, 52, 48, 55..."\n\n`;
        }

        // JSON format
        prompt += `\n🚨 פורמט JSON חובה:\n`;
        prompt += `{\n`;
        prompt += `  "question": "השאלה (ללא שורות חדשות אמיתיות)",\n`;
        prompt += `  "correctAnswer": "התשובה",\n`;
        prompt += `  "hints": ["רמז 1", "רמז 2", "רמז 3"],\n`;
        prompt += `  "explanation": "הסבר"\n`;
        prompt += `}\n`;
        prompt += `• השתמש ב-\\n לשורה חדשה, לא Enter\n`;
        prompt += `• בדוק שאין פסיקים מיותרים\n`;
        prompt += `• החזר רק JSON, ללא טקסט נוסף\n\n`;

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 PROMPT READY');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log(prompt);
        return prompt;

    } catch (error) {
        console.error('❌ FATAL ERROR in buildDynamicQuestionPrompt:', error);
        throw new Error(`buildDynamicQuestionPrompt failed: ${error.message}`);
    }
}
// ==================== GENERATE QUESTION ENDPOINT ====================
// ==================== GENERATE QUESTION ENDPOINT WITH RETRY LOGIC ====================
// ==================== GENERATE QUESTION ====================
// ==================== GENERATE QUESTION ====================
// ==================== SMART QUESTION GENERATION (Enhanced with all features) ====================
// ==================== SMART QUESTION GENERATION (Enhanced with all features) ====================
app.post('/api/ai/generate-question', async (req, res) => {
    console.log('============================================================');
    console.log('📝 SMART QUESTION GENERATION (DB + AI)');
    console.log('============================================================');

    try {
        const {
            topic,
            subtopic,
            difficulty = 'medium',
            grade = 'grade_8',
            previousQuestions = [],
            studentProfile = {}
        } = req.body;

        if (!topic) {
            return res.status(400).json({ success: false, error: 'Topic required' });
        }

        const topicName = typeof topic === 'object' ? topic.name : topic;
        const topicId = typeof topic === 'object' ? topic.id : topic;
        const subtopicName = typeof subtopic === 'object' ? subtopic.name : subtopic;
        const subtopicId = typeof subtopic === 'object' ? subtopic.id : subtopic;

        console.log('📊 Request:', {
            topic: topicName,
            subtopic: subtopicName,
            difficulty,
            grade
        });

        // ✅ FIX: Convert userId to integer or null (database expects integer)
        const userId = studentProfile.studentId || studentProfile.id || null;
        const userIdInt = userId ? parseInt(userId) : null;
        const gradeLevel = parseInt(grade.replace('grade_', '')) || 8;

        // 🎯 STEP 1: Try to get from database cache first
        console.log('🔍 Checking database cache...');
        const smartResult = await smartQuestionService.getQuestion({
            topicId,
            topicName,
            subtopicId,
            subtopicName,
            difficulty,
            gradeLevel,
            userId: userIdInt,  // ✅ FIXED: Use integer userId
            excludeQuestionIds: previousQuestions.map(q => q.id).filter(Boolean)
        });

        // ✅ Found in database - return immediately (FAST & FREE!)
        if (smartResult.cached) {
            console.log('✅ Serving cached question from database');
            console.log('📝 Question:', smartResult.question.substring(0, 100));

            return res.json({
                success: true,
                question: smartResult.question,
                correctAnswer: smartResult.correctAnswer,
                hints: smartResult.hints || [],
                explanation: smartResult.explanation || '',
                visualData: smartResult.visualData,
                cached: true,
                questionId: smartResult.id,
                source: 'database',
                model: 'cached',
                topic: topicName,
                subtopic: subtopicName
            });
        }

        // 🤖 STEP 2: No cached question found - generate with AI
        console.log('🤖 No suitable cached question - generating with Claude AI...');

        // Build personality-aware prompt
        const personalityContext = personalitySystem?.loaded ? `
אתה ${personalitySystem.data.corePersonality.teacherName}, ${personalitySystem.data.corePersonality.role}.
תכונות האישיות שלך:
- ${personalitySystem.data.corePersonality.personality}
- ${personalitySystem.data.corePersonality.teachingStyle}
- ${personalitySystem.data.corePersonality.communicationTone}

סגנון שפה:
- ${personalitySystem.data.languageStyle.hebrewLevel}
- ${personalitySystem.data.languageStyle.formalityLevel}
- ${personalitySystem.data.languageStyle.encouragementStyle}
` : 'אתה נקסון, מורה למתמטיקה ישראלי מנוסה וידידותי.';

        const previousQuestionsText = previousQuestions.length > 0
            ? `\n\nשאלות קודמות (צור שאלה שונה לחלוטין!):\n${previousQuestions.map((q, i) => `${i + 1}. ${typeof q === 'string' ? q.substring(0, 100) : q.question?.substring(0, 100) || 'N/A'}...`).join('\n')}`
            : '';

        const prompt = `${personalityContext}

צור שאלת מתמטיקה חדשה ומקורית.

נושא: ${topicName}
${subtopicName ? `תת-נושא (המוקד העיקרי): ${subtopicName}` : ''}
רמת קושי: ${difficulty}
כיתה: ${grade}
${previousQuestionsText}

דרישות חובה:
1. כתוב את כל התוכן בעברית בלבד - אסור לכתוב באנגלית!
2. השאלה חייבת להיות ישירות על "${subtopicName || topicName}"
3. השתמש במספרים מעניינים ומגוונים
4. הוסף הקשר מהחיים האמיתיים (ספורט, קניות, בית ספר וכו')
5. צור שאלה שונה לחלוטין משאלות קודמות
6. השאלה צריכה להיות מאתגרת ברמת ${difficulty}

פורמט JSON חובה (בעברית בלבד!):
{
  "question": "השאלה המלאה בעברית",
  "correctAnswer": "התשובה הנכונה",
  "hints": ["רמז 1 בעברית", "רמז 2 בעברית", "רמז 3 בעברית"],
  "explanation": "הסבר מפורט בעברית איך פותרים את השאלה"
}

חשוב: השתמש ב\\n לשורה חדשה, לא Enter אמיתי. החזר רק JSON, ללא טקסט נוסף.`;

        // Call Claude API
        console.log('🔄 Calling Claude API...');

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-5-20250929',
                max_tokens: 2500,
                temperature: 0.6,
                system: 'אתה מורה למתמטיקה ישראלי מנוסה. כל התשובות שלך חייבות להיות בעברית בלבד! אסור לך לכתוב באנגלית או בשפה אחרת. צור שאלות מקוריות ומעניינות שמתאימות לתכנית הלימודים הישראלית.',
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API error: ${response.status} - ${errorData.error?.message}`);
        }

        const data = await response.json();
        const rawText = data.content[0].text;

        console.log('📄 Raw response (first 200):', rawText.substring(0, 200));

        // Parse JSON
        let jsonText = rawText.trim();
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonText = jsonMatch[0];
        }

        const questionData = JSON.parse(jsonText);

        if (!questionData.question || !questionData.correctAnswer) {
            throw new Error('Missing required fields in generated question');
        }

        if (!questionData.hints || !Array.isArray(questionData.hints)) {
            questionData.hints = ['נסה לחשוב על השלב הראשון', 'מה הכלי המתמטי שנלמד?', 'חשוב על דוגמאות דומות'];
        }

        if (!questionData.explanation) {
            questionData.explanation = 'הסבר מפורט זמין בהמשך.';
        }

        console.log('✅ AI Question generated successfully');
        console.log('📝 Question:', questionData.question.substring(0, 100));

        // 💾 STEP 3: Cache the AI-generated question
        console.log('💾 Caching question for future use...');
        const cachedId = await smartQuestionService.cacheQuestion({
            question: questionData.question,
            correctAnswer: questionData.correctAnswer,
            hints: questionData.hints,
            explanation: questionData.explanation,
            visualData: questionData.visualData || null,
            topicId,
            topicName,
            subtopicId,
            subtopicName,
            difficulty,
            gradeLevel
        });

        if (cachedId) {
            console.log(`✅ Question cached with ID: ${cachedId}`);
        } else {
            console.log('⚠️ Question could not be cached (might be duplicate)');
        }

        // ✅ STEP 4: Record to question history (ONLY ONCE!)
        const studentId = userIdInt || studentProfile?.name || 'anonymous';

        try {
            questionHistoryManager.addQuestion(studentId, topicId, {
                question: questionData.question,
                difficulty,
                timestamp: Date.now()
            });
            console.log('✅ Question recorded to session memory');

            if (userIdInt) {  // ✅ FIXED: Use integer userId
                await questionHistoryManager.recordToDatabase(studentId, {
                    topicId,
                    subtopicId,
                    questionText: questionData.question,
                    difficulty
                });
                console.log('✅ Question recorded to database');
            }
        } catch (recordError) {
            console.error('⚠️ Failed to record question:', recordError.message);
        }

        // ✅ STEP 5: Return response
        res.json({
            success: true,
            question: questionData.question,
            correctAnswer: questionData.correctAnswer,
            hints: questionData.hints,
            explanation: questionData.explanation,
            visualData: questionData.visualData,
            cached: false,
            questionId: cachedId,
            source: 'ai_generated',
            model: 'claude-sonnet-4-5-20250929',
            topic: topicName,
            subtopic: subtopicName
        });

    } catch (error) {
        console.error('❌ Generate question error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// ==================== VERIFY ANSWER ====================


// Replace your existing endpoint with this:
// ==================== VERIFY ANSWER ====================
// ==================== ENHANCED VERIFY ANSWER WITH PRECISE MATH VALIDATION ====================
// ==================== ENHANCED VERIFY ANSWER WITH AI RE-CALCULATION ====================
app.post('/api/ai/verify-answer', async (req, res) => {
    console.log('🔍 VERIFYING ANSWER - WITH AI RE-CALCULATION');
    const startTime = Date.now();

    try {
        const {
            question,
            userAnswer,
            correctAnswer,
            topic = '',
            subtopic = '',
            userId = null,
            questionId = null,
            difficulty = 'medium'
        } = req.body;

        if (!question || !userAnswer || !correctAnswer) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // STEP 1: AI RE-CALCULATES THE ANSWER
        const calculationPrompt = `אתה מורה למתמטיקה מומחה. פתור את השאלה הזו בדיוק.

🎯 השאלה:
${question}

פתור צעד אחר צעד והחזר JSON:
{
  "calculatedAnswer": "התשובה המדויקת",
  "workingSteps": ["שלב 1", "שלב 2", "שלב 3"],
  "confidence": מספר 0-100
}`;

        const calcResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-5-20250929',
                max_tokens: 2048,
                temperature: 0.1,
                system: 'אתה מחשבון מתמטי מדויק. החזר JSON תקין בלבד.',
                messages: [{ role: 'user', content: calculationPrompt }]
            })
        });

        if (!calcResponse.ok) {
            throw new Error(`Calculation API error: ${calcResponse.status}`);
        }

        const calcData = await calcResponse.json();
        const calcRawText = calcData.content[0].text;

        let calculationResult;
        try {
            const calcJsonText = cleanJsonText(calcRawText);
            calculationResult = JSON.parse(calcJsonText);
        } catch (parseError) {
            calculationResult = {
                calculatedAnswer: correctAnswer,
                workingSteps: [],
                confidence: 50
            };
        }

        const aiCalculatedAnswer = String(calculationResult.calculatedAnswer).trim();
        const storedAnswer = String(correctAnswer).trim();

        // STEP 2: COMPARE STORED ANSWER TO CALCULATED
        const answersMatch = compareMathAnswers(storedAnswer, aiCalculatedAnswer);

        let storedAnswerIsWrong = false;
        let actualCorrectAnswer = storedAnswer;

        if (!answersMatch) {
            console.log('🚨 STORED ANSWER WRONG!');
            console.log('   Stored:', storedAnswer);
            console.log('   AI calculated:', aiCalculatedAnswer);

            storedAnswerIsWrong = true;
            actualCorrectAnswer = aiCalculatedAnswer;

            await logWrongStoredAnswer({
                questionId,
                question: question.substring(0, 100),
                wrongStoredAnswer: storedAnswer,
                correctCalculatedAnswer: aiCalculatedAnswer,
                timestamp: new Date().toISOString()
            });

            // Auto-fix in database if questionId exists
            if (questionId) {
                try {
                    await pool.query(
                        'UPDATE questions SET correct_answer = $1, needs_review = TRUE WHERE id = $2',
                        [aiCalculatedAnswer, questionId]
                    );
                    console.log('✅ Auto-fixed in database');
                } catch (updateError) {
                    console.error('⚠️ Failed to auto-fix:', updateError.message);
                }
            }
        }

        // STEP 3: VERIFY USER'S ANSWER
        const verificationPrompt = `בדוק האם תשובת התלמיד נכונה.

השאלה: ${question}
תשובת התלמיד: ${userAnswer}
התשובה הנכונה: ${actualCorrectAnswer}

${storedAnswerIsWrong ? `⚠️ התשובה השמורה (${storedAnswer}) היתה שגויה!` : ''}

כללי בדיקה:
- 8π = 25.13 = 25.132741 (שקילות)
- הבדל עד 0.01 = נכון
- התעלם מיחידות מידה
- בדוק שיטה גם אם יש טעות חישוב

החזר JSON:
{
  "isCorrect": true/false,
  "confidence": 0-100,
  "feedback": "משוב קצר בעברית",
  "explanation": "הסבר מפורט",
  "methodCorrect": true/false,
  "calculationError": true/false
}`;

        const verifyResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-5-20250929',
                max_tokens: 2048,
                temperature: 0.3,
                system: 'אתה מורה מתמטיקה מומחה. החזר JSON תקין בעברית.',
                messages: [{ role: 'user', content: verificationPrompt }]
            })
        });

        if (!verifyResponse.ok) {
            throw new Error(`Verification API error: ${verifyResponse.status}`);
        }

        const verifyData = await verifyResponse.json();
        const verifyRawText = verifyData.content[0].text;

        let verificationResult;
        try {
            const verifyJsonText = cleanJsonText(verifyRawText);
            verificationResult = JSON.parse(verifyJsonText);
        } catch (parseError) {
            const manualMatch = compareMathAnswers(userAnswer, actualCorrectAnswer);
            verificationResult = {
                isCorrect: manualMatch,
                confidence: 70,
                feedback: manualMatch ? 'תשובה נכונה!' : 'התשובה אינה נכונה',
                explanation: '',
                methodCorrect: manualMatch,
                calculationError: false
            };
        }

        const isCorrect = Boolean(verificationResult.isCorrect);
        const confidence = Math.min(100, Math.max(0, parseInt(verificationResult.confidence) || 85));
        let feedback = String(verificationResult.feedback || '').trim();
        const explanation = String(verificationResult.explanation || '').trim();

        if (storedAnswerIsWrong) {
            feedback = `⚠️ המערכת תוקנה! התשובה הנכונה היא ${actualCorrectAnswer}, לא ${storedAnswer}.\n\n` + feedback;
        }

        if (questionId && userId) {
            try {
                await smartQuestionService.trackUsage(questionId, userId, {
                    isCorrect,
                    timeSpent: 0,
                    hintsUsed: 0,
                    attempts: 1
                });
            } catch (trackError) {
                console.error('⚠️ Track usage failed:', trackError.message);
            }
        }

        const duration = Date.now() - startTime;

        return res.json({
            success: true,
            isCorrect,
            confidence,
            feedback,
            explanation,
            actualCorrectAnswer,
            storedAnswerWasWrong: storedAnswerIsWrong,
            calculatedAnswer: aiCalculatedAnswer,
            workingSteps: calculationResult.workingSteps || [],
            methodCorrect: verificationResult.methodCorrect,
            calculationError: verificationResult.calculationError,
            model: 'claude-sonnet-4-5-20250929',
            duration
        });

    } catch (error) {
        console.error('❌ Verify answer error:', error);
        return res.status(500).json({
            success: false,
            error: 'שגיאה בבדיקת התשובה. נסה שוב.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ==================== HELPER: COMPARE MATH ANSWERS ====================
// ==================== HELPER: COMPARE MATH ANSWERS ====================
function compareMathAnswers(answer1, answer2) {
    if (!answer1 || !answer2) return false;

    const a1 = String(answer1).trim().toLowerCase();
    const a2 = String(answer2).trim().toLowerCase();

    if (a1 === a2) return true;

    const num1 = parseFloat(a1.replace(/[^\d.-]/g, ''));
    const num2 = parseFloat(a2.replace(/[^\d.-]/g, ''));

    if (!isNaN(num1) && !isNaN(num2)) {
        const diff = Math.abs(num1 - num2);
        const avg = (Math.abs(num1) + Math.abs(num2)) / 2;
        return diff < 0.01 || (avg > 0 && diff / avg < 0.001);
    }

    if (a1.includes('π') || a2.includes('π')) {
        const piValue = 3.141592653589793;

        const extractPi = (str) => {
            const match = str.match(/(\d+\.?\d*)\s*[*×·]?\s*π/i) || str.match(/(\d+\.?\d*)π/i);
            return match ? parseFloat(match[1]) * piValue : null;
        };

        const pi1 = extractPi(a1);
        const pi2 = extractPi(a2);

        if (pi1 !== null && pi2 !== null) return Math.abs(pi1 - pi2) < 0.01;
        if (pi1 !== null && !isNaN(num2)) return Math.abs(pi1 - num2) < 0.01;
        if (pi2 !== null && !isNaN(num1)) return Math.abs(pi2 - num1) < 0.01;
    }

    return false;
}

// ==================== HELPER: LOG WRONG STORED ANSWER ====================
async function logWrongStoredAnswer(errorData) {
    try {
        console.log('🚨 LOGGING WRONG ANSWER:', errorData.questionId);

        const query = `
            INSERT INTO wrong_answer_log 
            (question_id, question_text, wrong_stored_answer, correct_calculated_answer, created_at)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (question_id) DO UPDATE
            SET wrong_stored_answer = EXCLUDED.wrong_stored_answer,
                correct_calculated_answer = EXCLUDED.correct_calculated_answer,
                created_at = EXCLUDED.created_at
        `;

        await pool.query(query, [
            errorData.questionId,
            errorData.question,
            errorData.wrongStoredAnswer,
            errorData.correctCalculatedAnswer,
            errorData.timestamp
        ]);

        console.log('✅ Wrong answer logged');
    } catch (error) {
        console.error('❌ Log failed:', error.message);
    }
}
// ==================== GET HINT ====================

// ==================== ADMIN: UPLOAD PERSONALITY FILE ====================
app.post('/api/admin/upload-personality', upload.single('file'), async (req, res) => {
    try {
        console.log('📤 PERSONALITY FILE UPLOAD');

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        console.log('   File:', req.file.originalname);
        console.log('   Size:', req.file.size, 'bytes');

        // Save to local uploads directory
        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const localPath = path.join(uploadsDir, 'personality-system.xlsx');
        fs.writeFileSync(localPath, req.file.buffer);
        console.log('   ✅ Saved locally:', localPath);

        // Upload to Firebase Storage if available
        if (bucket) {
            const file = bucket.file('personality-system.xlsx');
            await file.save(req.file.buffer, {
                metadata: {
                    contentType: req.file.mimetype,
                    metadata: {
                        uploadedAt: new Date().toISOString()
                    }
                }
            });
            console.log('   ✅ Uploaded to Firebase Storage');
        } else {
            console.log('   ⚠️ Firebase not configured - local only');
        }

        // Reload personality system
        personalitySystem.loadFromExcel(localPath);
        console.log('   ✅ Personality system reloaded');

        res.json({
            success: true,
            message: 'Personality file uploaded and loaded successfully',
            filename: req.file.originalname,
            size: req.file.size,
            firebaseUploaded: !!bucket,
            personalityLoaded: personalitySystem.loaded
        });

    } catch (error) {
        console.error('❌ Upload error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/ai/get-hint', async (req, res) => {
    try {
        const { question, hintIndex } = req.body;

        const hintLevels = ['רמז עדין', 'רמז ישיר', 'רמז ספציפי'];
        const prompt = `תן ${hintLevels[hintIndex]} לשאלה:\n\n${question}`;

        if (process.env.ANTHROPIC_API_KEY) {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-5-20250929',
                    max_tokens: 500,
                    temperature: 0.7,
                    messages: [{ role: 'user', content: prompt }]
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'API error');
            }

            return res.json({
                success: true,
                hint: data.content[0].text
            });
        }

        throw new Error('No AI configured');

    } catch (error) {
        console.error('❌ Error:', error);
        res.json({
            success: true,
            hint: 'נסה לפרק את השאלה 🤔'
        });
    }
});

// ==================== AI CHAT ====================
// Replace the existing /api/ai/chat route (around line 1119) with this:

// ==================== AI CHAT WITH PROGRESSIVE HINTS ====================
app.post('/api/ai/chat', async (req, res) => {
    console.log('============================================================');
    console.log('💬 AI CHAT REQUEST');
    console.log('============================================================');

    try {
        const {
            message,
            context,
            actionType = 'general',
            hintLevel = 0
        } = req.body;

        console.log('📝 Chat Request:', {
            message: message?.substring(0, 50),
            actionType,
            hintLevel,
            studentName: context?.studentName
        });

        if (!message || !context) {
            return res.status(400).json({
                success: false,
                error: 'Missing message or context'
            });
        }

        // Build system prompt based on action type
        let systemPrompt = '';

        // Add personality context
        if (personalitySystem.loaded) {
            const personality = personalitySystem.data.corePersonality;
            systemPrompt += `אתה ${personality.teacher_name}, ${personality.description}.\n`;
            systemPrompt += `${personality.teaching_approach}\n\n`;
        } else {
            systemPrompt += `אתה נקסון, מורה דיגיטלי למתמטיקה.\n\n`;
        }

        systemPrompt += `התלמיד: ${context.studentName}\n`;
        systemPrompt += `השאלה: ${context.question}\n`;
        if (context.answer) {
            systemPrompt += `התשובה הנכונה: ${context.answer}\n`;
        }

        // Action-specific prompts
        let userPrompt = message;
        let maxTokens = 800;

        switch (actionType) {
            case 'hint':
                maxTokens = 500;
                if (hintLevel === 1) {
                    systemPrompt += `
תן רמז כללי מאוד שיכוון את התלמיד לחשוב על הגישה הנכונה.
אל תגלה את השיטה או הנוסחה.
דוגמאות: "חשוב על סוג המשוואה", "זכור את הכללים הבסיסיים"
מקסימום 2 משפטים.`;
                } else if (hintLevel === 2) {
                    systemPrompt += `
תן רמז יותר ספציפי על השיטה או הנוסחה הרלוונטית.
אל תראה איך להשתמש בה.
דוגמאות: "נסה להשתמש בנוסחת השורשים", "איזו נוסחה מתאימה למשוואה ריבועית?"
מקסימום 3 משפטים.`;
                } else if (hintLevel >= 3) {
                    systemPrompt += `
הראה את הצעד הראשון של הפתרון עם הסבר קצר.
דוגמה: "נתחיל בזיהוי המקדמים: a=2, b=3, c=-5"
אל תראה יותר מצעד אחד.`;
                }
                break;

            case 'nextStep':
                maxTokens = 600;
                systemPrompt += `
התלמיד שואל מה הצעד הבא.
בדוק מה הוא כתב בהודעה ותן לו את הצעד הבא בלבד.
אם הוא לא כתב כלום, תן לו את הצעד הראשון.
אל תראה יותר מצעד אחד קדימה.
הסבר כל צעד בבירור.`;
                break;

            case 'checkDirection':
                maxTokens = 600;
                systemPrompt += `
התלמיד רוצה לבדוק אם הוא בכיוון הנכון.
אם הוא בכיוון הנכון - עודד אותו וציין מה טוב.
אם יש טעות - הצבע עליה בעדינות והסבר איך לתקן.
אל תיתן את הפתרון המלא.`;
                break;

            case 'fullSolution':
                maxTokens = 2000;
                systemPrompt += `
התלמיד מבקש את הפתרון המלא.
הצג את כל השלבים בצורה מסודרת עם הסברים.
כל צעד צריך להיות ברור עם חישובים מפורטים.
השתמש במספור לכל שלב.`;
                break;

            default:
                systemPrompt += `
ענה לתלמיד בצורה מועילה וחינוכית.
אם השאלה קשורה לבעיה המתמטית, עזור בהתאם.
אם זו שאלה כללית, ענה בצורה ידידותית.`;
        }

        // Add formatting instructions - UPDATED
        systemPrompt += `

חשוב מאוד:
1. כתוב בעברית ברורה וידידותית
2. אל תשבור משוואות או ביטויים מתמטיים באמצע
3. השתמש ב ^ לחזקות (לדוגמה: x^2, 3t^2)
4. השתמש ב / לחלוקה ו - למינוס  
5. שים רווחים מסביב לאופרטורים מתמטיים
6. השתמש באימוג'ים כשמתאים 😊
7. אל תשתמש בסימנים כמו $$ או \[ או \] - הם לא נחוצים
8. לשברים השתמש ב: (מונה)/(מכנה) לדוגמה: (3x+1)/(2x-5)
9. לשורשים השתמש ב: √ לדוגמה: √(x^2 + 1)
10. כתוב נוסחאות בצורה פשוטה וקריאה`;

        console.log('🤖 Calling Claude API...');
        console.log('   Action:', actionType);
        console.log('   Hint Level:', hintLevel);

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-5-20250929',
                max_tokens: maxTokens,
                temperature: 0.7,
                system: systemPrompt,
                messages: [{
                    role: 'user',
                    content: userPrompt
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API error: ${response.status} - ${errorData.error?.message}`);
        }

        const data = await response.json();
        const aiResponse = data.content[0].text;

        // Format mathematical content for better display
        let formattedResponse = formatMathematicalContent(aiResponse);

        console.log('✅ AI Response generated');
        console.log('   Length:', formattedResponse.length);

        res.json({
            success: true,
            response: formattedResponse,
            actionType: actionType,
            hintLevel: hintLevel,
            model: 'claude-sonnet-4-5-20250929'
        });

    } catch (error) {
        console.error('❌ AI Chat Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// Helper function to format mathematical content
// BACKEND UPDATE - Replace the formatMathematicalContent function and update the AI chat route

// ==================== ENHANCED MATH FORMATTER ====================
function formatMathematicalContent(text) {
    let formatted = text;

    // Remove LaTeX delimiters that shouldn't be visible
    formatted = formatted
        .replace(/\$\$/g, '')
        .replace(/\\\[/g, '')
        .replace(/\\\]/g, '')
        .replace(/\\begin{equation}/g, '')
        .replace(/\\end{equation}/g, '');

    // Clean up excessive line breaks
    formatted = formatted.replace(/\n{3,}/g, '\n\n');

    // Ensure spaces around operators
    formatted = formatted
        .replace(/([a-zA-Z0-9\u0590-\u05FF])\+([a-zA-Z0-9\u0590-\u05FF])/g, '$1 + $2')
        .replace(/([a-zA-Z0-9\u0590-\u05FF])\-([a-zA-Z0-9\u0590-\u05FF])/g, '$1 - $2')
        .replace(/([a-zA-Z0-9\u0590-\u05FF])\*([a-zA-Z0-9\u0590-\u05FF])/g, '$1 * $2')
        .replace(/([a-zA-Z0-9\u0590-\u05FF])\/([a-zA-Z0-9\u0590-\u05FF])/g, '$1 / $2')
        .replace(/([a-zA-Z0-9\u0590-\u05FF])\=([a-zA-Z0-9\u0590-\u05FF])/g, '$1 = $2');

    // Fix powers - convert to superscript notation
    formatted = formatted
        .replace(/\^{([^}]+)}/g, '^$1')
        .replace(/\^(\d+)/g, '^$1');

    // Fix subscripts
    formatted = formatted
        .replace(/_{([^}]+)}/g, '_$1')
        .replace(/_(\d+)/g, '_$1');

    // Fix fractions - keep them for frontend to process
    // But ensure they're properly formatted
    formatted = formatted.replace(/\\frac{([^}]*)}{([^}]*)}/g, '\\frac{$1}{$2}');

    // Fix common math functions
    formatted = formatted
        .replace(/\\sqrt{([^}]*)}/g, '√($1)')
        .replace(/\\partial/g, '∂')
        .replace(/\\times/g, '×')
        .replace(/\\cdot/g, '·')
        .replace(/\\pm/g, '±')
        .replace(/\\geq/g, '≥')
        .replace(/\\leq/g, '≤')
        .replace(/\\neq/g, '≠')
        .replace(/\\approx/g, '≈');

    return formatted;
}

// ==================== 🔥 IMAGE ANALYSIS FOR HANDWRITTEN WORK ====================
app.post('/api/ai/analyze-handwritten-work', upload.single('image'), async (req, res) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📸 ANALYZING HANDWRITTEN WORK');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No image file uploaded'
            });
        }

        const {
            question,
            correctAnswer,
            studentName = 'תלמיד',
            grade = '8',
            topic = '',
            personality = 'nexon',
            mathFeeling = 'okay',
            learningStyle = 'visual'
        } = req.body;

        console.log('   Question:', question?.substring(0, 60) + '...');
        console.log('   Correct Answer:', correctAnswer);
        console.log('   Student:', studentName);
        console.log('   File:', req.file.originalname);
        console.log('   Size:', (req.file.size / 1024).toFixed(2), 'KB');

        if (!question || !correctAnswer) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: question and correctAnswer'
            });
        }

        // Get base64 image from buffer
        const base64Image = req.file.buffer.toString('base64');

        // Determine media type
        const mediaTypeMap = {
            'image/jpeg': 'image/jpeg',
            'image/jpg': 'image/jpeg',
            'image/png': 'image/png',
            'image/webp': 'image/webp',
            'image/gif': 'image/gif'
        };
        const mediaType = mediaTypeMap[req.file.mimetype] || 'image/jpeg';

        console.log('   Media Type:', mediaType);

        // Build personality context
        let personalityContext = 'אתה נקסון - מורה דיגיטלי ידידותי, אופטימי ומעודד. השתמש באימוג׳ים והיה חיובי.';

        if (personalitySystem.loaded) {
            const corePersonality = personalitySystem.data.corePersonality;
            personalityContext = `אתה ${corePersonality.teacher_name}, ${corePersonality.description}. ${corePersonality.teaching_approach}`;
        }

        // Student feeling context
        let feelingContext = '';
        if (mathFeeling === 'struggle') {
            feelingContext = 'התלמיד מתקשה - היה סבלני מאוד ומעודד.';
        } else if (mathFeeling === 'love') {
            feelingContext = 'התלמיד אוהב מתמטיקה - עודד אותו להמשיך!';
        }

        const analysisPrompt = `${personalityContext}

${feelingContext ? feelingContext + '\n' : ''}
אתה בודק את הפתרון בכתב יד של ${studentName} (כיתה ${grade}).
${topic ? `נושא: ${topic}\n` : ''}

**השאלה המקורית:**
${question}

**התשובה הנכונה:**
${correctAnswer}

**המשימה שלך:**
1. זהה את התשובה הסופית שהתלמיד כתב בתמונה
2. בדוק אם התשובה נכונה (השווה לתשובה הנכונה)
3. נתח את השלבים שהתלמיד ביצע (אם נראים)
4. תן משוב מעודד ומועיל בעברית

**חשוב מאוד:**
- אם התלמיד פתר שאלה אחרת (לא את השאלה המקורית), ציין זאת במפורש!
- התעלם מהבדלים קלים בכתיב (למשל: 42 זהה ל-42.0, 1/2 זהה ל-0.5)
- אם אתה רואה רק תשובה סופית ללא שלבים, זה בסדר - נתח מה שאתה רואה
- היה סבלני וחיובי - זה תלמיד שמנסה!

השב במבנה JSON הבא (בדיוק כך):
{
  "detectedAnswer": "התשובה המדויקת שזיהית מהתמונה (טקסט)",
  "isCorrect": true או false,
  "matchesQuestion": true או false (האם התלמיד פתר את השאלה הנכונה),
  "feedback": "משוב מפורט בעברית עם אימוג'ים - עודד את התלמיד ותן טיפים",
  "stepsAnalysis": ["שלב 1 שהתלמיד ביצע", "שלב 2...", "שלב 3..."] או [] אם לא נראים שלבים
}

אם לא מצאת פתרון בתמונה או שהתמונה לא ברורה, ציין זאת ב-feedback ו-detectedAnswer יהיה ריק.
החזר **רק JSON** - ללא טקסט נוסף לפני או אחרי!`;

        console.log('   📤 Sending to Claude Sonnet Vision API...');

        // 🔥 RETRY LOGIC WITH EXPONENTIAL BACKOFF
        let apiSuccess = false;
        let claudeResponse = null;
        let lastError = null;

        for (let retryAttempt = 0; retryAttempt < 3; retryAttempt++) {
            try {
                // Wait before retry (exponential backoff: 2s, 4s, 8s)
                if (retryAttempt > 0) {
                    const waitTime = Math.pow(2, retryAttempt) * 1000;
                    console.log(`   ⏳ API Retry ${retryAttempt}/3 - waiting ${waitTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }

                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': process.env.ANTHROPIC_API_KEY,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: 'claude-sonnet-4-5-20250929',  // ✅ MUST USE SONNET FOR VISION
                        max_tokens: 2000,
                        temperature: 0.5,
                        messages: [{
                            role: 'user',
                            content: [
                                {
                                    type: 'image',
                                    source: {
                                        type: 'base64',
                                        media_type: mediaType,
                                        data: base64Image
                                    }
                                },
                                {
                                    type: 'text',
                                    text: analysisPrompt
                                }
                            ]
                        }]
                    })
                });

                const data = await response.json();

                // Handle 529 Overloaded error
                if (response.status === 529) {
                    lastError = new Error('Overloaded');
                    console.log(`   ⚠️ API Overloaded (retry ${retryAttempt + 1}/3)`);
                    continue;
                }

                // Handle other errors
                if (!response.ok) {
                    lastError = new Error(data.error?.message || `API error: ${response.status}`);
                    console.log(`   ❌ API Error: ${lastError.message}`);
                    console.log('   Full error:', JSON.stringify(data, null, 2));

                    // If it's a rate limit or server error, retry
                    if (response.status >= 500 || response.status === 429) {
                        continue;
                    }

                    throw lastError;
                }

                // Success!
                claudeResponse = data;
                console.log('   ✅ API call successful');
                apiSuccess = true;
                break;

            } catch (error) {
                lastError = error;
                console.error(`   ❌ API attempt ${retryAttempt + 1} failed:`, error.message);

                if (retryAttempt === 2) {
                    throw error;
                }
            }
        }

        if (!apiSuccess) {
            throw lastError || new Error('All API retry attempts failed');
        }

        // Parse Claude's response
        const claudeText = claudeResponse.content[0].text;
        console.log('   📥 Raw response (first 200):', claudeText.substring(0, 200));

        // Extract JSON from response
        let analysis;
        try {
            const jsonText = cleanJsonText(claudeText);
            analysis = JSON.parse(jsonText);
            console.log('   ✅ JSON parsed successfully');
        } catch (parseError) {
            console.error('   ❌ JSON parse error:', parseError.message);

            // Fallback analysis
            analysis = {
                detectedAnswer: '',
                isCorrect: false,
                matchesQuestion: true,
                feedback: claudeText.includes('לא') ? claudeText : 'לא הצלחתי לנתח את התמונה בצורה מלאה. נסה לצלם שוב עם תאורה טובה יותר! 📸',
                stepsAnalysis: []
            };
        }

        // Validate and clean analysis
        const cleanedAnalysis = {
            detectedAnswer: String(analysis.detectedAnswer || '').trim(),
            isCorrect: Boolean(analysis.isCorrect),
            matchesQuestion: analysis.matchesQuestion !== false,
            feedback: String(analysis.feedback || 'לא הצלחתי לנתח את התמונה. נסה שוב! 📸').trim(),
            stepsAnalysis: Array.isArray(analysis.stepsAnalysis) ? analysis.stepsAnalysis : []
        };

        console.log('   📊 Analysis Result:');
        console.log('      Detected:', cleanedAnalysis.detectedAnswer);
        console.log('      Correct:', cleanedAnalysis.isCorrect ? '✅' : '❌');
        console.log('      Matches Question:', cleanedAnalysis.matchesQuestion ? '✅' : '⚠️');
        console.log('      Steps:', cleanedAnalysis.stepsAnalysis.length);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Return analysis
        res.json({
            success: true,
            analysis: cleanedAnalysis,
            model: 'claude-sonnet-4-5-20250929',  // ✅ SONNET FOR VISION
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ CRITICAL ERROR:', error);
        console.error('   Error details:', error.message);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // User-friendly error messages
        let errorMessage = error.message;
        if (error.message === 'Overloaded') {
            errorMessage = 'השרת עמוס כרגע. אנא נסה שוב בעוד כמה שניות.';
        } else if (error.message.includes('API key')) {
            errorMessage = 'שגיאת הגדרות שרת. אנא פנה למנהל המערכת.';
        } else if (error.message.includes('model')) {
            errorMessage = 'שגיאה במודל AI. מנסה שוב...';
        }

        res.status(500).json({
            success: false,
            error: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
});
app.use('/api/ai', aiAnalysisRoutes);  // ✅ ADD THIS LINE


// ==================== START SERVER ====================
async function loadPersonalityFromStorage() {
    if (!bucket) {
        console.log('⚠️ Firebase not configured - using local storage');
        const localPath = path.join(__dirname, '../uploads/personality-system.xlsx');
        if (fs.existsSync(localPath)) {
            personalitySystem.loadFromExcel(localPath);
            console.log('✅ Loaded from local file');
        }
        return;
    }

    try {
        const file = bucket.file('personality-system.xlsx');
        const [exists] = await file.exists();
        if (exists) {
            const tempPath = `/tmp/personality-system.xlsx`;
            await file.download({ destination: tempPath });
            personalitySystem.loadFromExcel(tempPath);
            console.log('✅ Loaded from Firebase');
        }
    } catch (error) {
        console.error('❌ Error loading personality:', error.message);
    }
}



// ==================== TEST DATABASE CONNECTION ====================
pool.query('SELECT NOW()', (err, result) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Database connected successfully!');
        console.log('   Connection time:', result.rows[0].now);
    }
});


// ==================== INITIALIZE CRON JOBS ====================
if (process.env.NODE_ENV === 'production') {
    console.log('🕐 Initializing automated tasks...');
    try {
        cronManager.initialize();
        console.log('✅ Cron jobs initialized successfully');
    } catch (error) {
        console.error('❌ Cron initialization failed:', error.message);
    }
}

// ==================== CRON MANAGEMENT ENDPOINTS ====================
app.get('/api/cron/status', (req, res) => {
    try {
        const status = cronManager.getAllStatus();
        res.json({ success: true, jobs: status });
    } catch (error) {
        console.error('❌ Cron status error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/cron/run/:jobName', async (req, res) => {
    try {
        const { jobName } = req.params;
        console.log(`🔄 Manually running job: ${jobName}`);
        await cronManager.runJobNow(jobName);
        res.json({ success: true, message: `Job ${jobName} completed successfully` });
    } catch (error) {
        console.error(`❌ Manual job run error (${req.params.jobName}):`, error);
        res.status(500).json({ success: false, error: error.message });
    }
});

console.log('✅ Enhanced Question System endpoints registered');


app.listen(PORT, '0.0.0.0', async () => {
    await loadPersonalityFromStorage();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 NEXON AI - SMART TOPIC-BASED QUESTIONS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📡 Server: http://0.0.0.0:${PORT}`);
    console.log(`   • Personality: ${personalitySystem.loaded ? '✅' : '❌'}`);
    console.log(`   • Smart Topics: ✅`);
    console.log(`   • SVG Support: ✅`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});