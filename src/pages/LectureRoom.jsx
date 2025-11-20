// src/pages/LectureRoom.jsx - LECTURE ROOM WITH AI CONTENT
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, ChevronLeft, ChevronRight, CheckCircle,
    Lightbulb, MessageSquare, Sparkles, Trophy,
    ArrowRight, Brain, Target, Star
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import axios from 'axios';
import ISRAELI_CURRICULUM from '../config/israeliCurriculum';
import MathRenderer from '../components/ai/MathRenderer';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const LectureRoom = () => {
    const { user } = useAuthStore();
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [selectedSubtopic, setSelectedSubtopic] = useState(null);
    const [learningContent, setLearningContent] = useState(null);
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [showTopicSelect, setShowTopicSelect] = useState(true);
    const [quizAnswer, setQuizAnswer] = useState('');
    const [quizFeedback, setQuizFeedback] = useState(null);
    const [completedSections, setCompletedSections] = useState([]);

    // Get user's grade
    const userGrade = user?.grade || '9';
    const gradeKey = `grade_${userGrade}`;
    const availableTopics = ISRAELI_CURRICULUM[gradeKey]?.topics || [];

    const loadLearningContent = async () => {
        if (!selectedTopic) {
            alert('אנא בחר נושא תחילה');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/api/learning/get-content`, {
                topicId: selectedTopic.id,
                topicName: selectedTopic.name,
                subtopicId: selectedSubtopic?.id,
                subtopicName: selectedSubtopic?.name,
                gradeLevel: userGrade,
                userId: user?.uid,
                mode: 'lecture',
                numExamples: 3
            });

            if (response.data.success) {
                setLearningContent(response.data.content);
                setCurrentSectionIndex(0);
                setShowTopicSelect(false);
                setCompletedSections([]);
            }
        } catch (error) {
            console.error('❌ Error loading content:', error);
            alert('שגיאה בטעינת התוכן. נסה שוב.');
        } finally {
            setLoading(false);
        }
    };

    const checkQuizAnswer = async () => {
        if (!quizAnswer.trim()) {
            alert('אנא הזן תשובה');
            return;
        }

        try {
            const currentSection = learningContent.sections[currentSectionIndex];
            const response = await axios.post(`${API_URL}/api/learning/check-quiz`, {
                question: currentSection.quiz.question,
                correctAnswer: currentSection.quiz.answer,
                userAnswer: quizAnswer.trim(),
                topic: selectedTopic.name,
                userId: user?.uid
            });

            if (response.data.success) {
                setQuizFeedback(response.data);
                if (response.data.isCorrect && !completedSections.includes(currentSectionIndex)) {
                    setCompletedSections([...completedSections, currentSectionIndex]);
                }
            }
        } catch (error) {
            console.error('❌ Error checking quiz:', error);
            alert('שגיאה בבדיקת התשובה');
        }
    };

    const nextSection = () => {
        if (currentSectionIndex < learningContent.sections.length - 1) {
            setCurrentSectionIndex(currentSectionIndex + 1);
            setQuizAnswer('');
            setQuizFeedback(null);
        }
    };

    const prevSection = () => {
        if (currentSectionIndex > 0) {
            setCurrentSectionIndex(currentSectionIndex - 1);
            setQuizAnswer('');
            setQuizFeedback(null);
        }
    };

    const currentSection = learningContent?.sections?.[currentSectionIndex];
    const progress = learningContent ? ((completedSections.length / learningContent.sections.length) * 100) : 0;

    if (showTopicSelect) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 py-12 px-4" dir="rtl">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <h1 className="text-6xl font-black text-white mb-4">📚 חדר הרצאה</h1>
                        <p className="text-2xl text-gray-300">בחר נושא ללמידה</p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableTopics.map((topic, index) => (
                            <motion.div
                                key={topic.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ scale: 1.05 }}
                                onClick={() => {
                                    setSelectedTopic(topic);
                                    setSelectedSubtopic(null);
                                }}
                                className={`bg-gray-800 rounded-2xl p-6 cursor-pointer border-2 transition-all ${
                                    selectedTopic?.id === topic.id
                                        ? 'border-blue-500 shadow-xl shadow-blue-500/20'
                                        : 'border-gray-700 hover:border-gray-600'
                                }`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="text-4xl">{topic.icon || '📚'}</div>
                                    <h3 className="text-xl font-black text-white">{topic.name}</h3>
                                </div>
                                <p className="text-gray-400 text-sm">{topic.description || 'למד נושא זה'}</p>
                            </motion.div>
                        ))}
                    </div>

                    {selectedTopic && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-8"
                        >
                            <h2 className="text-3xl font-black text-white mb-6 text-center">
                                בחר תת-נושא (אופציונלי)
                            </h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                {selectedTopic.subtopics?.map((subtopic, index) => (
                                    <motion.div
                                        key={subtopic.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ scale: 1.03 }}
                                        onClick={() => setSelectedSubtopic(subtopic)}
                                        className={`bg-gray-700 rounded-xl p-4 cursor-pointer border-2 transition-all ${
                                            selectedSubtopic?.id === subtopic.id
                                                ? 'border-cyan-500'
                                                : 'border-transparent hover:border-gray-600'
                                        }`}
                                    >
                                        <p className="text-white font-bold text-sm">{subtopic.name}</p>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="flex justify-center">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={loadLearningContent}
                                    disabled={loading}
                                    className="px-12 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-black text-xl flex items-center gap-3 hover:shadow-xl disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full"></div>
                                            <span>טוען תוכן...</span>
                                        </>
                                    ) : (
                                        <>
                                            <BookOpen className="w-6 h-6" />
                                            <span>התחל ללמוד</span>
                                            <ChevronRight className="w-6 h-6" />
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        );
    }

    if (!currentSection) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 py-12 px-4" dir="rtl">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-4xl font-black text-white mb-2">📚 {selectedTopic?.name}</h1>
                            <p className="text-blue-400 font-bold">
                                {selectedSubtopic?.name || 'למידה כללית'}
                            </p>
                        </div>
                        <div className="bg-gray-800 rounded-xl px-6 py-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Trophy className="w-5 h-5 text-yellow-400" />
                                <span className="text-2xl font-black text-white">{Math.round(progress)}%</span>
                            </div>
                            <p className="text-gray-400 text-xs text-center">הושלם</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                        />
                    </div>
                </div>

                {/* Section Navigation */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={prevSection}
                        disabled={currentSectionIndex === 0}
                        className="px-4 py-2 bg-gray-700 text-white rounded-lg font-bold hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <ChevronRight className="w-5 h-5" />
                        <span>קודם</span>
                    </button>

                    <div className="flex items-center gap-2">
                        {learningContent.sections.map((_, index) => (
                            <div
                                key={index}
                                className={`w-3 h-3 rounded-full ${
                                    index === currentSectionIndex
                                        ? 'bg-blue-500 w-8'
                                        : completedSections.includes(index)
                                            ? 'bg-green-500'
                                            : 'bg-gray-600'
                                }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={nextSection}
                        disabled={currentSectionIndex === learningContent.sections.length - 1}
                        className="px-4 py-2 bg-gray-700 text-white rounded-lg font-bold hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <span>הבא</span>
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <motion.div
                    key={currentSectionIndex}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="bg-gray-800 rounded-3xl p-8 border-2 border-blue-500/30 mb-6"
                >
                    {/* Section Title */}
                    <div className="mb-8">
                        <h2 className="text-4xl font-black text-white mb-3">{currentSection.title}</h2>
                        <p className="text-xl text-blue-400 font-bold">{currentSection.subtitle}</p>
                    </div>

                    {/* Story */}
                    {currentSection.story && (
                        <div className="mb-8 p-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl border-2 border-blue-500/30">
                            <div className="flex items-start gap-4">
                                <Sparkles className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                                <p className="text-lg text-gray-200 leading-relaxed">
                                    <MathRenderer content={currentSection.story} />
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Explanation */}
                    <div className="mb-8">
                        <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
                            <Brain className="w-6 h-6 text-cyan-400" />
                            הסבר
                        </h3>
                        <div className="text-lg text-gray-200 leading-relaxed space-y-4">
                            <MathRenderer content={currentSection.explanation} />
                        </div>
                    </div>

                    {/* Key Points */}
                    {currentSection.keyPoints && currentSection.keyPoints.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
                                <Target className="w-6 h-6 text-yellow-400" />
                                נקודות מפתח
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                {currentSection.keyPoints.map((point, index) => (
                                    <div key={index} className="flex items-start gap-3 p-4 bg-gray-700/50 rounded-xl">
                                        <Star className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                                        <p className="text-gray-200">
                                            <MathRenderer content={point} />
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Examples */}
                    {currentSection.examples && currentSection.examples.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
                                <Lightbulb className="w-6 h-6 text-orange-400" />
                                דוגמאות
                            </h3>
                            <div className="space-y-6">
                                {currentSection.examples.map((example, index) => (
                                    <div key={index} className="bg-gray-700/30 rounded-2xl p-6 border-2 border-gray-700">
                                        <h4 className="text-xl font-bold text-white mb-4">{example.title}</h4>

                                        <div className="mb-4">
                                            <p className="text-gray-400 text-sm mb-2">בעיה:</p>
                                            <p className="text-lg text-gray-200">
                                                <MathRenderer content={example.problem} />
                                            </p>
                                        </div>

                                        {example.steps && example.steps.length > 0 && (
                                            <div className="mb-4">
                                                <p className="text-gray-400 text-sm mb-3">שלבי הפתרון:</p>
                                                <div className="space-y-3">
                                                    {example.steps.map((step, stepIndex) => (
                                                        <div key={stepIndex} className="flex items-start gap-3">
                                                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                                <span className="text-white font-bold text-sm">{stepIndex + 1}</span>
                                                            </div>
                                                            <p className="text-gray-200 pt-1">
                                                                <MathRenderer content={step} />
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="p-4 bg-green-500/10 rounded-xl border-2 border-green-500/30">
                                            <p className="text-gray-400 text-sm mb-1">תשובה:</p>
                                            <p className="text-xl font-bold text-green-400">
                                                <MathRenderer content={example.answer} />
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quiz */}
                    {currentSection.quiz && (
                        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border-2 border-purple-500/30">
                            <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
                                <CheckCircle className="w-6 h-6 text-purple-400" />
                                בדיקת הבנה
                            </h3>
                            <p className="text-lg text-gray-200 mb-4">
                                <MathRenderer content={currentSection.quiz.question} />
                            </p>

                            {!quizFeedback ? (
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={quizAnswer}
                                        onChange={(e) => setQuizAnswer(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && checkQuizAnswer()}
                                        placeholder="הזן את תשובתך..."
                                        className="w-full px-6 py-4 bg-gray-700 text-white rounded-xl text-lg border-2 border-gray-600 focus:border-purple-500 focus:outline-none"
                                    />
                                    <button
                                        onClick={checkQuizAnswer}
                                        disabled={!quizAnswer.trim()}
                                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        בדוק תשובה
                                    </button>
                                    {currentSection.quiz.hint && (
                                        <p className="text-yellow-400 text-sm flex items-center gap-2">
                                            <Lightbulb className="w-4 h-4" />
                                            <span>רמז: {currentSection.quiz.hint}</span>
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`p-6 rounded-xl ${
                                        quizFeedback.isCorrect
                                            ? 'bg-green-500/20 border-2 border-green-500'
                                            : 'bg-red-500/20 border-2 border-red-500'
                                    }`}
                                >
                                    <p className={`text-xl font-bold mb-2 ${
                                        quizFeedback.isCorrect ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                        {quizFeedback.feedback}
                                    </p>
                                    {!quizFeedback.isCorrect && (
                                        <button
                                            onClick={() => {
                                                setQuizAnswer('');
                                                setQuizFeedback(null);
                                            }}
                                            className="mt-4 px-6 py-2 bg-gray-700 text-white rounded-lg font-bold hover:bg-gray-600"
                                        >
                                            נסה שוב
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                    <button
                        onClick={() => {
                            setShowTopicSelect(true);
                            setLearningContent(null);
                        }}
                        className="px-6 py-3 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600"
                    >
                        חזור לבחירת נושא
                    </button>

                    {currentSectionIndex === learningContent.sections.length - 1 && (
                        <button
                            onClick={() => alert('כל הכבוד! סיימת את הנושא! 🎉')}
                            className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:shadow-xl flex items-center gap-2"
                        >
                            <Trophy className="w-5 h-5" />
                            <span>סיים נושא</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LectureRoom;