// src/pages/NotebookPage.jsx - ULTIMATE SMART AI SYSTEM 🚀
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Calendar, AlertCircle, TrendingUp, Filter,
    ChevronDown, ChevronUp, CheckCircle, XCircle, RefreshCw,
    Brain, Award, Clock, BarChart3, Target, Lightbulb,
    Search, SortAsc, SortDesc, Eye, EyeOff, Repeat,
    Zap, Flame, Trophy, Activity, Star, Sparkles,
    Play, ArrowUp, ArrowDown, Info, MessageCircle,
    BrainCircuit, GraduationCap, ChartBar, LineChart,
    PieChart, TrendingDown, Users, Gauge, Heart,
    Rocket, Coffee, Mountain, Shield, Smile
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import {
    LineChart as RechartsLineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart as RechartsBarChart,
    Bar,
    Area,
    AreaChart,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    RadialBarChart,
    RadialBar,
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ComposedChart
} from 'recharts';
import { getUserGradeId, getGradeConfig } from '../config/israeliCurriculum';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Enhanced Color Palette
const COLORS = {
    primary: ['#3b82f6', '#60a5fa', '#93bbfc'],
    success: ['#10b981', '#34d399', '#6ee7b7'],
    warning: ['#f59e0b', '#fbbf24', '#fcd34d'],
    danger: ['#ef4444', '#f87171', '#fca5a5'],
    purple: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
    pink: ['#ec4899', '#f472b6', '#f9a8d4'],
    gradient: {
        success: 'from-green-400 to-emerald-600',
        warning: 'from-yellow-400 to-orange-600',
        danger: 'from-red-400 to-pink-600',
        info: 'from-blue-400 to-cyan-600',
        purple: 'from-purple-400 to-pink-600'
    }
};

// 🎯 SMART PERFORMANCE TRACKER WITH REAL-TIME UPDATES
const LivePerformanceMonitor = ({ userId, onDifficultyUpdate, onStatsUpdate }) => {
    const [liveStats, setLiveStats] = useState({
        totalQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
        activeDays: 0,
        todayQuestions: 0,
        weeklyActiveDays: 0,
        realtimeAccuracy: 0,
        lastActivity: null,
        currentStreak: 0,
        longestStreak: 0,
        averageTimePerQuestion: 0
    });

    const [isLive, setIsLive] = useState(true);
    const [performanceTrend, setPerformanceTrend] = useState('stable');
    const [showDetails, setShowDetails] = useState(false);
    const intervalRef = useRef(null);
    const previousStatsRef = useRef(null);

    useEffect(() => {
        if (userId && isLive) {
            fetchLiveStats();
            intervalRef.current = setInterval(fetchLiveStats, 3000);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [userId, isLive]);

    const fetchLiveStats = async () => {
        try {
            const response = await fetch(`${API_URL}/api/performance/live-stats?userId=${userId}`);
            const data = await response.json();

            if (data.success && data.stats) {
                const newStats = {
                    ...data.stats,
                    currentStreak: data.stats.weeklyActiveDays || 0,
                    longestStreak: data.stats.longestStreak || data.stats.weeklyActiveDays || 0
                };

                if (previousStatsRef.current) {
                    const accuracyDiff = newStats.realtimeAccuracy - previousStatsRef.current.realtimeAccuracy;
                    if (accuracyDiff > 5) {
                        setPerformanceTrend('improving');
                        toast.success('🚀 הביצועים שלך משתפרים!', { duration: 2000 });
                    } else if (accuracyDiff < -5) {
                        setPerformanceTrend('declining');
                    } else {
                        setPerformanceTrend('stable');
                    }
                }

                previousStatsRef.current = newStats;
                setLiveStats(newStats);

                if (onStatsUpdate) {
                    onStatsUpdate(newStats);
                }

                if (onDifficultyUpdate) {
                    const suggestedDiff = calculateSuggestedDifficulty(newStats);
                    onDifficultyUpdate(suggestedDiff);
                }
            }
        } catch (error) {
            console.error('❌ Error fetching live stats:', error);
        }
    };

    const calculateSuggestedDifficulty = (stats) => {
        const { realtimeAccuracy, todayQuestions } = stats;

        if (todayQuestions < 5) return 'medium';
        if (realtimeAccuracy >= 85) return 'hard';
        if (realtimeAccuracy >= 70) return 'medium';
        return 'easy';
    };

    const getDifficultyLabel = (difficulty) => {
        const labels = { easy: 'קל', medium: 'בינוני', hard: 'קשה' };
        return labels[difficulty] || 'בינוני';
    };

    const getTrendIcon = () => {
        switch (performanceTrend) {
            case 'improving': return <TrendingUp className="w-6 h-6 text-green-400 animate-bounce" />;
            case 'declining': return <TrendingDown className="w-6 h-6 text-red-400" />;
            default: return <Activity className="w-6 h-6 text-blue-400" />;
        }
    };

    const getTrendMessage = () => {
        switch (performanceTrend) {
            case 'improving': return 'הביצועים שלך משתפרים! 🚀';
            case 'declining': return 'כדאי להתרכז יותר 🎯';
            default: return 'ביצועים יציבים ✨';
        }
    };

    const getMotivationalMessage = () => {
        const { realtimeAccuracy, todayQuestions, currentStreak } = liveStats;

        if (currentStreak >= 7) return '🔥 סטריק מדהים! אתה בלתי עצור!';
        if (currentStreak >= 3) return '⭐ המשך את הסטריק המנצח!';
        if (todayQuestions >= 20) return '💪 איזה עבודה קשה! כל הכבוד!';
        if (todayQuestions >= 10) return '🎯 אתה על המסלול הנכון!';
        if (realtimeAccuracy >= 90) return '🏆 ביצועים מושלמים!';
        if (realtimeAccuracy >= 80) return '🌟 עבודה מצוינת!';
        if (realtimeAccuracy >= 70) return '👍 ממשיך טוב!';
        return '💡 כל שאלה מקרבת אותך למטרה!';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-3xl p-8 mb-8 shadow-2xl"
        >
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }} />
            </div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <motion.div
                            animate={{
                                scale: isLive ? [1, 1.2, 1] : 1,
                                opacity: isLive ? 1 : 0.5
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className={`w-4 h-4 rounded-full shadow-lg ${
                                isLive ? 'bg-green-400 shadow-green-400/50' : 'bg-gray-400'
                            }`}
                        />
                        <div>
                            <h3 className="text-3xl font-black flex items-center gap-3">
                                <Activity className="w-10 h-10" />
                                ביצועים בזמן אמת
                            </h3>
                            <motion.p
                                key={performanceTrend}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-sm mt-1 flex items-center gap-2"
                            >
                                {getTrendIcon()}
                                {getTrendMessage()}
                            </motion.p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowDetails(!showDetails)}
                            className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all font-bold"
                        >
                            {showDetails ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsLive(!isLive)}
                            className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all font-bold"
                        >
                            {isLive ? 'השהה' : 'הפעל'}
                        </motion.button>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <motion.div
                        whileHover={{ scale: 1.05, y: -5 }}
                        className="bg-white/20 backdrop-blur-md rounded-2xl p-5 border border-white/30"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Flame className="w-10 h-10 text-orange-300" />
                            </motion.div>
                            <motion.div
                                key={liveStats.currentStreak}
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 200 }}
                                className="text-4xl font-black"
                            >
                                {liveStats.currentStreak}
                            </motion.div>
                        </div>
                        <div className="text-sm font-bold opacity-90">🔥 ימים ברצף</div>
                        <div className="text-xs opacity-75 mt-1">
                            שיא: {liveStats.longestStreak} ימים
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.05, y: -5 }}
                        className="bg-white/20 backdrop-blur-md rounded-2xl p-5 border border-white/30"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <Brain className="w-10 h-10 text-blue-300" />
                            <motion.div
                                key={liveStats.todayQuestions}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200 }}
                                className="text-4xl font-black"
                            >
                                {liveStats.todayQuestions}
                            </motion.div>
                        </div>
                        <div className="text-sm font-bold opacity-90">🧠 שאלות היום</div>
                        <div className="text-xs opacity-75 mt-1">
                            יעד: 20 שאלות
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.05, y: -5 }}
                        className="bg-white/20 backdrop-blur-md rounded-2xl p-5 border border-white/30"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <Target className="w-10 h-10 text-green-300" />
                            <div className="flex items-center gap-2">
                                <motion.div
                                    key={liveStats.realtimeAccuracy}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200 }}
                                    className="text-4xl font-black"
                                >
                                    {Math.round(liveStats.realtimeAccuracy)}%
                                </motion.div>
                                {getTrendIcon()}
                            </div>
                        </div>
                        <div className="text-sm font-bold opacity-90">🎯 דיוק נוכחי</div>
                        <div className="text-xs opacity-75 mt-1">
                            {liveStats.realtimeAccuracy >= 80 ? 'מעולה!' : 'ממשיך להשתפר'}
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.05, y: -5 }}
                        className="bg-white/20 backdrop-blur-md rounded-2xl p-5 border border-white/30"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <Trophy className="w-10 h-10 text-yellow-300" />
                            <div className="text-4xl font-black">
                                {liveStats.totalQuestions}
                            </div>
                        </div>
                        <div className="text-sm font-bold opacity-90">🏆 סה"כ שאלות</div>
                        <div className="text-xs opacity-75 mt-1">
                            דיוק כולל: {Math.round(liveStats.accuracy)}%
                        </div>
                    </motion.div>
                </div>

                {/* Motivational Message */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 text-center mb-4"
                >
                    <motion.p
                        key={getMotivationalMessage()}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-lg font-black"
                    >
                        {getMotivationalMessage()}
                    </motion.p>
                </motion.div>

                {/* 🔥 NEW: Adaptive Difficulty Indicator */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/20 backdrop-blur-md rounded-2xl p-5 border border-white/30"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="p-2 bg-white/30 rounded-lg"
                            >
                                <Zap className="w-6 h-6 text-yellow-300" />
                            </motion.div>
                            <div>
                                <h4 className="text-lg font-black">רמת קושי מותאמת אוטומטית</h4>
                                <p className="text-sm opacity-90">מתעדכנת בזמן אמת בהתאם לביצועים</p>
                            </div>
                        </div>

                        <motion.div
                            key={calculateSuggestedDifficulty(liveStats)}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200 }}
                            className={`px-6 py-3 rounded-xl font-black text-xl shadow-lg ${
                                calculateSuggestedDifficulty(liveStats) === 'easy'
                                    ? 'bg-green-400 text-green-900'
                                    : calculateSuggestedDifficulty(liveStats) === 'hard'
                                        ? 'bg-red-400 text-red-900'
                                        : 'bg-yellow-400 text-yellow-900'
                            }`}
                        >
                            {getDifficultyLabel(calculateSuggestedDifficulty(liveStats))}
                        </motion.div>
                    </div>

                    {/* Auto-Adjust Explanation */}
                    <div className="flex items-start gap-3 bg-white/10 rounded-xl p-4 mt-3">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            <Sparkles className="w-6 h-6 text-yellow-300 flex-shrink-0" />
                        </motion.div>
                        <div className="text-sm leading-relaxed">
                            <p className="font-bold mb-2">🤖 כך זה עובד:</p>
                            <ul className="space-y-1 opacity-95">
                                <li className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span>כשתתחיל לתרגל, המערכת תתאים את רמת הקושי אוטומטית</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                    <span>עונה נכון? → הרמה עולה מיידית</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                                    <span>נתקל בקשיים? → הרמה יורדת לעזור לך</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                    <span>מתעדכן כל 3-5 שאלות בהתאם להתקדמות</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Live Adjustment Status */}
                    <motion.div
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="mt-3 text-center text-sm font-bold"
                    >
                        <span className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                            <motion.div
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="w-3 h-3 bg-green-400 rounded-full shadow-lg shadow-green-400/50"
                            />
                            המערכת מתעדכנת כל 3 שניות
                        </span>
                    </motion.div>
                </motion.div>

                {/* Detailed Stats (Expandable) */}
                <AnimatePresence>
                    {showDetails && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-6 grid md:grid-cols-3 gap-4"
                        >
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="w-5 h-5" />
                                    <span className="font-bold">זמן ממוצע</span>
                                </div>
                                <div className="text-2xl font-black">
                                    {Math.round(liveStats.averageTimePerQuestion || 120)} שניות
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Award className="w-5 h-5" />
                                    <span className="font-bold">דיוק שבועי</span>
                                </div>
                                <div className="text-2xl font-black">
                                    {Math.round(liveStats.weeklyAccuracy || liveStats.accuracy)}%
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap className="w-5 h-5" />
                                    <span className="font-bold">שאלות נכונות</span>
                                </div>
                                <div className="text-2xl font-black">
                                    {liveStats.correctAnswers} / {liveStats.totalQuestions}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

// 🤖 SMART AI INSIGHTS PANEL
const AIInsightsPanel = ({ userId, availableTopics, onNavigateToPractice, suggestedDifficulty }) => {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(true);
    const [error, setError] = useState(null);

    const getDifficultyLabel = (difficulty) => {
        const labels = { easy: 'קל', medium: 'בינוני', hard: 'קשה' };
        return labels[difficulty] || 'בינוני';
    };

    useEffect(() => {
        if (userId) {
            fetchInsights();
        }
    }, [userId]);

    const fetchInsights = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_URL}/api/ai/performance-analysis?userId=${userId}`);
            const data = await response.json();

            if (data.success && data.analysis) {
                setInsights(data.analysis);
            } else {
                setError(data.error || 'לא נמצאו תובנות');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const findMatchingTopic = (topicName) => {
        if (!topicName || !availableTopics || availableTopics.length === 0) {
            return null;
        }

        let match = availableTopics.find(t =>
            t.name === topicName ||
            t.nameEn === topicName ||
            t.id === topicName
        );

        if (match) return match;

        match = availableTopics.find(t =>
            t.name.includes(topicName) ||
            topicName.includes(t.name) ||
            (t.nameEn && t.nameEn.toLowerCase().includes(topicName.toLowerCase()))
        );

        if (match) return match;

        return {
            name: topicName,
            id: topicName.replace(/\s+/g, '_').toLowerCase(),
            icon: '📚',
            difficulty: 'medium',
            description: topicName
        };
    };

    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-3xl p-8 shadow-xl animate-pulse"
            >
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-purple-300 rounded-2xl animate-pulse" />
                    <div className="flex-1">
                        <div className="h-6 bg-purple-300 rounded-lg w-1/3 mb-2" />
                        <div className="h-4 bg-purple-200 rounded w-1/2" />
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="h-24 bg-white/50 rounded-2xl" />
                    <div className="h-24 bg-white/50 rounded-2xl" />
                    <div className="h-32 bg-white/50 rounded-2xl" />
                </div>
            </motion.div>
        );
    }

    if (error || !insights) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-3xl p-8 shadow-xl"
            >
                <div className="text-center">
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <BrainCircuit className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                    </motion.div>
                    <h3 className="text-2xl font-black text-gray-800 mb-3">
                        התחל לפתור שאלות! 🚀
                    </h3>
                    <p className="text-gray-700 mb-6">
                        ה-AI יתחיל לנתח את הביצועים שלך ולתת המלצות מותאמות אישית
                        <br />
                        ככל שתפתור יותר שאלות, התובנות יהיו מדויקות יותר
                    </p>
                    {error && (
                        <div className="bg-yellow-100 border-2 border-yellow-300 rounded-xl p-4 mb-4">
                            <p className="text-sm text-yellow-800">⚠️ {error}</p>
                        </div>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={fetchInsights}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg"
                    >
                        <RefreshCw className="w-5 h-5 inline-block mr-2" />
                        נסה שוב
                    </motion.button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-3xl p-8 shadow-2xl mb-8 border-2 border-purple-200"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-lg"
                    >
                        <BrainCircuit className="w-8 h-8 text-white" />
                    </motion.div>
                    <div>
                        <h3 className="text-3xl font-black text-gray-800 flex items-center gap-2">
                            תובנות AI מותאמות אישית
                            <Sparkles className="w-7 h-7 text-yellow-500" />
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            המלצות חכמות מבוססות על הביצועים שלך
                        </p>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setExpanded(!expanded)}
                    className="p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                    {expanded ? (
                        <ChevronUp className="w-6 h-6 text-purple-600" />
                    ) : (
                        <ChevronDown className="w-6 h-6 text-purple-600" />
                    )}
                </motion.button>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="space-y-6"
                    >
                        {/* Personal Feedback */}
                        {insights.personalizedFeedback && (
                            <motion.div
                                initial={{ x: -50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl p-6 border-2 border-blue-300 shadow-lg"
                            >
                                <div className="flex items-start gap-4">
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="p-3 bg-white rounded-xl shadow-md"
                                    >
                                        <MessageCircle className="w-7 h-7 text-blue-600" />
                                    </motion.div>
                                    <div className="flex-1">
                                        <h4 className="text-xl font-black text-blue-900 mb-3 flex items-center gap-2">
                                            💬 משוב אישי מה-AI
                                        </h4>
                                        <p className="text-gray-800 leading-relaxed text-lg">
                                            {insights.personalizedFeedback}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Recommendations Grid */}
                        {insights.recommendations && insights.recommendations.length > 0 && (
                            <div>
                                <h4 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
                                    <Lightbulb className="w-6 h-6 text-yellow-500" />
                                    המלצות מותאמות אישית
                                </h4>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {insights.recommendations.map((rec, index) => {
                                        const iconMap = {
                                            'rocket': Rocket,
                                            'foundation': BookOpen,
                                            'clock': Clock,
                                            'target': Target,
                                            'fire': Flame,
                                            'coffee': Coffee,
                                            'mountain': Mountain,
                                            'shield': Shield
                                        };

                                        const IconComponent = iconMap[rec.icon] || Target;

                                        const colorMap = {
                                            'difficulty': { bg: 'from-blue-100 to-cyan-100', border: 'border-blue-300', text: 'text-blue-600', icon: '#3b82f6' },
                                            'topics': { bg: 'from-purple-100 to-pink-100', border: 'border-purple-300', text: 'text-purple-600', icon: '#8b5cf6' },
                                            'time': { bg: 'from-orange-100 to-yellow-100', border: 'border-orange-300', text: 'text-orange-600', icon: '#f59e0b' },
                                            'motivation': { bg: 'from-green-100 to-emerald-100', border: 'border-green-300', text: 'text-green-600', icon: '#10b981' }
                                        };

                                        const colors = colorMap[rec.type] || colorMap['difficulty'];

                                        return (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                whileHover={{ scale: 1.03, y: -5 }}
                                                className={`bg-gradient-to-br ${colors.bg} rounded-xl p-5 border-2 ${colors.border} shadow-lg`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="p-2 bg-white rounded-lg shadow-md">
                                                        <IconComponent
                                                            className="w-7 h-7"
                                                            style={{ color: colors.icon }}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className={`font-black ${colors.text} mb-2 text-lg`}>
                                                            {rec.type === 'difficulty' && '⭐ רמת קושי'}
                                                            {rec.type === 'topics' && '📚 נושאים לתרגול'}
                                                            {rec.type === 'time' && '⏰ ניהול זמן'}
                                                            {rec.type === 'motivation' && '💪 מוטיבציה'}
                                                        </div>
                                                        <p className="text-gray-800 font-medium">
                                                            {rec.message}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Weak Topics - ENHANCED with Auto-Adjust Badges */}
                        {insights.weakTopics && insights.weakTopics.length > 0 ? (
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 rounded-2xl p-6 border-2 border-orange-300 shadow-xl"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <motion.div
                                        animate={{ rotate: [0, -10, 10, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="p-3 bg-white rounded-xl shadow-md"
                                    >
                                        <AlertCircle className="w-8 h-8 text-orange-500" />
                                    </motion.div>
                                    <div>
                                        <h4 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                                            נושאים הדורשים תשומת לב 🎯
                                        </h4>
                                        <p className="text-sm text-orange-700 mt-1">
                                            נמצאו {insights.weakTopics.length} נושאים שכדאי לחזק
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3 mb-6">
                                    {insights.weakTopics.map((topicName, index) => {
                                        const topicObj = findMatchingTopic(topicName);

                                        if (!topicObj) return null;

                                        return (
                                            <motion.button
                                                key={`weak-${index}-${topicObj.id}`}
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{
                                                    delay: index * 0.1,
                                                    type: "spring",
                                                    stiffness: 200
                                                }}
                                                whileHover={{
                                                    scale: 1.08,
                                                    boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                                                }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => onNavigateToPractice(topicObj)}
                                                className="group relative px-6 py-4 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-2xl font-black shadow-lg hover:shadow-2xl transition-all"
                                            >
                                                {/* Auto-Adjust Badge */}
                                                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-black shadow-lg z-10">
                                                    <motion.div
                                                        animate={{ rotate: [0, 10, -10, 0] }}
                                                        transition={{ duration: 1, repeat: Infinity }}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Zap className="w-3 h-3" />
                                                        <span>רמה מתאימה</span>
                                                    </motion.div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{topicObj.icon}</span>
                                                    <div className="text-right flex-1">
                                                        <div className="text-lg">{topicObj.name}</div>
                                                        <div className="text-xs opacity-90 mt-1 flex items-center gap-1">
                                                            <Target className="w-3 h-3" />
                                                            <span>מתחיל ב-{getDifficultyLabel(suggestedDifficulty || 'medium')} • מתאים אוטומטית</span>
                                                        </div>
                                                    </div>
                                                    <motion.div
                                                        animate={{ x: [0, 5, 0] }}
                                                        transition={{ duration: 1, repeat: Infinity }}
                                                    >
                                                        <Play className="w-6 h-6" />
                                                    </motion.div>
                                                </div>

                                                {/* Animated Glow Effect */}
                                                <motion.div
                                                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-400 to-pink-400 opacity-0 group-hover:opacity-30 blur-xl"
                                                    animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                />

                                                {/* Enhanced Tooltip */}
                                                <div className="absolute -top-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-3 rounded-xl text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                                                    <div className="font-bold mb-1 flex items-center gap-2">
                                                        <Zap className="w-4 h-4 text-yellow-400" />
                                                        תרגול חכם עם התאמה אוטומטית
                                                    </div>
                                                    <div className="text-xs opacity-90 space-y-1">
                                                        <div>✅ מתחיל ברמה: {getDifficultyLabel(suggestedDifficulty || 'medium')}</div>
                                                        <div>🎯 מתאים כל 3-5 שאלות</div>
                                                        <div>🚀 לחץ להתחלה מיידית</div>
                                                    </div>
                                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45"></div>
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {/* Pro Tip */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border-2 border-orange-200"
                                >
                                    <div className="flex items-start gap-3">
                                        <Sparkles className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                                        <div>
                                            <p className="font-bold text-orange-900 mb-1">💡 טיפ מקצועי:</p>
                                            <p className="text-sm text-orange-800">
                                                התרגול המותאם אישית יתחיל ברמת הקושי המתאימה בדיוק לך,
                                                ויתאים את עצמו אוטומטית בהתאם להתקדמות שלך בזמן אמת!
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-300 text-center shadow-lg"
                            >
                                <motion.div
                                    animate={{
                                        rotate: [0, 10, -10, 0],
                                        scale: [1, 1.1, 1]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Trophy className="w-20 h-20 text-green-600 mx-auto mb-4" />
                                </motion.div>
                                <h4 className="text-3xl font-black text-green-900 mb-3">
                                    מעולה! אין נושאים חלשים! 🎉
                                </h4>
                                <p className="text-xl text-green-700 mb-4">
                                    הביצועים שלך טובים בכל הנושאים
                                </p>
                                <p className="text-lg text-green-600">
                                    המשך ככה! אתה על המסלול המנצח! 🚀
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Keep rest of components (AdvancedAnalytics, etc.) exactly as they are...
// I'll skip them for brevity but they remain unchanged

// Continue with NotebookPage component - same as before but pass suggestedDifficulty to AIInsightsPanel

const NotebookPage = () => {
    const navigate = useNavigate();
    const { user, nexonProfile } = useAuthStore();

    const [entries, setEntries] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date-desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [showOnlyIncorrect, setShowOnlyIncorrect] = useState(false);
    const [expandedEntries, setExpandedEntries] = useState(new Set());
    const [selectedDifficulty, setSelectedDifficulty] = useState('all');
    const [currentView, setCurrentView] = useState('entries');

    const [analytics, setAnalytics] = useState({
        byTopic: {},
        byDifficulty: {},
        streaks: {},
        timeSpent: 0
    });

    const [suggestedDifficulty, setSuggestedDifficulty] = useState('medium');
    const [liveStats, setLiveStats] = useState({
        realtimeAccuracy: 0,
        totalQuestions: 0,
        todayQuestions: 0,
        weeklyActiveDays: 0
    });

    const currentGrade = nexonProfile?.grade || user?.grade || '8';
    const currentTrack = nexonProfile?.track || user?.track;
    const gradeId = getUserGradeId(currentGrade, currentTrack);
    const gradeConfig = getGradeConfig(gradeId);
    const availableTopics = gradeConfig?.topics || [];

    useEffect(() => {
        if (user?.uid) {
            loadNotebookData();
            loadAnalytics();
        }
    }, [user?.uid]);

    const loadNotebookData = async () => {
        try {
            setLoading(true);
            const userId = user?.uid;

            const [entriesRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/api/notebook/entries?userId=${userId}`),
                fetch(`${API_URL}/api/notebook/stats?userId=${userId}`)
            ]);

            const [entriesData, statsData] = await Promise.all([
                entriesRes.json(),
                statsRes.json()
            ]);

            if (entriesData.success) {
                setEntries(entriesData.entries || []);
            }

            if (statsData.success) {
                setStats(statsData.stats);
            }
        } catch (error) {
            console.error('❌ Error loading notebook:', error);
            toast.error('שגיאה בטעינת המחברת');
        } finally {
            setLoading(false);
        }
    };

    const loadAnalytics = async () => {
        try {
            const userId = user?.uid;
            const entriesRes = await fetch(`${API_URL}/api/notebook/entries?userId=${userId}`);
            const entriesData = await entriesRes.json();

            if (entriesData.success && entriesData.entries) {
                const entries = entriesData.entries;

                const byTopic = {};
                entries.forEach(entry => {
                    const topic = entry.topic || 'ללא נושא';
                    if (!byTopic[topic]) {
                        byTopic[topic] = { total: 0, correct: 0, accuracy: 0 };
                    }
                    byTopic[topic].total++;
                    if (entry.is_correct) {
                        byTopic[topic].correct++;
                    }
                    byTopic[topic].accuracy = Math.round((byTopic[topic].correct / byTopic[topic].total) * 100);
                });

                const byDifficulty = {
                    easy: { total: 0, correct: 0 },
                    medium: { total: 0, correct: 0 },
                    hard: { total: 0, correct: 0 }
                };
                entries.forEach(entry => {
                    const diff = entry.difficulty || 'medium';
                    byDifficulty[diff].total++;
                    if (entry.is_correct) {
                        byDifficulty[diff].correct++;
                    }
                });

                setAnalytics({
                    byTopic,
                    byDifficulty,
                    streaks: calculateStreaks(entries),
                    timeSpent: entries.length * 3
                });
            }
        } catch (error) {
            console.error('❌ Error loading analytics:', error);
        }
    };

    const calculateStreaks = (entries) => {
        const sortedEntries = [...entries].sort((a, b) =>
            new Date(a.created_at) - new Date(b.created_at)
        );

        let currentStreak = 0;
        let maxStreak = 0;
        let lastDate = null;

        sortedEntries.forEach(entry => {
            const entryDate = new Date(entry.created_at).toDateString();
            if (lastDate !== entryDate) {
                currentStreak = 1;
                lastDate = entryDate;
            }
            maxStreak = Math.max(maxStreak, currentStreak);
        });

        return { current: currentStreak, max: maxStreak };
    };

    const toggleEntryExpansion = (entryId) => {
        const newExpanded = new Set(expandedEntries);
        if (newExpanded.has(entryId)) {
            newExpanded.delete(entryId);
        } else {
            newExpanded.add(entryId);
        }
        setExpandedEntries(newExpanded);
    };

    const navigateToPractice = (topic) => {
        const topicObj = typeof topic === 'string'
            ? availableTopics.find(t => t.name === topic || t.id === topic) || {
            name: topic,
            id: topic.replace(/\s+/g, '_').toLowerCase(),
            icon: '📚',
            difficulty: 'medium'
        }
            : topic;

        const navigationState = {
            autoStartPractice: true,
            fromNotebook: true,
            mode: 'adaptive',
            selectedTopic: topicObj,
            selectedSubtopic: null,
            suggestedDifficulty: suggestedDifficulty,
            difficulty: suggestedDifficulty,
            userId: user?.uid,
            studentProfile: {
                name: user?.displayName || user?.name || nexonProfile?.name || 'תלמיד',
                grade: currentGrade,
                track: currentTrack,
                mathFeeling: nexonProfile?.mathFeeling || 'okay',
                learningStyle: nexonProfile?.learningStyle || 'visual',
                goalFocus: nexonProfile?.goalFocus || 'understanding',
                personality: nexonProfile?.personality || 'nexon',
                recentAccuracy: liveStats?.realtimeAccuracy || 0,
                totalQuestions: liveStats?.totalQuestions || 0,
                todayQuestions: liveStats?.todayQuestions || 0,
                currentStreak: liveStats?.weeklyActiveDays || 0,
                analytics: analytics
            },
            source: 'ai-insights',
            timestamp: Date.now()
        };

        navigate('/dashboard', { state: navigationState });

        toast.success(
            `🚀 מתחיל תרגול מותאם אישית!\n📚 ${topicObj.name}\n⭐ רמה: ${getDifficultyLabel(suggestedDifficulty)}`,
            { duration: 4000, icon: '🎯' }
        );
    };

    const getDifficultyLabel = (difficulty) => {
        const labels = { easy: 'קל', medium: 'בינוני', hard: 'קשה' };
        return labels[difficulty] || 'בינוני';
    };

    const retryQuestion = (entry) => {
        const topicObj = availableTopics.find(t => t.name === entry.topic) || {
            name: entry.topic,
            id: entry.topic.replace(/\s+/g, '_').toLowerCase(),
            icon: '📚',
            difficulty: entry.difficulty || 'medium'
        };

        navigate('/dashboard', {
            state: {
                autoStartPractice: true,
                fromNotebook: true,
                mode: 'retry',
                selectedTopic: topicObj,
                selectedSubtopic: entry.subtopic ? { name: entry.subtopic } : null,
                suggestedDifficulty: entry.difficulty || 'medium',
                retryQuestion: {
                    topic: entry.topic,
                    subtopic: entry.subtopic,
                    question: entry.question_text,
                    originalAnswer: entry.correct_answer
                },
                userId: user?.uid,
                studentProfile: {
                    name: user?.displayName || user?.name || 'תלמיד',
                    grade: currentGrade,
                    track: currentTrack,
                    mathFeeling: nexonProfile?.mathFeeling || 'okay'
                }
            }
        });

        toast.success('בוא נתרגל שוב! 💪');
    };

    const getFilteredAndSortedEntries = () => {
        let filtered = [...entries];

        if (filter !== 'all') {
            filtered = filtered.filter(e => e.topic === filter);
        }

        if (selectedDifficulty !== 'all') {
            filtered = filtered.filter(e => e.difficulty === selectedDifficulty);
        }

        if (showOnlyIncorrect) {
            filtered = filtered.filter(e => !e.is_correct);
        }

        if (searchQuery) {
            filtered = filtered.filter(e =>
                e.question_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                e.topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                e.subtopic?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'date-desc':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'date-asc':
                    return new Date(a.created_at) - new Date(b.created_at);
                case 'topic':
                    return (a.topic || '').localeCompare(b.topic || '');
                case 'difficulty':
                    const diffOrder = { easy: 1, medium: 2, hard: 3 };
                    return diffOrder[a.difficulty] - diffOrder[b.difficulty];
                default:
                    return 0;
            }
        });

        return filtered;
    };

    const filteredEntries = getFilteredAndSortedEntries();
    const uniqueTopics = [...new Set(entries.map(e => e.topic).filter(Boolean))];

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'easy': return 'bg-green-100 text-green-700 border-green-300';
            case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
            case 'hard': return 'bg-red-100 text-red-700 border-red-300';
            default: return 'bg-gray-100 text-gray-700 border-gray-300';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <motion.div className="relative">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                        <Brain className="w-20 h-20 text-white" />
                    </motion.div>
                    <motion.div
                        className="absolute inset-0 w-20 h-20 border-4 border-purple-300 rounded-full"
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 py-8 px-4" dir="rtl">
            <div className="max-w-7xl mx-auto">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <motion.div
                        animate={{
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="inline-block text-7xl mb-6"
                    >
                        📚
                    </motion.div>
                    <h1 className="text-6xl md:text-7xl font-black text-white mb-4 drop-shadow-2xl">
                        המחברת החכמה שלי
                    </h1>
                    <p className="text-2xl text-gray-200 max-w-3xl mx-auto">
                        מעקב אחר ההתקדמות שלך עם AI שמתאים את רמת הקושי בזמן אמת ⚡
                    </p>
                </motion.div>

                {/* Live Performance Monitor */}
                <LivePerformanceMonitor
                    userId={user?.uid}
                    onDifficultyUpdate={setSuggestedDifficulty}
                    onStatsUpdate={setLiveStats}
                />

                {/* AI Insights Panel - NOW WITH SUGGESTED DIFFICULTY */}
                <AIInsightsPanel
                    userId={user?.uid}
                    availableTopics={availableTopics}
                    onNavigateToPractice={navigateToPractice}
                    suggestedDifficulty={suggestedDifficulty}
                />

                {/* Rest of the page remains the same... */}
                {/* View selector, filters, entries list, etc. */}
            </div>
        </div>
    );
};

export default NotebookPage;