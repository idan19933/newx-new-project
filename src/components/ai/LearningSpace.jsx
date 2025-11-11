// src/components/ai/LearningSpace.jsx - מרחב למידה
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Lightbulb, Target, Play, ChevronLeft, ChevronRight,
    Sparkles, CheckCircle, Brain, Zap, TrendingUp, Award, Star,
    ArrowLeft, Activity
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const LearningSpace = ({ topic, subtopic, onStartPractice, onBack, userId }) => {
    const [currentSection, setCurrentSection] = useState(0);
    const [learningContent, setLearningContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [completedSections, setCompletedSections] = useState(new Set());
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizAnswer, setQuizAnswer] = useState('');
    const [quizFeedback, setQuizFeedback] = useState(null);

    useEffect(() => {
        loadLearningContent();
    }, [topic, subtopic]);

    const loadLearningContent = async () => {
        try {
            setLoading(true);
            const response = await axios.post(`${API_URL}/api/learning/get-content`, {
                topicId: topic?.id,
                subtopicId: subtopic?.id,
                topicName: topic?.name,
                subtopicName: subtopic?.name
                userId: userId
            });

            if (response.data.success) {
                setLearningContent(response.data.content);
            }
        } catch (error) {
            console.error('Error loading learning content:', error);
        } finally {
            setLoading(false);
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
        }
    };

    const handlePreviousSection = () => {
        if (currentSection > 0) {
            setCurrentSection(prev => prev - 1);
            setShowQuiz(false);
            setQuizAnswer('');
            setQuizFeedback(null);
        }
    };

    const handleQuizSubmit = async () => {
        try {
            const section = learningContent.sections[currentSection];
            const response = await axios.post(`${API_URL}/api/learning/check-quiz`, {
                question: section.quiz.question,
                correctAnswer: section.quiz.answer,
                userAnswer: quizAnswer
            });

            setQuizFeedback(response.data);
            if (response.data.isCorrect) {
                handleSectionComplete();
            }
        } catch (error) {
            console.error('Error checking quiz:', error);
        }
    };

    const allSectionsCompleted = completedSections.size === learningContent?.sections.length;
    const progress = learningContent ? (completedSections.size / learningContent.sections.length) * 100 : 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center" dir="rtl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <Brain className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
                    <p className="text-xl font-bold text-gray-900">נקסון מכין עבורך תוכן לימודי...</p>
                </motion.div>
            </div>
        );
    }

    if (!learningContent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center p-4" dir="rtl">
                <div className="text-center">
                    <p className="text-xl text-gray-600 mb-4">לא נמצא תוכן לימודי לנושא זה</p>
                    <button onClick={onBack} className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors">
                        חזרה
                    </button>
                </div>
            </div>
        );
    }

    const section = learningContent.sections[currentSection];

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50" dir="rtl">
            {/* Header */}
            <div className="bg-white border-b-2 border-purple-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto p-6">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>חזרה</span>
                        </button>

                        <div className="flex items-center gap-3">
                            <BookOpen className="w-8 h-8 text-purple-600" />
                            <div>
                                <h1 className="text-2xl font-black text-gray-900">{topic?.name}</h1>
                                {subtopic && <p className="text-gray-600">{subtopic.name}</p>}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-left">
                                <p className="text-sm text-gray-600">התקדמות</p>
                                <p className="text-2xl font-black text-purple-600">{Math.round(progress)}%</p>
                            </div>
                            <div className="w-16 h-16 relative">
                                <svg className="transform -rotate-90 w-16 h-16">
                                    <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="6" fill="none" />
                                    <circle
                                        cx="32"
                                        cy="32"
                                        r="28"
                                        stroke="#9333ea"
                                        strokeWidth="6"
                                        fill="none"
                                        strokeDasharray={`${2 * Math.PI * 28}`}
                                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                                        className="transition-all duration-500"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Section Progress */}
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
            <div className="max-w-5xl mx-auto p-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSection}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="bg-white rounded-3xl shadow-xl p-8 mb-6"
                    >
                        {/* Section Header */}
                        <div className="flex items-start gap-4 mb-6">
                            <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
                                <Lightbulb className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-3xl font-black text-gray-900">{section.title}</h2>
                                    {completedSections.has(currentSection) && (
                                        <CheckCircle className="w-6 h-6 text-green-500" />
                                    )}
                                </div>
                                <p className="text-gray-600 text-lg">{section.subtitle}</p>
                            </div>
                        </div>

                        {/* Story Intro */}
                        {section.story && (
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6 border-2 border-blue-200">
                                <div className="flex items-start gap-3">
                                    <Sparkles className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                                    <p className="text-lg text-gray-800 leading-relaxed">{section.story}</p>
                                </div>
                            </div>
                        )}

                        {/* Main Explanation */}
                        <div className="space-y-4 mb-6">
                            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Target className="w-6 h-6 text-purple-600" />
                                ההסבר
                            </h3>
                            <div className="prose prose-lg max-w-none">
                                {section.explanation.split('\n').map((para, idx) => (
                                    <p key={idx} className="text-gray-700 leading-relaxed mb-3">
                                        {para}
                                    </p>
                                ))}
                            </div>
                        </div>

                        {/* Examples */}
                        {section.examples && section.examples.length > 0 && (
                            <div className="space-y-4 mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <Activity className="w-6 h-6 text-green-600" />
                                    דוגמאות
                                </h3>
                                <div className="space-y-4">
                                    {section.examples.map((example, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200"
                                        >
                                            <h4 className="text-xl font-bold text-gray-900 mb-3">
                                                דוגמה {idx + 1}: {example.title}
                                            </h4>
                                            <div className="space-y-3">
                                                <div className="bg-white rounded-xl p-4">
                                                    <p className="text-sm text-gray-600 mb-1">שאלה:</p>
                                                    <p className="text-lg font-bold text-gray-900">{example.problem}</p>
                                                </div>
                                                <div className="bg-white rounded-xl p-4">
                                                    <p className="text-sm text-gray-600 mb-2">פתרון:</p>
                                                    <div className="space-y-2">
                                                        {example.solution.split('\n').map((step, stepIdx) => (
                                                            <p key={stepIdx} className="text-gray-800">
                                                                {step}
                                                            </p>
                                                        ))}
                                                    </div>
                                                </div>
                                                {example.answer && (
                                                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4">
                                                        <p className="text-sm text-gray-700 mb-1">תשובה סופית:</p>
                                                        <p className="text-xl font-black text-purple-700">{example.answer}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Key Points */}
                        {section.keyPoints && section.keyPoints.length > 0 && (
                            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 mb-6 border-2 border-yellow-200">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Star className="w-6 h-6 text-yellow-600" />
                                    נקודות מפתח לזכור
                                </h3>
                                <ul className="space-y-2">
                                    {section.keyPoints.map((point, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                                            <span className="text-gray-800">{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Quick Quiz */}
                        {section.quiz && !showQuiz && !completedSections.has(currentSection) && (
                            <button
                                onClick={() => setShowQuiz(true)}
                                className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2"
                            >
                                <Brain className="w-6 h-6" />
                                <span>בדוק את ההבנה שלך</span>
                            </button>
                        )}

                        {/* Quiz Question */}
                        {showQuiz && section.quiz && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200"
                            >
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Brain className="w-6 h-6 text-indigo-600" />
                                    שאלת הבנה
                                </h3>
                                <p className="text-lg text-gray-800 mb-4">{section.quiz.question}</p>

                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={quizAnswer}
                                        onChange={(e) => setQuizAnswer(e.target.value)}
                                        placeholder="הקלד את התשובה שלך כאן..."
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
                                        disabled={quizFeedback?.isCorrect}
                                    />

                                    {!quizFeedback && (
                                        <button
                                            onClick={handleQuizSubmit}
                                            disabled={!quizAnswer.trim()}
                                            className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            בדוק תשובה
                                        </button>
                                    )}

                                    {quizFeedback && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={`p-4 rounded-xl ${
                                                quizFeedback.isCorrect
                                                    ? 'bg-green-100 border-2 border-green-300'
                                                    : 'bg-orange-100 border-2 border-orange-300'
                                            }`}
                                        >
                                            <p className={`font-bold mb-2 ${
                                                quizFeedback.isCorrect ? 'text-green-700' : 'text-orange-700'
                                            }`}>
                                                {quizFeedback.isCorrect ? '✅ נכון מצוין!' : '❌ לא מדויק'}
                                            </p>
                                            <p className="text-gray-800">{quizFeedback.feedback}</p>
                                            {!quizFeedback.isCorrect && section.quiz.hint && (
                                                <p className="text-gray-600 mt-2">💡 רמז: {section.quiz.hint}</p>
                                            )}
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between gap-4">
                    <button
                        onClick={handlePreviousSection}
                        disabled={currentSection === 0}
                        className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                        <span>קודם</span>
                    </button>

                    <div className="text-center">
                        <p className="text-sm text-gray-600">סעיף {currentSection + 1} מתוך {learningContent.sections.length}</p>
                    </div>

                    {currentSection < learningContent.sections.length - 1 ? (
                        <button
                            onClick={handleNextSection}
                            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors"
                        >
                            <span>הבא</span>
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={onStartPractice}
                            disabled={!allSectionsCompleted}
                            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <Play className="w-6 h-6" />
                            <span>התחל תרגול!</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LearningSpace;