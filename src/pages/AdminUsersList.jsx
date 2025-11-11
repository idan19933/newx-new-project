// src/pages/AdminUsersList.jsx - VIEW ALL STUDENTS
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Users, Search, Filter, ChevronRight, User, Mail,
    Calendar, Award, TrendingUp, CheckCircle2, XCircle,
    ArrowLeft, Clock, Brain, Target, Flame, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const AdminUsersList = () => {
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterGrade, setFilterGrade] = useState('all');
    const [sortBy, setSortBy] = useState('recent'); // recent, name, grade, activity

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/admin/users`);
            const data = await response.json();

            if (data.success) {
                setUsers(data.users || []);
            } else {
                toast.error('שגיאה בטעינת המשתמשים');
            }
        } catch (error) {
            console.error('❌ Error loading users:', error);
            toast.error('שגיאה בטעינת המשתמשים');
        } finally {
            setLoading(false);
        }
    };

    const getFilteredAndSortedUsers = () => {
        let filtered = [...users];

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(user =>
                user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Grade filter
        if (filterGrade !== 'all') {
            filtered = filtered.filter(user => user.grade === filterGrade);
        }

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return (a.name || a.displayName || '').localeCompare(b.name || b.displayName || '');
                case 'grade':
                    return (a.grade || '').localeCompare(b.grade || '');
                case 'activity':
                    return (b.stats?.questionsAnswered || 0) - (a.stats?.questionsAnswered || 0);
                case 'recent':
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });

        return filtered;
    };

    const filteredUsers = getFilteredAndSortedUsers();

    const grades = ['all', 'grade7', 'grade8', 'grade9', 'grade10', 'grade11', 'grade12'];
    const gradeLabels = {
        'all': 'כל הכיתות',
        'grade7': 'כיתה ז',
        'grade8': 'כיתה ח',
        'grade9': 'כיתה ט',
        'grade10': 'כיתה י',
        'grade11': 'כיתה יא',
        'grade12': 'כיתה יב'
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-white text-xl font-bold">טוען משתמשים...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-8 px-4" dir="rtl">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/admin')}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>חזרה</span>
                    </motion.button>

                    <div className="text-center flex-1">
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-2">ניהול תלמידים</h1>
                        <p className="text-gray-400">סה"כ {users.length} תלמידים במערכת</p>
                    </div>

                    <div className="w-24"></div> {/* Spacer for balance */}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 shadow-xl"
                    >
                        <Users className="w-10 h-10 text-white mb-3" />
                        <p className="text-4xl font-black text-white">{users.length}</p>
                        <p className="text-white/90 font-bold">סה"כ תלמידים</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-6 shadow-xl"
                    >
                        <CheckCircle2 className="w-10 h-10 text-white mb-3" />
                        <p className="text-4xl font-black text-white">
                            {users.filter(u => u.stats?.questionsAnswered > 0).length}
                        </p>
                        <p className="text-white/90 font-bold">פעילים</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-6 shadow-xl"
                    >
                        <Brain className="w-10 h-10 text-white mb-3" />
                        <p className="text-4xl font-black text-white">
                            {users.reduce((sum, u) => sum + (u.stats?.questionsAnswered || 0), 0)}
                        </p>
                        <p className="text-white/90 font-bold">סה"כ שאלות</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl p-6 shadow-xl"
                    >
                        <Flame className="w-10 h-10 text-white mb-3" />
                        <p className="text-4xl font-black text-white">
                            {Math.round(users.reduce((sum, u) => sum + (u.stats?.streak || 0), 0) / (users.length || 1))}
                        </p>
                        <p className="text-white/90 font-bold">רצף ממוצע</p>
                    </motion.div>
                </div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800 rounded-2xl p-6 mb-8 border-2 border-gray-700"
                >
                    <div className="grid md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute right-4 top-4 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="חפש תלמיד..."
                                className="w-full pr-12 pl-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                            />
                        </div>

                        {/* Grade Filter */}
                        <select
                            value={filterGrade}
                            onChange={(e) => setFilterGrade(e.target.value)}
                            className="px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                        >
                            {grades.map(grade => (
                                <option key={grade} value={grade}>{gradeLabels[grade]}</option>
                            ))}
                        </select>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                        >
                            <option value="recent">לפי תאריך הרשמה</option>
                            <option value="name">לפי שם</option>
                            <option value="grade">לפי כיתה</option>
                            <option value="activity">לפי פעילות</option>
                        </select>
                    </div>

                    <div className="mt-4 text-gray-400 text-sm">
                        מוצגים {filteredUsers.length} מתוך {users.length} תלמידים
                    </div>
                </motion.div>

                {/* Users List */}
                {filteredUsers.length === 0 ? (
                    <div className="bg-gray-800 rounded-2xl p-12 text-center border-2 border-gray-700">
                        <Users className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-gray-400 mb-2">לא נמצאו תלמידים</h3>
                        <p className="text-gray-500">נסה לשנות את הסינון או החיפוש</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredUsers.map((user, index) => (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ scale: 1.02, x: 10 }}
                                onClick={() => navigate(`/admin/user/${user.id}`)}
                                className="bg-gray-800 rounded-2xl p-6 border-2 border-gray-700 hover:border-purple-500 cursor-pointer transition-all shadow-lg hover:shadow-2xl"
                            >
                                <div className="flex items-center justify-between">
                                    {/* User Info */}
                                    <div className="flex items-center gap-6 flex-1">
                                        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                                            <User className="w-8 h-8 text-white" />
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="text-xl font-black text-white mb-1">
                                                {user.name || user.displayName || 'ללא שם'}
                                            </h3>
                                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-4 h-4" />
                                                    {user.email}
                                                </span>
                                                {user.grade && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {gradeLabels[user.grade] || user.grade}
                                                    </span>
                                                )}
                                                {user.track && (
                                                    <span className="flex items-center gap-1">
                                                        <Award className="w-4 h-4" />
                                                        {user.track}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="hidden md:flex items-center gap-6">
                                        <div className="text-center">
                                            <div className="flex items-center gap-2 text-blue-400 mb-1">
                                                <Brain className="w-5 h-5" />
                                                <span className="text-2xl font-black">{user.stats?.questionsAnswered || 0}</span>
                                            </div>
                                            <p className="text-xs text-gray-400">שאלות</p>
                                        </div>

                                        <div className="text-center">
                                            <div className="flex items-center gap-2 text-green-400 mb-1">
                                                <Target className="w-5 h-5" />
                                                <span className="text-2xl font-black">
                                                    {user.stats?.questionsAnswered > 0
                                                        ? Math.round((user.stats.correctAnswers / user.stats.questionsAnswered) * 100)
                                                        : 0}%
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400">דיוק</p>
                                        </div>

                                        <div className="text-center">
                                            <div className="flex items-center gap-2 text-orange-400 mb-1">
                                                <Flame className="w-5 h-5" />
                                                <span className="text-2xl font-black">{user.stats?.streak || 0}</span>
                                            </div>
                                            <p className="text-xs text-gray-400">רצף</p>
                                        </div>

                                        {/* Missions Count */}
                                        <div className="text-center">
                                            <div className="flex items-center gap-2 text-purple-400 mb-1">
                                                <CheckCircle2 className="w-5 h-5" />
                                                <span className="text-2xl font-black">
                                                    {user.stats?.completedMissions || 0}/{user.stats?.totalMissions || 0}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400">משימות</p>
                                        </div>
                                    </div>

                                    {/* View Button */}
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold"
                                    >
                                        <Eye className="w-5 h-5" />
                                        <span>צפה</span>
                                        <ChevronRight className="w-5 h-5" />
                                    </motion.div>
                                </div>

                                {/* Mobile Stats */}
                                <div className="md:hidden mt-4 pt-4 border-t border-gray-700">
                                    <div className="grid grid-cols-4 gap-2 text-center">
                                        <div>
                                            <div className="text-blue-400 text-xl font-black">{user.stats?.questionsAnswered || 0}</div>
                                            <div className="text-xs text-gray-400">שאלות</div>
                                        </div>
                                        <div>
                                            <div className="text-green-400 text-xl font-black">
                                                {user.stats?.questionsAnswered > 0
                                                    ? Math.round((user.stats.correctAnswers / user.stats.questionsAnswered) * 100)
                                                    : 0}%
                                            </div>
                                            <div className="text-xs text-gray-400">דיוק</div>
                                        </div>
                                        <div>
                                            <div className="text-orange-400 text-xl font-black">{user.stats?.streak || 0}</div>
                                            <div className="text-xs text-gray-400">רצף</div>
                                        </div>
                                        <div>
                                            <div className="text-purple-400 text-xl font-black">
                                                {user.stats?.completedMissions || 0}/{user.stats?.totalMissions || 0}
                                            </div>
                                            <div className="text-xs text-gray-400">משימות</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsersList;