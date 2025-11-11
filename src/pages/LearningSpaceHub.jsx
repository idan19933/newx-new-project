// src/pages/LearningSpaceHub.jsx - MAIN LEARNING SPACE HUB (מרחב למידה מרכזי)
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen, Brain, Play, Target, TrendingUp, Award,
    Clock, Zap, Flame, CheckCircle2, MessageSquare,
    ArrowLeft, Sparkles, Star, Activity, Home,
    GraduationCap, FileText, Users, Trophy, Gauge
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { profileService } from '../services/profileService';
import { getUserGradeId, getGradeConfig } from '../config/israeliCurriculum';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const LearningSpaceHub = () => {
    const navigate = useNavigate();
    const { user, studentProfile, nexonProfile } = useAuthStore();
    const profile = studentProfile || nexonProfile;

    const [stats, setStats] = useState({
        questionsAnswered: 0,
        correctAnswers: 0,
        streak: 0,
        practiceTime: 0,
        completedMissions: 0,
        openMissions: 0,
        difficulty: 'medium',
        realtimeAccuracy: 0
    });

    const [missions, setMissions] = useState({
        practice: [],
        lecture: [],
        review: []
    });

    const [loading, setLoading] = useState(true);
    const [adaptiveRecommendation, setAdaptiveRecommendation] = useState(null);

    // Get grade and topics
    const currentGrade = profile?.grade || user?.grade || 'grade10';
    const currentTrack = profile?.track || user?.track || '3-units';
    const numericGrade = parseInt(currentGrade.replace('grade', ''));
    const gradeId = getUserGradeId(currentGrade, currentTrack);
    const gradeConfig = getGradeConfig(gradeId);
    const availableTopics = gradeConfig?.topics || [];

    useEffect(() => {
        if (user?.uid) {
            loadLearningSpaceData();
            fetchAdaptiveDifficulty();
        }
    }, [user?.uid]);

    const loadLearningSpaceData = async () => {
        try {
            setLoading(true);

            // Load user stats
            const userStats = await profileService.getUserStats(user.uid);

            // Load missions from backend
            const missionsResponse = await fetch(`${API_URL}/api/missions/user/${user.uid}`);
            const missionsData = await missionsResponse.json();

            if (userStats && typeof userStats === 'object') {
                setStats({
                    questionsAnswered: Number(userStats.questionsAnswered) || 0,
                    correctAnswers: Number(userStats.correctAnswers) || 0,
                    streak: Number(userStats.streak) || 0,
                    practiceTime: Number(userStats.practiceTime) || 0,
                    completedMissions: Number(userStats.completedMissions) || 0,
                    openMissions: Number(userStats.openMissions) || 0,
                    difficulty: userStats.suggestedDifficulty || 'medium',
                    realtimeAccuracy: Number(userStats.realtimeAccuracy) || 0
                });
            }

            if (missionsData.success && missionsData.missions) {
                setMissions(missionsData.missions);
            }

        } catch (error) {
            console.error('❌ Error loading learning space:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAdaptiveDifficulty = async () => {
        if (!user?.uid) return;

        try {
            const response = await fetch(`${API_URL}/api/adaptive/recommendation/${user.uid}`);
            const data = await response.json();

            if (data.success && data.recommendation) {
                setAdaptiveRecommendation(data.recommendation);
            }
        } catch (error) {
            console.error('❌ Error fetching adaptive difficulty:', error);
        }
    };

    const navigateToArea = (area) => {
        switch(area) {
            case 'practice':
                navigate('/practice-room');
                toast.success('עובר לחדר התרגול! 🎯');
                break;
            case 'lecture':
                navigate('/lecture-room');
                toast.success('עובר לחדר ההרצאות! 📚');
                break;
            case 'notebook':
                navigate('/notebook');
                toast.success('פותח את המחברת שלך! 📝');
                break;
        }
    };

    const getDifficultyLabel = (difficulty) => {
        const labels = { easy: 'קל', medium: 'בינוני', hard: 'מאתגר' };
        return labels[difficulty] || 'בינוני';
    };

    const getDifficultyEmoji = (difficulty) => {
        const emojis = { easy: '🌱', medium: '⚡', hard: '🔥' };
        return emojis[difficulty] || '⚡';
    };

    const getDifficultyColor = (difficulty) => {
        const colors = {
            easy: 'from-green-400 to-emerald-500',
            medium: 'from-blue-400 to-cyan-500',
            hard: 'from-orange-400 to-red-500'
        };
        return colors[difficulty] || 'from-blue-400 to-cyan-500';
    };

    const successRate = stats.questionsAnswered > 0
        ? Math.round((stats.correctAnswers / stats.questionsAnswered) * 100)
        : 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                    <Brain className="w-20 h-20 text-white" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900" dir="rtl">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12 space-y-6 md:space-y-8">

                {/* Back to Personal Area Button */}
                <motion.button
                    onClick={() => navigate('/dashboard')}
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-md text-white rounded-xl font-bold hover:bg-white/30 transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>חזרה לאזור האישי</span>
                </motion.button>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-white"
                >
                    <motion.h1
                        className="text-5xl md:text-7xl font-black mb-4"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        מרחב הלמידה שלי 🚀
                    </motion.h1>
                    <p className="text-2xl md:text-3xl font-bold">
                        כל מה שאתה צריך ללמוד ולהתקדם במקום אחד
                    </p>
                </motion.div>

                {/* Section 1: Learning Statistics */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/95 backdrop-blur-lg rounded-3xl p-6 md:p-8 shadow-2xl"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
                            <Activity className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-900">סטטיסטיקות למידה</h2>
                            <p className="text-gray-600">המצב שלך כרגע</p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <motion.div
                            whileHover={{ scale: 1.05, y: -5 }}
                            className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-5 border-2 border-purple-200"
                        >
                            <Brain className="w-10 h-10 text-purple-600 mb-3" />
                            <p className="text-4xl font-black text-purple-900 mb-2">
                                {stats.questionsAnswered}
                            </p>
                            <p className="text-sm font-bold text-purple-700">סה"כ שאלות</p>
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.05, y: -5 }}
                            className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-5 border-2 border-green-200"
                        >
                            <Target className="w-10 h-10 text-green-600 mb-3" />
                            <p className="text-4xl font-black text-green-900 mb-2">
                                {successRate}%
                            </p>
                            <p className="text-sm font-bold text-green-700">דיוק</p>
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.05, y: -5 }}
                            className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-5 border-2 border-orange-200"
                        >
                            <Flame className="w-10 h-10 text-orange-600 mb-3" />
                            <p className="text-4xl font-black text-orange-900 mb-2">
                                {stats.streak}
                            </p>
                            <p className="text-sm font-bold text-orange-700">רצף ימים</p>
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.05, y: -5 }}
                            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border-2 border-blue-200"
                        >
                            <Clock className="w-10 h-10 text-blue-600 mb-3" />
                            <p className="text-4xl font-black text-blue-900 mb-2">
                                {Math.round(stats.practiceTime / 60)}
                            </p>
                            <p className="text-sm font-bold text-blue-700">דקות תרגול</p>
                        </motion.div>
                    </div>

                    {/* Adaptive Difficulty */}
                    {adaptiveRecommendation && (
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <motion.div
                                        animate={{ rotate: [0, 360] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        className="p-3 bg-white rounded-xl shadow-md"
                                    >
                                        <Gauge className="w-8 h-8 text-indigo-600" />
                                    </motion.div>
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 mb-1">
                                            רמת קושי מותאמת אוטומטית
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {adaptiveRecommendation.message}
                                        </p>
                                    </div>
                                </div>

                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className={`px-6 py-3 rounded-xl font-black text-2xl bg-gradient-to-r ${getDifficultyColor(stats.difficulty)} text-white shadow-lg`}
                                >
                                    {getDifficultyEmoji(stats.difficulty)} {getDifficultyLabel(stats.difficulty)}
                                </motion.div>
                            </div>
                        </div>
                    )}

                    {/* Feedback from Nexon */}
                    <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-200">
                        <div className="flex items-start gap-3">
                            <Sparkles className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                            <div>
                                <p className="font-bold text-yellow-900 mb-2">משוב נקודתי מנקסון:</p>
                                <p className="text-gray-800 leading-relaxed">
                                    {successRate >= 90 && "ביצועים מעולים! אתה שולט בחומר! 🌟"}
                                    {successRate >= 75 && successRate < 90 && "עבודה מצוינת! המשך ככה! 💪"}
                                    {successRate >= 60 && successRate < 75 && "התקדמות טובה! עוד קצת תרגול ותגיע למצוינות! 📈"}
                                    {successRate < 60 && stats.questionsAnswered > 0 && "זכור שטעויות הן חלק מהלמידה. בוא נתרגל עוד! 🤗"}
                                    {stats.questionsAnswered === 0 && "בוא נתחיל! אני כאן כדי ללוות אותך בכל שלב 🚀"}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Section 2: Missions from Nexon */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/95 backdrop-blur-lg rounded-3xl p-6 md:p-8 shadow-2xl"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl">
                            <MessageSquare className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-900">המשימות שלי 📋</h2>
                            <p className="text-gray-600">הנחיות מפורשות מנקסון - שיעורי הבית שלך</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Practice Missions */}
                        {missions.practice && missions.practice.length > 0 && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                                <h3 className="text-xl font-black text-green-900 mb-4 flex items-center gap-2">
                                    <Play className="w-6 h-6" />
                                    משימות תרגול
                                </h3>
                                <ul className="space-y-3">
                                    {missions.practice.map((mission, idx) => (
                                        <li key={idx} className="flex items-start gap-3 bg-white rounded-xl p-4">
                                            <CheckCircle2 className={`w-6 h-6 flex-shrink-0 ${mission.completed ? 'text-green-600' : 'text-gray-400'}`} />
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-900">{mission.title}</p>
                                                {mission.description && (
                                                    <p className="text-sm text-gray-600 mt-1">{mission.description}</p>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Lecture Missions */}
                        {missions.lecture && missions.lecture.length > 0 && (
                            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
                                <h3 className="text-xl font-black text-blue-900 mb-4 flex items-center gap-2">
                                    <GraduationCap className="w-6 h-6" />
                                    משימות הרצאה
                                </h3>
                                <ul className="space-y-3">
                                    {missions.lecture.map((mission, idx) => (
                                        <li key={idx} className="flex items-start gap-3 bg-white rounded-xl p-4">
                                            <CheckCircle2 className={`w-6 h-6 flex-shrink-0 ${mission.completed ? 'text-blue-600' : 'text-gray-400'}`} />
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-900">{mission.title}</p>
                                                {mission.description && (
                                                    <p className="text-sm text-gray-600 mt-1">{mission.description}</p>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Review Missions */}
                        {missions.review && missions.review.length > 0 && (
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                                <h3 className="text-xl font-black text-purple-900 mb-4 flex items-center gap-2">
                                    <FileText className="w-6 h-6" />
                                    משימות חזרה
                                </h3>
                                <ul className="space-y-3">
                                    {missions.review.map((mission, idx) => (
                                        <li key={idx} className="flex items-start gap-3 bg-white rounded-xl p-4">
                                            <CheckCircle2 className={`w-6 h-6 flex-shrink-0 ${mission.completed ? 'text-purple-600' : 'text-gray-400'}`} />
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-900">{mission.title}</p>
                                                {mission.description && (
                                                    <p className="text-sm text-gray-600 mt-1">{mission.description}</p>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* No Missions */}
                        {(!missions.practice || missions.practice.length === 0) &&
                            (!missions.lecture || missions.lecture.length === 0) &&
                            (!missions.review || missions.review.length === 0) && (
                                <div className="text-center py-12">
                                    <Trophy className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                                    <p className="text-xl text-gray-600 font-bold">
                                        אין משימות פתוחות כרגע 🎉
                                    </p>
                                    <p className="text-gray-500 mt-2">
                                        בחר באחד מאזורי הלמידה למטה כדי להתחיל ללמוד
                                    </p>
                                </div>
                            )}
                    </div>
                </motion.div>

                {/* Section 3: Learning Areas */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2 className="text-4xl font-black text-white text-center mb-8">
                        אזורי הלמידה שלי 🎯
                    </h2>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Practice Room */}
                        <motion.button
                            whileHover={{ scale: 1.05, y: -10 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigateToArea('practice')}
                            className="group relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all overflow-hidden"
                        >
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />

                            <div className="relative z-10">
                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="text-7xl mb-6 text-center"
                                >
                                    🎯
                                </motion.div>

                                <h3 className="text-3xl font-black text-white mb-4 text-center">
                                    חדר תרגול
                                </h3>

                                <p className="text-white/90 text-center mb-6">
                                    תרגול שאלות ומשימות עם תמיכת AI בזמן אמת
                                </p>

                                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
                                    <p className="text-white font-bold text-center">
                                        {missions.practice?.length || 0} משימות פתוחות
                                    </p>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-white font-bold">
                                    <span>לחץ להתחלה</span>
                                    <motion.div
                                        animate={{ x: [0, 5, 0] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                    >
                                        <Play className="w-6 h-6" />
                                    </motion.div>
                                </div>
                            </div>
                        </motion.button>

                        {/* Lecture Room */}
                        <motion.button
                            whileHover={{ scale: 1.05, y: -10 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigateToArea('lecture')}
                            className="group relative bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all overflow-hidden"
                        >
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-500 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />

                            <div className="relative z-10">
                                <motion.div
                                    animate={{ rotate: [0, -10, 10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="text-7xl mb-6 text-center"
                                >
                                    📚
                                </motion.div>

                                <h3 className="text-3xl font-black text-white mb-4 text-center">
                                    חדר הרצאות
                                </h3>

                                <p className="text-white/90 text-center mb-6">
                                    למידת נושאים חדשים עם הסברים מפורטים ודוגמאות
                                </p>

                                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
                                    <p className="text-white font-bold text-center">
                                        {missions.lecture?.length || 0} משימות פתוחות
                                    </p>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-white font-bold">
                                    <span>לחץ להתחלה</span>
                                    <motion.div
                                        animate={{ x: [0, 5, 0] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                    >
                                        <GraduationCap className="w-6 h-6" />
                                    </motion.div>
                                </div>
                            </div>
                        </motion.button>

                        {/* My Notebook */}
                        <motion.button
                            whileHover={{ scale: 1.05, y: -10 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigateToArea('notebook')}
                            className="group relative bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all overflow-hidden"
                        >
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-500 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />

                            <div className="relative z-10">
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="text-7xl mb-6 text-center"
                                >
                                    📝
                                </motion.div>

                                <h3 className="text-3xl font-black text-white mb-4 text-center">
                                    המחברת שלי
                                </h3>

                                <p className="text-white/90 text-center mb-6">
                                    כל הסיכומים, התרגולים וההערות שלך במקום אחד
                                </p>

                                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
                                    <p className="text-white font-bold text-center">
                                        {missions.review?.length || 0} משימות חזרה
                                    </p>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-white font-bold">
                                    <span>לחץ להתחלה</span>
                                    <motion.div
                                        animate={{ x: [0, 5, 0] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                    >
                                        <FileText className="w-6 h-6" />
                                    </motion.div>
                                </div>
                            </div>
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LearningSpaceHub;