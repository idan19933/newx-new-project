// server/ai-proxy.js - SMART TOPIC-BASED QUESTION GENERATION
import { formatMathAnswer, compareMathExpressions } from './utils/mathFormatter.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
import multer from 'multer';
import fs from 'fs';
import fsPromises from 'fs/promises';  // ✅ FIXED: Different name to avoid duplicate
import path from 'path';
import { fileURLToPath } from 'url';
import personalitySystem from './services/personalityLoader.js';
import questionHistoryManager from './services/questionHistory.js';
import SVGGenerator from './services/svgGenerator.js';
import { bucket } from './config/firebase-admin.js';
import mathCalculationService from './services/mathCalculationService.js';
import curriculumRoutes from './routes/curriculumRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import learningRoutes from './routes/learningRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import nexonRoutes from './routes/nexonRoutes.js';
import notebookRoutes from './routes/notebookRoutes.js';
import aiAnalysisRoutes from './routes/aiAnalysisRoutes.js';
import performanceRoutes from './routes/performanceRoutes.js';
import adaptiveDifficultyRoutes from './routes/adaptiveDifficultyRoutes.js';
import enhancedQuestionsRouter from './routes/enhancedQuestions.js';
import calculusValidator from './services/calculus-validator.js';
import bagrutExamRoutes from './routes/bagrExamRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
// בתחילת הקובץ, אחרי ה-imports הקיימים:
import claudeApi from './utils/claudeApiHelper.js';
import * as cronManager from './services/cronJobs.js';
import israeliSourcesRoutes from './routes/israeliSourcesRoutes.js';
import adaptiveRoutes from './routes/adaptive.js';
import notebookService from './services/notebookService.js';
import smartQuestionService from './services/smartQuestionService.js';
import adminBagrutRoutes from './routes/adminBagrutRoutes.js';

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
    console.error('✓✓ TEST ROUTE HIT!');
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
app.use('/api/progress', progressRoutes);
app.use('/api/adaptive', adaptiveDifficultyRoutes);
app.use('/api/questions', enhancedQuestionsRouter);
app.use('/api/israeli-sources', israeliSourcesRoutes);
app.use('/api/adaptive', adaptiveRoutes);
app.use('/api/bagrut', bagrutExamRoutes);
app.use('/api/admin/bagrut', adminBagrutRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiAnalysisRoutes);

console.log('✅ All routes registered!');

app.post('/api/test-progress', (req, res) => {
    console.error('✓✓ TEST PROGRESS ROUTE HIT!');
    res.json({ success: true, message: 'Test progress endpoint works!' });
});

// LOG ALL INCOMING REQUESTS
// LOG ALL INCOMING REQUESTS
app.use((req, res, next) => {
    console.log('='.repeat(60));
    console.error('✓✓ INCOMING REQUEST');
    console.error('✓✓ Method:', req.method);
    console.error('✓✓ URL:', req.url);
    console.error('✓✓ Content-Type:', req.headers['content-type']);

    // Don't log body for multipart/form-data (file uploads)
    if (!req.headers['content-type']?.includes('multipart/form-data')) {
        console.log('Body:', JSON.stringify(req.body));
    } else {
        console.log('Body: [multipart/form-data - file upload]');
    }

    console.log('='.repeat(60));
    next();
});

// ==================== MULTER CONFIGURATION ====================
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

        const isExcel = file.originalname.toLowerCase().endsWith('.xlsx') ||
            file.originalname.toLowerCase().endsWith('.xls');

        const excelMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/octet-stream',
            'application/zip'
        ];

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

    jsonText = jsonText
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');

    jsonText = jsonText.replace(
        /"([^"\\]|\\.)*"/g,
        match => match.replace(/\n/g, '\\n').replace(/\r/g, '\\r')
    );

    jsonText = jsonText
        .replace(/,(\s*[}\]])/g, '$1')
        .replace(/("\s*:\s*"[^"]*")\s*("\w+"\s*:)/g, '$1,$2')
        .replace(/("\s*:\s*\d+)\s*("\w+"\s*:)/g, '$1,$2')
        .replace(/("\s*:\s*true|false)\s*("\w+"\s*:)/g, '$1,$2')
        .replace(/:\\s*"([^"]*?)"([^,}\]]*?)"/g, (match, p1, p2) => {
            if (p2.includes('"')) {
                return `: "${p1}\\"${p2}"`;
            }
            return match;
        });

    try {
        JSON.parse(jsonText);
        return jsonText;
    } catch (e) {
        console.log('⚠️ JSON still invalid, attempting deep repair...');
        console.log('   Error:', e.message);

        const errorPos = parseInt(e.message.match(/position (\d+)/)?.[1] || '0');
        if (errorPos > 0) {
            const start = Math.max(0, errorPos - 50);
            const end = Math.min(jsonText.length, errorPos + 50);
            console.log('   Context:', jsonText.substring(start, end));
        }

        jsonText = jsonText
            .replace(/״/g, '\\"')
            .replace(/׳/g, "'")
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

    if (personalitySystem.loaded) {
        const personality = personalitySystem.data.corePersonality;
        prompt += `אתה ${personality.teacher_name}, ${personality.description}.\n`;
        prompt += `${personality.teaching_approach}\n\n`;
    } else {
        prompt += `אתה נקסון, מורה דיגיטלי למתמטיקה.\n\n`;
    }

    if (grade) {
        prompt += `התלמיד בכיתה ${grade}.\n`;
    }

    if (mathFeeling === 'struggle') {
        prompt += `התלמיד מתקשה - היה סבלני מאוד, תן הסברים צעד-צעד.\n`;
    } else if (mathFeeling === 'love') {
        prompt += `התלמיד אוהב מתמטיקה - אתגר אותו!\n`;
    }

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

    const allNumbers = (parsed.question || '')
        .match(/\d+(\.\d+)?/g)
        ?.map(n => parseFloat(n))
        .filter(n => !angleNumbers.has(n) && !heightNumbers.has(n) && n > 0 && n < 1000) || [];

    console.log('   ✅ Valid numbers (after filtering):', allNumbers);

    let visualData = null;

    if (questionText.includes('משולש') || questionText.includes('triangle')) {
        console.log('   → Triangle detected');

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

        if (isIsosceles) {
            console.log('   → Processing ISOSCELES triangle');

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

            for (const pattern of basePatterns) {
                const match = parsed.question.match(pattern);
                if (match) {
                    base = parseFloat(match[1]);
                    console.log('   ✅ Found BASE from keyword:', base);
                    break;
                }
            }

            for (const pattern of legPatterns) {
                const match = parsed.question.match(pattern);
                if (match) {
                    leg = parseFloat(match[1]);
                    console.log('   ✅ Found LEGS from keyword:', leg);
                    break;
                }
            }

            if (!base || !leg) {
                console.log('   → Using fallback method');

                if (allNumbers.length >= 2) {
                    base = allNumbers[0];
                    leg = allNumbers[1];
                    console.log('   ✅ Fallback - Base:', base, 'Legs:', leg);
                } else if (allNumbers.length === 1) {
                    base = allNumbers[0];
                    leg = allNumbers[0];
                    console.log('   ⚠️ Only one number - using equilateral');
                } else {
                    base = 8;
                    leg = 10;
                    console.log('   ⚠️ No numbers found - using defaults');
                }
            }

            if (!angleNumbers.has(base) && !heightNumbers.has(base) &&
                !angleNumbers.has(leg) && !heightNumbers.has(leg)) {
                sideA = base;
                sideB = leg;
                sideC = leg;
                console.log('   ✅ FINAL ISOSCELES - Base:', sideA, 'Legs:', sideB, sideC);
            } else {
                sideA = 8;
                sideB = 10;
                sideC = 10;
                console.log('   ⚠️ Validation failed - using defaults');
            }
        }
        else if (isEquilateral) {
            sideA = allNumbers[0] || 8;
            sideB = sideA;
            sideC = sideA;
            console.log('   ✅ Equilateral - All sides:', sideA);
        }
        else if (isRight) {
            sideA = allNumbers[0] || 3;
            sideB = allNumbers[1] || 4;
            sideC = allNumbers[2] || 5;
            console.log('   ✅ Right triangle - Sides:', sideA, sideB, sideC);
        }
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
    else if (questionText.includes('מלבן') || questionText.includes('rectangle')) {
        const width = allNumbers[0] || 5;
        const height = allNumbers[1] || 3;
        visualData = {
            type: 'svg-rectangle',
            svgData: { width, height, showLabels: true }
        };
    }
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

// ==================== SMART TOPIC-BASED QUESTION PROMPT ====================
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

        if (personalitySystem.loaded) {
            const topicGuideline = personalitySystem.getTopicGuideline(topicName);
            if (topicGuideline?.curriculum_requirements) {
                prompt += `📚 דרישות תכנית לימודים:\n${topicGuideline.curriculum_requirements}\n\n`;
            }

            try {
                let examples = personalitySystem.getExamplesForTopic(topicName, difficulty);

                if (examples && examples.length > 0) {
                    const isTriangleTopic = topicName.includes('משולש') || topicName.includes('triangle') ||
                        topicName.includes('גאומטריה') || subtopicName.includes('משולש');

                    if (isTriangleTopic) {
                        console.log('   🔍 Filtering triangle examples...');

                        examples = examples.filter(ex => {
                            const q = String(ex?.question || '');
                            if (!q) return false;

                            const isIsosceles = /שווה[- ]?שוקיים|isosceles/i.test(q);
                            if (!isIsosceles) return true;

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

                    if (recentQuestions && recentQuestions.length > 0) {
                        examples = examples.filter(ex => {
                            const exQ = String(ex?.question || '').toLowerCase();
                            return !recentQuestions.some(recent => {
                                const recentQ = recent.question.toLowerCase();
                                const exNums = exQ.match(/\d+/g) || [];
                                const recentNums = recentQ.match(/\d+/g) || [];
                                const numOverlap = exNums.filter(n => recentNums.includes(n)).length;
                                return numOverlap > 2;
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

        if (classification.isStatistics) {
            prompt += `📊 נתונים סטטיסטיים:\n`;
            prompt += `✅ לפחות 20 נקודות מידע\n`;
            prompt += `✅ פורמט: "משתנה X: 12, 15, 18, 21...\n`;
            prompt += `          משתנה Y: 45, 52, 48, 55..."\n\n`;
        }

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
// ==================== GENERATE QUESTION ENDPOINT ====================
// ==================== GENERATE QUESTION ENDPOINT - FULL WITH HISTORY TRACKING ====================
app.post('/api/ai/generate-question', async (req, res) => {
    console.log('============================================================');
    console.log('📝 SMART QUESTION GENERATION (DB + AI) - DEBUG MODE');
    console.log('============================================================');

    try {
        const {
            grade,
            topic,
            subtopic,
            difficulty,
            previousQuestions = [],
            studentProfile = {},
            userId,
            excludeQuestionIds = [],
            gradeLevel
        } = req.body;

        const actualGrade = grade || studentProfile.grade || gradeLevel || '8';

        console.log('📦 Full Request Body:', JSON.stringify(req.body, null, 2));

        if (!topic) {
            return res.status(400).json({ success: false, error: 'Topic required' });
        }

        const topicName = typeof topic === 'object' ? topic.name : topic;
        const topicId = typeof topic === 'object' ? topic.id : topic;
        const subtopicName = typeof subtopic === 'object' ? subtopic.name : subtopic;
        const subtopicId = typeof subtopic === 'object' ? subtopic.id : subtopic;

        console.log('📊 Parsed Request:', {
            topicName,
            topicId,
            subtopicName,
            subtopicId,
            difficulty,
            grade: actualGrade,
            previousQuestionsCount: previousQuestions.length,
            excludedIdsCount: excludeQuestionIds?.length || 0
        });

        const userIdFromParam = userId;
        const userIdFromProfile = studentProfile.studentId || studentProfile.id;
        const finalUserId = userIdFromParam || userIdFromProfile || null;
        const userIdInt = finalUserId ? parseInt(finalUserId) : null;

        const parsedGradeLevel = typeof actualGrade === 'string'
            ? (actualGrade.includes('grade_') ? parseInt(actualGrade.replace('grade_', '')) : parseInt(actualGrade))
            : (parseInt(actualGrade) || 8);

        console.log('👤 User Info:', {
            fromParam: userIdFromParam,
            fromProfile: userIdFromProfile,
            finalUserId,
            userIdInt,
            type: typeof userIdInt,
            hasValidUserId: !!userIdInt
        });

        const sessionKey = userIdInt || finalUserId || 'anonymous';
        console.log('🔑 Session Key:', {
            sessionKey,
            type: typeof sessionKey,
            isAnonymous: sessionKey === 'anonymous'
        });

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔍 CHECKING QUESTION HISTORY');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const historyExcludedIds = questionHistoryManager.getExcludedQuestionIds(sessionKey, topicId, 30);
        const excludedFromParam = Array.isArray(excludeQuestionIds) ? excludeQuestionIds : [];
        const excludedFromPrevious = previousQuestions.map(q => {
            if (typeof q === 'object' && q.id) return q.id;
            if (typeof q === 'object' && q.questionId) return q.questionId;
            if (typeof q === 'string') return q;
            return null;
        }).filter(Boolean);

        const allExcludedIds = [
            ...new Set([
                ...historyExcludedIds,
                ...excludedFromParam,
                ...excludedFromPrevious
            ])
        ];

        console.log('🚫 Excluded Question IDs Summary:');
        console.log('   From History:', historyExcludedIds.length);
        console.log('   From Param:', excludedFromParam.length);
        console.log('   From Previous:', excludedFromPrevious.length);
        console.log('   Total Unique:', allExcludedIds.length);
        if (allExcludedIds.length > 0) {
            console.log('   Sample IDs:', allExcludedIds.slice(0, 10));
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📚 EXISTING HISTORY BEFORE GENERATION');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const existingHistory = questionHistoryManager.getRecentQuestions(sessionKey, topicId, 20);

        console.log('   History Retrieved:', {
            count: existingHistory?.length || 0,
            isArray: Array.isArray(existingHistory)
        });

        if (existingHistory && existingHistory.length > 0) {
            console.log('   ✅ FOUND EXISTING HISTORY!');
            existingHistory.slice(0, 5).forEach((q, i) => {
                console.log(`      ${i + 1}. ID: ${q.questionId || 'NO-ID'} - ${q.question.substring(0, 60)}...`);
            });
        } else {
            console.log('   ⚠️ NO HISTORY FOUND!');
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('🔍 Calling smartQuestionService.getQuestion with:', {
            topicId,
            subtopicId,
            difficulty,
            gradeLevel: parsedGradeLevel,
            userId: userIdInt,
            excludedCount: allExcludedIds.length
        });

        const smartResult = await smartQuestionService.getQuestion({
            topicId,
            topicName,
            subtopicId,
            subtopicName,
            difficulty,
            gradeLevel: parsedGradeLevel,
            userId: userIdInt,
            excludeQuestionIds: allExcludedIds
        });

        if (smartResult.cached) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('✅ SERVING CACHED QUESTION FROM DATABASE');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('   Question ID:', smartResult.id);
            console.log('   Question Preview:', smartResult.question.substring(0, 100) + '...');
            console.log('   Source:', smartResult.source);

            console.log('\n📝 Recording cached question to history...');
            try {
                const recordData = {
                    id: smartResult.id,
                    questionId: smartResult.id,
                    cached_id: smartResult.id,
                    question: smartResult.question,
                    difficulty,
                    source: smartResult.source || 'cached',
                    timestamp: Date.now()
                };

                console.log('   🔍 Recording with data:', {
                    id: recordData.id,
                    questionId: recordData.questionId,
                    cached_id: recordData.cached_id,
                    source: recordData.source,
                    questionPreview: recordData.question.substring(0, 40) + '...'
                });

                questionHistoryManager.addQuestion(sessionKey, topicId, recordData);
                console.log('   ✅ Cached question recorded to history');

                const verifyExcluded = questionHistoryManager.getExcludedQuestionIds(sessionKey, topicId, 5);
                console.log('   ✅ Verification - Excluded IDs now:', verifyExcluded);

                const verifyRecent = questionHistoryManager.getRecentQuestions(sessionKey, topicId, 1);
                console.log('   ✅ Verification - Last question ID:', verifyRecent?.[0]?.questionId);

            } catch (histError) {
                console.error('   ❌ Failed to record cached question:', histError.message);
                console.error('   Stack:', histError.stack);
            }

            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            return res.json({
                success: true,
                question: smartResult.question,
                correctAnswer: smartResult.correctAnswer,
                hints: smartResult.hints || [],
                explanation: smartResult.explanation || '',
                visualData: smartResult.visualData,
                cached: true,
                questionId: smartResult.id,
                source: smartResult.source || 'database',
                matchType: smartResult.matchType,
                model: 'cached',
                topic: topicName,
                subtopic: subtopicName
            });
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🤖 NO SUITABLE CACHED QUESTION - GENERATING WITH AI');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const recentQuestionsFromMemory = questionHistoryManager.getRecentQuestions(sessionKey, topicId, 10);

        console.log('   Questions to exclude from AI generation:', {
            count: recentQuestionsFromMemory?.length || 0
        });

        if (recentQuestionsFromMemory && recentQuestionsFromMemory.length > 0) {
            console.log('   ✅ Will tell AI to avoid these questions:');
            recentQuestionsFromMemory.forEach((q, i) => {
                console.log(`      ${i + 1}. ${q.question.substring(0, 50)}...`);
            });
        }

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

        const allPreviousQuestions = [
            ...previousQuestions,
            ...(recentQuestionsFromMemory || [])
        ];

        console.log('📋 Combining previous questions:', {
            fromRequest: previousQuestions.length,
            fromMemory: recentQuestionsFromMemory?.length || 0,
            total: allPreviousQuestions.length
        });

        const uniquePreviousQuestions = allPreviousQuestions.filter((q, index, self) => {
            const text = typeof q === 'string' ? q : (q.question || '');
            return index === self.findIndex(t => {
                const tText = typeof t === 'string' ? t : (t.question || '');
                return text === tText;
            });
        });

        console.log('📋 After deduplication:', uniquePreviousQuestions.length, 'unique questions');

        const previousQuestionsText = uniquePreviousQuestions.length > 0
            ? `\n\n🚨 חשוב מאוד - אסור לחזור על השאלות הבאות!\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${uniquePreviousQuestions.map((q, i) => {
                const text = typeof q === 'string' ? q : (q.question || 'N/A');
                return `${i + 1}. ${text.substring(0, 80)}...`;
            }).join('\n')}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n⚠️⚠️⚠️ צור שאלה שונה לחלוטין:\n- מספרים שונים לגמרי (לא אותם ערכים!)\n- הקשר שונה (אם היה על ספורט, עשה על קניות או בית ספר)\n- זווית גישה שונה (למשל: במקום "חשב", שאל "מצא את הערך המקסימלי")\n- נוסח שונה לגמרי\n- תחשוב על דרך יצירתית חדשה לגמרי!\n`
            : '';

        const prompt = `${personalityContext}

צור שאלת מתמטיקה חדשה ומקורית.

נושא: ${topicName}
${subtopicName ? `תת-נושא (המוקד העיקרי): ${subtopicName}` : ''}
רמת קושי: ${difficulty}
כיתה: ${actualGrade}
${previousQuestionsText}

דרישות חובה:
1. כתוב את כל התוכן בעברית בלבד - אסור לכתוב באנגלית!
2. השאלה חייבת להיות ישירות על "${subtopicName || topicName}"
3. השתמש במספרים מעניינים ומגוונים - לא אותם מספרים מהשאלות הקודמות!
4. הוסף הקשר מהחיים האמיתיים (ספורט, קניות, בית ספר, חוגים וכו')
5. 🚨 צור שאלה שונה לחלוטין משאלות קודמות - תחשוב על זווית חדשה!
6. השאלה צריכה להיות מאתגרת ברמת ${difficulty}
7. וודא שהשאלה שלמה ומסתיימת במשפט שלם עם נקודה

פורמט JSON חובה (בעברית בלבד!):
{
  "question": "השאלה המלאה בעברית",
  "correctAnswer": "התשובה הנכונה",
  "hints": ["רמז 1 בעברית", "רמז 2 בעברית", "רמז 3 בעברית"],
  "explanation": "הסבר מפורט בעברית איך פותרים את השאלה"
}

חשוב: השתמש ב\\n לשורה חדשה, לא Enter אמיתי. החזר רק JSON, ללא טקסט נוסף.`;

        console.log('🔄 Calling Claude API with smart retry...');

        // ✅ USE CLAUDE API HELPER
        const result = await claudeApi.complete(
            prompt,
            'אתה מורה למתמטיקה ישראלי מנוסה. כל התשובות שלך חייבות להיות בעברית בלבד! אסור לך לכתוב באנגלית או בשפה אחרת. צור שאלות מקוריות ומעניינות שמתאימות לתכנית הלימודים הישראלית. וודא שהשאלה שלמה ומסתיימת במשפט שלם.',
            {
                maxTokens: 3000,
                temperature: 0.7,
                maxRetries: 5,
                timeout: 90000,
                onRetry: (attempt, max, delay) => {
                    console.log(`   🔄 Retrying (${attempt}/${max}) in ${Math.round(delay)}ms...`);
                }
            }
        );

        if (!result.success) {
            throw new Error(result.error || 'Failed to generate question');
        }

        const rawText = result.text;

        console.log('📄 AI Response received:', {
            length: rawText.length,
            first200: rawText.substring(0, 200),
            attempts: result.attempts
        });

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

        questionData.question = String(questionData.question).trim();
        questionData.correctAnswer = String(questionData.correctAnswer).trim();

        if (!questionData.hints || !Array.isArray(questionData.hints)) {
            questionData.hints = ['נסה לחשוב על השלב הראשון', 'מה הכלי המתמטי שנלמד?', 'חשוב על דוגמאות דומות'];
        }

        if (!questionData.explanation) {
            questionData.explanation = 'הסבר מפורט זמין בהמשך.';
        }

        console.log('✅ AI Question generated successfully');
        console.log('📝 Question length:', questionData.question.length);

        let cachedId = null;
        console.log('\n💾 Attempting to cache question...');

        try {
            cachedId = await smartQuestionService.cacheQuestion({
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
                gradeLevel: parsedGradeLevel
            });

            if (cachedId) {
                console.log(`✅ Question cached with ID: ${cachedId}`);
            }
        } catch (cacheError) {
            console.error('❌ Cache error:', cacheError.message);
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 RECORDING AI-GENERATED QUESTION TO HISTORY');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        try {
            console.log('   Session Key:', sessionKey);
            console.log('   Topic ID:', topicId);
            console.log('   Cached ID:', cachedId || 'NOT-CACHED-YET');

            const recordData = {
                id: cachedId,
                questionId: cachedId,
                cached_id: cachedId,
                question: questionData.question,
                difficulty,
                source: cachedId ? 'cached_ai' : 'ai_generated',
                timestamp: Date.now()
            };

            console.log('   🔍 Recording with data:', {
                id: recordData.id,
                questionId: recordData.questionId,
                cached_id: recordData.cached_id,
                source: recordData.source,
                questionPreview: recordData.question.substring(0, 40) + '...'
            });

            questionHistoryManager.addQuestion(sessionKey, topicId, recordData);
            console.log('   ✅ Question recorded to memory');

            const verifyRecent = questionHistoryManager.getRecentQuestions(sessionKey, topicId, 1);
            console.log('   ✅ Verification:', {
                found: !!verifyRecent && verifyRecent.length > 0,
                lastQuestion: verifyRecent?.[0]?.question?.substring(0, 40),
                lastQuestionId: verifyRecent?.[0]?.questionId
            });

            if (userIdInt && typeof userIdInt === 'number') {
                try {
                    await questionHistoryManager.recordToDatabase(userIdInt, {
                        topicId,
                        subtopicId,
                        questionText: questionData.question,
                        difficulty,
                        isCorrect: null
                    });
                    console.log('   ✅ Recorded to database');
                } catch (dbError) {
                    console.error('   ⚠️ Database recording failed:', dbError.message);
                }
            }

        } catch (recordError) {
            console.error('❌ CRITICAL ERROR recording question:', recordError);
            console.error('   Stack:', recordError.stack);
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('✅ Returning question to user');
        console.log('============================================================\n');

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
        console.error('❌❌❌ FATAL ERROR in generate-question:', error);
        console.error('   Message:', error.message);
        console.error('   Stack:', error.stack);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate question'
        });
    }
});
// ==================== VERIFY ANSWER ====================
// ==================== VERIFY ANSWER - ENHANCED WITH SMART AI VALIDATION ====================
// ==================== VERIFY ANSWER - ENHANCED WITH SMART VALIDATION ====================
// ==================== VERIFY ANSWER - WITH MATHEMATICAL CALCULATION ====================
// ==================== VERIFY ANSWER - WITH CALCULUS VALIDATION ====================
app.post('/api/ai/verify-answer', async (req, res) => {
    console.log('🔍 VERIFYING ANSWER - WITH CALCULUS VALIDATION');
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

        console.log('📝 Verification Request:', {
            question: question?.substring(0, 80) + '...',
            userAnswer,
            correctAnswer,
            questionId,
            userId
        });

        if (!question || !userAnswer || !correctAnswer) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        console.log('\n🎓 Step 0: Checking for calculus question...');

        const calculusAnalysis = calculusValidator.analyzeCalculusQuestion(question);
        console.log('   Analysis Type:', calculusAnalysis.type);
        console.log('   Description:', calculusAnalysis.description);
        console.log('   Needs Second Derivative:', calculusAnalysis.needsSecondDerivative);

        if (calculusAnalysis.type !== 'unknown') {
            console.log('   ✅ CALCULUS QUESTION DETECTED!');
            console.log('   Running specialized calculus validation...');

            const calculusValidation = calculusValidator.validateCalculusAnswer(
                question,
                userAnswer,
                correctAnswer
            );

            console.log('   Calculus Validation Result:', {
                isCorrect: calculusValidation.isCorrect,
                commonMistake: calculusValidation.commonMistake,
                mistakeType: calculusValidation.mistakeType || 'none'
            });

            if (calculusValidation.commonMistake) {
                console.log('   🚨 COMMON CALCULUS MISTAKE DETECTED!');
                console.log('   Mistake Type:', calculusValidation.mistakeType);
                console.log('   Returning early with specialized feedback...');

                return res.json({
                    success: true,
                    isCorrect: false,
                    confidence: 95,
                    feedback: calculusValidation.feedback,
                    explanation: calculusValidation.hint || calculusAnalysis.explanation,
                    actualCorrectAnswer: correctAnswer,
                    commonMistake: true,
                    mistakeType: calculusValidation.mistakeType,
                    calculusType: calculusAnalysis.type,
                    model: 'calculus-validator',
                    duration: Date.now() - startTime
                });
            }

            if (calculusValidation.isCorrect) {
                console.log('   ✅ Calculus answer is CORRECT!');
                console.log('   Returning early with success...');

                return res.json({
                    success: true,
                    isCorrect: true,
                    confidence: 100,
                    feedback: calculusValidation.feedback || 'מצוין! הפתרון שלך נכון לגמרי! 🎉',
                    explanation: calculusAnalysis.explanation,
                    actualCorrectAnswer: correctAnswer,
                    calculusType: calculusAnalysis.type,
                    model: 'calculus-validator',
                    duration: Date.now() - startTime
                });
            }

            console.log('   ⚠️ Calculus validation inconclusive - continuing with normal flow...');
        } else {
            console.log('   ℹ️ Not a calculus question - continuing with normal flow...');
        }

        console.log('\n🔢 Step 1: Attempting mathematical calculation...');

        const mathResult = await mathCalculationService.solveQuestion(question, correctAnswer);

        let mathematicalAnswer = null;
        let mathConfidence = 0;
        let mathWorkingSteps = [];

        if (mathResult.success) {
            console.log('✅ Mathematical calculation succeeded!');
            console.log('   Answer:', mathResult.answer);
            console.log('   Confidence:', mathResult.confidence);
            console.log('   Method:', mathResult.method);

            mathematicalAnswer = mathResult.answer;
            mathConfidence = mathResult.confidence;
            mathWorkingSteps = mathResult.workingSteps || [];
        } else {
            console.log('⚠️ Mathematical calculation failed or not applicable');
            console.log('   Reason:', mathResult.reason);
        }

        console.log('\n🤖 Step 2: AI calculation as backup...');

        const calculationPrompt = `אתה מורה למתמטיקה מומחה. פתור בדיוק.

🎯 השאלה:
${question}

${mathematicalAnswer ? `\n🔢 חישוב מתמטי מדויק נעשה (אמת אותו!): ${mathematicalAnswer}\n` : ''}

📋 הוראות:
1. פתור צעד אחר צעד
2. ${mathematicalAnswer ? 'בדוק אם החישוב המתמטי נכון' : 'חשב בקפידה'}
3. הצג כל שלב ביניים

⚠️ שים לב לשאלות על נגזרות:
- אם שואלים "מתי [פונקציה] מקסימלית?" → פתור F'(x) = 0
- אם שואלים "מתי [קצב/מהירות] מקסימלי?" → פתור F''(x) = 0!
- דוגמה: "מתי קצב המילוי מקסימלי?" → זה מקסימום של V'(t), אז צריך V''(t) = 0

פתור והחזר JSON בלבד:
{
  "calculatedAnswer": "התשובה המדויקת",
  "workingSteps": ["שלב 1", "שלב 2", "..."],
  "confidence": 0-100
}`;

        // ✅ USE CLAUDE API HELPER
        const calcResult = await claudeApi.complete(
            calculationPrompt,
            'אתה מחשבון מדויק במתמטיקה. שים לב מיוחד לשאלות על נגזרות - הבן את ההבדל בין מקסימום של פונקציה למקסימום של הנגזרת שלה! החזר JSON בעברית.',
            {
                maxTokens: 3000,
                temperature: 0.05,
                maxRetries: 5
            }
        );

        if (!calcResult.success) {
            throw new Error(calcResult.error || 'AI Calculation failed');
        }

        const calcRawText = calcResult.text;

        let calculationResult;
        try {
            const calcJsonText = cleanJsonText(calcRawText);
            calculationResult = JSON.parse(calcJsonText);
            console.log('✅ AI calculation parsed');
        } catch (parseError) {
            console.error('⚠️ AI JSON parse failed:', parseError.message);
            calculationResult = {
                calculatedAnswer: correctAnswer,
                workingSteps: [],
                confidence: 50
            };
        }

        const aiCalculatedAnswer = String(calculationResult.calculatedAnswer || '').trim();
        const storedAnswer = String(correctAnswer).trim();
        const aiConfidence = calculationResult.confidence || 50;

        console.log('📊 Calculation Results:');
        console.log('   Stored:', storedAnswer);
        console.log('   Math:', mathematicalAnswer || 'N/A', `(conf: ${mathConfidence})`);
        console.log('   AI:', aiCalculatedAnswer, `(conf: ${aiConfidence})`);

        console.log('\n🎯 Step 3: Deciding which answer to trust...');

        let actualCorrectAnswer = storedAnswer;
        let answerSource = 'stored';
        let shouldReview = false;
        let reviewReason = '';

        if (mathResult.success && mathConfidence >= 95) {
            console.log('   ✅ Using MATHEMATICAL answer (high confidence)');
            actualCorrectAnswer = mathematicalAnswer;
            answerSource = 'mathematical';

            const storedMatchesMath = compareMathAnswers(storedAnswer, mathematicalAnswer);
            if (!storedMatchesMath) {
                console.log('   🚨 STORED ANSWER DIFFERS FROM MATH!');
                console.log('      Stored:', storedAnswer);
                console.log('      Math:', mathematicalAnswer);
                shouldReview = true;
                reviewReason = 'math_mismatch_high_confidence';
            }
        }
        else if (!mathResult.success && aiConfidence >= 98) {
            const storedMatchesAi = compareMathAnswers(storedAnswer, aiCalculatedAnswer);
            if (!storedMatchesAi) {
                console.log('   ⚠️ AI answer differs from stored (very high confidence)');
                shouldReview = true;
                reviewReason = 'ai_mismatch_very_high_confidence';
            }
        }
        else if (mathResult.success && mathConfidence >= 80 && aiConfidence >= 80) {
            const mathMatchesAi = compareMathAnswers(mathematicalAnswer, aiCalculatedAnswer);
            const storedMatchesMath = compareMathAnswers(storedAnswer, mathematicalAnswer);

            if (!mathMatchesAi || !storedMatchesMath) {
                console.log('   ⚠️ Mismatch between calculations');
                shouldReview = true;
                reviewReason = 'calculation_mismatch_moderate_confidence';
            }
        }

        console.log('   Decision:', answerSource);
        console.log('   Needs Review:', shouldReview);

        if (shouldReview && questionId) {
            console.log('\n📝 Step 4: Adding to review queue...');

            try {
                const complexity = mathCalculationService.assessComplexity(question);

                const priority = mathConfidence >= 95 ? 'high' :
                    aiConfidence >= 95 ? 'medium' : 'low';

                await pool.query(`
                    INSERT INTO answer_review_queue (
                        question_id, question_source, question_text,
                        topic_name, subtopic_name, difficulty, grade_level,
                        stored_answer, ai_calculated_answer, math_calculated_answer,
                        ai_confidence, math_confidence,
                        issue_type, complexity_level, priority
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                    ON CONFLICT (question_id, question_source) DO UPDATE SET
                        ai_calculated_answer = EXCLUDED.ai_calculated_answer,
                        math_calculated_answer = EXCLUDED.math_calculated_answer,
                        ai_confidence = EXCLUDED.ai_confidence,
                        math_confidence = EXCLUDED.math_confidence,
                        issue_type = EXCLUDED.issue_type,
                        priority = EXCLUDED.priority,
                        updated_at = CURRENT_TIMESTAMP
                `, [
                    questionId,
                    'cache',
                    question.substring(0, 1000),
                    topic || null,
                    subtopic || null,
                    difficulty,
                    null,
                    storedAnswer,
                    aiCalculatedAnswer,
                    mathematicalAnswer,
                    aiConfidence,
                    mathConfidence,
                    reviewReason,
                    complexity.level,
                    priority
                ]);

                console.log('   ✅ Added to review queue');
                console.log('      Priority:', priority);
                console.log('      Complexity:', complexity.level);

            } catch (reviewError) {
                console.error('   ⚠️ Failed to add to review queue:', reviewError.message);
            }
        }

        console.log('\n✅ Step 5: Verifying user answer...');

        const verificationPrompt = `בדוק תשובת התלמיד בקפידה.

השאלה: ${question}
תשובת התלמיד: ${userAnswer}
התשובה הנכונה: ${actualCorrectAnswer}

${answerSource === 'mathematical' ? '✅ התשובה הנכונה חושבה מתמטית בדיוק מלא' : ''}
${shouldReview ? '⚠️ התשובה נשלחה לבדיקת אדמין מכיוון שיש אי-התאמות' : ''}

⚠️⚠️⚠️ חשוב מאוד - הבנה מושגית בחשבון דיפרנציאלי:
- אם השאלה שואלת "מתי F(x) מקסימלי?" → צריך לפתור F'(x) = 0
- אם השאלה שואלת "מתי קצב השינוי מקסימלי?" → זה אומר "מתי F'(x) מקסימלי?" → צריך לפתור F''(x) = 0!

דוגמה קונקרטית:
אם V(t) = נפח, ושואלים "מתי קצב המילוי מקסימלי?":
- קצב המילוי = V'(t)
- מקסימום של V'(t) → צריך V''(t) = 0 (לא V'(t) = 0!)
- V'(t) = 0 מוצא איפה קצב המילוי הוא אפס, לא איפה הוא מקסימלי!

כללי בדיקה:
- השווה בגמישות: 8/3 = 2.67 = 2 שעות ו-40 דקות
- 16/3 = 5.33 = 5 שעות ו-20 דקות
- אלה ערכים שונים לגמרי!
- התעלם מיחידות: "21 מ״ק לשעה" = "21"
- בדוק שיטה: גם אם יש טעות חישובית, ציין אם השיטה נכונה

החזר JSON בלבד:
{
  "isCorrect": true/false,
  "confidence": 0-100,
  "feedback": "משוב מעודד בעברית (2-3 משפטים)",
  "explanation": "הסבר מפורט של הפתרון הנכון",
  "methodCorrect": true/false,
  "calculationError": true/false
}`;

        // ✅ USE CLAUDE API HELPER
        const verifyResult = await claudeApi.complete(
            verificationPrompt,
            'מורה מתמטיקה מעודד. שים לב מיוחד לשאלות על נגזרות והבן את ההבדל בין מקסימום של פונקציה למקסימום של הנגזרת שלה. JSON בעברית.',
            {
                maxTokens: 2000,
                temperature: 0.3,
                maxRetries: 5
            }
        );

        if (!verifyResult.success) {
            throw new Error(verifyResult.error || 'Verification failed');
        }

        const verifyRawText = verifyResult.text;

        let verificationResult;
        try {
            const verifyJsonText = cleanJsonText(verifyRawText);
            verificationResult = JSON.parse(verifyJsonText);
            console.log('✅ Verification parsed');
        } catch (parseError) {
            console.error('⚠️ Verification JSON parse failed');
            const manualMatch = compareMathAnswers(userAnswer, actualCorrectAnswer);
            verificationResult = {
                isCorrect: manualMatch,
                confidence: 70,
                feedback: manualMatch ? 'תשובה נכונה! 🎉' : 'התשובה לא נכונה. נסה שוב! 💪',
                explanation: '',
                methodCorrect: manualMatch,
                calculationError: false
            };
        }

        const isCorrect = Boolean(verificationResult.isCorrect);
        const confidence = Math.min(100, Math.max(0, parseInt(verificationResult.confidence) || 85));
        let feedback = String(verificationResult.feedback || '').trim();
        const explanation = String(verificationResult.explanation || '').trim();

        console.log('📊 Final Verification:');
        console.log('   Is Correct:', isCorrect ? '✅' : '❌');
        console.log('   Confidence:', confidence);
        console.log('   Method Correct:', verificationResult.methodCorrect);

        if (shouldReview) {
            feedback = `📝 שים לב: התשובה נשלחה לבדיקת מורה מכיוון שיש אי-התאמה בין החישובים השונים. אנחנו רוצים לוודא שהתשובה הנכונה מדויקת.\n\n` + feedback;
        }

        if (questionId && userId) {
            try {
                await smartQuestionService.trackUsage(questionId, userId, {
                    isCorrect,
                    timeSpent: 0,
                    hintsUsed: 0,
                    attempts: 1
                });
                console.log('✅ Usage tracked');
            } catch (trackError) {
                console.error('⚠️ Track usage failed:', trackError.message);
            }
        }

        const duration = Date.now() - startTime;

        console.log('✅ Verification completed in', duration, 'ms');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        return res.json({
            success: true,
            isCorrect,
            confidence,
            feedback,
            explanation,
            actualCorrectAnswer,
            calculatedAnswer: aiCalculatedAnswer,
            mathematicalAnswer: mathematicalAnswer,
            answerSource: answerSource,
            aiConfidence: aiConfidence,
            mathConfidence: mathConfidence,
            flaggedForReview: shouldReview,
            reviewReason: reviewReason,
            workingSteps: mathWorkingSteps.length > 0 ? mathWorkingSteps : (calculationResult.workingSteps || []),
            methodCorrect: verificationResult.methodCorrect || false,
            calculationError: verificationResult.calculationError || false,
            model: 'claude-sonnet-4-5-20250929',
            mathMethod: mathResult.method || null,
            duration: duration
        });

    } catch (error) {
        console.error('❌ Verify answer error:', error);
        console.error('   Stack:', error.stack);
        return res.status(500).json({
            success: false,
            error: 'שגיאה בבדיקת התשובה. נסה שוב.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ==================== HELPER: COMPARE MATH ANSWERS ====================
// ==================== HELPER: IMPROVED MATH COMPARISON ====================
function compareMathAnswers(answer1, answer2) {
    if (!answer1 || !answer2) return false;

    // Clean both answers
    const clean = (str) => {
        return String(str)
            .trim()
            .toLowerCase()
            // Remove Hebrew text
            .replace(/[א-ת]/g, '')
            // Remove currency symbols
            .replace(/[₪$€£¥]/g, '')
            // Remove units (km, m, cm, etc)
            .replace(/\b(ש"ח|שח|שקל|שקלים|מטר|ק"מ|ס"מ|יח'|יחידות|km|m|cm|units?)\b/gi, '')
            // Remove extra spaces
            .replace(/\s+/g, ' ')
            .trim();
    };

    const a1 = clean(answer1);
    const a2 = clean(answer2);

    console.log('   🔍 Comparing answers:');
    console.log('      Original 1:', answer1);
    console.log('      Cleaned 1:', a1);
    console.log('      Original 2:', answer2);
    console.log('      Cleaned 2:', a2);

    // Direct match after cleaning
    if (a1 === a2) {
        console.log('   ✅ Direct match!');
        return true;
    }

    // Extract all numbers from both
    const extractNumbers = (str) => {
        const nums = str.match(/-?\d+\.?\d*/g);
        return nums ? nums.map(n => parseFloat(n)).filter(n => !isNaN(n)) : [];
    };

    const nums1 = extractNumbers(a1);
    const nums2 = extractNumbers(a2);

    console.log('      Numbers 1:', nums1);
    console.log('      Numbers 2:', nums2);

    // If same number of values, compare each
    if (nums1.length > 0 && nums1.length === nums2.length) {
        const allMatch = nums1.every((n1, i) => {
            const n2 = nums2[i];
            const diff = Math.abs(n1 - n2);
            const avg = (Math.abs(n1) + Math.abs(n2)) / 2;
            const isClose = diff < 0.1 || (avg > 0 && diff / avg < 0.01);

            console.log(`      Compare: ${n1} vs ${n2} → ${isClose ? '✅' : '❌'} (diff: ${diff})`);
            return isClose;
        });

        if (allMatch) {
            console.log('   ✅ All numbers match!');
            return true;
        }
    }

    // Handle π (pi) expressions
    if (a1.includes('π') || a2.includes('π')) {
        const piValue = 3.141592653589793;

        const extractPi = (str) => {
            // Match patterns like: 8π, 8*π, 8×π, 8·π
            const match = str.match(/(\d+\.?\d*)\s*[*×·]?\s*π/i) || str.match(/(\d+\.?\d*)π/i);
            return match ? parseFloat(match[1]) * piValue : null;
        };

        const pi1 = extractPi(a1);
        const pi2 = extractPi(a2);

        // Extract regular numbers
        const num1 = parseFloat(a1.replace(/[^\d.-]/g, ''));
        const num2 = parseFloat(a2.replace(/[^\d.-]/g, ''));

        console.log('      Pi values:', { pi1, pi2, num1, num2 });

        // Compare pi expressions
        if (pi1 !== null && pi2 !== null && Math.abs(pi1 - pi2) < 0.01) {
            console.log('   ✅ Pi expressions match!');
            return true;
        }

        // Compare pi to decimal
        if (pi1 !== null && !isNaN(num2) && Math.abs(pi1 - num2) < 0.1) {
            console.log('   ✅ Pi matches decimal!');
            return true;
        }
        if (pi2 !== null && !isNaN(num1) && Math.abs(pi2 - num1) < 0.1) {
            console.log('   ✅ Decimal matches pi!');
            return true;
        }
    }

    // Handle fractions: 1/2 = 0.5
    const fractionPattern = /(\d+)\s*\/\s*(\d+)/;
    const frac1 = a1.match(fractionPattern);
    const frac2 = a2.match(fractionPattern);

    if (frac1 || frac2) {
        const val1 = frac1 ? parseFloat(frac1[1]) / parseFloat(frac1[2]) : parseFloat(a1);
        const val2 = frac2 ? parseFloat(frac2[1]) / parseFloat(frac2[2]) : parseFloat(a2);

        if (!isNaN(val1) && !isNaN(val2) && Math.abs(val1 - val2) < 0.01) {
            console.log('   ✅ Fraction match!');
            return true;
        }
    }

    console.log('   ❌ No match found');
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

        let systemPrompt = '';

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

// ==================== ENHANCED MATH FORMATTER ====================
function formatMathematicalContent(text) {
    let formatted = text;

    formatted = formatted
        .replace(/\$\$/g, '')
        .replace(/\\\[/g, '')
        .replace(/\\\]/g, '')
        .replace(/\\begin{equation}/g, '')
        .replace(/\\end{equation}/g, '');

    formatted = formatted.replace(/\n{3,}/g, '\n\n');

    formatted = formatted
        .replace(/([a-zA-Z0-9\u0590-\u05FF])\+([a-zA-Z0-9\u0590-\u05FF])/g, '$1 + $2')
        .replace(/([a-zA-Z0-9\u0590-\u05FF])\-([a-zA-Z0-9\u0590-\u05FF])/g, '$1 - $2')
        .replace(/([a-zA-Z0-9\u0590-\u05FF])\*([a-zA-Z0-9\u0590-\u05FF])/g, '$1 * $2')
        .replace(/([a-zA-Z0-9\u0590-\u05FF])\/([a-zA-Z0-9\u0590-\u05FF])/g, '$1 / $2')
        .replace(/([a-zA-Z0-9\u0590-\u05FF])\=([a-zA-Z0-9\u0590-\u05FF])/g, '$1 = $2');

    formatted = formatted
        .replace(/\^{([^}]+)}/g, '^$1')
        .replace(/\^(\d+)/g, '^$1');

    formatted = formatted
        .replace(/_{([^}]+)}/g, '_$1')
        .replace(/_(\d+)/g, '_$1');

    formatted = formatted.replace(/\\frac{([^}]*)}{([^}]*)}/g, '\\frac{$1}{$2}');

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

// ==================== IMAGE ANALYSIS FOR HANDWRITTEN WORK ====================
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

        const base64Image = req.file.buffer.toString('base64');

        const mediaTypeMap = {
            'image/jpeg': 'image/jpeg',
            'image/jpg': 'image/jpeg',
            'image/png': 'image/png',
            'image/webp': 'image/webp',
            'image/gif': 'image/gif'
        };
        const mediaType = mediaTypeMap[req.file.mimetype] || 'image/jpeg';

        console.log('   Media Type:', mediaType);

        let personalityContext = 'אתה נקסון - מורה דיגיטלי ידידותי, אופטימי ומעודד. השתמש באימוג׳ים והיה חיובי.';

        if (personalitySystem.loaded) {
            const corePersonality = personalitySystem.data.corePersonality;
            personalityContext = `אתה ${corePersonality.teacher_name}, ${corePersonality.description}. ${corePersonality.teaching_approach}`;
        }

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

        let apiSuccess = false;
        let claudeResponse = null;
        let lastError = null;

        for (let retryAttempt = 0; retryAttempt < 3; retryAttempt++) {
            try {
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
                        model: 'claude-sonnet-4-5-20250929',
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

                if (response.status === 529) {
                    lastError = new Error('Overloaded');
                    console.log(`   ⚠️ API Overloaded (retry ${retryAttempt + 1}/3)`);
                    continue;
                }

                if (!response.ok) {
                    lastError = new Error(data.error?.message || `API error: ${response.status}`);
                    console.log(`   ❌ API Error: ${lastError.message}`);
                    console.log('   Full error:', JSON.stringify(data, null, 2));

                    if (response.status >= 500 || response.status === 429) {
                        continue;
                    }

                    throw lastError;
                }

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

        const claudeText = claudeResponse.content[0].text;
        console.log('   📥 Raw response (first 200):', claudeText.substring(0, 200));

        let analysis;
        try {
            const jsonText = cleanJsonText(claudeText);
            analysis = JSON.parse(jsonText);
            console.log('   ✅ JSON parsed successfully');
        } catch (parseError) {
            console.error('   ❌ JSON parse error:', parseError.message);

            analysis = {
                detectedAnswer: '',
                isCorrect: false,
                matchesQuestion: true,
                feedback: claudeText.includes('לא') ? claudeText : 'לא הצלחתי לנתח את התמונה בצורה מלאה. נסה לצלם שוב עם תאורה טובה יותר! 📸',
                stepsAnalysis: []
            };
        }

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

        res.json({
            success: true,
            analysis: cleanedAnalysis,
            model: 'claude-sonnet-4-5-20250929',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ CRITICAL ERROR:', error);
        console.error('   Error details:', error.message);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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

        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const localPath = path.join(uploadsDir, 'personality-system.xlsx');
        fs.writeFileSync(localPath, req.file.buffer);
        console.log('   ✅ Saved locally:', localPath);

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

// ==================== DEBUG: CHECK QUESTION HISTORY ====================
app.get('/api/ai/question-history/:userId/:topicId', async (req, res) => {
    try {
        const { userId, topicId } = req.params;

        console.log('🔍 Checking question history:', { userId, topicId });

        const userIdInt = parseInt(userId);
        const sessionKey = isNaN(userIdInt) ? userId : userIdInt;

        const sessionHistory = questionHistoryManager.getRecentQuestions(sessionKey, topicId, 20);

        let dbHistory = [];
        if (!isNaN(userIdInt)) {
            const query = `
                SELECT question_text, difficulty, created_at
                FROM question_history
                WHERE user_id = $1 AND topic_id = $2
                ORDER BY created_at DESC
                LIMIT 20
            `;
            const result = await pool.query(query, [userIdInt, topicId]);
            dbHistory = result.rows;
        }

        res.json({
            success: true,
            userId,
            topicId,
            sessionKey,
            sessionHistory: {
                count: sessionHistory?.length || 0,
                questions: sessionHistory || []
            },
            databaseHistory: {
                count: dbHistory.length,
                questions: dbHistory
            }
        });

    } catch (error) {
        console.error('❌ Error checking history:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==================== IMAGE UPLOAD ENDPOINT ====================
const uploadStorage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const dir = 'uploads/admin-images';
        await fsPromises.mkdir(dir, { recursive: true });  // ✅ FIXED: Using fsPromises
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const adminUpload = multer({
    storage: uploadStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);

        if (ext && mime) {
            cb(null, true);
        } else {
            cb(new Error('Only images allowed'));
        }
    }
});

app.post('/api/admin/upload-image', adminUpload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No image uploaded'
            });
        }

        const imageUrl = `/uploads/admin-images/${req.file.filename}`;

        res.json({
            success: true,
            imageUrl: imageUrl,
            filename: req.file.filename
        });

    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

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

// ==================== START SERVER ====================

// ==================== START SERVER ====================
// העתק את כל הקטע הזה והדבק אותו במקום הסוף של server/ai-proxy.js
// החל משורה "async function loadPersonalityFromStorage()"

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
            console.log('✅ Loaded from Firebase');
        }
    } catch (error) {
        console.error('❌ Error loading personality:', error.message);
    }
}

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