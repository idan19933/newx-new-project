// src/pages/AdminMissions.jsx - FULL MISSIONS MANAGEMENT PAGE
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
    Target, Plus, Users, Brain, BookOpen, CheckCircle,
    Clock, Trophy, TrendingUp, Edit, Trash2, Eye,
    Filter, Search, Calendar, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import MissionCreator from '../components/admin/MissionCreator';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const AdminMissions = () => {
    const navigate = useNavigate();
    const [missions, setMissions] = useState([]);
    const [stats, setStats] = useState({
        active: 0,
        completed: 0,
        total: 0
    });
    const [loading, setLoading] = useState(true);
    const [showMissionCreator, setShowMissionCreator] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);

    useEffect(() => {
        loadMissions();
        loadUsers();
    }, []);

    const loadMissions = async () => {
        try {
            setLoading(true);

            // Load all missions
            const missionsRes = await axios.get(`${API_URL}/api/missions/admin/all`);
            if (missionsRes.data.success) {
                setMissions(missionsRes.data.missions || []);
            }

            // Load stats
            const statsRes = await axios.get(`${API_URL}/api/missions/admin/stats`);
            if (statsRes.data.success) {
                const s = statsRes.data.stats;
                setStats({
                    active: s.active_missions || 0,
                    completed: s.completed_missions || 0,
                    total: (s.active_missions || 0) + (s.completed_missions || 0)
                });
            }
        } catch (error) {
            console.error('❌ Error loading missions:', error);
            toast.error('שגיאה בטעינת משימות');
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/admin/users`);
            if (response.data.success) {
                setUsers(response.data.users || []);
            }
        } catch (error) {
            console.error('❌ Error loading users:', error);
        }
    };

    const openMissionCreator = (user) => {
        setSelectedUser(user);
        setShowMissionCreator(true);
    };

    const handleDelete = async (missionId) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) return;

        try {
            const response = await axios.delete(`${API_URL}/api/missions/delete/${missionId}`);
            if (response.data.success) {
                toast.success('✅ משימה נמחקה');
                loadMissions();
            }
        } catch (error) {
            console.error('❌ Error deleting mission:', error);
            toast.error('שגיאה במחיקת משימה');
        }
    };

    const filteredMissions = missions.filter(m => {
        const matchesStatus = filterStatus === 'all' || m.status === filterStatus;
        const matchesSearch = !searchTerm ||
            m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

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
                            <h1 className="text-5xl font-black text-white mb-2 flex items-center gap-3">
                                <Target className="w-12 h-12 text-orange-400" />
                                ניהול משימות
                            </h1>
                            <p className="text-xl text-gray-400">
                                צור ונהל משימות חכמות עם מעקב מלא
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/admin')}
                                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold"
                            >
                                ← חזור לדשבורד
                            </button>
                            <button
                                onClick={() => setShowMissionCreator(true)}
                                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold flex items-center gap-2 hover:shadow-xl"
                            >
                                <Plus className="w-5 h-5" />
                                משימה חדשה
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl p-6 shadow-xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <Target className="w-12 h-12 text-white" />
                            <div className="text-right">
                                <p className="text-5xl font-black text-white">{stats.active}</p>
                                <p className="text-white/90 font-bold">משימות פעילות</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-6 shadow-xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <CheckCircle className="w-12 h-12 text-white" />
                            <div className="text-right">
                                <p className="text-5xl font-black text-white">{stats.completed}</p>
                                <p className="text-white/90 font-bold">משימות הושלמו</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 shadow-xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <Trophy className="w-12 h-12 text-white" />
                            <div className="text-right">
                                <p className="text-5xl font-black text-white">{stats.total}</p>
                                <p className="text-white/90 font-bold">סה"כ משימות</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Filters */}
                <div className="bg-gray-800 rounded-2xl p-6 mb-8 border-2 border-gray-700">
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="חפש משימה או תלמיד..."
                                className="w-full pr-12 pl-4 py-3 bg-gray-700 text-white rounded-xl border-2 border-gray-600 focus:border-purple-500 focus:outline-none"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilterStatus('all')}
                                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                                    filterStatus === 'all'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                הכל ({missions.length})
                            </button>
                            <button
                                onClick={() => setFilterStatus('active')}
                                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                                    filterStatus === 'active'
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                פעיל ({stats.active})
                            </button>
                            <button
                                onClick={() => setFilterStatus('completed')}
                                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                                    filterStatus === 'completed'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                הושלם ({stats.completed})
                            </button>
                        </div>
                    </div>
                </div>

                {/* Missions List */}
                {filteredMissions.length === 0 ? (
                    <div className="bg-gray-800 rounded-2xl p-12 border-2 border-gray-700 text-center">
                        <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-2xl font-black text-white mb-2">אין משימות</h3>
                        <p className="text-gray-400 mb-6">
                            {searchTerm ? 'לא נמצאו משימות תואמות' : 'התחל ליצור משימות לתלמידים'}
                        </p>
                        <button
                            onClick={() => setShowMissionCreator(true)}
                            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold inline-flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            צור משימה ראשונה
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredMissions.map((mission, index) => (
                            <MissionCard
                                key={mission.id}
                                mission={mission}
                                index={index}
                                onDelete={() => handleDelete(mission.id)}
                                onViewUser={() => navigate(`/admin/user/${mission.user_id}`)}
                            />
                        ))}
                    </div>
                )}

                {/* Quick Create for Users */}
                {users.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-2xl font-black text-white mb-4">יצירה מהירה לתלמיד</h2>
                        <div className="grid md:grid-cols-3 gap-4">
                            {users.slice(0, 6).map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => openMissionCreator(user)}
                                    className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 border-2 border-gray-700 hover:border-purple-500 transition-all text-right"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                                            <Users className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-white font-bold">{user.name || user.displayName}</h4>
                                            <p className="text-gray-400 text-sm">{user.email}</p>
                                        </div>
                                        <Plus className="w-5 h-5 text-purple-400" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Mission Creator Modal */}
            <AnimatePresence>
                {showMissionCreator && (
                    <MissionCreator
                        userId={selectedUser?.id}
                        userName={selectedUser?.name || selectedUser?.displayName}
                        onClose={() => {
                            setShowMissionCreator(false);
                            setSelectedUser(null);
                        }}
                        onCreated={() => {
                            loadMissions();
                            setShowMissionCreator(false);
                            setSelectedUser(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// Mission Card Component
const MissionCard = ({ mission, index, onDelete, onViewUser }) => {
    const Icon = mission.mission_type === 'practice' ? Brain : BookOpen;
    const isCompleted = mission.status === 'completed';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-gray-800 rounded-2xl p-6 border-2 transition-all ${
                isCompleted ? 'border-green-500/30' : 'border-purple-500/30'
            }`}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                    <div className={`w-14 h-14 bg-gradient-to-br ${
                        isCompleted ? 'from-green-600 to-emerald-600' : 'from-orange-600 to-red-600'
                    } rounded-xl flex items-center justify-center`}>
                        {isCompleted ? (
                            <CheckCircle className="w-7 h-7 text-white" />
                        ) : (
                            <Icon className="w-7 h-7 text-white" />
                        )}
                    </div>

                    <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h3 className="text-xl font-black text-white mb-1">{mission.title}</h3>
                                {mission.description && (
                                    <p className="text-gray-400 text-sm mb-2">{mission.description}</p>
                                )}
                            </div>
                            {mission.points > 0 && (
                                <div className="flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full">
                                    <Trophy className="w-4 h-4 text-yellow-400" />
                                    <span className="text-yellow-400 font-bold">{mission.points}</span>
                                </div>
                            )}
                        </div>

                        {/* User Info */}
                        <div className="flex items-center gap-4 mb-4">
                            <button
                                onClick={onViewUser}
                                className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 text-sm transition-colors"
                            >
                                <Users className="w-4 h-4" />
                                <span>{mission.user_name || mission.user_email}</span>
                            </button>

                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                mission.mission_type === 'practice'
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-green-500/20 text-green-400'
                            }`}>
                                {mission.mission_type === 'practice' ? '💪 תרגול' : '📚 הרצאה'}
                            </span>

                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                isCompleted
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-orange-500/20 text-orange-400'
                            }`}>
                                {isCompleted ? '✓ הושלם' : '⏳ פעיל'}
                            </span>
                        </div>

                        {/* Dates */}
                        <div className="flex items-center gap-6 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>נוצר: {new Date(mission.created_at).toLocaleDateString('he-IL')}</span>
                            </div>
                            {mission.deadline && (
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>עד: {new Date(mission.deadline).toLocaleDateString('he-IL')}</span>
                                </div>
                            )}
                            {isCompleted && mission.completed_at && (
                                <div className="flex items-center gap-2 text-green-400">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>הושלם: {new Date(mission.completed_at).toLocaleDateString('he-IL')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={onViewUser}
                        className="w-10 h-10 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center justify-center"
                        title="צפה בתלמיד"
                    >
                        <Eye className="w-5 h-5 text-white" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="w-10 h-10 bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center"
                        title="מחק משימה"
                    >
                        <Trash2 className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default AdminMissions;