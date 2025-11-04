// src/components/ai/MathTutor.jsx - COMPLETE WITH FIXED ADAPTIVE DIFFICULTY 🎯✨
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, Send, BookOpen, Target, Sparkles, ChevronRight,
    Loader2, Lightbulb, CheckCircle2, XCircle, ArrowLeft,
    Trophy, Star, Zap, Flame, Clock, BarChart3, Award, Play,
    AlertCircle, RefreshCw, TrendingUp, MessageCircle, X, LineChart, Box,
    Camera, Upload, Mic, Volume2, VolumeX
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { getUserGradeId, getGradeConfig, getSubtopics } from '../../config/israeliCurriculum';
import toast from 'react-hot-toast';
import { aiVerification } from '../../services/aiAnswerVerification';
import axios from 'axios';
import notebookAPI from '../../services/notebookService';
import AdaptiveDifficultyDisplay from '../adaptive/AdaptiveDifficultyDisplay';
import {
    LineChart as RechartsLineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    ReferenceLine,
    BarChart as RechartsBarChart,
    Bar,
    Area,
    AreaChart,
    ComposedChart
} from 'recharts';
import '../../styles/mathFormatting.css';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// ==================== 🎨 ANIMATION VARIANTS ====================
const pageTransition = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    },
    exit: {
        opacity: 0,
        y: -20,
        scale: 0.98,
        transition: { duration: 0.3 }
    }
};

const cardHover = {
    rest: { scale: 1, y: 0 },
    hover: {
        scale: 1.03,
        y: -8,
        transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
    },
    tap: { scale: 0.97 }
};

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (custom = 0) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: custom * 0.1,
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1]
        }
    })
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 200,
            damping: 20
        }
    }
};

// ==================== 🎯 DIFFICULTY CHANGE NOTIFICATION COMPONENT ====================
const DifficultyChangeNotification = ({ change, onClose }) => {
    if (!change) return null;

    const getDifficultyInfo = (level) => {
        const info = {
            easy: { emoji: '🌱', label: 'קל', color: 'from-green-400 to-emerald-500', textColor: 'text-green-900' },
            medium: { emoji: '⚡', label: 'בינוני', color: 'from-blue-400 to-cyan-500', textColor: 'text-blue-900' },
            hard: { emoji: '🔥', label: 'מאתגר', color: 'from-orange-400 to-red-500', textColor: 'text-red-900' }
        };
        return info[level] || info.medium;
    };

    const fromInfo = getDifficultyInfo(change.from);
    const toInfo = getDifficultyInfo(change.to);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -100 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -100 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] max-w-lg w-full mx-4"
                dir="rtl"
            >
                <motion.div
                    initial={{ boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}
                    animate={{
                        boxShadow: [
                            "0 10px 40px rgba(59, 130, 246, 0.3)",
                            "0 10px 60px rgba(59, 130, 246, 0.5)",
                            "0 10px 40px rgba(59, 130, 246, 0.3)"
                        ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="bg-white rounded-3xl p-6 shadow-2xl border-4 border-blue-300 relative overflow-hidden"
                >
                    {/* Animated Background */}
                    <motion.div
                        className="absolute inset-0 opacity-10"
                        animate={{
                            background: [
                                'linear-gradient(45deg, #3b82f6 0%, #06b6d4 100%)',
                                'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                                'linear-gradient(225deg, #3b82f6 0%, #06b6d4 100%)',
                                'linear-gradient(315deg, #06b6d4 0%, #3b82f6 100%)'
                            ]
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                    />

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-3 left-3 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>

                    {/* Content */}
                    <div className="relative z-10">
                        {/* Title */}
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-center mb-6"
                        >
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.6, repeat: 2 }}
                                className="text-6xl mb-3"
                            >
                                🎯
                            </motion.div>
                            <h3 className="text-3xl font-black text-gray-800 mb-2">
                                רמת הקושי השתנתה!
                            </h3>
                            <p className="text-gray-600 font-medium">
                                המערכת התאימה את הקושי בהתאם לביצועים שלך
                            </p>
                        </motion.div>

                        {/* Difficulty Change Animation */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.4, type: "spring" }}
                            className="flex items-center justify-center gap-6 mb-6"
                        >
                            {/* From Difficulty */}
                            <motion.div
                                animate={{ x: [0, -5, 0] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className={`bg-gradient-to-br ${fromInfo.color} text-white rounded-2xl p-6 shadow-lg min-w-[140px]`}
                            >
                                <div className="text-5xl mb-2 text-center">{fromInfo.emoji}</div>
                                <div className="text-xl font-black text-center">{fromInfo.label}</div>
                            </motion.div>

                            {/* Arrow */}
                            <motion.div
                                animate={{
                                    x: [0, 10, 0],
                                    scale: [1, 1.2, 1]
                                }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="text-5xl"
                            >
                                ➜
                            </motion.div>

                            {/* To Difficulty */}
                            <motion.div
                                animate={{
                                    x: [0, 5, 0],
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className={`bg-gradient-to-br ${toInfo.color} text-white rounded-2xl p-6 shadow-lg min-w-[140px] ring-4 ring-white`}
                            >
                                <div className="text-5xl mb-2 text-center">{toInfo.emoji}</div>
                                <div className="text-xl font-black text-center">{toInfo.label}</div>
                            </motion.div>
                        </motion.div>

                        {/* Reason */}
                        {change.reason && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="bg-blue-50 rounded-2xl p-4 border-2 border-blue-200"
                            >
                                <div className="flex items-start gap-3">
                                    <Sparkles className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                                    <div>
                                        <div className="font-bold text-blue-900 mb-1">למה?</div>
                                        <div className="text-blue-800 text-sm leading-relaxed">
                                            {change.reason}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Encouragement */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="text-center mt-6"
                        >
                            <div className="text-lg font-bold text-gray-700">
                                {change.to === 'hard' ? '🚀 אתגר חדש מחכה לך!' :
                                    change.to === 'easy' ? '💪 בואו נחזק את היסודות!' :
                                        '⚡ מצוין! ממשיכים להתקדם!'}
                            </div>
                        </motion.div>

                        {/* Progress Dots */}
                        <div className="flex justify-center gap-2 mt-4">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        scale: [1, 1.3, 1],
                                        opacity: [0.5, 1, 0.5]
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        delay: i * 0.2
                                    }}
                                    className="w-2 h-2 bg-blue-500 rounded-full"
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ==================== 🎤 VOICE SUPPORT HOOK ====================
const useVoiceSupport = () => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'he-IL';
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
            synthRef.current.cancel();
        };
    }, []);

    const speak = (text) => {
        if (!voiceEnabled || !text) return;
        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'he-IL';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        synthRef.current.speak(utterance);
    };

    const stopSpeaking = () => {
        synthRef.current.cancel();
        setIsSpeaking(false);
    };

    const startListening = (onResult, onError) => {
        if (!recognitionRef.current) {
            toast.error('הדפדפן לא תומך בזיהוי קול');
            return;
        }

        setIsListening(true);

        recognitionRef.current.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            onResult(transcript);
            setIsListening(false);
        };

        recognitionRef.current.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (onError) onError(event.error);
            setIsListening(false);
        };

        recognitionRef.current.onend = () => setIsListening(false);

        try {
            recognitionRef.current.start();
            toast.success('מקשיב... דבר עכשיו 🎤');
        } catch (error) {
            console.error('Error starting recognition:', error);
            setIsListening(false);
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) recognitionRef.current.stop();
        setIsListening(false);
    };

    const toggleVoice = () => {
        setVoiceEnabled(prev => {
            if (prev) synthRef.current.cancel();
            toast.success(prev ? '🔇 קול כובה' : '🔊 קול הופעל');
            return !prev;
        });
    };

    return {
        isListening,
        isSpeaking,
        voiceEnabled,
        speak,
        stopSpeaking,
        startListening,
        stopListening,
        toggleVoice
    };
};

// ==================== 📊 CURRICULUM TRACKING FUNCTION ====================
const trackCurriculumProgress = async (userId, exerciseData) => {
    if (!userId) {
        console.warn('⚠️ No user ID - skipping curriculum tracking');
        return { success: false };
    }

    try {
        console.log('📊 Tracking curriculum progress:', {
            userId,
            topic: exerciseData.topic,
            subtopic: exerciseData.subtopic,
            isCorrect: exerciseData.isCorrect
        });

        const response = await axios.post(`${API_URL}/api/curriculum/progress/record`, {
            userId: userId,
            topicId: exerciseData.topicId || null,
            subtopicId: exerciseData.subtopicId || null,
            topic: exerciseData.topic || 'כללי',
            subtopic: exerciseData.subtopic || '',
            correct: exerciseData.isCorrect,
            timeSpent: exerciseData.timeSpent || 0,
            hintsUsed: exerciseData.hintsUsed || 0,
            attempts: exerciseData.attempts || 1
        });

        if (response.data.success) {
            console.log('✅ Curriculum progress tracked successfully');
        }

        return response.data;
    } catch (error) {
        console.error('❌ Curriculum tracking error:', error);
        return { success: false };
    }
};

// ==================== NOTEBOOK SAVE FUNCTION ====================
const saveExerciseToNotebook = async (userId, exerciseData) => {
    if (!userId) {
        console.warn('⚠️ No user ID - skipping notebook save');
        return { success: false };
    }

    try {
        console.log('📝 Saving to notebook:', {
            userId,
            isCorrect: exerciseData.isCorrect,
            topic: exerciseData.topic,
            difficulty: exerciseData.difficulty // ✅ LOG DIFFICULTY
        });

        const result = await notebookAPI.saveExercise(userId, {
            question: exerciseData.question,
            answer: exerciseData.correctAnswer,
            studentAnswer: exerciseData.userAnswer,
            isCorrect: exerciseData.isCorrect,
            topic: exerciseData.topic || 'כללי',
            subtopic: exerciseData.subtopic || '',
            difficulty: exerciseData.difficulty || 'medium' // ✅ INCLUDE DIFFICULTY
        });

        if (result.success) {
            console.log('✅ Saved to notebook with difficulty:', exerciseData.difficulty);
        }

        return result;
    } catch (error) {
        console.error('❌ Notebook save error:', error);
        return { success: false };
    }
};

// ==================== MATH FORMATTER UTILITY ====================
const formatMathText = (text) => {
    if (!text) return text;

    let formatted = String(text);

    const fractionMap = {
        '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾',
        '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘',
        '1/6': '⅙', '5/6': '⅚', '1/7': '⅐',
        '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞',
        '1/9': '⅑', '1/10': '⅒'
    };

    Object.entries(fractionMap).forEach(([plain, unicode]) => {
        const regex = new RegExp(plain.replace('/', '\\/'), 'g');
        formatted = formatted.replace(regex, unicode);
    });

    const superscriptMap = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
        '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾'
    };

    formatted = formatted.replace(/\^(\d+)/g, (match, digits) => {
        return digits.split('').map(d => superscriptMap[d] || d).join('');
    });

    formatted = formatted.replace(/([a-zA-Zא-ת])(\d)(?!\d)/g, (match, letter, digit) =>
        letter + (superscriptMap[digit] || digit)
    );

    formatted = formatted.replace(/\\int/g, '∫');
    formatted = formatted.replace(/integral/gi, '∫');

    formatted = formatted.replace(/([+\-=])/g, ' $1 ');
    formatted = formatted.replace(/\s+/g, ' ').trim();

    return formatted;
};

// ==================== 📝 MATH DISPLAY COMPONENT ====================
const MathDisplay = ({ children, className = '', inline = false }) => {
    if (!children) return null;

    let formatted = formatMathText(children);

    formatted = formatted.replace(/([.?!])\s*([א-ת])\./g, '$1\n\n$2.');
    formatted = formatted.replace(/\s+([א-ת])\.\s+/g, '\n\n$1. ');

    const paragraphs = formatted.split(/\n\n+/);

    const baseStyle = {
        fontFamily: "'Segoe UI', 'Assistant', 'Arial', 'Helvetica', sans-serif",
        direction: 'rtl',
        textAlign: 'right'
    };

    const blockStyle = {
        ...baseStyle,
        fontSize: '1.4rem',
        lineHeight: '2.6',
        letterSpacing: '0.04em',
        wordSpacing: '0.2em',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        maxWidth: '100%'
    };

    const inlineStyle = {
        ...baseStyle,
        display: 'inline',
        fontSize: 'inherit',
        lineHeight: 'inherit'
    };

    if (inline) {
        return (
            <span className={`math-inline ${className}`} style={inlineStyle}>
                {formatted}
            </span>
        );
    }

    return (
        <div className={`math-text hebrew-math-mixed ${className}`} style={blockStyle}>
            {paragraphs.map((paragraph, idx) => {
                const isListItem = /^[א-ת]\./.test(paragraph.trim());
                const parts = paragraph.split(/(\$\$[^\$]+\$\$|\$[^\$]+\$)/g);

                return (
                    <div
                        key={idx}
                        style={{
                            marginBottom: idx < paragraphs.length - 1 ? '1.8rem' : 0,
                            paddingRight: isListItem ? '0' : '0',
                            position: 'relative'
                        }}
                    >
                        {parts.map((part, partIdx) => {
                            if (part.startsWith('$$') && part.endsWith('$$')) {
                                const math = part.slice(2, -2);
                                return (
                                    <div
                                        key={partIdx}
                                        className="math-expression-block"
                                        style={{
                                            fontFamily: "'Cambria Math', 'Times New Roman', serif",
                                            fontSize: '1.6rem',
                                            fontWeight: 600,
                                            padding: '1.2rem 1.8rem',
                                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(14, 165, 233, 0.06))',
                                            borderRadius: '12px',
                                            display: 'block',
                                            margin: '1.2rem 0',
                                            border: '2px solid rgba(59, 130, 246, 0.2)',
                                            direction: 'ltr',
                                            textAlign: 'center',
                                            boxShadow: '0 2px 10px rgba(59, 130, 246, 0.08)'
                                        }}
                                    >
                                        {math}
                                    </div>
                                );
                            }
                            else if (part.startsWith('$') && part.endsWith('$')) {
                                const math = part.slice(1, -1);
                                return (
                                    <span
                                        key={partIdx}
                                        className="math-expression-inline"
                                        style={{
                                            fontFamily: "'Cambria Math', 'Times New Roman', serif",
                                            fontSize: '1.3rem',
                                            fontWeight: 600,
                                            padding: '0.3rem 0.8rem',
                                            background: 'rgba(59, 130, 246, 0.08)',
                                            borderRadius: '8px',
                                            display: 'inline-block',
                                            margin: '0 0.4rem',
                                            border: '1px solid rgba(59, 130, 246, 0.15)',
                                            direction: 'ltr',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {math}
                                    </span>
                                );
                            }

                            return part.split('\n').map((line, lineIdx, arr) => (
                                <React.Fragment key={`${partIdx}-${lineIdx}`}>
                                    <span style={{ display: 'inline' }}>{line}</span>
                                    {lineIdx < arr.length - 1 && <br />}
                                </React.Fragment>
                            ));
                        })}
                    </div>
                );
            })}
        </div>
    );
};

// ==================== SVG VISUAL COMPONENT ====================
const SVGVisual = ({ visualData }) => {
    if (!visualData?.svg) return null;

    const getTitle = (type) => {
        switch (type) {
            case 'svg-triangle': return '🔺 תרשים משולש';
            case 'svg-rectangle': return '⬜ תרשים מלבן';
            case 'svg-circle': return '⭕ תרשים עיגול';
            case 'svg-coordinate': return '📊 מערכת צירים';
            default: return '📐 תרשים גאומטרי';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 rounded-2xl border-4 border-blue-300 p-6 mb-6 shadow-xl"
        >
            <div className="flex items-center gap-3 mb-4 bg-white/80 backdrop-blur-sm rounded-xl p-3">
                <Target className="w-6 h-6 text-blue-600" />
                <span className="font-black text-xl text-gray-800">{getTitle(visualData.type)}</span>
            </div>

            <div
                className="flex justify-center items-center bg-white rounded-2xl p-6 shadow-inner min-h-[400px]"
                dangerouslySetInnerHTML={{ __html: visualData.svg }}
            />

            {visualData.svgData && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 p-5 bg-gradient-to-r from-cyan-50 to-sky-50 rounded-2xl border-3 border-cyan-300 shadow-lg"
                >
                    <div className="text-base font-black text-cyan-900 mb-3 flex items-center gap-2">
                        📐 מידות התרשים:
                    </div>
                    <div className="text-base text-cyan-900 space-y-2">
                        {visualData.svgData.sideA && (
                            <div className="flex items-center gap-3 bg-white/70 p-2 rounded-lg">
                                <span className="font-mono bg-blue-200 px-3 py-1 rounded-lg font-bold text-lg">A</span>
                                <span className="font-bold">צלע: {visualData.svgData.sideA} ס"מ</span>
                            </div>
                        )}
                        {visualData.svgData.sideB && (
                            <div className="flex items-center gap-3 bg-white/70 p-2 rounded-lg">
                                <span className="font-mono bg-cyan-200 px-3 py-1 rounded-lg font-bold text-lg">B</span>
                                <span className="font-bold">צלע: {visualData.svgData.sideB} ס"מ</span>
                            </div>
                        )}
                        {visualData.svgData.sideC && (
                            <div className="flex items-center gap-3 bg-white/70 p-2 rounded-lg">
                                <span className="font-mono bg-sky-200 px-3 py-1 rounded-lg font-bold text-lg">C</span>
                                <span className="font-bold">צלע: {visualData.svgData.sideC} ס"מ</span>
                            </div>
                        )}
                        {visualData.svgData.width && (
                            <div className="flex items-center gap-3 bg-white/70 p-2 rounded-lg">
                                <span className="font-bold text-lg">רוחב:</span>
                                <span className="text-lg font-black text-blue-700">{visualData.svgData.width} ס"מ</span>
                            </div>
                        )}
                        {visualData.svgData.height && (
                            <div className="flex items-center gap-3 bg-white/70 p-2 rounded-lg">
                                <span className="font-bold text-lg">גובה:</span>
                                <span className="text-lg font-black text-cyan-700">{visualData.svgData.height} ס"מ</span>
                            </div>
                        )}
                        {visualData.svgData.radius && (
                            <div className="flex items-center gap-3 bg-white/70 p-2 rounded-lg">
                                <span className="font-bold text-lg">רדיוס:</span>
                                <span className="text-lg font-black text-sky-700">{visualData.svgData.radius} ס"מ</span>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

// ==================== BOX PLOT & CHART COMPONENTS ====================
const BoxPlotVisualization = ({ data, label = 'תרשים קופסה' }) => {
    if (!data || data.length === 0) return null;

    const sorted = [...data].sort((a, b) => a - b);
    const n = sorted.length;
    const q1Index = Math.floor(n * 0.25);
    const q2Index = Math.floor(n * 0.5);
    const q3Index = Math.floor(n * 0.75);

    const min = sorted[0];
    const q1 = sorted[q1Index];
    const median = sorted[q2Index];
    const q3 = sorted[q3Index];
    const max = sorted[n - 1];
    const iqr = q3 - q1;
    const range = max - min;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-4 border-blue-300 p-6 mb-6 shadow-xl"
        >
            <div className="flex items-center gap-3 mb-6 bg-white/80 backdrop-blur-sm rounded-xl p-3">
                <Box className="w-6 h-6 text-blue-600" />
                <span className="font-black text-xl text-gray-800">{label}</span>
            </div>

            <div className="relative h-48 bg-white rounded-2xl p-8 mb-6 shadow-inner">
                <div className="absolute bottom-12 left-8 right-8 h-24">
                    <div
                        className="absolute bg-blue-500 h-1"
                        style={{
                            left: `${((min - min) / range) * 100}%`,
                            width: `${((q1 - min) / range) * 100}%`,
                            top: '50%',
                            transform: 'translateY(-50%)'
                        }}
                    />
                    <div
                        className="absolute bg-blue-700 w-1 h-12"
                        style={{
                            left: `${((min - min) / range) * 100}%`,
                            top: '25%'
                        }}
                    />
                    <div
                        className="absolute bg-gradient-to-r from-blue-200 to-cyan-300 border-4 border-blue-600 rounded-lg shadow-lg"
                        style={{
                            left: `${((q1 - min) / range) * 100}%`,
                            width: `${((q3 - q1) / range) * 100}%`,
                            height: '80px',
                            top: '0%'
                        }}
                    >
                        <div
                            className="absolute bg-blue-900 w-1 h-full"
                            style={{
                                left: `${((median - q1) / (q3 - q1)) * 100}%`
                            }}
                        />
                    </div>
                    <div
                        className="absolute bg-blue-500 h-1"
                        style={{
                            left: `${((q3 - min) / range) * 100}%`,
                            width: `${((max - q3) / range) * 100}%`,
                            top: '50%',
                            transform: 'translateY(-50%)'
                        }}
                    />
                    <div
                        className="absolute bg-blue-700 w-1 h-12"
                        style={{
                            left: `${((max - min) / range) * 100}%`,
                            top: '25%'
                        }}
                    />
                </div>

                <div className="absolute bottom-0 left-8 right-8 flex justify-between text-xs font-bold text-gray-700">
                    <span className="bg-white px-2 py-1 rounded shadow">Min<br/>{min}</span>
                    <span className="bg-blue-100 px-2 py-1 rounded shadow">Q1<br/>{q1}</span>
                    <span className="bg-cyan-200 px-2 py-1 rounded shadow border-2 border-blue-900">Q2<br/>{median}</span>
                    <span className="bg-blue-100 px-2 py-1 rounded shadow">Q3<br/>{q3}</span>
                    <span className="bg-white px-2 py-1 rounded shadow">Max<br/>{max}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="text-xs text-gray-600 mb-1">רבעון ראשון</div>
                    <div className="text-xl font-bold text-blue-700">Q1 = {q1}</div>
                </div>
                <div className="bg-cyan-100 p-3 rounded-lg border-2 border-cyan-600">
                    <div className="text-xs text-gray-600 mb-1">חציון</div>
                    <div className="text-xl font-bold text-cyan-900">Q2 = {median}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="text-xs text-gray-600 mb-1">רבעון שלישי</div>
                    <div className="text-xl font-bold text-blue-700">Q3 = {q3}</div>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg border-2 border-amber-400">
                    <div className="text-xs text-gray-700 mb-1 font-semibold">תחום בין-רבעוני</div>
                    <div className="text-xl font-bold text-amber-700">IQR = {iqr}</div>
                </div>
            </div>
        </motion.div>
    );
};

const BarChartVisualization = ({ data, xLabel = 'קטגוריה', yLabel = 'ערך', label = 'גרף עמודות', color = '#3b82f6' }) => {
    if (!data || data.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-4 border-blue-300 p-6 mb-6 shadow-xl"
        >
            <div className="flex items-center gap-3 mb-4 bg-white/80 backdrop-blur-sm rounded-xl p-3">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                <span className="font-black text-xl text-gray-800">{label}</span>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-inner">
                <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="x" stroke="#6b7280" label={{ value: xLabel, position: 'insideBottom', offset: -5 }} />
                        <YAxis stroke="#6b7280" label={{ value: yLabel, angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '2px solid #3b82f6', borderRadius: '8px' }} />
                        <Bar dataKey="y" fill={color} radius={[8, 8, 0, 0]} />
                    </RechartsBarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

const HistogramVisualization = ({ data, bins = 5, xLabel = 'טווח', yLabel = 'תדירות', label = 'היסטוגרמה' }) => {
    if (!data || data.length === 0) return null;

    const sorted = [...data].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const binWidth = (max - min) / bins;

    const histogramData = [];
    for (let i = 0; i < bins; i++) {
        const binStart = min + i * binWidth;
        const binEnd = binStart + binWidth;
        const count = sorted.filter(x => x >= binStart && (i === bins - 1 ? x <= binEnd : x < binEnd)).length;

        histogramData.push({
            x: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
            y: count
        });
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-4 border-blue-300 p-6 mb-6 shadow-xl"
        >
            <div className="flex items-center gap-3 mb-4 bg-white/80 backdrop-blur-sm rounded-xl p-3">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                <span className="font-black text-xl text-gray-800">{label}</span>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-inner">
                <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={histogramData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="x" stroke="#6b7280" label={{ value: xLabel, position: 'insideBottom', offset: -5 }} />
                        <YAxis stroke="#6b7280" label={{ value: yLabel, angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '2px solid #3b82f6', borderRadius: '8px' }} />
                        <Bar dataKey="y" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                    </RechartsBarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

// ==================== VISUAL GRAPH COMPONENT ====================
const VisualGraph = ({ visualData }) => {
    if (!visualData) return null;

    const { type } = visualData;

    if (type?.startsWith('svg-')) {
        return <SVGVisual visualData={visualData} />;
    }

    const { points, data, equation, xRange = [-10, 10], yRange = [-10, 10], color = '#3b82f6', label = 'גרף', xLabel = 'x', yLabel = 'y', bins = 5 } = visualData;

    if (type === 'boxplot' && data) {
        return <BoxPlotVisualization data={data} label={label} />;
    }

    if (type === 'histogram' && data) {
        return <HistogramVisualization data={data} bins={bins} xLabel={xLabel} yLabel={yLabel} label={label} />;
    }

    if (type === 'bar' && points && points.length > 0) {
        return <BarChartVisualization data={points} xLabel={xLabel} yLabel={yLabel} label={label} color={color} />;
    }

    if (type === 'scatter' && points && points.length > 0) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-4 border-blue-300 p-6 mb-6 shadow-xl">
                <div className="flex items-center gap-3 mb-4 bg-white/80 backdrop-blur-sm rounded-xl p-3">
                    <LineChart className="w-6 h-6 text-blue-600" />
                    <span className="font-black text-xl text-gray-800">{label}</span>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-inner">
                    <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="x" type="number" stroke="#6b7280" domain={xRange} />
                            <YAxis dataKey="y" type="number" stroke="#6b7280" domain={yRange} />
                            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '2px solid #3b82f6', borderRadius: '8px' }} />
                            <ReferenceLine x={0} stroke="#9ca3af" strokeWidth={1} />
                            <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={1} />
                            <Scatter data={points} fill={color} />
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        );
    }

    const generateGraphData = () => {
        if (points && points.length > 0) return points;

        const graphPoints = [];
        const [xMin, xMax] = xRange;
        const step = (xMax - xMin) / 100;

        for (let x = xMin; x <= xMax; x += step) {
            try {
                let y;
                if (type === 'line' && equation) {
                    const match = equation.match(/y\s*=\s*([+-]?\d*\.?\d*)\s*\*?\s*x\s*([+-]\s*\d+\.?\d*)?/i);
                    if (match) {
                        const slope = match[1] ? parseFloat(match[1]) : 1;
                        const intercept = match[2] ? parseFloat(match[2].replace(/\s/g, '')) : 0;
                        y = slope * x + intercept;
                    }
                } else if (type === 'parabola' && equation) {
                    const match = equation.match(/y\s*=\s*([+-]?\d*\.?\d*)\s*\*?\s*x\s*\^\s*2\s*([+-]?\d*\.?\d*)\s*\*?\s*x?\s*([+-]?\d+\.?\d*)?/i);
                    if (match) {
                        const a = match[1] ? parseFloat(match[1]) : 1;
                        const b = match[2] ? parseFloat(match[2].replace(/\s/g, '')) : 0;
                        const c = match[3] ? parseFloat(match[3].replace(/\s/g, '')) : 0;
                        y = a * x * x + b * x + c;
                    }
                }

                if (y !== undefined && !isNaN(y) && isFinite(y)) {
                    graphPoints.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) });
                }
            } catch (error) {
                console.error('Error calculating point:', error);
            }
        }
        return graphPoints;
    };

    const graphData = generateGraphData();
    if (graphData.length === 0) return null;

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-4 border-blue-300 p-6 mb-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4 bg-white/80 backdrop-blur-sm rounded-xl p-3">
                <LineChart className="w-6 h-6 text-blue-600" />
                <span className="font-black text-xl text-gray-800">{label}</span>
                {equation && <span className="text-sm text-gray-600 font-mono bg-white px-3 py-1 rounded-lg shadow"><MathDisplay inline>{equation}</MathDisplay></span>}
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-inner">
                <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={graphData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="x" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" domain={yRange} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '2px solid #3b82f6', borderRadius: '8px' }} />
                        <ReferenceLine x={0} stroke="#9ca3af" strokeWidth={2} />
                        <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={2} />
                        <Line type="monotone" dataKey="y" stroke={color} strokeWidth={3} dot={false} />
                    </RechartsLineChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

// ==================== AI CHAT SIDEBAR ====================
const AIChatSidebar = ({ question, studentProfile, isOpen, onToggle, currentAnswer }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (question && messages.length === 0) {
            const welcomeMessage = {
                role: 'assistant',
                content: `היי ${studentProfile.name}! 👋\n\nאני כאן לעזור לך עם השאלה:\n**${question.question}**\n\nאיך אני יכול לעזור?\n- 💡 רמז קטן\n- 🤔 מה הצעד הבא?\n- ✅ בדוק את הכיוון שלי\n- 📖 הסבר מלא\n\nפשוט שאל! 😊`
            };
            setMessages([welcomeMessage]);
        }
    }, [question]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const quickActions = [
        { label: '💡 רמז', prompt: 'תן לי רמז קטן' },
        { label: '🤔 צעד הבא', prompt: 'מה הצעד הבא?' },
        { label: '✅ בדוק כיוון', prompt: 'האם אני בכיוון הנכון?' },
        { label: '📖 הסבר מלא', prompt: 'הראה לי פתרון מלא' }
    ];

    const sendMessage = async (messageText = input) => {
        if (!messageText.trim() || loading) return;

        setMessages(prev => [...prev, { role: 'user', content: messageText }]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageText,
                    context: {
                        question: question.question,
                        answer: question.correctAnswer,
                        currentAnswer: currentAnswer,
                        hints: question.hints || [],
                        steps: question.steps || [],
                        studentName: studentProfile.name,
                        topic: studentProfile.topic,
                        grade: studentProfile.grade,
                        personality: studentProfile.personality || 'nexon',
                        mathFeeling: studentProfile.mathFeeling,
                        learningStyle: studentProfile.learningStyle
                    }
                })
            });

            const data = await response.json();

            if (data.success) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: '😔 מצטער, נתקלתי בבעיה. נסה שוב!' }]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <motion.button
                initial={{ x: -100 }}
                animate={{ x: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggle}
                className="fixed right-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 rounded-full shadow-2xl z-50"
            >
                <MessageCircle className="w-6 h-6" />
            </motion.button>
        );
    }

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col"
            dir="rtl"
        >
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Brain className="w-6 h-6" />
                    <span className="font-bold">עוזר AI - נקסון</span>
                </div>
                <button onClick={onToggle} className="hover:bg-white/20 p-2 rounded-lg">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-blue-50 to-cyan-50">
                {messages.map((message, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}
                    >
                        <div className={`max-w-[85%] rounded-2xl p-4 ${message.role === 'user' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' : 'bg-white shadow-lg text-gray-900'}`}>
                            <div className="whitespace-pre-wrap text-sm">
                                <MathDisplay inline>{message.content}</MathDisplay>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {loading && (
                    <div className="flex justify-end">
                        <div className="bg-white rounded-2xl p-4 shadow-lg">
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                <span className="text-sm text-gray-600">נקסון חושב...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {messages.length <= 1 && (
                <div className="p-3 grid grid-cols-2 gap-2 bg-white border-t">
                    {quickActions.map((action, index) => (
                        <button
                            key={index}
                            onClick={() => sendMessage(action.prompt)}
                            className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 transition-all border border-blue-200 text-xs font-bold text-gray-700"
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            )}

            <div className="p-4 bg-white border-t">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="שאל אותי..."
                        disabled={loading}
                        className="flex-1 px-3 py-2 rounded-xl bg-gray-100 border border-gray-300 focus:border-blue-500 focus:outline-none text-sm"
                    />
                    <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || loading}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl disabled:opacity-50"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// ==================== THINKING ANIMATION ====================
const ThinkingAnimation = ({ message = "נקסון חושב..." }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16"
        >
            <motion.div
                animate={{
                    rotate: 360,
                    scale: [1, 1.1, 1]
                }}
                transition={{
                    rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                    scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                }}
                className="relative mb-6"
            >
                <motion.div
                    animate={{
                        rotate: -360,
                        scale: [1, 1.2, 1]
                    }}
                    transition={{
                        rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="absolute inset-0 w-32 h-32 border-4 border-blue-200 rounded-full"
                    style={{
                        borderTopColor: 'transparent',
                        borderRightColor: 'transparent'
                    }}
                />
                <motion.div
                    animate={{
                        rotate: 360,
                        scale: [1, 1.15, 1]
                    }}
                    transition={{
                        rotate: { duration: 2.5, repeat: Infinity, ease: "linear" },
                        scale: { duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }
                    }}
                    className="absolute inset-2 w-28 h-28 border-4 border-cyan-200 rounded-full"
                    style={{
                        borderBottomColor: 'transparent',
                        borderLeftColor: 'transparent'
                    }}
                />
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center shadow-2xl">
                    <Brain className="w-16 h-16 text-white" />
                </div>
            </motion.div>

            <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-xl font-bold text-gray-700 mb-2"
            >
                {message}
            </motion.div>

            <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        animate={{
                            y: [0, -10, 0],
                            scale: [1, 1.2, 1]
                        }}
                        transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.2
                        }}
                        className="w-3 h-3 bg-blue-500 rounded-full"
                    />
                ))}
            </div>
        </motion.div>
    );
};

// ==================== LIVE FEEDBACK INDICATOR ====================
const LiveFeedbackIndicator = ({ status }) => {
    if (status === 'idle') return null;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={status}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2"
            >
                {status === 'checking' && (
                    <>
                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                        <span className="text-sm text-blue-600 font-medium">בודק...</span>
                    </>
                )}

                {status === 'correct' && (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500 }}
                        >
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </motion.div>
                        <span className="text-sm text-green-600 font-bold">נכון! ✓</span>
                    </>
                )}

                {status === 'wrong' && (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500 }}
                        >
                            <XCircle className="w-5 h-5 text-red-500" />
                        </motion.div>
                        <span className="text-sm text-red-600 font-medium">לא נכון</span>
                    </>
                )}

                {status === 'partial' && (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500 }}
                        >
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                        </motion.div>
                        <span className="text-sm text-amber-600 font-medium">כמעט!</span>
                    </>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

// ==================== MAIN MATH TUTOR COMPONENT ====================
const MathTutor = ({
                       topicId: propTopicId,
                       gradeId: propGradeId,
                       selectedTopic: propSelectedTopic,
                       selectedSubtopic: propSelectedSubtopic,
                       mode: propMode,
                       userId: propUserId,
                       initialDifficulty: propInitialDifficulty,
                       onClose,
                       onAnswerSubmitted
                   }) => {
    const mountCount = useRef(0);
    const initStartedRef = useRef(false);

    useEffect(() => {
        mountCount.current += 1;
        console.log(`🎨 MathTutor MOUNTED (count: ${mountCount.current})`);
        return () => console.log(`🗑️ MathTutor UNMOUNTING`);
    }, []);

    const user = useAuthStore(state => state.user);
    const nexonProfile = useAuthStore(state => state.nexonProfile);

    const getUserId = useCallback(() => {
        if (propUserId) return propUserId;
        if (!user) return null;
        const id = user.id || user.uid || user.userId || user.student_id;
        if (!id) return null;
        const numId = parseInt(id);
        return isNaN(numId) ? null : numId;
    }, [propUserId, user]);

    const determineInitialView = useCallback(() => {
        if (onClose && propSelectedTopic) return 'practice';
        if (propMode && propMode !== 'normal') return 'practice';
        if (propSelectedTopic && propSelectedSubtopic) return 'practice';
        if (propSelectedTopic && !onClose) return 'subtopic-select';
        if (propTopicId) return 'subtopic-select';
        return 'home';
    }, [onClose, propSelectedTopic, propSelectedSubtopic, propMode, propTopicId]);

    const [view, setView] = useState(determineInitialView);
    const [selectedTopic, setSelectedTopic] = useState(propSelectedTopic || null);
    const [selectedSubtopic, setSelectedSubtopic] = useState(propSelectedSubtopic || null);
    const [practiceMode, setPracticeMode] = useState(propMode || 'normal');

    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
    const [hintCount, setHintCount] = useState(0);
    const [currentHints, setCurrentHints] = useState([]);

    const [feedbackStatus, setFeedbackStatus] = useState('idle');
    const [liveFeedback, setLiveFeedback] = useState(null);
    const [finalFeedback, setFinalFeedback] = useState(null);
    const [attemptCount, setAttemptCount] = useState(0);

    const [chatOpen, setChatOpen] = useState(false);

    const [uploadedImage, setUploadedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
    const [imageAnalysisResult, setImageAnalysisResult] = useState(null);
    const fileInputRef = useRef(null);

    const voice = useVoiceSupport();

    const autoCheckTimerRef = useRef(null);
    const lastCheckedAnswerRef = useRef('');
    const practiceStartedRef = useRef(false);

    const [sessionStats, setSessionStats] = useState({
        correct: 0,
        total: 0,
        attempts: 0,
        streak: 0,
        maxStreak: 0,
        points: 0,
        startTime: null,
        questionTimes: []
    });

    // ✅ ADAPTIVE DIFFICULTY STATE
    const [currentDifficulty, setCurrentDifficulty] = useState(propInitialDifficulty || 'medium');
    const [adaptiveQuestionsCount, setAdaptiveQuestionsCount] = useState(0);
    const [recentAnswers, setRecentAnswers] = useState([]);
    const [recommendation, setRecommendation] = useState(null);
    const [performance, setPerformance] = useState(null);
    const [adjustmentHistory, setAdjustmentHistory] = useState([]);
    const [isCheckingAdaptive, setIsCheckingAdaptive] = useState(false);
    const [showDifficultyChange, setShowDifficultyChange] = useState(null);

    // Difficulty display helpers
    const difficultyEmoji = useMemo(() => {
        const emojis = { easy: '🌱', medium: '⚡', hard: '🔥' };
        return emojis[currentDifficulty] || '⚡';
    }, [currentDifficulty]);

    const difficultyLabel = useMemo(() => {
        const labels = { easy: 'קל', medium: 'בינוני', hard: 'מאתגר' };
        return labels[currentDifficulty] || 'בינוני';
    }, [currentDifficulty]);

    const difficultyColor = useMemo(() => {
        const colors = {
            easy: 'from-green-400 to-emerald-500',
            medium: 'from-blue-400 to-cyan-500',
            hard: 'from-orange-400 to-red-500'
        };
        return colors[currentDifficulty] || 'from-blue-400 to-cyan-500';
    }, [currentDifficulty]);

    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const timerRef = useRef(null);
    const inputRef = useRef(null);

    const { currentGrade, currentTrack, gradeId, gradeConfig, availableTopics } = useMemo(() => {
        const grade = propGradeId || nexonProfile?.grade || user?.grade || '8';
        const track = nexonProfile?.track || user?.track;
        const id = getUserGradeId(grade, track);
        const config = getGradeConfig(id);
        const topics = config?.topics || [];

        return {
            currentGrade: grade,
            currentTrack: track,
            gradeId: id,
            gradeConfig: config,
            availableTopics: topics
        };
    }, [propGradeId, nexonProfile?.grade, nexonProfile?.track, user?.grade, user?.track]);

    // ✅ ✅ ✅ FIXED TRACK ANSWER FOR ADAPTIVE DIFFICULTY ✅ ✅ ✅
    const trackAnswer = useCallback(async (isCorrect, timeTaken) => {
        console.log('🎯 trackAnswer called:', { isCorrect, timeTaken });

        const userId = getUserId();
        console.log('👤 User ID:', userId);

        if (!userId) {
            console.warn('⚠️ No userId available for tracking');
            return;
        }

        const answerData = {
            userId,
            topicId: selectedTopic?.id || 'general',
            subtopicId: selectedSubtopic?.id || null,
            difficulty: currentDifficulty,
            isCorrect,
            timeTaken,
            hintsUsed: hintCount,
            attempts: attemptCount + 1
        };

        console.log('📊 Answer data:', answerData);

        // ✅ FIX: Increment count FIRST, then check
        const newCount = adaptiveQuestionsCount + 1;
        setAdaptiveQuestionsCount(newCount);

        // Update recent answers
        setRecentAnswers(prev => [...prev.slice(-9), answerData]);

        console.log('🔍 Questions answered so far:', newCount);

        // ✅ Check for difficulty adjustment after 3 questions
        if (newCount >= 3) {
            console.log('✅ Threshold met (3+ questions), checking adjustment...');
            setIsCheckingAdaptive(true);

            try {
                const url = `${API_URL}/api/adaptive/check-adjustment`;
                console.log('🌐 Calling API:', url);
                console.log('📤 Request body:', answerData);

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(answerData)
                });

                console.log('📥 API Response status:', response.status);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ API Error response:', errorText);
                    throw new Error(`API returned ${response.status}`);
                }

                const result = await response.json();
                console.log('📊 Adjustment check result:', result);

                if (result.success && result.shouldAdjust && result.recommendation) {
                    const rec = result.recommendation;
                    console.log('🎯 Should adjust! Recommendation:', rec);

                    setRecommendation(rec);

                    if (rec.newDifficulty !== currentDifficulty) {
                        console.log('🔄 Changing difficulty:', currentDifficulty, '→', rec.newDifficulty);

                        // ✅ Show visual notification
                        const difficultyNames = {
                            easy: 'קל',
                            medium: 'בינוני',
                            hard: 'מאתגר'
                        };

                        const changeMessage = `עניתנו ${isCorrect ? 'נכון' : 'לא נכון'} על ${newCount} שאלות. ${rec.reason || ''}`;

                        setShowDifficultyChange({
                            from: currentDifficulty,
                            to: rec.newDifficulty,
                            reason: changeMessage
                        });

                        // Auto-hide after 5 seconds
                        setTimeout(() => {
                            console.log('⏰ Hiding difficulty change notification');
                            setShowDifficultyChange(null);
                        }, 5000);

                        // Update difficulty
                        setCurrentDifficulty(rec.newDifficulty);

                        // Reset counter for next check
                        setAdaptiveQuestionsCount(0);

                        // Track adjustment history
                        setAdjustmentHistory(prev => [...prev, {
                            timestamp: Date.now(),
                            from: currentDifficulty,
                            to: rec.newDifficulty,
                            reason: rec.reason
                        }]);

                        // Show toast notification
                        const diffEmoji = rec.newDifficulty === 'easy' ? '🌱' : rec.newDifficulty === 'hard' ? '🔥' : '⚡';
                        toast.success(
                            `רמת קושי שונתה ל-${difficultyNames[rec.newDifficulty]} ${diffEmoji}!`,
                            { duration: 3000, icon: '🎯' }
                        );
                    }
                } else {
                    console.log('ℹ️ No adjustment needed at this time');
                }

                // Get performance summary
                try {
                    const perfUrl = `${API_URL}/api/adaptive/performance/${userId}`;
                    console.log('📊 Fetching performance:', perfUrl);

                    const perfResponse = await fetch(perfUrl);
                    if (perfResponse.ok) {
                        const perfData = await perfResponse.json();
                        if (perfData.success) {
                            setPerformance(perfData.performance);
                            console.log('✅ Performance updated:', perfData.performance);
                        }
                    }
                } catch (perfError) {
                    console.warn('⚠️ Could not fetch performance:', perfError);
                }

            } catch (error) {
                console.error('❌ Adaptive difficulty check error:', error);
                toast.error('שגיאה בבדיקת רמת קושי', { duration: 2000 });
            } finally {
                setIsCheckingAdaptive(false);
            }
        } else {
            console.log(`ℹ️ Not checking yet - need ${3 - newCount} more questions`);
        }
    }, [
        getUserId,
        selectedTopic,
        selectedSubtopic,
        currentDifficulty,
        hintCount,
        attemptCount,
        adaptiveQuestionsCount
    ]);

    useEffect(() => {
        if (propTopicId && availableTopics.length > 0 && !selectedTopic && !initStartedRef.current) {
            initStartedRef.current = true;

            const topic = availableTopics.find(t => t.id === propTopicId);

            if (topic) {
                setSelectedTopic(topic);

                const subtopics = getSubtopics(gradeId, topic.id) || [];

                if (subtopics.length === 0) {
                    setTimeout(() => {
                        startPractice(topic, null);
                    }, 0);
                } else {
                    setView('subtopic-select');
                }
            } else {
                const basicTopic = {
                    id: propTopicId,
                    name: propTopicId,
                    nameEn: propTopicId,
                    icon: '📚',
                    difficulty: 'intermediate'
                };
                setSelectedTopic(basicTopic);
                setTimeout(() => {
                    startPractice(basicTopic, null);
                }, 0);
            }
        }
    }, [propTopicId, availableTopics.length]);

    useEffect(() => {
        if (view === 'practice' && !currentQuestion && !practiceStartedRef.current && !initStartedRef.current) {
            practiceStartedRef.current = true;

            let topicToUse = propSelectedTopic;
            let subtopicToUse = propSelectedSubtopic;

            if (!topicToUse && availableTopics.length > 0) {
                if (propMode === 'random' || propMode === 'ai-adaptive') {
                    const randomIndex = Math.floor(Math.random() * availableTopics.length);
                    topicToUse = availableTopics[randomIndex];
                } else if (propMode === 'weakness-only') {
                    const profileData = nexonProfile || user;
                    const weakTopics = profileData?.weakTopics || [];
                    if (weakTopics.length > 0) {
                        const weakTopicObjs = weakTopics
                            .map(id => availableTopics.find(t => t.id === id))
                            .filter(Boolean);
                        if (weakTopicObjs.length > 0) {
                            const randomIndex = Math.floor(Math.random() * weakTopicObjs.length);
                            topicToUse = weakTopicObjs[randomIndex];
                        }
                    }
                    if (!topicToUse) {
                        const randomIndex = Math.floor(Math.random() * availableTopics.length);
                        topicToUse = availableTopics[randomIndex];
                    }
                }
            }

            setTimeout(() => {
                startPractice(topicToUse, subtopicToUse);
            }, 100);
        }
    }, [view, currentQuestion]);

    useEffect(() => {
        if (isTimerRunning) {
            timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isTimerRunning]);

    useEffect(() => {
        if (currentQuestion && voice.voiceEnabled) {
            setTimeout(() => {
                voice.speak(currentQuestion.question);
            }, 500);
        }
    }, [currentQuestion]);

    useEffect(() => {
        if (finalFeedback && voice.voiceEnabled) {
            const feedbackText = finalFeedback.isCorrect
                ? `מעולה! התשובה נכונה. ${finalFeedback.feedback || ''}`
                : `התשובה לא נכונה. ${finalFeedback.feedback || ''}`;
            voice.speak(feedbackText);
        }
    }, [finalFeedback]);

    useEffect(() => {
        if (!userAnswer.trim() || finalFeedback?.isCorrect) {
            if (autoCheckTimerRef.current) {
                clearTimeout(autoCheckTimerRef.current);
                autoCheckTimerRef.current = null;
            }
            setFeedbackStatus('idle');
            return;
        }

        if (userAnswer === lastCheckedAnswerRef.current) {
            return;
        }

        if (autoCheckTimerRef.current) {
            clearTimeout(autoCheckTimerRef.current);
        }

        const checkTimer = setTimeout(() => {
            setFeedbackStatus('checking');
        }, 2500);

        autoCheckTimerRef.current = setTimeout(() => {
            checkAnswerLive();
        }, 3000);

        return () => {
            clearTimeout(checkTimer);
            if (autoCheckTimerRef.current) {
                clearTimeout(autoCheckTimerRef.current);
            }
        };
    }, [userAnswer, finalFeedback]);

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('נא להעלות קובץ תמונה בלבד');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('גודל הקובץ חייב להיות פחות מ-10MB');
            return;
        }

        setUploadedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
        toast.success('תמונה הועלתה בהצלחה! 📸');
    };

    const analyzeUploadedWork = async () => {
        if (!uploadedImage || !currentQuestion) {
            toast.error('אין תמונה להעלות או שאלה פעילה');
            return;
        }

        setIsAnalyzingImage(true);
        setImageAnalysisResult(null);

        try {
            const formData = new FormData();
            formData.append('image', uploadedImage);
            formData.append('question', currentQuestion.question);
            formData.append('correctAnswer', currentQuestion.correctAnswer);
            formData.append('studentName', nexonProfile?.name || user?.name || 'תלמיד');
            formData.append('grade', currentGrade);
            formData.append('topic', selectedTopic?.name || '');
            formData.append('personality', nexonProfile?.personality || 'nexon');
            formData.append('mathFeeling', nexonProfile?.mathFeeling || 'okay');
            formData.append('learningStyle', nexonProfile?.learningStyle || 'visual');

            const response = await fetch(`${API_URL}/api/ai/analyze-handwritten-work`, {
                method: 'POST',
                body: formData
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const textResponse = await response.text();
                throw new Error('שרת החזיר תשובה לא תקינה');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `שגיאת שרת: ${response.status}`);
            }

            if (!data.success) {
                throw new Error(data.error || 'שגיאה בניתוח התמונה');
            }

            if (!data.analysis) {
                throw new Error('התשובה מהשרת לא תקינה');
            }

            setImageAnalysisResult(data.analysis);

            const userId = getUserId();
            if (userId) {
                await saveExerciseToNotebook(userId, {
                    question: currentQuestion.question,
                    correctAnswer: currentQuestion.correctAnswer,
                    userAnswer: data.analysis.detectedAnswer || 'תשובה מתמונה',
                    isCorrect: data.analysis.isCorrect,
                    topic: selectedTopic?.name || 'כללי',
                    subtopic: selectedSubtopic?.name || '',
                    difficulty: currentDifficulty // ✅ INCLUDE DIFFICULTY
                });
            }

            if (userId) {
                await trackCurriculumProgress(userId, {
                    topicId: selectedTopic?.id,
                    subtopicId: selectedSubtopic?.id,
                    topic: selectedTopic?.name || 'כללי',
                    subtopic: selectedSubtopic?.name || '',
                    isCorrect: data.analysis.isCorrect,
                    timeSpent: timer * 1000,
                    hintsUsed: hintCount,
                    attempts: attemptCount + 1
                });

                // ✅ Track answer for adaptive difficulty
                console.log('🎯 Calling trackAnswer from image analysis');
                await trackAnswer(data.analysis.isCorrect, timer);
            }

            if (data.analysis.isCorrect) {
                const pointsEarned = Math.max(100 - (hintCount * 10) - (attemptCount * 20), 10);
                setSessionStats(prev => {
                    const newStreak = prev.streak + 1;
                    return {
                        ...prev,
                        correct: prev.correct + 1,
                        total: prev.total + 1,
                        attempts: prev.attempts + attemptCount + 1,
                        streak: newStreak,
                        maxStreak: Math.max(newStreak, prev.maxStreak),
                        points: prev.points + pointsEarned,
                        questionTimes: [...prev.questionTimes, timer]
                    };
                });
                toast.success('🎉 תשובה נכונה! מעולה!');
                setIsTimerRunning(false);
            } else {
                toast.error('התשובה לא נכונה, נסה שוב');
                setAttemptCount(prev => prev + 1);
                setSessionStats(prev => ({
                    ...prev,
                    streak: 0
                }));
            }

        } catch (error) {
            console.error('❌ Image analysis error:', error);

            let errorMessage = 'שגיאה בניתוח התמונה';

            if (error.message.includes('fetch')) {
                errorMessage = 'לא ניתן להתחבר לשרת. בדוק את החיבור לאינטרנט.';
            } else if (error.message.includes('JSON')) {
                errorMessage = 'שגיאה בקריאת תשובה מהשרת. נסה שוב.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage, { duration: 5000 });

        } finally {
            setIsAnalyzingImage(false);
        }
    };

    const clearUploadedImage = () => {
        setUploadedImage(null);
        setImagePreview(null);
        setImageAnalysisResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startPractice = async (topic, subtopic) => {
        practiceStartedRef.current = true;

        setSelectedTopic(topic);
        setSelectedSubtopic(subtopic);
        setView('practice');
        setSessionStats({
            correct: 0,
            total: 0,
            attempts: 0,
            streak: 0,
            maxStreak: 0,
            points: 0,
            startTime: Date.now(),
            questionTimes: []
        });
        await generateNewQuestion(topic, subtopic);
    };

    const generateNewQuestion = async (topic, subtopic) => {
        setIsGeneratingQuestion(true);
        setTimer(0);
        setHintCount(0);
        setCurrentHints([]);
        setUserAnswer('');
        setLiveFeedback(null);
        setFinalFeedback(null);
        setFeedbackStatus('idle');
        setCurrentQuestion(null);
        setAttemptCount(0);
        setChatOpen(false);
        lastCheckedAnswerRef.current = '';
        clearUploadedImage();

        try {
            if (!topic || typeof topic !== 'object' || !topic.name) {
                throw new Error('Invalid topic object');
            }

            let finalSubtopic = subtopic;
            if (!finalSubtopic) {
                const availableSubtopics = getSubtopics(gradeId, topic.id) || [];

                if (availableSubtopics.length > 0) {
                    const randomIndex = Math.floor(Math.random() * availableSubtopics.length);
                    finalSubtopic = availableSubtopics[randomIndex];
                }
            }

            const requestBody = {
                topic: {
                    id: String(topic.id || topic.name || 'unknown'),
                    name: String(topic.name),
                    nameEn: String(topic.nameEn || '')
                },
                subtopic: finalSubtopic ? {
                    id: String(finalSubtopic.id || finalSubtopic.name || 'unknown'),
                    name: String(finalSubtopic.name || ''),
                    nameEn: String(finalSubtopic.nameEn || '')
                } : null,
                difficulty: currentDifficulty, // ✅ Use adaptive difficulty
                studentProfile: {
                    name: String(nexonProfile?.name || user?.name || 'תלמיד'),
                    grade: String(currentGrade),
                    track: String(currentTrack || ''),
                    mathFeeling: String(nexonProfile?.mathFeeling || 'okay'),
                    learningStyle: String(nexonProfile?.learningStyle || 'ask'),
                    goalFocus: String(nexonProfile?.goalFocus || 'understanding'),
                    studentId: String(nexonProfile?.id || user?.id || 'anonymous')
                }
            };

            console.log('🎯 Generating question with difficulty:', currentDifficulty);

            const response = await fetch(`${API_URL}/api/ai/generate-question`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
                throw new Error('Server error - check if server is running on port 3001');
            }

            let data;
            try {
                const text = await response.text();
                data = JSON.parse(text);
            } catch (parseError) {
                throw new Error(`Invalid JSON response: ${parseError.message}`);
            }

            if (!response.ok || !data.success) {
                let errorMsg = 'Failed to generate question';
                if (data.error) {
                    errorMsg = typeof data.error === 'string' ? data.error : data.error.message || JSON.stringify(data.error);
                }
                throw new Error(errorMsg);
            }

            if (!data.question) {
                throw new Error('No question data received');
            }

            await new Promise(resolve => setTimeout(resolve, 1500));

            setCurrentQuestion({
                question: data.question,
                correctAnswer: data.correctAnswer,
                hints: data.hints || [],
                explanation: data.explanation || '',
                visualData: data.visualData || null
            });
            try {
                const userId = getUserId();
                if (userId) {
                    console.log('📝 Recording question to history');

                    await axios.post(`${API_URL}/api/questions/record-history`, {
                        userId: userId,
                        topicId: topic?.id || 'general',
                        subtopicId: finalSubtopic?.id || null,
                        questionText: data.question,
                        difficulty: currentDifficulty
                    });

                    console.log('✅ Question recorded to history');
                }
            } catch (historyError) {
                console.warn('⚠️ Failed to record question history:', historyError.message);
                // Don't fail the question generation - continue anyway
            }
            setIsTimerRunning(true);
            setTimeout(() => inputRef.current?.focus(), 100);

        } catch (error) {
            console.error('❌ Error in generateNewQuestion:', error);

            let displayMessage = 'שגיאה ביצירת שאלה';
            if (error.message.includes('fetch')) {
                displayMessage = 'לא ניתן להתחבר לשרת. בדוק שהשרת רץ';
            } else if (error.message.includes('JSON')) {
                displayMessage = 'שגיאת תקשורת עם השרת. נסה שוב.';
            } else if (error.message) {
                displayMessage = `שגיאה: ${error.message}`;
            }

            toast.error(displayMessage, { duration: 5000, icon: '❌' });

            if (propTopicId && onClose) {
                onClose();
            } else {
                setView('topic-select');
            }
        } finally {
            setIsGeneratingQuestion(false);
        }
    };

    const checkAnswerLive = async () => {
        if (!userAnswer.trim() || !currentQuestion) return;

        lastCheckedAnswerRef.current = userAnswer;

        try {
            const result = await aiVerification.verifyAnswer(
                userAnswer,
                currentQuestion.correctAnswer,
                currentQuestion.question,
                {
                    studentName: nexonProfile?.name || user?.name || 'תלמיד',
                    grade: currentGrade,
                    topic: selectedTopic?.name,
                    subtopic: selectedSubtopic?.name
                }
            );

            setLiveFeedback(result);

            if (result.isCorrect) {
                setFeedbackStatus('correct');
            } else if (result.isPartial) {
                setFeedbackStatus('partial');
            } else {
                setFeedbackStatus('wrong');
            }

        } catch (error) {
            console.error('Live check error:', error);
            setFeedbackStatus('idle');
        }
    };

    const submitAnswer = async () => {
        if (!userAnswer.trim() || !currentQuestion) return;
        if (finalFeedback?.isCorrect) {
            nextQuestion();
            return;
        }

        setIsTimerRunning(false);

        let result = liveFeedback;

        if (!result || lastCheckedAnswerRef.current !== userAnswer) {
            try {
                const actualUserId = propUserId || user?.uid || null;

                result = await aiVerification.verifyAnswer(
                    userAnswer,
                    currentQuestion.correctAnswer,
                    currentQuestion.question,
                    {
                        studentName: nexonProfile?.name || user?.displayName || user?.name || 'תלמיד',
                        grade: currentGrade,
                        userId: actualUserId,
                        topic: selectedTopic?.name,
                        subtopic: selectedSubtopic?.name
                    }
                );
            } catch (error) {
                console.error('❌ Submit error:', error);
                toast.error('שגיאה בבדיקת תשובה');
                return;
            }
        }

        const isCorrect = result.isCorrect;

        const userId = getUserId();
        if (userId) {
            await saveExerciseToNotebook(userId, {
                question: currentQuestion.question,
                correctAnswer: currentQuestion.correctAnswer,
                userAnswer: userAnswer,
                isCorrect: isCorrect,
                topic: selectedTopic?.name || 'כללי',
                subtopic: selectedSubtopic?.name || '',
                difficulty: currentDifficulty // ✅ INCLUDE DIFFICULTY
            });
        }

        if (userId) {
            await trackCurriculumProgress(userId, {
                topicId: selectedTopic?.id,
                subtopicId: selectedSubtopic?.id,
                topic: selectedTopic?.name || 'כללי',
                subtopic: selectedSubtopic?.name || '',
                isCorrect: isCorrect,
                timeSpent: timer * 1000,
                hintsUsed: hintCount,
                attempts: attemptCount + 1
            });

            // ✅ ✅ ✅ TRACK ANSWER FOR ADAPTIVE DIFFICULTY ✅ ✅ ✅
            console.log('🎯 Calling trackAnswer from submitAnswer');
            await trackAnswer(isCorrect, timer);
        }

        if (onAnswerSubmitted && typeof onAnswerSubmitted === 'function') {
            onAnswerSubmitted(isCorrect);
        }

        let pointsEarned = 0;
        if (isCorrect) {
            if (attemptCount === 0) {
                pointsEarned = 100 - (hintCount * 10);
            } else if (attemptCount === 1) {
                pointsEarned = 60;
            } else if (attemptCount === 2) {
                pointsEarned = 30;
            } else {
                pointsEarned = 10;
            }
            pointsEarned = Math.max(pointsEarned, 10);
        }

        setFinalFeedback({
            ...result,
            timeTaken: timer,
            pointsEarned,
            attemptNumber: attemptCount + 1
        });

        if (isCorrect) {
            setSessionStats(prev => {
                const newStreak = prev.streak + 1;
                return {
                    ...prev,
                    correct: prev.correct + 1,
                    total: prev.total + 1,
                    attempts: prev.attempts + attemptCount + 1,
                    streak: newStreak,
                    maxStreak: Math.max(newStreak, prev.maxStreak),
                    points: prev.points + pointsEarned,
                    questionTimes: [...prev.questionTimes, timer]
                };
            });
        } else {
            setAttemptCount(prev => prev + 1);
            setSessionStats(prev => ({
                ...prev,
                streak: 0
            }));
        }
    };

    const getHint = async () => {
        if (hintCount >= 3) return;

        try {
            const response = await fetch(`${API_URL}/api/ai/get-hint`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: currentQuestion.question,
                    hintIndex: hintCount,
                    studentProfile: {
                        name: nexonProfile?.name || user?.name || 'תלמיד',
                        learningStyle: nexonProfile?.learningStyle || 'ask'
                    }
                })
            });

            const data = await response.json();

            if (data.success) {
                setCurrentHints([...currentHints, data.hint]);
                setHintCount(hintCount + 1);
            }
        } catch (error) {
            console.error('Hint error:', error);
            toast.error('שגיאה בקבלת רמז');
        }
    };

    const nextQuestion = () => {
        if (finalFeedback?.isCorrect) {
            generateNewQuestion(selectedTopic, selectedSubtopic);
        }
    };

    const tryAgain = () => {
        setUserAnswer('');
        setLiveFeedback(null);
        setFinalFeedback(null);
        setFeedbackStatus('idle');
        lastCheckedAnswerRef.current = '';
        setIsTimerRunning(true);
        clearUploadedImage();
        inputRef.current?.focus();
    };

    const endSession = () => {
        setView('results');
        setIsTimerRunning(false);
    };

    const handleExitPractice = () => {
        const confirmed = window.confirm('האם אתה בטוח שברצונך לצאת מהתרגול?');
        if (confirmed && onClose) {
            onClose();
        }
    };

    const handleBackNavigation = () => {
        if (onClose) {
            handleExitPractice();
        } else if (view === 'practice') {
            const subtopics = getSubtopics(gradeId, selectedTopic?.id) || [];
            if (subtopics.length > 0) {
                setView('subtopic-select');
            } else {
                setView('topic-select');
            }
        } else if (view === 'subtopic-select') {
            setView('topic-select');
            setSelectedTopic(null);
        } else {
            setView('home');
        }
    };

    // ==================== 📱 RENDER VIEWS ====================

    // HOME VIEW
    if (view === 'home') {
        return (
            <motion.div
                key="home"
                {...pageTransition}
                className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-purple-50 p-4 md:p-8"
                dir="rtl"
            >
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-8 md:mb-12"
                    >
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                            className="text-6xl md:text-8xl mb-4"
                        >
                            🧠
                        </motion.div>
                        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mb-3">
                            נקסון - המורה שלך למתמטיקה
                        </h1>
                        <p className="text-lg md:text-xl text-gray-700 font-medium">
                            {nexonProfile?.name ? `היי ${nexonProfile.name}! ` : ''}בואו ללמוד מתמטיקה בדרך חכמה ומהנה! 🎯
                        </p>
                    </motion.div>

                    {/* Quick Actions */}
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <motion.button
                            variants={cardHover}
                            initial="rest"
                            whileHover="hover"
                            whileTap="tap"
                            onClick={() => setView('topic-select')}
                            className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-3xl p-8 shadow-2xl"
                        >
                            <BookOpen className="w-16 h-16 mb-4 mx-auto" />
                            <h3 className="text-2xl font-black mb-2">תרגול לפי נושא</h3>
                            <p className="text-blue-100">בחר נושא ספציפי ותתחיל לתרגל</p>
                        </motion.button>

                        <motion.button
                            variants={cardHover}
                            initial="rest"
                            whileHover="hover"
                            whileTap="tap"
                            onClick={() => {
                                setPracticeMode('random');
                                setView('practice');
                            }}
                            className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-3xl p-8 shadow-2xl"
                        >
                            <Sparkles className="w-16 h-16 mb-4 mx-auto" />
                            <h3 className="text-2xl font-black mb-2">תרגול אקראי</h3>
                            <p className="text-purple-100">תרגל שאלות מנושאים שונים</p>
                        </motion.button>
                    </div>

                    {/* Stats Cards */}
                    {sessionStats.total > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-4"
                        >
                            <div className="bg-white rounded-2xl p-6 shadow-lg">
                                <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                                <div className="text-3xl font-black text-gray-800">{sessionStats.points}</div>
                                <div className="text-sm text-gray-600">נקודות</div>
                            </div>
                            <div className="bg-white rounded-2xl p-6 shadow-lg">
                                <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                                <div className="text-3xl font-black text-gray-800">{sessionStats.streak}</div>
                                <div className="text-sm text-gray-600">רצף נוכחי</div>
                            </div>
                            <div className="bg-white rounded-2xl p-6 shadow-lg">
                                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                <div className="text-3xl font-black text-gray-800">{sessionStats.correct}</div>
                                <div className="text-sm text-gray-600">תשובות נכונות</div>
                            </div>
                            <div className="bg-white rounded-2xl p-6 shadow-lg">
                                <BarChart3 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                                <div className="text-3xl font-black text-gray-800">{sessionStats.total}</div>
                                <div className="text-sm text-gray-600">סה"כ שאלות</div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        );
    }

    // TOPIC SELECT VIEW
    if (view === 'topic-select') {
        return (
            <motion.div
                key="topic-select"
                {...pageTransition}
                className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8"
                dir="rtl"
            >
                <div className="max-w-7xl mx-auto">
                    {/* Back Button */}
                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={handleBackNavigation}
                        className="mb-6 flex items-center gap-2 bg-white px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-bold">חזרה</span>
                    </motion.button>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-8"
                    >
                        <h2 className="text-3xl md:text-5xl font-black text-gray-800 mb-3">
                            בחר נושא לתרגול
                        </h2>
                        <p className="text-lg text-gray-600">
                            כיתה {currentGrade} {currentTrack && `- מסלול ${currentTrack}`}
                        </p>
                    </motion.div>

                    {/* Topics Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableTopics.map((topic, index) => (
                            <motion.button
                                key={topic.id}
                                custom={index}
                                variants={fadeInUp}
                                initial="hidden"
                                animate="visible"
                                whileHover="hover"
                                whileTap="tap"
                                onClick={() => {
                                    setSelectedTopic(topic);
                                    const subtopics = getSubtopics(gradeId, topic.id) || [];
                                    if (subtopics.length > 0) {
                                        setView('subtopic-select');
                                    } else {
                                        startPractice(topic, null);
                                    }
                                }}
                                className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all text-right"
                            >
                                <div className="text-5xl mb-4">{topic.icon}</div>
                                <h3 className="text-2xl font-black text-gray-800 mb-2">
                                    {topic.name}
                                </h3>
                                <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                                    topic.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                        topic.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                }`}>
                                    {topic.difficulty === 'easy' ? 'קל' :
                                        topic.difficulty === 'intermediate' ? 'בינוני' : 'מתקדם'}
                                </div>
                                <ChevronRight className="w-6 h-6 text-gray-400 mx-auto mt-4" />
                            </motion.button>
                        ))}
                    </div>
                </div>
            </motion.div>
        );
    }

    // SUBTOPIC SELECT VIEW
    if (view === 'subtopic-select' && selectedTopic) {
        const subtopics = getSubtopics(gradeId, selectedTopic.id) || [];

        return (
            <motion.div
                key="subtopic-select"
                {...pageTransition}
                className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-purple-50 p-4 md:p-8"
                dir="rtl"
            >
                <div className="max-w-7xl mx-auto">
                    {/* Back Button */}
                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={handleBackNavigation}
                        className="mb-6 flex items-center gap-2 bg-white px-6 py-3 rounded-2xl shadow-lg"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-bold">חזרה</span>
                    </motion.button>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-8"
                    >
                        <div className="text-6xl mb-4">{selectedTopic.icon}</div>
                        <h2 className="text-3xl md:text-5xl font-black text-gray-800 mb-3">
                            {selectedTopic.name}
                        </h2>
                        <p className="text-lg text-gray-600">בחר תת-נושא</p>
                    </motion.div>

                    {/* Subtopics */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {subtopics.map((subtopic, index) => (
                            <motion.button
                                key={subtopic.id}
                                custom={index}
                                variants={fadeInUp}
                                initial="hidden"
                                animate="visible"
                                whileHover="hover"
                                whileTap="tap"
                                onClick={() => startPractice(selectedTopic, subtopic)}
                                className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all"
                            >
                                <Target className="w-12 h-12 text-blue-500 mb-4 mx-auto" />
                                <h3 className="text-xl font-black text-gray-800 mb-2">
                                    {subtopic.name}
                                </h3>
                                <ChevronRight className="w-6 h-6 text-gray-400 mx-auto mt-4" />
                            </motion.button>
                        ))}
                    </div>
                </div>
            </motion.div>
        );
    }

    // PRACTICE VIEW
    if (view === 'practice') {
        if (isGeneratingQuestion) {
            return (
                <motion.div
                    key="generating"
                    {...pageTransition}
                    className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center"
                    dir="rtl"
                >
                    <ThinkingAnimation message="נקסון מכין שאלה מיוחדת בשבילך..." />
                </motion.div>
            );
        }

        if (!currentQuestion) {
            return (
                <motion.div
                    key="loading"
                    {...pageTransition}
                    className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center"
                    dir="rtl"
                >
                    <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
                </motion.div>
            );
        }

        return (
            <motion.div
                key="practice"
                {...pageTransition}
                className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8"
                dir="rtl"
            >
                {/* AI Chat Sidebar */}
                <AIChatSidebar
                    question={currentQuestion}
                    studentProfile={{
                        name: nexonProfile?.name || user?.name || 'תלמיד',
                        topic: selectedTopic?.name,
                        grade: currentGrade,
                        personality: nexonProfile?.personality,
                        mathFeeling: nexonProfile?.mathFeeling,
                        learningStyle: nexonProfile?.learningStyle
                    }}
                    isOpen={chatOpen}
                    onToggle={() => setChatOpen(!chatOpen)}
                    currentAnswer={userAnswer}
                />

                <div className="max-w-5xl mx-auto">
                    {/* ✅ DIFFICULTY CHANGE NOTIFICATION */}
                    <DifficultyChangeNotification
                        change={showDifficultyChange}
                        onClose={() => setShowDifficultyChange(null)}
                    />

                    {/* Top Bar */}
                    <div className="flex items-center justify-between mb-6 bg-white rounded-2xl p-4 shadow-lg">
                        <button
                            onClick={handleBackNavigation}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-bold">יציאה</span>
                        </button>

                        <div className="flex items-center gap-4">
                            {/* ✅ Adaptive Difficulty Badge */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={`flex items-center gap-2 bg-gradient-to-r ${difficultyColor} px-4 py-2 rounded-xl shadow-lg`}
                            >
                                <span className="text-2xl">{difficultyEmoji}</span>
                                <span className="font-bold text-white">{difficultyLabel}</span>
                            </motion.div>

                            {/* Timer */}
                            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl">
                                <Clock className="w-5 h-5 text-blue-600" />
                                <span className="font-mono font-bold text-blue-900">
                                    {formatTime(timer)}
                                </span>
                            </div>

                            {/* Voice Toggle */}
                            <button
                                onClick={voice.toggleVoice}
                                className="p-3 bg-purple-50 rounded-xl hover:bg-purple-100"
                            >
                                {voice.voiceEnabled ? (
                                    <Volume2 className="w-5 h-5 text-purple-600" />
                                ) : (
                                    <VolumeX className="w-5 h-5 text-gray-400" />
                                )}
                            </button>

                            {/* Stats */}
                            <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl">
                                <Trophy className="w-5 h-5 text-green-600" />
                                <span className="font-bold text-green-900">{sessionStats.points}</span>
                            </div>

                            {sessionStats.streak > 0 && (
                                <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-xl">
                                    <Flame className="w-5 h-5 text-orange-600" />
                                    <span className="font-bold text-orange-900">{sessionStats.streak}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ✅ Adaptive Difficulty Display Component */}
                    {adaptiveQuestionsCount > 0 && (
                        <AdaptiveDifficultyDisplay
                            currentDifficulty={currentDifficulty}
                            recentAnswers={recentAnswers}
                            recommendation={recommendation}
                            performance={performance}
                            adjustmentHistory={adjustmentHistory}
                            isChecking={isCheckingAdaptive}
                        />
                    )}

                    {/* Question Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl p-8 shadow-2xl mb-6"
                    >
                        {/* Topic Badge */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="text-3xl">{selectedTopic?.icon}</div>
                            <div>
                                <div className="font-black text-lg text-gray-800">
                                    {selectedTopic?.name}
                                </div>
                                {selectedSubtopic && (
                                    <div className="text-sm text-gray-600">
                                        {selectedSubtopic.name}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Question Text */}
                        <div className="mb-8">
                            <div className="flex items-start gap-3 mb-4">
                                <Brain className="w-8 h-8 text-blue-600 flex-shrink-0 mt-2" />
                                <div className="flex-1">
                                    <MathDisplay>{currentQuestion.question}</MathDisplay>
                                </div>
                            </div>
                        </div>

                        {/* Visual Graph */}
                        {currentQuestion.visualData && (
                            <VisualGraph visualData={currentQuestion.visualData} />
                        )}

                        {/* Hints */}
                        {currentHints.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6"
                            >
                                {currentHints.map((hint, index) => (
                                    <div
                                        key={index}
                                        className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mb-3"
                                    >
                                        <div className="flex items-start gap-3">
                                            <Lightbulb className="w-6 h-6 text-amber-600 flex-shrink-0" />
                                            <div className="flex-1">
                                                <div className="font-bold text-amber-900 mb-1">
                                                    רמז {index + 1}:
                                                </div>
                                                <MathDisplay>{hint}</MathDisplay>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {/* Answer Input */}
                        {!finalFeedback?.isCorrect && (
                            <div className="relative mb-6">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && submitAnswer()}
                                    placeholder="הקלד את תשובתך כאן..."
                                    className="w-full px-6 py-4 pr-20 text-2xl font-bold text-center border-4 border-blue-300 rounded-2xl focus:outline-none focus:border-blue-500 bg-blue-50"
                                    disabled={finalFeedback !== null}
                                />
                                <LiveFeedbackIndicator status={feedbackStatus} />
                            </div>
                        )}

                        {/* Live Feedback */}
                        {liveFeedback && !finalFeedback && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`mb-6 p-4 rounded-2xl border-2 ${
                                    liveFeedback.isCorrect
                                        ? 'bg-green-50 border-green-300'
                                        : liveFeedback.isPartial
                                            ? 'bg-amber-50 border-amber-300'
                                            : 'bg-red-50 border-red-300'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    {liveFeedback.isCorrect ? (
                                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                                    ) : liveFeedback.isPartial ? (
                                        <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                                    ) : (
                                        <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                                    )}
                                    <div className="flex-1">
                                        <MathDisplay>{liveFeedback.feedback}</MathDisplay>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Final Feedback */}
                        {finalFeedback && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`mb-6 p-6 rounded-2xl border-4 ${
                                    finalFeedback.isCorrect
                                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400'
                                        : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-400'
                                }`}
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    {finalFeedback.isCorrect ? (
                                        <>
                                            <CheckCircle2 className="w-12 h-12 text-green-600" />
                                            <div>
                                                <div className="text-2xl font-black text-green-900">
                                                    מעולה! תשובה נכונה! 🎉
                                                </div>
                                                <div className="text-green-700 font-bold">
                                                    +{finalFeedback.pointsEarned} נקודות
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-12 h-12 text-red-600" />
                                            <div>
                                                <div className="text-2xl font-black text-red-900">
                                                    התשובה לא נכונה
                                                </div>
                                                <div className="text-red-700 font-bold">
                                                    נסיון {finalFeedback.attemptNumber}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="bg-white/80 rounded-xl p-4 mb-4">
                                    <MathDisplay>{finalFeedback.feedback}</MathDisplay>
                                </div>

                                {!finalFeedback.isCorrect && currentQuestion.correctAnswer && (
                                    <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-300">
                                        <div className="font-bold text-blue-900 mb-2">
                                            התשובה הנכונה:
                                        </div>
                                        <div className="text-2xl font-black text-blue-600">
                                            <MathDisplay>{currentQuestion.correctAnswer}</MathDisplay>
                                        </div>
                                    </div>
                                )}

                                {currentQuestion.explanation && (
                                    <div className="bg-purple-50 rounded-xl p-4 mt-4 border-2 border-purple-300">
                                        <div className="font-bold text-purple-900 mb-2">
                                            הסבר:
                                        </div>
                                        <MathDisplay>{currentQuestion.explanation}</MathDisplay>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Image Upload Section */}
                        {!finalFeedback?.isCorrect && (
                            <div className="border-t-2 border-gray-200 pt-6 mt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-black text-lg text-gray-800">
                                        פתרת על נייר? העלה תמונה! 📸
                                    </h3>
                                </div>

                                {!imagePreview ? (
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-4 border-dashed border-blue-300 rounded-2xl cursor-pointer bg-blue-50 hover:bg-blue-100 transition-all">
                                        <div className="flex flex-col items-center">
                                            <Camera className="w-10 h-10 text-blue-600 mb-2" />
                                            <span className="font-bold text-blue-900">
                                                לחץ להעלאת תמונה
                                            </span>
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                    </label>
                                ) : (
                                    <div className="relative">
                                        <img
                                            src={imagePreview}
                                            alt="Uploaded work"
                                            className="w-full max-h-64 object-contain rounded-2xl border-4 border-blue-300 bg-white"
                                        />
                                        <button
                                            onClick={clearUploadedImage}
                                            className="absolute top-2 left-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>

                                        {!imageAnalysisResult && (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={analyzeUploadedWork}
                                                disabled={isAnalyzingImage}
                                                className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-lg py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                            >
                                                {isAnalyzingImage ? (
                                                    <>
                                                        <Loader2 className="w-6 h-6 animate-spin" />
                                                        מנתח את הפתרון שלך...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Brain className="w-6 h-6" />
                                                        נתח את הפתרון שלי
                                                        <Sparkles className="w-6 h-6" />
                                                    </>
                                                )}
                                            </motion.button>
                                        )}

                                        {imageAnalysisResult && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`mt-4 p-6 rounded-2xl border-4 ${
                                                    imageAnalysisResult.isCorrect
                                                        ? 'bg-green-50 border-green-400'
                                                        : 'bg-red-50 border-red-400'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 mb-4">
                                                    {imageAnalysisResult.isCorrect ? (
                                                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                                                    ) : (
                                                        <XCircle className="w-10 h-10 text-red-600" />
                                                    )}
                                                    <div className={`text-2xl font-black ${
                                                        imageAnalysisResult.isCorrect ? 'text-green-900' : 'text-red-900'
                                                    }`}>
                                                        {imageAnalysisResult.isCorrect ? 'פתרון נכון! 🎉' : 'יש טעות בפתרון'}
                                                    </div>
                                                </div>

                                                <div className="bg-white/80 rounded-xl p-4">
                                                    <MathDisplay>{imageAnalysisResult.feedback}</MathDisplay>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3 mt-6">
                            {!finalFeedback?.isCorrect && (
                                <>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={submitAnswer}
                                        disabled={!userAnswer.trim() || finalFeedback !== null}
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-black text-xl py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        <Send className="w-6 h-6" />
                                        {finalFeedback ? 'נשלח' : 'שלח תשובה'}
                                    </motion.button>

                                    {hintCount < 3 && (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={getHint}
                                            className="px-6 py-4 bg-amber-500 text-white font-black rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center gap-2"
                                        >
                                            <Lightbulb className="w-6 h-6" />
                                            רמז ({3 - hintCount})
                                        </motion.button>
                                    )}

                                    {voice.isListening ? (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={voice.stopListening}
                                            className="px-6 py-4 bg-red-500 text-white font-black rounded-2xl shadow-xl animate-pulse flex items-center gap-2"
                                        >
                                            <Mic className="w-6 h-6" />
                                            עצור
                                        </motion.button>
                                    ) : (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => voice.startListening((text) => setUserAnswer(text))}
                                            className="px-6 py-4 bg-purple-500 text-white font-black rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center gap-2"
                                        >
                                            <Mic className="w-6 h-6" />
                                            דבר
                                        </motion.button>
                                    )}
                                </>
                            )}

                            {finalFeedback?.isCorrect && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={nextQuestion}
                                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-black text-xl py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                    שאלה הבאה
                                    <Sparkles className="w-6 h-6" />
                                </motion.button>
                            )}

                            {finalFeedback && !finalFeedback.isCorrect && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={tryAgain}
                                    className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white font-black text-xl py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3"
                                >
                                    <RefreshCw className="w-6 h-6" />
                                    נסה שוב
                                </motion.button>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={endSession}
                                className="px-6 py-4 bg-gray-600 text-white font-black rounded-2xl shadow-xl hover:shadow-2xl transition-all"
                            >
                                סיום
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        );
    }

    // RESULTS VIEW
    if (view === 'results') {
        const accuracy = sessionStats.total > 0
            ? Math.round((sessionStats.correct / sessionStats.total) * 100)
            : 0;

        const avgTime = sessionStats.questionTimes.length > 0
            ? Math.round(
                sessionStats.questionTimes.reduce((a, b) => a + b, 0) /
                sessionStats.questionTimes.length
            )
            : 0;

        return (
            <motion.div
                key="results"
                {...pageTransition}
                className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8"
                dir="rtl"
            >
                <div className="max-w-4xl mx-auto">
                    {/* Celebration Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: 3 }}
                            className="text-8xl mb-6"
                        >
                            🎉
                        </motion.div>
                        <h2 className="text-4xl md:text-6xl font-black text-gray-800 mb-4">
                            כל הכבוד!
                        </h2>
                        <p className="text-xl text-gray-600">
                            סיימת את האימון - הנה התוצאות שלך
                        </p>
                    </motion.div>

                    {/* Stats Cards */}
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <motion.div
                            variants={scaleIn}
                            initial="hidden"
                            animate="visible"
                            className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-3xl p-8 shadow-2xl"
                        >
                            <Trophy className="w-16 h-16 mb-4 mx-auto" />
                            <div className="text-6xl font-black mb-2">{sessionStats.points}</div>
                            <div className="text-xl font-bold">נקודות כוללות</div>
                        </motion.div>

                        <motion.div
                            variants={scaleIn}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: 0.1 }}
                            className="bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-3xl p-8 shadow-2xl"
                        >
                            <Target className="w-16 h-16 mb-4 mx-auto" />
                            <div className="text-6xl font-black mb-2">{accuracy}%</div>
                            <div className="text-xl font-bold">דיוק</div>
                        </motion.div>

                        <motion.div
                            variants={scaleIn}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-blue-400 to-cyan-500 text-white rounded-3xl p-8 shadow-2xl"
                        >
                            <CheckCircle2 className="w-16 h-16 mb-4 mx-auto" />
                            <div className="text-6xl font-black mb-2">
                                {sessionStats.correct}/{sessionStats.total}
                            </div>
                            <div className="text-xl font-bold">תשובות נכונות</div>
                        </motion.div>

                        <motion.div
                            variants={scaleIn}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: 0.3 }}
                            className="bg-gradient-to-br from-purple-400 to-pink-500 text-white rounded-3xl p-8 shadow-2xl"
                        >
                            <Flame className="w-16 h-16 mb-4 mx-auto" />
                            <div className="text-6xl font-black mb-2">{sessionStats.maxStreak}</div>
                            <div className="text-xl font-bold">רצף מקסימלי</div>
                        </motion.div>
                    </div>

                    {/* Additional Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-3xl p-8 shadow-2xl mb-8"
                    >
                        <h3 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
                            <BarChart3 className="w-8 h-8 text-blue-600" />
                            סטטיסטיקה נוספת
                        </h3>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <Clock className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                                <div className="text-3xl font-black text-gray-800 mb-1">
                                    {formatTime(avgTime)}
                                </div>
                                <div className="text-gray-600 font-medium">זמן ממוצע לשאלה</div>
                            </div>

                            <div className="text-center">
                                <TrendingUp className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <div className="text-3xl font-black text-gray-800 mb-1">
                                    {sessionStats.attempts}
                                </div>
                                <div className="text-gray-600 font-medium">ניסיונות כוללים</div>
                            </div>

                            <div className="text-center">
                                <Award className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                                <div className="text-3xl font-black text-gray-800 mb-1">
                                    {accuracy >= 90 ? 'מצוין' : accuracy >= 70 ? 'טוב מאוד' : 'בסדר'}
                                </div>
                                <div className="text-gray-600 font-medium">ביצועים</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Action Buttons */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setView('topic-select');
                                setSessionStats({
                                    correct: 0,
                                    total: 0,
                                    attempts: 0,
                                    streak: 0,
                                    maxStreak: 0,
                                    points: 0,
                                    startTime: null,
                                    questionTimes: []
                                });
                            }}
                            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-black text-xl py-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all flex items-center justify-center gap-3"
                        >
                            <RefreshCw className="w-8 h-8" />
                            תרגול נוסף
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                if (onClose) {
                                    onClose();
                                } else {
                                    setView('home');
                                }
                            }}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-xl py-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all flex items-center justify-center gap-3"
                        >
                            <ArrowLeft className="w-8 h-8" />
                            חזרה לדף הבית
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return null;
};

export default React.memo(MathTutor);