// src/pages/PracticeRoom.jsx - PRACTICE WITH ISRAELI CURRICULUM
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, Sparkles, Trophy, Target, ChevronRight,
    CheckCircle, XCircle, Lightbulb, RotateCcw,
    BookOpen, TrendingUp, Flame, Star
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import axios from 'axios';
import ISRAELI_CURRICULUM from '../config/israeliCurriculum';
import MathRenderer from '../components/ai/MathRenderer';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const PracticeRoom = () => {
    const { user } = useAuthStore();
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [selectedSubtopic, setSelectedSubtopic] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sessionStats, setSessionStats] = useState({
        correct: 0,
        total: 0,
        streak: 0
    });
    const [showTopicSelect, setShowTopicSelect] = useState(true);

    // Get user's grade
    const userGrade = user?.grade || '9';
    const gradeKey = `grade_${userGrade}`;

    // Get topics for user's grade
    const availableTopics = ISRAELI_CURRICULUM[gradeKey]?.topics || [];

    const generateQuestion = async () => {
        if (!selectedTopic) {
            alert('אנא בחר נושא תחילה');
            return;
        }

        setLoading(true);
        setShowFeedback(false);
        setUserAnswer('');

        try {
            const response = await axios.post(`${API_URL}/api/ai/generate-question`, {
                topic: {
                    id: selectedTopic.id,
                    name: selectedTopic.name
                },
                subtopic: selectedSubtopic ? {
                    id: selectedSubtopic.id,
                    name: selectedSubtopic.name
                } : null,
                difficulty: 'medium',
                grade: userGrade,
                userId: user?.uid,
                gradeLevel: userGrade
            });

            if (response.data.success) {
                setCurrentQuestion(response.data);
                setShowTopicSelect(false);
            }
        } catch (error) {
            console.error('❌ Error generating question:', error);
            alert('שגיאה ביצירת שאלה. נסה שוב.');
        } finally {
            setLoading(false);
        }
    };

    const checkAnswer = async () => {
        if (!userAnswer.trim()) {
            alert('אנא הזן תשובה');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(`${API_URL}/api/ai/verify-answer`, {
                question: currentQuestion.question,
                userAnswer: userAnswer.trim(),
                correctAnswer: currentQuestion.correctAnswer,
                topic: selectedTopic?.name,
                subtopic: selectedSubtopic?.name,
                userId: user?.uid,
                questionId: currentQuestion.questionId,
                difficulty: 'medium'
            });

            if (response.data.success) {
                setFeedback(response.data);
                setShowFeedback(true);

                // Update stats
                setSessionStats(prev => ({
                    correct: prev.correct + (response.data.isCorrect ? 1 : 0),
                    total: prev.total + 1,
                    streak: response.data.isCorrect ? prev.streak + 1 : 0
                }));
            }
        } catch (error) {
            console.error('❌ Error checking answer:', error);
            alert('שגיאה בבדיקת התשובה. נסה שוב.');
        } finally {
            setLoading(false);
        }
    };

    const nextQuestion = () => {
        generateQuestion();
    };

    const changeTopic = () => {
        setShowTopicSelect(true);
        setCurrentQuestion(null);
        setSelectedTopic(null);
        setSelectedSubtopic(null);
        setUserAnswer('');
        setShowFeedback(false);
    };

    if (showTopicSelect) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 py-12 px-4" dir="rtl">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <h1 className="text-6xl font-black text-white mb-4">💪 חדר תרגול</h1>
                        <p className="text-2xl text-gray-300">בחר נושא לתרגול</p>
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
                                        ? 'border-purple-500 shadow-xl shadow-purple-500/20'
                                        : 'border-gray-700 hover:border-gray-600'
                                }`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="text-4xl">{topic.icon || '📚'}</div>
                                    <h3 className="text-xl font-black text-white">{topic.name}</h3>
                                </div>
                                <p className="text-gray-400 text-sm">{topic.description || 'תרגול בנושא זה'}</p>
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
                                                ? 'border-pink-500'
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
                                    onClick={generateQuestion}
                                    disabled={loading}
                                    className="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-black text-xl flex items-center gap-3 hover:shadow-xl disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full"></div>
                                            <span>מייצר שאלה...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-6 h-6" />
                                            <span>התחל תרגול</span>
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 py-12 px-4" dir="rtl">
            <div className="max-w-5xl mx-auto">
                {/* Header with Stats */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-white mb-2">💪 תרגול</h1>
                        <p className="text-purple-400 font-bold">
                            {selectedTopic?.name} {selectedSubtopic && `• ${selectedSubtopic.name}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-gray-800 rounded-xl px-6 py-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Target className="w-5 h-5 text-green-400" />
                                <span className="text-2xl font-black text-white">
                                    {sessionStats.correct}/{sessionStats.total}
                                </span>
                            </div>
                            <p className="text-gray-400 text-xs text-center">נכונות</p>
                        </div>
                        <div className="bg-gray-800 rounded-xl px-6 py-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Flame className="w-5 h-5 text-orange-400" />
                                <span className="text-2xl font-black text-white">{sessionStats.streak}</span>
                            </div>
                            <p className="text-gray-400 text-xs text-center">רצף</p>
                        </div>
                    </div>
                </div>

                {/* Question Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gray-800 rounded-3xl p-8 border-2 border-purple-500/30 mb-6"
                >
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-black text-white mb-4">השאלה</h2>
                            <div className="text-xl text-gray-200 leading-relaxed">
                                <MathRenderer content={currentQuestion?.question || ''} />
                            </div>
                        </div>
                    </div>

                    {/* Answer Input */}
                    {!showFeedback && (
                        <div className="space-y-4">
                            <label className="block text-white font-bold mb-2">התשובה שלך:</label>
                            <input
                                type="text"
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
                                placeholder="הזן את התשובה כאן..."
                                className="w-full px-6 py-4 bg-gray-700 text-white rounded-xl text-lg border-2 border-gray-600 focus:border-purple-500 focus:outline-none"
                                disabled={loading}
                            />
                            <button
                                onClick={checkAnswer}
                                disabled={loading || !userAnswer.trim()}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-black text-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin w-5 h-5 border-3 border-white border-t-transparent rounded-full"></div>
                                        <span>בודק...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        <span>בדוק תשובה</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Feedback */}
                    <AnimatePresence>
                        {showFeedback && feedback && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className={`rounded-2xl p-6 border-2 ${
                                    feedback.isCorrect
                                        ? 'bg-green-500/10 border-green-500'
                                        : 'bg-red-500/10 border-red-500'
                                }`}
                            >
                                <div className="flex items-start gap-4 mb-4">
                                    {feedback.isCorrect ? (
                                        <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0" />
                                    ) : (
                                        <XCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
                                    )}
                                    <div className="flex-1">
                                        <h3 className={`text-2xl font-black mb-2 ${
                                            feedback.isCorrect ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                            {feedback.isCorrect ? '🎉 נכון מאוד!' : '❌ לא בדיוק'}
                                        </h3>
                                        <p className="text-white text-lg leading-relaxed">
                                            <MathRenderer content={feedback.feedback} />
                                        </p>
                                    </div>
                                </div>

                                {feedback.explanation && (
                                    <div className="mt-4 p-4 bg-gray-700/50 rounded-xl">
                                        <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                                            <Lightbulb className="w-5 h-5 text-yellow-400" />
                                            הסבר:
                                        </h4>
                                        <div className="text-gray-300">
                                            <MathRenderer content={feedback.explanation} />
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={nextQuestion}
                                        disabled={loading}
                                        className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Sparkles className="w-5 h-5" />
                                        <span>שאלה הבאה</span>
                                    </button>
                                    <button
                                        onClick={changeTopic}
                                        className="px-6 py-3 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 flex items-center gap-2"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                        <span>שנה נושא</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Hints Button */}
                {currentQuestion?.hints && !showFeedback && (
                    <div className="text-center">
                        <button
                            className="px-6 py-3 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 inline-flex items-center gap-2"
                        >
                            <Lightbulb className="w-5 h-5 text-yellow-400" />
                            <span>רמזים ({currentQuestion.hints.length})</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PracticeRoom;