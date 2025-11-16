// src/components/learning/AILearningArea.jsx - ENHANCED LECTURE COMPONENT
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Lightbulb, Target, ChevronLeft, ChevronRight,
    Sparkles, CheckCircle, Brain, MessageCircle, AlertCircle,
    FileText, Save, X, Send, ThumbsUp, HelpCircle, Repeat,
    Volume2, VolumeX, User
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = "nexons-production-1915.up.railway.app";

// Helper function to fix Hebrew-English-Number mixed text
const fixHebrewText = (text) => {
    if (!text) return '';

    // Replace common patterns that mix Hebrew, numbers, and English
    // This helps with RTL display issues
    return text
        .replace(/(\d+)\s*\+\s*(\d+)/g, '$1 + $2') // Fix spacing around operators
        .replace(/(\d+)\s*-\s*(\d+)/g, '$1 - $2')
        .replace(/(\d+)\s*×\s*(\d+)/g, '$1 × $2')
        .replace(/(\d+)\s*÷\s*(\d+)/g, '$1 ÷ $2')
        .replace(/(\d+)\s*=\s*(\d+)/g, '$1 = $2')
        // Add zero-width space after numbers to help with RTL
        .replace(/(\d+)([א-ת])/g, '$1\u200B$2')
        // Fix common mathematical expressions
        .replace(/x\^(\d+)/g, 'x^{$1}');
};

const AILearningArea = ({ topic, subtopic, gradeLevel, userId, onComplete, mode = 'lecture' }) => {
    const [currentSection, setCurrentSection] = useState(0);
    const [learningContent, setLearningContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [completedSections, setCompletedSections] = useState(new Set());

    // Quiz state
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizAnswer, setQuizAnswer] = useState('');
    const [quizFeedback, setQuizFeedback] = useState(null);
    const [quizAttempts, setQuizAttempts] = useState(0);

    // Communication with Nexon
    const [showChatBox, setShowChatBox] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [chatLoading, setChatLoading] = useState(false);

    // Notebook
    const [showNotebook, setShowNotebook] = useState(false);
    const [notebookNotes, setNotebookNotes] = useState('');
    const [savedNotes, setSavedNotes] = useState([]);

    // Voice settings
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const [voiceGender, setVoiceGender] = useState('female'); // 'female' or 'male'

    const chatEndRef = useRef(null);

    useEffect(() => {
        loadLearningContent();
        loadSavedNotes();
    }, [topic, subtopic]);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatHistory]);

    const loadLearningContent = async () => {
        try {
            setLoading(true);
            const response = await axios.post(`${API_URL}/api/learning/get-content`, {
                topicId: topic?.id,
                subtopicId: subtopic?.id,
                topicName: topic?.name,
                subtopicName: subtopic?.name,
                gradeLevel: gradeLevel,
                userId: userId,
                mode: 'lecture', // Enhanced lecture mode with full examples
                requestFullExamples: true, // Request step-by-step solutions
                numExamples: 3 // Request 3 examples before quiz
            });

            if (response.data.success) {
                // Fix Hebrew text in all content
                const content = response.data.content;
                if (content.sections) {
                    content.sections = content.sections.map(section => ({
                        ...section,
                        title: fixHebrewText(section.title),
                        subtitle: fixHebrewText(section.subtitle),
                        story: fixHebrewText(section.story),
                        explanation: fixHebrewText(section.explanation),
                        keyPoints: section.keyPoints?.map(fixHebrewText),
                        examples: section.examples?.map(ex => ({
                            ...ex,
                            title: fixHebrewText(ex.title),
                            problem: fixHebrewText(ex.problem),
                            solution: fixHebrewText(ex.solution),
                            answer: fixHebrewText(ex.answer),
                            steps: ex.steps?.map(fixHebrewText)
                        })),
                        quiz: section.quiz ? {
                            ...section.quiz,
                            question: fixHebrewText(section.quiz.question),
                            hint: fixHebrewText(section.quiz.hint),
                            answer: fixHebrewText(section.quiz.answer)
                        } : null
                    }));
                }
                setLearningContent(content);
            }
        } catch (error) {
            console.error('Error loading learning content:', error);
            toast.error('שגיאה בטעינת התוכן הלימודי');
        } finally {
            setLoading(false);
        }
    };

    const loadSavedNotes = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/notebook/notes/${userId}/${topic?.id}`);
            if (response.data.success) {
                setSavedNotes(response.data.notes || []);
            }
        } catch (error) {
            console.error('Error loading notes:', error);
        }
    };

    const handleSectionComplete = () => {
        setCompletedSections(prev => new Set([...prev, currentSection]));
    };

    const handleNextSection = () => {
        handleSectionComplete();
        if (currentSection < learningContent.sections.length - 1) {
            setCurrentSection(prev => prev + 1);
            setShowQuiz(false);
            setQuizAnswer('');
            setQuizFeedback(null);
            setQuizAttempts(0);
            setChatHistory([]);
        }
    };

    const handlePreviousSection = () => {
        if (currentSection > 0) {
            setCurrentSection(prev => prev - 1);
            setShowQuiz(false);
            setQuizAnswer('');
            setQuizFeedback(null);
            setQuizAttempts(0);
            setChatHistory([]);
        }
    };

    const handleQuizSubmit = async () => {
        try {
            setQuizAttempts(prev => prev + 1);
            const section = learningContent.sections[currentSection];

            const response = await axios.post(`${API_URL}/api/learning/check-quiz`, {
                question: section.quiz.question,
                correctAnswer: section.quiz.answer,
                userAnswer: quizAnswer,
                topic: topic?.name,
                userId: userId
            });

            const feedback = fixHebrewText(response.data.feedback);
            setQuizFeedback({ ...response.data, feedback });

            if (response.data.isCorrect) {
                handleSectionComplete();
                toast.success('תשובה נכונה! כל הכבוד! 🎉');

                // Save to notebook automatically
                await saveToNotebook(`שאלת בדיקה: ${section.quiz.question}\nתשובתי: ${quizAnswer}\n✅ נכון!`);
            } else if (quizAttempts >= 2) {
                toast('💡 רוצה לנסות שוב או לקבל הסבר נוסף?', {
                    duration: 5000,
                    icon: '🤔'
                });
            }
        } catch (error) {
            console.error('Error checking quiz:', error);
            toast.error('שגיאה בבדיקת התשובה');
        }
    };

    // Send message to Nexon
    const sendMessageToNexon = async (message, isQuickButton = false) => {
        try {
            setChatLoading(true);
            const section = learningContent.sections[currentSection];

            // Add user message to history
            const userMessage = {
                role: 'user',
                content: fixHebrewText(message),
                timestamp: new Date()
            };
            setChatHistory(prev => [...prev, userMessage]);

            const response = await axios.post(`${API_URL}/api/learning/ask-nexon`, {
                message: message,
                context: {
                    topic: topic?.name,
                    subtopic: subtopic?.name,
                    sectionTitle: section.title,
                    sectionContent: section.explanation,
                    currentExample: section.examples?.[0], // Send current example for context
                    gradeLevel: gradeLevel
                },
                userId: userId,
                conversationHistory: chatHistory
            });

            const nexonReply = {
                role: 'assistant',
                content: fixHebrewText(response.data.reply),
                timestamp: new Date()
            };
            setChatHistory(prev => [...prev, nexonReply]);

            // Text-to-speech if enabled
            if (voiceEnabled && response.data.reply) {
                speakText(response.data.reply);
            }

            if (!isQuickButton) {
                setChatMessage('');
            }

        } catch (error) {
            console.error('Error sending message to Nexon:', error);
            toast.error('שגיאה בשליחת ההודעה');
        } finally {
            setChatLoading(false);
        }
    };

    // Save notes to notebook
    const saveToNotebook = async (noteContent = notebookNotes) => {
        if (!noteContent.trim()) {
            toast.error('אנא כתוב משהו לפני השמירה');
            return;
        }

        try {
            const response = await axios.post(`${API_URL}/api/notebook/save-note`, {
                userId: userId,
                topicId: topic?.id,
                topicName: topic?.name,
                subtopicName: subtopic?.name,
                sectionTitle: learningContent.sections[currentSection].title,
                noteContent: noteContent,
                noteType: 'lecture'
            });

            if (response.data.success) {
                toast.success('ההערה נשמרה במחברת! 📝');
                setSavedNotes(prev => [...prev, {
                    content: noteContent,
                    timestamp: new Date(),
                    sectionTitle: learningContent.sections[currentSection].title
                }]);
                setNotebookNotes('');
                setShowNotebook(false);
            }
        } catch (error) {
            console.error('Error saving note:', error);
            toast.error('שגיאה בשמירת ההערה');
        }
    };

    // Text-to-speech
    const speakText = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'he-IL';
            utterance.rate = 0.9;
            utterance.pitch = voiceGender === 'female' ? 1.2 : 0.8;
            window.speechSynthesis.speak(utterance);
        }
    };

    const stopSpeaking = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    };

    const allSectionsCompleted = completedSections.size === learningContent?.sections.length;
    const progress = learningContent ? (completedSections.size / learningContent.sections.length) * 100 : 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center" dir="rtl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                        <Brain className="w-20 h-20 text-purple-600 mx-auto mb-4" />
                    </motion.div>
                    <p className="text-2xl font-bold text-gray-900">נקסון מכין עבורך תוכן לימודי מותאם...</p>
                    <p className="text-gray-600 mt-2">זה ייקח רק כמה שניות</p>
                </motion.div>
            </div>
        );
    }

    if (!learningContent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4" dir="rtl">
                <div className="text-center">
                    <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
                    <p className="text-2xl text-gray-800 font-bold mb-4">לא נמצא תוכן לימודי לנושא זה</p>
                    <p className="text-gray-600">אנא נסה שוב או בחר נושא אחר</p>
                </div>
            </div>
        );
    }

    const section = learningContent.sections[currentSection];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50" dir="rtl">
            {/* Sticky Header */}
            <div className="bg-white border-b-2 border-purple-200 sticky top-0 z-20 shadow-lg">
                <div className="max-w-5xl mx-auto p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <GraduationCap className="w-8 h-8 text-purple-600" />
                            <div>
                                <h1 className="text-xl md:text-2xl font-black text-gray-900">{topic?.name}</h1>
                                {subtopic && <p className="text-gray-600 text-sm">{subtopic.name}</p>}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Voice Toggle */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                    setVoiceEnabled(!voiceEnabled);
                                    if (voiceEnabled) stopSpeaking();
                                }}
                                className={`p-3 rounded-xl transition-colors ${
                                    voiceEnabled
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-100 text-gray-600'
                                }`}
                            >
                                {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                            </motion.button>

                            {/* Voice Gender */}
                            {voiceEnabled && (
                                <select
                                    value={voiceGender}
                                    onChange={(e) => setVoiceGender(e.target.value)}
                                    className="px-3 py-2 rounded-xl bg-gray-100 border-2 border-gray-200 font-bold text-sm"
                                >
                                    <option value="female">קול נשי</option>
                                    <option value="male">קול גברי</option>
                                </select>
                            )}

                            {/* Progress */}
                            <div className="text-left hidden md:block">
                                <p className="text-sm text-gray-600">התקדמות</p>
                                <p className="text-2xl font-black text-purple-600">{Math.round(progress)}%</p>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex gap-2">
                        {learningContent.sections.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-2 flex-1 rounded-full transition-all ${
                                    completedSections.has(idx)
                                        ? 'bg-green-500'
                                        : idx === currentSection
                                            ? 'bg-purple-600'
                                            : 'bg-gray-200'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto p-4 md:p-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSection}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 mb-6"
                    >
                        {/* Section Header */}
                        <div className="flex items-start gap-4 mb-6">
                            <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
                                <Lightbulb className="w-10 h-10 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-3xl md:text-4xl font-black text-gray-900">{section.title}</h2>
                                    {completedSections.has(currentSection) && (
                                        <CheckCircle className="w-8 h-8 text-green-500" />
                                    )}
                                </div>
                                <p className="text-gray-700 text-lg md:text-xl">{section.subtitle}</p>
                            </div>
                        </div>

                        {/* Story/Introduction */}
                        {section.story && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 mb-6 border-2 border-blue-200"
                            >
                                <div className="flex items-start gap-3">
                                    <Sparkles className="w-7 h-7 text-blue-600 flex-shrink-0 mt-1" />
                                    <p className="text-lg md:text-xl text-gray-800 leading-relaxed">{section.story}</p>
                                </div>
                            </motion.div>
                        )}

                        {/* Main Explanation - ENHANCED */}
                        <div className="space-y-6 mb-8">
                            <h3 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-3">
                                <Target className="w-8 h-8 text-purple-600" />
                                ההסבר המלא
                            </h3>
                            <div className="prose prose-lg md:prose-xl max-w-none">
                                {section.explanation.split('\n\n').map((para, idx) => (
                                    <motion.p
                                        key={idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="text-gray-800 leading-relaxed mb-4 text-lg"
                                    >
                                        {para}
                                    </motion.p>
                                ))}
                            </div>
                        </div>

                        {/* Enhanced Examples - STEP BY STEP, NO USER INPUT */}
                        {section.examples && section.examples.length > 0 && (
                            <div className="space-y-6 mb-8">
                                <h3 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-3">
                                    <BookOpen className="w-8 h-8 text-green-600" />
                                    דוגמאות פתורות במלואן
                                </h3>
                                <p className="text-gray-700 text-lg">
                                    💡 כאן תראה איך פותרים שלב אחר שלב - אין צורך לפתור, רק להבין!
                                </p>

                                <div className="space-y-6">
                                    {section.examples.map((example, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.15 }}
                                            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-6 md:p-8 border-2 border-green-300 shadow-lg"
                                        >
                                            <h4 className="text-xl md:text-2xl font-black text-gray-900 mb-4">
                                                דוגמה {idx + 1}: {example.title}
                                            </h4>

                                            {/* Problem */}
                                            <div className="bg-white rounded-2xl p-5 mb-5 border-2 border-green-200">
                                                <p className="text-sm text-green-700 font-bold mb-2">📝 השאלה:</p>
                                                <p className="text-xl md:text-2xl font-bold text-gray-900 leading-relaxed">
                                                    {example.problem}
                                                </p>
                                            </div>

                                            {/* Step-by-step Solution */}
                                            <div className="bg-white rounded-2xl p-5 mb-5 border-2 border-blue-200">
                                                <p className="text-sm text-blue-700 font-bold mb-4">🔍 הפתרון שלב אחר שלב:</p>
                                                <div className="space-y-4">
                                                    {(example.steps || example.solution.split('\n')).map((step, stepIdx) => (
                                                        <motion.div
                                                            key={stepIdx}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.3 + stepIdx * 0.1 }}
                                                            className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl"
                                                        >
                                                            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-black">
                                                                {stepIdx + 1}
                                                            </div>
                                                            <p className="text-gray-800 text-lg leading-relaxed flex-1">
                                                                {typeof step === 'string' ? step : step}
                                                            </p>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Final Answer */}
                                            {example.answer && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: 0.5 }}
                                                    className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-5 border-2 border-purple-300"
                                                >
                                                    <p className="text-sm text-purple-700 font-bold mb-2">✅ התשובה הסופית:</p>
                                                    <p className="text-2xl md:text-3xl font-black text-purple-900">
                                                        {example.answer}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Key Points */}
                        {section.keyPoints && section.keyPoints.length > 0 && (
                            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 mb-6 border-2 border-yellow-300">
                                <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-4 flex items-center gap-2">
                                    <Star className="w-7 h-7 text-yellow-600" />
                                    נקודות מפתח לזכור
                                </h3>
                                <ul className="space-y-3">
                                    {section.keyPoints.map((point, idx) => (
                                        <motion.li
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="flex items-start gap-3"
                                        >
                                            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                                            <span className="text-gray-800 text-lg leading-relaxed">{point}</span>
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Communication with Nexon */}
                        <div className="mt-8 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl md:text-2xl font-black text-gray-900">
                                    יש לך שאלה? דבר עם נקסון! 💬
                                </h3>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowChatBox(!showChatBox)}
                                    className={`px-6 py-3 rounded-xl font-bold transition-all ${
                                        showChatBox
                                            ? 'bg-red-500 text-white'
                                            : 'bg-purple-600 text-white hover:bg-purple-700'
                                    }`}
                                >
                                    {showChatBox ? 'סגור צ׳אט' : 'פתח צ׳אט עם נקסון'}
                                </motion.button>
                            </div>

                            {/* Quick Action Buttons */}
                            <div className="flex flex-wrap gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => sendMessageToNexon('לא הבנתי את החלק הזה, תוכל להסביר שוב?', true)}
                                    className="px-5 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors flex items-center gap-2"
                                >
                                    <HelpCircle className="w-5 h-5" />
                                    <span>לא הבנתי</span>
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => sendMessageToNexon('תוכל לתת לי עוד דוגמה?', true)}
                                    className="px-5 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors flex items-center gap-2"
                                >
                                    <Repeat className="w-5 h-5" />
                                    <span>עוד דוגמה</span>
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => sendMessageToNexon('תוכל לפרק את זה לשלבים קטנים יותר?', true)}
                                    className="px-5 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors flex items-center gap-2"
                                >
                                    <Target className="w-5 h-5" />
                                    <span>שלבים קטנים יותר</span>
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => sendMessageToNexon('מעולה! הבנתי!', true)}
                                    className="px-5 py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 transition-colors flex items-center gap-2"
                                >
                                    <ThumbsUp className="w-5 h-5" />
                                    <span>הבנתי!</span>
                                </motion.button>
                            </div>

                            {/* Chat Box */}
                            <AnimatePresence>
                                {showChatBox && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-300"
                                    >
                                        {/* Chat History */}
                                        <div className="bg-white rounded-xl p-4 mb-4 max-h-96 overflow-y-auto">
                                            {chatHistory.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <Brain className="w-16 h-16 text-purple-400 mx-auto mb-3" />
                                                    <p className="text-gray-600">שאל את נקסון כל שאלה!</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {chatHistory.map((msg, idx) => (
                                                        <motion.div
                                                            key={idx}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className={`flex items-start gap-3 ${
                                                                msg.role === 'user' ? 'flex-row-reverse' : ''
                                                            }`}
                                                        >
                                                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                                                msg.role === 'user'
                                                                    ? 'bg-blue-500'
                                                                    : 'bg-purple-600'
                                                            }`}>
                                                                {msg.role === 'user' ? (
                                                                    <User className="w-6 h-6 text-white" />
                                                                ) : (
                                                                    <Brain className="w-6 h-6 text-white" />
                                                                )}
                                                            </div>
                                                            <div className={`flex-1 p-4 rounded-2xl ${
                                                                msg.role === 'user'
                                                                    ? 'bg-blue-100 text-gray-900'
                                                                    : 'bg-purple-100 text-gray-900'
                                                            }`}>
                                                                <p className="text-base leading-relaxed whitespace-pre-wrap">
                                                                    {msg.content}
                                                                </p>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                    <div ref={chatEndRef} />
                                                </div>
                                            )}

                                            {chatLoading && (
                                                <div className="flex items-center gap-2 text-purple-600">
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                    >
                                                        <Brain className="w-6 h-6" />
                                                    </motion.div>
                                                    <span>נקסון חושב...</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Chat Input */}
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                value={chatMessage}
                                                onChange={(e) => setChatMessage(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && chatMessage.trim() && !chatLoading) {
                                                        sendMessageToNexon(chatMessage);
                                                    }
                                                }}
                                                placeholder="כתוב את השאלה שלך לנקסון..."
                                                className="flex-1 px-5 py-4 border-2 border-purple-300 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
                                                disabled={chatLoading}
                                            />
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    if (chatMessage.trim() && !chatLoading) {
                                                        sendMessageToNexon(chatMessage);
                                                    }
                                                }}
                                                disabled={!chatMessage.trim() || chatLoading}
                                                className="px-6 py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <Send className="w-6 h-6" />
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Notebook Feature */}
                        <div className="mt-6">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowNotebook(!showNotebook)}
                                className="w-full px-6 py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 rounded-xl font-bold hover:shadow-xl transition-all flex items-center justify-center gap-3"
                            >
                                <FileText className="w-6 h-6" />
                                <span>{showNotebook ? 'סגור מחברת' : 'פתח מחברת לרישום הערות'}</span>
                            </motion.button>

                            <AnimatePresence>
                                {showNotebook && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-300"
                                    >
                                        <h4 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                                            <FileText className="w-6 h-6" />
                                            המחברת שלי - רשום הערות
                                        </h4>

                                        <textarea
                                            value={notebookNotes}
                                            onChange={(e) => setNotebookNotes(e.target.value)}
                                            placeholder="רשום כאן הערות, שאלות, או דברים שחשוב לך לזכור..."
                                            className="w-full min-h-[200px] p-4 border-2 border-yellow-300 rounded-xl focus:border-orange-400 focus:outline-none text-lg resize-y"
                                        />

                                        <div className="flex gap-3 mt-4">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => saveToNotebook()}
                                                disabled={!notebookNotes.trim()}
                                                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Save className="w-5 h-5" />
                                                <span>שמור למחברת</span>
                                            </motion.button>

                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    setNotebookNotes('');
                                                    setShowNotebook(false);
                                                }}
                                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </motion.button>
                                        </div>

                                        {/* Previous Notes */}
                                        {savedNotes.length > 0 && (
                                            <div className="mt-6">
                                                <h5 className="font-bold text-gray-800 mb-3">הערות שנשמרו בסעיף זה:</h5>
                                                <div className="space-y-2">
                                                    {savedNotes
                                                        .filter(note => note.sectionTitle === section.title)
                                                        .map((note, idx) => (
                                                            <div key={idx} className="bg-white rounded-xl p-3 border-2 border-yellow-200">
                                                                <p className="text-sm text-gray-700">{note.content}</p>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Quiz Section - AFTER EXAMPLES */}
                        {section.quiz && !showQuiz && section.examples && section.examples.length >= 2 && !completedSections.has(currentSection) && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowQuiz(true)}
                                className="w-full mt-8 py-5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl font-black text-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3"
                            >
                                <Brain className="w-8 h-8" />
                                <span>עכשיו בוא נבדוק שהבנת! 🎯</span>
                            </motion.button>
                        )}

                        {/* Quiz Question */}
                        {showQuiz && section.quiz && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 border-2 border-indigo-300 shadow-xl"
                            >
                                <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-4 flex items-center gap-3">
                                    <Brain className="w-10 h-10 text-indigo-600" />
                                    שאלת בדיקה - בוא נראה אם הבנת!
                                </h3>

                                <div className="bg-white rounded-2xl p-6 mb-6 border-2 border-indigo-200">
                                    <p className="text-xl md:text-2xl text-gray-900 font-bold leading-relaxed">
                                        {section.quiz.question}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={quizAnswer}
                                        onChange={(e) => setQuizAnswer(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && quizAnswer.trim() && !quizFeedback?.isCorrect) {
                                                handleQuizSubmit();
                                            }
                                        }}
                                        placeholder="הקלד את התשובה שלך כאן..."
                                        className="w-full px-6 py-4 border-2 border-indigo-300 rounded-xl focus:border-purple-500 focus:outline-none text-xl"
                                        disabled={quizFeedback?.isCorrect}
                                    />

                                    {!quizFeedback && (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleQuizSubmit}
                                            disabled={!quizAnswer.trim()}
                                            className="w-full py-4 bg-purple-600 text-white rounded-xl font-black text-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            בדוק תשובה
                                        </motion.button>
                                    )}

                                    {quizFeedback && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={`p-6 rounded-2xl border-2 ${
                                                quizFeedback.isCorrect
                                                    ? 'bg-green-50 border-green-300'
                                                    : 'bg-orange-50 border-orange-300'
                                            }`}
                                        >
                                            <p className={`font-black text-xl mb-3 ${
                                                quizFeedback.isCorrect ? 'text-green-700' : 'text-orange-700'
                                            }`}>
                                                {quizFeedback.isCorrect ? '✅ נכון מצוין! כל הכבוד!' : '❌ לא ממש...'}
                                            </p>
                                            <p className="text-gray-800 text-lg leading-relaxed">{quizFeedback.feedback}</p>

                                            {!quizFeedback.isCorrect && section.quiz.hint && quizAttempts >= 2 && (
                                                <div className="mt-4 p-4 bg-yellow-100 rounded-xl border-2 border-yellow-300">
                                                    <p className="text-yellow-900 font-bold mb-1">💡 רמז:</p>
                                                    <p className="text-gray-800">{section.quiz.hint}</p>
                                                </div>
                                            )}

                                            {!quizFeedback.isCorrect && (
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => {
                                                        setQuizFeedback(null);
                                                        setQuizAnswer('');
                                                    }}
                                                    className="mt-4 w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"
                                                >
                                                    נסה שוב 🔄
                                                </motion.button>
                                            )}
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between gap-4 pb-8">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePreviousSection}
                        disabled={currentSection === 0}
                        className="flex items-center gap-2 px-8 py-4 bg-white border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                    >
                        <ChevronRight className="w-6 h-6" />
                        <span>קודם</span>
                    </motion.button>

                    <div className="text-center">
                        <p className="text-sm text-gray-600">סעיף {currentSection + 1} מתוך {learningContent.sections.length}</p>
                    </div>

                    {currentSection < learningContent.sections.length - 1 ? (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleNextSection}
                            className="flex items-center gap-2 px-8 py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg"
                        >
                            <span>הבא</span>
                            <ChevronLeft className="w-6 h-6" />
                        </motion.button>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onComplete}
                            disabled={!allSectionsCompleted}
                            className="flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-black text-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <CheckCircle className="w-7 h-7" />
                            <span>סיימתי! 🎉</span>
                        </motion.button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AILearningArea;