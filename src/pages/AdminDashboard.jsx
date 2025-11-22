// src/pages/AdminDashboard.jsx - ENHANCED WITH MISSIONS MANAGEMENT
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
    Users, BookOpen, Bell, Code, MessageSquare, Upload,
    Brain, TrendingUp, Award, Target, Clock, Flame,
    ChevronRight, User, Eye, Settings, BarChart3,
    GraduationCap, FileText, Zap, Star, Activity, Plus, X
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import MissionCreator from '../components/admin/MissionCreator';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalQuestions: 0,
        totalExams: 0,
        totalMissions: 0,
        completedMissions: 0,
        activeMissions: 0
    });
    const [loading, setLoading] = useState(true);
    const [recentUsers, setRecentUsers] = useState([]);
    const [showMissionCreator, setShowMissionCreator] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        loadDashboardStats();
    }, []);

    const loadDashboardStats = async () => {
        try {
            setLoading(true);

            // Load overall stats
            const statsResponse = await axios.get(`${API_URL}/api/admin/dashboard-stats`);
            if (statsResponse.data.success) {
                setStats(prev => ({ ...prev, ...statsResponse.data.stats }));
            }

            // Load mission stats
            try {
                const missionStatsResponse = await axios.get(`${API_URL}/api/missions/admin/stats`);
                if (missionStatsResponse.data.success) {
                    setStats(prev => ({
                        ...prev,
                        activeMissions: missionStatsResponse.data.stats.active_missions || 0,
                        completedMissions: missionStatsResponse.data.stats.completed_missions || 0,
                        totalMissions: (missionStatsResponse.data.stats.active_missions || 0) +
                            (missionStatsResponse.data.stats.completed_missions || 0)
                    }));
                }
            } catch (e) {
                console.log('Mission stats not available yet');
            }

            // Load recent users
            const usersResponse = await axios.get(`${API_URL}/api/admin/users?limit=5`);
            if (usersResponse.data.success) {
                setRecentUsers(usersResponse.data.users || []);
            }
        } catch (error) {
            console.error('❌ Error loading dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const openMissionCreator = (userId, userName) => {
        setSelectedUser({ id: userId, name: userName });
        setShowMissionCreator(true);
    };

    const adminSections = [
        {
            title: 'ניהול תלמידים',
            description: 'צפה בכל התלמידים, הקצה משימות ושלח הודעות אישיות',
            icon: Users,
            color: 'from-purple-600 to-pink-600',
            path: '/admin/users',
            badge: stats.totalUsers
        },
        {
            title: 'ניהול משימות',
            description: 'צור משימות חכמות עם מעקב אחר התקדמות ומניעת כפילויות',
            icon: Target,
            color: 'from-orange-600 to-red-600',
            path: '/admin/missions',
            badge: stats.activeMissions,
            isNew: true
        },
        {
            title: 'העלאת מבחנים',
            description: 'העלה מבחני בגרות והפוך אותם למבחנים אינטראקטיביים',
            icon: Upload,
            color: 'from-blue-600 to-cyan-600',
            path: '/admin',
            badge: stats.totalExams,
            isCurrentPage: true
        },
        {
            title: 'ניהול תכנית לימודים',
            description: 'ערוך שיעורים, נושאים וחומרי לימוד',
            icon: BookOpen,
            color: 'from-green-600 to-emerald-600',
            path: '/admin/course/mathematics/curriculum'
        },
        {
            title: 'קודי הרשמה',
            description: 'צור וניהל קודי הרשמה ייחודיים',
            icon: Code,
            color: 'from-indigo-600 to-purple-600',
            path: '/admin/codes'
        },
        {
            title: 'התראות מערכת',
            description: 'שלח הודעות והתראות לכל המשתמשים',
            icon: Bell,
            color: 'from-yellow-600 to-orange-600',
            path: '/admin/notifications'
        },
        {
            title: 'העלאת בעיות',
            description: 'הוסף בעיות תרגול למאגר השאלות',
            icon: Brain,
            color: 'from-pink-600 to-rose-600',
            path: '/admin/problems'
        },
        {
            title: 'אישיויות AI',
            description: 'נהל את האישיויות והטונים של נקסון',
            icon: MessageSquare,
            color: 'from-teal-600 to-cyan-600',
            path: '/admin/ai-upload'
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                <div className="animate-spin w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4" dir="rtl">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-5xl font-black text-white mb-2">
                                👨‍💼 לוח הבקרה - Admin
                            </h1>
                            <p className="text-xl text-gray-400">
                                ברוך הבא, {user?.name || user?.displayName}! 🚀
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 bg-green-500/20 rounded-full text-green-400 font-bold text-sm">
                                🟢 המערכת פעילה
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 shadow-xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <Users className="w-12 h-12 text-white" />
                            <div className="text-right">
                                <p className="text-5xl font-black text-white">{stats.totalUsers}</p>
                                <p className="text-white/90 font-bold">תלמידים</p>
                            </div>
                        </div>
                        <div className="text-white/80 text-sm">
                            {stats.activeUsers} פעילים השבוע
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl p-6 shadow-xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <Target className="w-12 h-12 text-white" />
                            <div className="text-right">
                                <p className="text-5xl font-black text-white">{stats.activeMissions}</p>
                                <p className="text-white/90 font-bold">משימות פעילות</p>
                            </div>
                        </div>
                        <div className="text-white/80 text-sm">
                            {stats.completedMissions} הושלמו
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-6 shadow-xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <Brain className="w-12 h-12 text-white" />
                            <div className="text-right">
                                <p className="text-5xl font-black text-white">{stats.totalQuestions}</p>
                                <p className="text-white/90 font-bold">שאלות</p>
                            </div>
                        </div>
                        <div className="text-white/80 text-sm">
                            סה"כ שאלות במערכת
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-6 shadow-xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <FileText className="w-12 h-12 text-white" />
                            <div className="text-right">
                                <p className="text-5xl font-black text-white">{stats.totalExams}</p>
                                <p className="text-white/90 font-bold">מבחנים</p>
                            </div>
                        </div>
                        <div className="text-white/80 text-sm">
                            מבחנים שהועלו למערכת
                        </div>
                    </motion.div>
                </div>

                {/* Quick Actions / Recent Activity Grid */}
                <div className="grid lg:grid-cols-3 gap-8 mb-8">
                    {/* Admin Sections - 2 columns */}
                    <div className="lg:col-span-2">
                        <h2 className="text-3xl font-black text-white mb-6 flex items-center gap-3">
                            <Settings className="w-8 h-8 text-purple-400" />
                            כלי ניהול
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {adminSections.map((section, index) => (
                                <motion.div
                                    key={section.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ scale: 1.03, y: -5 }}
                                    onClick={() => navigate(section.path)}
                                    className={`relative bg-gray-800 rounded-2xl p-6 cursor-pointer border-2 transition-all ${
                                        section.isCurrentPage
                                            ? 'border-purple-500 shadow-xl shadow-purple-500/20'
                                            : 'border-gray-700 hover:border-gray-600'
                                    }`}
                                >
                                    {section.badge !== undefined && (
                                        <div className="absolute top-4 left-4 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                                            <span className="text-white font-black text-sm">{section.badge}</span>
                                        </div>
                                    )}

                                    {section.isNew && (
                                        <div className="absolute top-4 left-4 px-3 py-1 bg-green-500 rounded-full">
                                            <span className="text-white font-black text-xs">חדש!</span>
                                        </div>
                                    )}

                                    <div className={`w-14 h-14 bg-gradient-to-br ${section.color} rounded-xl flex items-center justify-center mb-4`}>
                                        <section.icon className="w-7 h-7 text-white" />
                                    </div>

                                    <h3 className="text-xl font-black text-white mb-2">
                                        {section.title}
                                    </h3>
                                    <p className="text-gray-400 text-sm mb-4">
                                        {section.description}
                                    </p>

                                    <div className="flex items-center text-purple-400 font-bold text-sm">
                                        <span>כנס לניהול</span>
                                        <ChevronRight className="w-5 h-5 mr-1" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Users - 1 column */}
                    <div className="lg:col-span-1">
                        <h2 className="text-3xl font-black text-white mb-6 flex items-center gap-3">
                            <Activity className="w-8 h-8 text-green-400" />
                            תלמידים אחרונים
                        </h2>
                        <div className="bg-gray-800 rounded-2xl p-6 border-2 border-gray-700">
                            {recentUsers.length === 0 ? (
                                <div className="text-center py-8">
                                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-400">אין תלמידים עדיין</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {recentUsers.map((student, index) => (
                                        <motion.div
                                            key={student.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="bg-gray-700/50 rounded-xl p-3"
                                        >
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <User className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-white font-bold truncate">
                                                        {student.name || student.displayName}
                                                    </h4>
                                                    <p className="text-xs text-gray-400 truncate">
                                                        {student.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => navigate(`/admin/user/${student.id}`)}
                                                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    צפה
                                                </button>
                                                <button
                                                    onClick={() => openMissionCreator(student.id, student.name || student.displayName)}
                                                    className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    משימה
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => navigate('/admin/users')}
                                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Users className="w-5 h-5" />
                                        <span>צפה בכל התלמידים</span>
                                        <ChevronRight className="w-5 h-5" />
                                    </motion.button>
                                </div>
                            )}
                        </div>

                        {/* Quick Stats */}
                        <div className="mt-6 bg-gray-800 rounded-2xl p-6 border-2 border-gray-700">
                            <h3 className="text-xl font-black text-white mb-4">סטטיסטיקות מהירות</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" />
                                        דיוק ממוצע
                                    </span>
                                    <span className="text-green-400 font-black">
                                        {stats.averageAccuracy || 0}%
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400 flex items-center gap-2">
                                        <Flame className="w-4 h-4" />
                                        רצף ממוצע
                                    </span>
                                    <span className="text-orange-400 font-black">
                                        {stats.averageStreak || 0} ימים
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        זמן לימוד כולל
                                    </span>
                                    <span className="text-blue-400 font-black">
                                        {Math.round((stats.totalLearningTime || 0) / 60)} שעות
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800 rounded-2xl p-6 border-2 border-gray-700"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-black">נקסון AI - מערכת לימוד חכמה</h3>
                                <p className="text-gray-400 text-sm">גרסה 2.0 • עדכון אחרון: {new Date().toLocaleDateString('he-IL')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 bg-blue-500/20 rounded-full text-blue-400 font-bold text-sm">
                                API: {API_URL}
                            </div>
                            <div className="px-4 py-2 bg-green-500/20 rounded-full text-green-400 font-bold text-sm flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                מחובר
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Mission Creator Modal */}
            <AnimatePresence>
                {showMissionCreator && selectedUser && (
                    <MissionCreator
                        userId={selectedUser.id}
                        userName={selectedUser.name}
                        onClose={() => {
                            setShowMissionCreator(false);
                            setSelectedUser(null);
                        }}
                        onCreated={() => {
                            loadDashboardStats();
                            toast.success('✅ משימה נוצרה בהצלחה!');
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDashboard;