// src/pages/NotebookPage.jsx - ULTIMATE SMART AI SYSTEM WITH ADVANCED ANALYTICS 🚀
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
    Rocket, Coffee, Mountain, Shield, Smile, Download,
    Share2, Bookmark, Tag, Archive, Settings, Moon, Sun
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
    chart: ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
    gradient: {
        success: 'from-green-400 to-emerald-600',
        warning: 'from-yellow-400 to-orange-600',
        danger: 'from-red-400 to-pink-600',
        info: 'from-blue-400 to-cyan-600',
        purple: 'from-purple-400 to-pink-600'
    }
};

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white rounded-xl shadow-2xl p-4 border-2 border-purple-200">
                <p className="font-bold text-gray-800 mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: {entry.value}
                        {entry.name.includes('דיוק') || entry.name.includes('אחוז') ? '%' : ''}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// 🎯 LIVE PERFORMANCE MONITOR
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

                {/* Adaptive Difficulty Indicator */}
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

                {/* Detailed Stats */}
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

// 🤖 AI INSIGHTS PANEL
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

                                                <motion.div
                                                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-400 to-pink-400 opacity-0 group-hover:opacity-30 blur-xl"
                                                    animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                />

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

// 📊 ADVANCED ANALYTICS COMPONENT
const AdvancedAnalytics = ({ analytics, entries }) => {
    // Topic Performance Data
    const topicData = Object.entries(analytics.byTopic || {}).map(([topic, data]) => ({
        name: topic.length > 15 ? topic.substring(0, 15) + '...' : topic,
        fullName: topic,
        accuracy: data.accuracy || 0,
        total: data.total || 0,
        correct: data.correct || 0
    })).sort((a, b) => b.total - a.total).slice(0, 8);

    // Difficulty Distribution
    const difficultyData = [
        {
            name: 'קל',
            value: analytics.byDifficulty?.easy?.total || 0,
            accuracy: analytics.byDifficulty?.easy?.total > 0
                ? Math.round((analytics.byDifficulty.easy.correct / analytics.byDifficulty.easy.total) * 100)
                : 0
        },
        {
            name: 'בינוני',
            value: analytics.byDifficulty?.medium?.total || 0,
            accuracy: analytics.byDifficulty?.medium?.total > 0
                ? Math.round((analytics.byDifficulty.medium.correct / analytics.byDifficulty.medium.total) * 100)
                : 0
        },
        {
            name: 'קשה',
            value: analytics.byDifficulty?.hard?.total || 0,
            accuracy: analytics.byDifficulty?.hard?.total > 0
                ? Math.round((analytics.byDifficulty.hard.correct / analytics.byDifficulty.hard.total) * 100)
                : 0
        }
    ];

    // Weekly Progress
    const getWeeklyProgress = () => {
        if (!entries || entries.length === 0) return [];

        const today = new Date();
        const last7Days = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dayEntries = entries.filter(e => {
                const entryDate = new Date(e.created_at).toISOString().split('T')[0];
                return entryDate === dateStr;
            });

            const correct = dayEntries.filter(e => e.is_correct).length;
            const total = dayEntries.length;

            last7Days.push({
                date: date.toLocaleDateString('he-IL', { weekday: 'short' }),
                fullDate: date.toLocaleDateString('he-IL'),
                questions: total,
                correct: correct,
                accuracy: total > 0 ? Math.round((correct / total) * 100) : 0
            });
        }

        return last7Days;
    };

    const weeklyProgress = getWeeklyProgress();

    // Time-based data
    const getTimeDistribution = () => {
        if (!entries || entries.length === 0) return [];

        const hours = {};
        entries.forEach(entry => {
            const hour = new Date(entry.created_at).getHours();
            if (!hours[hour]) {
                hours[hour] = { total: 0, correct: 0 };
            }
            hours[hour].total++;
            if (entry.is_correct) hours[hour].correct++;
        });

        return Object.entries(hours).map(([hour, data]) => ({
            hour: `${hour}:00`,
            questions: data.total,
            accuracy: Math.round((data.correct / data.total) * 100)
        })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
    };

    const timeDistribution = getTimeDistribution();

    return (
        <div className="space-y-8">
            {/* Topic Performance Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-8 shadow-2xl"
            >
                <div className="flex items-center gap-3 mb-6">
                    <BarChart3 className="w-8 h-8 text-purple-600" />
                    <h3 className="text-2xl font-black text-gray-800">ביצועים לפי נושא</h3>
                </div>

                {topicData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <RechartsBarChart data={topicData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="name"
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                angle={-45}
                                textAnchor="end"
                                height={100}
                            />
                            <YAxis tick={{ fill: '#6b7280' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="total" name="סה״כ שאלות" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="correct" name="תשובות נכונות" fill="#10b981" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="accuracy" name="אחוז דיוק" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                        </RechartsBarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-96 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>אין מספיק נתונים להצגת גרף</p>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Weekly Progress Line Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-3xl p-8 shadow-2xl"
            >
                <div className="flex items-center gap-3 mb-6">
                    <LineChart className="w-8 h-8 text-blue-600" />
                    <h3 className="text-2xl font-black text-gray-800">התקדמות שבועית</h3>
                </div>

                {weeklyProgress.length > 0 && weeklyProgress.some(d => d.questions > 0) ? (
                    <ResponsiveContainer width="100%" height={350}>
                        <RechartsLineChart data={weeklyProgress}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" tick={{ fill: '#6b7280' }} />
                            <YAxis tick={{ fill: '#6b7280' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="questions"
                                name="מספר שאלות"
                                stroke="#8b5cf6"
                                strokeWidth={3}
                                dot={{ fill: '#8b5cf6', r: 6 }}
                                activeDot={{ r: 8 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="accuracy"
                                name="אחוז דיוק"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={{ fill: '#10b981', r: 6 }}
                                activeDot={{ r: 8 }}
                            />
                        </RechartsLineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-80 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>אין נתוני פעילות השבוע</p>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Difficulty Distribution Pie Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-3xl p-8 shadow-2xl"
            >
                <div className="flex items-center gap-3 mb-6">
                    <PieChart className="w-8 h-8 text-pink-600" />
                    <h3 className="text-2xl font-black text-gray-800">התפלגות רמות קושי</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {difficultyData.some(d => d.value > 0) ? (
                        <>
                            <ResponsiveContainer width="100%" height={300}>
                                <RechartsPieChart>
                                    <Pie
                                        data={difficultyData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, value, percent }) =>
                                            value > 0 ? `${name}: ${value} (${(percent * 100).toFixed(0)}%)` : ''
                                        }
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {difficultyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </RechartsPieChart>
                            </ResponsiveContainer>

                            <div className="flex flex-col justify-center space-y-4">
                                {difficultyData.map((diff, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <div
                                            className="w-6 h-6 rounded-lg"
                                            style={{ backgroundColor: COLORS.chart[index % COLORS.chart.length] }}
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-gray-800">{diff.name}</span>
                                                <span className="text-sm text-gray-600">{diff.value} שאלות</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="h-2 rounded-full transition-all"
                                                    style={{
                                                        width: `${diff.accuracy}%`,
                                                        backgroundColor: COLORS.chart[index % COLORS.chart.length]
                                                    }}
                                                />
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                דיוק: {diff.accuracy}%
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="md:col-span-2 h-80 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p>אין נתוני רמות קושי</p>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Time Distribution Area Chart */}
            {timeDistribution.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-3xl p-8 shadow-2xl"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <Clock className="w-8 h-8 text-orange-600" />
                        <h3 className="text-2xl font-black text-gray-800">פעילות לפי שעות</h3>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={timeDistribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="hour" tick={{ fill: '#6b7280' }} />
                            <YAxis tick={{ fill: '#6b7280' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="questions"
                                name="מספר שאלות"
                                stroke="#f59e0b"
                                fill="#fbbf24"
                                fillOpacity={0.6}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>
            )}

            {/* Summary Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl p-6 shadow-lg"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <Trophy className="w-8 h-8 text-purple-600" />
                        <h4 className="font-black text-gray-800">סה״כ נושאים</h4>
                    </div>
                    <p className="text-4xl font-black text-purple-600">
                        {Object.keys(analytics.byTopic || {}).length}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-br from-green-100 to-green-50 rounded-2xl p-6 shadow-lg"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <Flame className="w-8 h-8 text-green-600" />
                        <h4 className="font-black text-gray-800">סטריק נוכחי</h4>
                    </div>
                    <p className="text-4xl font-black text-green-600">
                        {analytics.streaks?.current || 0} ימים
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl p-6 shadow-lg"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <Clock className="w-8 h-8 text-blue-600" />
                        <h4 className="font-black text-gray-800">זמן כולל</h4>
                    </div>
                    <p className="text-4xl font-black text-blue-600">
                        {Math.round(analytics.timeSpent || 0)} דק׳
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                    className="bg-gradient-to-br from-pink-100 to-pink-50 rounded-2xl p-6 shadow-lg"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <Star className="w-8 h-8 text-pink-600" />
                        <h4 className="font-black text-gray-800">שיא סטריק</h4>
                    </div>
                    <p className="text-4xl font-black text-pink-600">
                        {analytics.streaks?.max || 0} ימים
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

// 📝 MAIN NOTEBOOK PAGE COMPONENT
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

                {/* AI Insights Panel */}
                <AIInsightsPanel
                    userId={user?.uid}
                    availableTopics={availableTopics}
                    onNavigateToPractice={navigateToPractice}
                    suggestedDifficulty={suggestedDifficulty}
                />

                {/* View Selector */}
                <div className="flex justify-center gap-4 mb-8">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrentView('entries')}
                        className={`px-8 py-4 rounded-2xl font-black text-lg transition-all ${
                            currentView === 'entries'
                                ? 'bg-white text-purple-900 shadow-2xl'
                                : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                    >
                        <BookOpen className="w-6 h-6 inline-block ml-2" />
                        רשומות המחברת
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrentView('analytics')}
                        className={`px-8 py-4 rounded-2xl font-black text-lg transition-all ${
                            currentView === 'analytics'
                                ? 'bg-white text-purple-900 shadow-2xl'
                                : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                    >
                        <BarChart3 className="w-6 h-6 inline-block ml-2" />
                        ניתוחים מתקדמים
                    </motion.button>
                </div>

                {/* Analytics View */}
                {currentView === 'analytics' && (
                    <AdvancedAnalytics analytics={analytics} entries={entries} />
                )}

                {/* Entries View */}
                {currentView === 'entries' && (
                    <>
                        {/* Filters */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/10 backdrop-blur-md rounded-3xl p-6 mb-8 border-2 border-white/20"
                        >
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="relative">
                                    <Search className="absolute right-4 top-4 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="חפש שאלה או נושא..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pr-12 pl-4 py-3 rounded-xl bg-white/90 border-2 border-white/20 focus:border-purple-400 focus:ring-4 focus:ring-purple-400/20 font-bold text-gray-800"
                                    />
                                </div>

                                <select
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    className="px-4 py-3 rounded-xl bg-white/90 border-2 border-white/20 focus:border-purple-400 focus:ring-4 focus:ring-purple-400/20 font-bold text-gray-800"
                                >
                                    <option value="all">🎯 כל הנושאים</option>
                                    {uniqueTopics.map(topic => (
                                        <option key={topic} value={topic}>{topic}</option>
                                    ))}
                                </select>

                                <select
                                    value={selectedDifficulty}
                                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                                    className="px-4 py-3 rounded-xl bg-white/90 border-2 border-white/20 focus:border-purple-400 focus:ring-4 focus:ring-purple-400/20 font-bold text-gray-800"
                                >
                                    <option value="all">⭐ כל הרמות</option>
                                    <option value="easy">🟢 קל</option>
                                    <option value="medium">🟡 בינוני</option>
                                    <option value="hard">🔴 קשה</option>
                                </select>

                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="px-4 py-3 rounded-xl bg-white/90 border-2 border-white/20 focus:border-purple-400 focus:ring-4 focus:ring-purple-400/20 font-bold text-gray-800"
                                >
                                    <option value="date-desc">📅 חדש לישן</option>
                                    <option value="date-asc">📅 ישן לחדש</option>
                                    <option value="topic">📚 לפי נושא</option>
                                    <option value="difficulty">⭐ לפי קושי</option>
                                </select>
                            </div>

                            <div className="mt-4 flex items-center justify-center">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowOnlyIncorrect(!showOnlyIncorrect)}
                                    className={`px-6 py-3 rounded-xl font-bold transition-all ${
                                        showOnlyIncorrect
                                            ? 'bg-red-500 text-white shadow-lg'
                                            : 'bg-white/20 text-white hover:bg-white/30'
                                    }`}
                                >
                                    <AlertCircle className="w-5 h-5 inline-block ml-2" />
                                    {showOnlyIncorrect ? 'הצג הכל' : 'הצג רק טעויות'}
                                </motion.button>
                            </div>
                        </motion.div>

                        {/* Entries List */}
                        <div className="space-y-6">
                            {filteredEntries.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white rounded-3xl p-12 text-center shadow-2xl"
                                >
                                    <motion.div
                                        animate={{ rotate: [0, 10, -10, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <BookOpen className="w-24 h-24 mx-auto mb-6 text-gray-400" />
                                    </motion.div>
                                    <h3 className="text-3xl font-black text-gray-800 mb-4">
                                        {searchQuery || filter !== 'all' || selectedDifficulty !== 'all' || showOnlyIncorrect
                                            ? 'לא נמצאו תוצאות 🔍'
                                            : 'המחברת ריקה ✨'}
                                    </h3>
                                    <p className="text-xl text-gray-600 mb-6">
                                        {searchQuery || filter !== 'all' || selectedDifficulty !== 'all' || showOnlyIncorrect
                                            ? 'נסה לשנות את הסינון או לחפש משהו אחר'
                                            : 'התחל לפתור שאלות והן יישמרו אוטומטית כאן'}
                                    </p>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => navigate('/dashboard')}
                                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-black text-lg shadow-xl"
                                    >
                                        <Play className="w-6 h-6 inline-block ml-2" />
                                        התחל לתרגל עכשיו
                                    </motion.button>
                                </motion.div>
                            ) : (
                                <>
                                    <div className="text-center text-white mb-4">
                                        <span className="text-xl font-bold">
                                            נמצאו {filteredEntries.length} רשומות
                                        </span>
                                    </div>

                                    {filteredEntries.map((entry, index) => (
                                        <motion.div
                                            key={entry.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="bg-white rounded-3xl p-6 shadow-2xl hover:shadow-3xl transition-all"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        {entry.is_correct ? (
                                                            <CheckCircle className="w-8 h-8 text-green-500" />
                                                        ) : (
                                                            <XCircle className="w-8 h-8 text-red-500" />
                                                        )}
                                                        <h3 className="text-2xl font-black text-gray-800">
                                                            {entry.topic || 'נושא לא ידוע'}
                                                        </h3>
                                                        {entry.subtopic && (
                                                            <span className="text-lg text-gray-600">
                                                                • {entry.subtopic}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <span className={`px-4 py-1 rounded-full text-sm font-bold border-2 ${getDifficultyColor(entry.difficulty)}`}>
                                                            {entry.difficulty === 'easy' && '🟢 קל'}
                                                            {entry.difficulty === 'medium' && '🟡 בינוני'}
                                                            {entry.difficulty === 'hard' && '🔴 קשה'}
                                                        </span>

                                                        <span className="text-sm text-gray-500">
                                                            <Calendar className="w-4 h-4 inline-block ml-1" />
                                                            {new Date(entry.created_at).toLocaleDateString('he-IL')}
                                                        </span>

                                                        {entry.time_spent > 0 && (
                                                            <span className="text-sm text-gray-500">
                                                                <Clock className="w-4 h-4 inline-block ml-1" />
                                                                {Math.round(entry.time_spent / 60)} דקות
                                                            </span>
                                                        )}

                                                        {entry.hints_used > 0 && (
                                                            <span className="text-sm text-orange-600">
                                                                <Lightbulb className="w-4 h-4 inline-block ml-1" />
                                                                {entry.hints_used} רמזים
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => toggleEntryExpansion(entry.id)}
                                                        className="p-3 bg-purple-100 hover:bg-purple-200 rounded-xl transition-colors"
                                                    >
                                                        {expandedEntries.has(entry.id) ? (
                                                            <ChevronUp className="w-6 h-6 text-purple-600" />
                                                        ) : (
                                                            <ChevronDown className="w-6 h-6 text-purple-600" />
                                                        )}
                                                    </motion.button>

                                                    {!entry.is_correct && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => retryQuestion(entry)}
                                                            className="p-3 bg-orange-100 hover:bg-orange-200 rounded-xl transition-colors"
                                                        >
                                                            <Repeat className="w-6 h-6 text-orange-600" />
                                                        </motion.button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                                                <p className="text-gray-800 font-medium leading-relaxed">
                                                    {entry.question_text?.substring(0, 150)}
                                                    {entry.question_text?.length > 150 && '...'}
                                                </p>
                                            </div>

                                            <AnimatePresence>
                                                {expandedEntries.has(entry.id) && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="space-y-4 mt-4"
                                                    >
                                                        <div className="bg-blue-50 rounded-2xl p-4">
                                                            <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                                                                <BookOpen className="w-5 h-5" />
                                                                השאלה המלאה:
                                                            </h4>
                                                            <p className="text-gray-800 whitespace-pre-wrap">
                                                                {entry.question_text}
                                                            </p>
                                                        </div>

                                                        {entry.correct_answer && (
                                                            <div className="bg-green-50 rounded-2xl p-4">
                                                                <h4 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                                                                    <CheckCircle className="w-5 h-5" />
                                                                    התשובה הנכונה:
                                                                </h4>
                                                                <p className="text-gray-800">{entry.correct_answer}</p>
                                                            </div>
                                                        )}

                                                        {entry.user_answer && (
                                                            <div className={`rounded-2xl p-4 ${
                                                                entry.is_correct ? 'bg-green-50' : 'bg-red-50'
                                                            }`}>
                                                                <h4 className={`font-bold mb-2 flex items-center gap-2 ${
                                                                    entry.is_correct ? 'text-green-900' : 'text-red-900'
                                                                }`}>
                                                                    {entry.is_correct ? (
                                                                        <>
                                                                            <CheckCircle className="w-5 h-5" />
                                                                            התשובה שלך (נכונה):
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <XCircle className="w-5 h-5" />
                                                                            התשובה שלך (שגויה):
                                                                        </>
                                                                    )}
                                                                </h4>
                                                                <p className="text-gray-800">{entry.user_answer}</p>
                                                            </div>
                                                        )}

                                                        {entry.explanation && (
                                                            <div className="bg-purple-50 rounded-2xl p-4">
                                                                <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                                                                    <Brain className="w-5 h-5" />
                                                                    הסבר:
                                                                </h4>
                                                                <p className="text-gray-800 whitespace-pre-wrap">
                                                                    {entry.explanation}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {entry.notes && (
                                                            <div className="bg-yellow-50 rounded-2xl p-4">
                                                                <h4 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                                                                    <MessageCircle className="w-5 h-5" />
                                                                    הערות:
                                                                </h4>
                                                                <p className="text-gray-800">{entry.notes}</p>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    ))}
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default NotebookPage;