// src/pages/PersonalizedDashboard.jsx - SIMPLIFIED PERSONAL AREA (אזור אישי)
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    User, Calendar, Award, TrendingUp, ArrowLeft,
    BookOpen, Target, Clock, Zap, MessageSquare,
    CheckCircle2, Flame
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { profileService } from '../services/profileService';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const PersonalizedDashboard = () => {
    const navigate = useNavigate();
    const { user, studentProfile, nexonProfile } = useAuthStore();
    const profile = studentProfile || nexonProfile;

    const [greeting, setGreeting] = useState('');
    const [adminMessage, setAdminMessage] = useState('');
    const [stats, setStats] = useState({
        completedMissions: 0,
        openMissions: 0,
        learningStreak: 0,
        totalLearningTime: 0
    });
    const [loading, setLoading] = useState(true);

    // Get user info
    const userName = profile?.name || user?.displayName || user?.email?.split('@')[0] || 'תלמיד';
    const userAge = profile?.age || '';
    const userGrade = profile?.grade || user?.grade || '';

    useEffect(() => {
        // Set greeting based on time of day
        const hour = new Date().getHours();
        let greetingText = '';
        if (hour < 12) greetingText = `בוקר טוב ${userName}`;
        else if (hour < 18) greetingText = `שלום ${userName}`;
        else greetingText = `ערב טוב ${userName}`;
        setGreeting(greetingText);
    }, [userName]);

    useEffect(() => {
        if (user?.uid) {
            loadPersonalAreaData();
        }
    }, [user?.uid]);

    const loadPersonalAreaData = async () => {
        try {
            setLoading(true);

            // Load stats from backend
            const userStats = await profileService.getUserStats(user.uid);

            // Load admin message for this user
            const messageResponse = await fetch(`${API_URL}/api/admin/user-message/${user.uid}`);
            const messageData = await messageResponse.json();

            if (userStats) {
                setStats({
                    completedMissions: userStats.completedMissions || 0,
                    openMissions: userStats.openMissions || 0,
                    learningStreak: userStats.streak || 0,
                    totalLearningTime: Math.round((userStats.practiceTime || 0) / 60) // Convert to minutes
                });
            }

            if (messageData.success && messageData.message) {
                setAdminMessage(messageData.message);
            }

        } catch (error) {
            console.error('❌ Error loading personal area:', error);
        } finally {
            setLoading(false);
        }
    };

    const navigateToLearningSpace = () => {
        navigate('/learning-space');
        toast.success('עובר למרחב הלמידה! 🚀');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="text-white"
                >
                    <BookOpen className="w-16 h-16" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" dir="rtl">
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-12 space-y-6 md:space-y-8">

                {/* Header - Greeting */}
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
                        {greeting} 👋
                    </motion.h1>
                </motion.div>

                {/* Section 1: Personal Details */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/95 backdrop-blur-lg rounded-3xl p-6 md:p-8 shadow-2xl"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl">
                            <User className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900">פרטים אישיים</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200">
                            <p className="text-sm text-blue-700 mb-2 font-bold">שם מלא</p>
                            <p className="text-2xl font-black text-blue-900">{userName}</p>
                        </div>

                        {userAge && (
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-200">
                                <p className="text-sm text-purple-700 mb-2 font-bold">גיל</p>
                                <p className="text-2xl font-black text-purple-900">{userAge}</p>
                            </div>
                        )}

                        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-6 border-2 border-pink-200">
                            <p className="text-sm text-pink-700 mb-2 font-bold">כיתה</p>
                            <p className="text-2xl font-black text-pink-900">{userGrade}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Section 2: Admin Message from Nexon */}
                {adminMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative overflow-hidden bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 rounded-3xl p-8 shadow-2xl"
                    >
                        <motion.div
                            className="absolute inset-0 opacity-30"
                            animate={{
                                backgroundPosition: ['0% 0%', '100% 100%'],
                            }}
                            transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
                            style={{
                                backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.3) 0%, transparent 50%)',
                                backgroundSize: '200% 200%',
                            }}
                        />

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-6">
                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="p-4 bg-white/30 backdrop-blur-sm rounded-2xl"
                                >
                                    <MessageSquare className="w-10 h-10 text-white" />
                                </motion.div>
                                <div>
                                    <h2 className="text-3xl font-black text-white">הודעה מנקסון 💡</h2>
                                    <p className="text-white/90 text-lg">מיוחד בשבילך</p>
                                </div>
                            </div>

                            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border-2 border-white/30">
                                <p className="text-xl md:text-2xl text-white font-bold leading-relaxed whitespace-pre-wrap">
                                    {adminMessage}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Section 3: My Goals Statistics */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/95 backdrop-blur-lg rounded-3xl p-6 md:p-8 shadow-2xl"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl">
                            <Target className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900">היעדים שלי 🎯</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Completed Missions */}
                        <motion.div
                            whileHover={{ scale: 1.05, y: -5 }}
                            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 text-center"
                        >
                            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                            <p className="text-4xl font-black text-green-900 mb-2">
                                {stats.completedMissions}
                            </p>
                            <p className="text-sm font-bold text-green-700">משימות שנסגרו</p>
                        </motion.div>

                        {/* Open Missions */}
                        <motion.div
                            whileHover={{ scale: 1.05, y: -5 }}
                            className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 border-2 border-orange-200 text-center"
                        >
                            <BookOpen className="w-12 h-12 text-orange-600 mx-auto mb-3" />
                            <p className="text-4xl font-black text-orange-900 mb-2">
                                {stats.openMissions}
                            </p>
                            <p className="text-sm font-bold text-orange-700">משימות פתוחות</p>
                        </motion.div>

                        {/* Learning Streak */}
                        <motion.div
                            whileHover={{ scale: 1.05, y: -5 }}
                            className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border-2 border-red-200 text-center"
                        >
                            <Flame className="w-12 h-12 text-red-600 mx-auto mb-3" />
                            <p className="text-4xl font-black text-red-900 mb-2">
                                {stats.learningStreak}
                            </p>
                            <p className="text-sm font-bold text-red-700">רצף ימי למידה</p>
                        </motion.div>

                        {/* Total Learning Time */}
                        <motion.div
                            whileHover={{ scale: 1.05, y: -5 }}
                            className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200 text-center"
                        >
                            <Clock className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                            <p className="text-4xl font-black text-blue-900 mb-2">
                                {stats.totalLearningTime}
                            </p>
                            <p className="text-sm font-bold text-blue-700">דקות למידה</p>
                        </motion.div>
                    </div>

                    {/* Additional Stats Insights */}
                    <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                        <div className="flex items-start gap-3">
                            <Zap className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                            <div>
                                <p className="font-bold text-purple-900 mb-2">משוב נקודתי מנקסון:</p>
                                <p className="text-gray-800 leading-relaxed">
                                    {stats.completedMissions === 0 && stats.openMissions === 0 && (
                                        "בוא נתחיל! יש הרבה משימות מעניינות שמחכות לך במרחב הלמידה 🚀"
                                    )}
                                    {stats.completedMissions > 0 && stats.learningStreak === 0 && (
                                        `כל הכבוד על השלמת ${stats.completedMissions} משימות! בוא ננסה לשמור על רצף למידה יומי 💪`
                                    )}
                                    {stats.learningStreak >= 1 && stats.learningStreak < 3 && (
                                        `יפה מאוד! רצף של ${stats.learningStreak} ימים. המשך ככה! 🔥`
                                    )}
                                    {stats.learningStreak >= 3 && stats.learningStreak < 7 && (
                                        `מדהים! ${stats.learningStreak} ימים ברצף! אתה בדרך למצוינות! ⭐`
                                    )}
                                    {stats.learningStreak >= 7 && (
                                        `אלוף אמיתי! ${stats.learningStreak} ימים ברצף! המוטיבציה שלך מעוררת השראה! 🏆`
                                    )}
                                    {stats.openMissions > 0 && stats.completedMissions === 0 && (
                                        `יש ${stats.openMissions} משימות שמחכות לך. בוא נתחיל לסגור אותן! 💪`
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Section 4: Move to Learning Space Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-center"
                >
                    <motion.button
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={navigateToLearningSpace}
                        className="group relative px-12 py-6 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white rounded-3xl font-black text-2xl shadow-2xl hover:shadow-3xl transition-all overflow-hidden"
                    >
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 opacity-0 group-hover:opacity-100 blur-xl transition-opacity"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />

                        <div className="relative z-10 flex items-center justify-center gap-4">
                            <BookOpen className="w-10 h-10" />
                            <span>מעבר למרחב הלמידה</span>
                            <motion.div
                                animate={{ x: [0, 10, 0] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            >
                                <Zap className="w-10 h-10" />
                            </motion.div>
                        </div>
                    </motion.button>

                    <p className="mt-4 text-white text-lg font-bold">
                        כל המשימות והתרגולים שלך מחכים לך שם! 🚀
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default PersonalizedDashboard;