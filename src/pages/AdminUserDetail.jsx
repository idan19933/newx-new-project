// src/pages/AdminUserDetail.jsx - FIXED API PATHS VERSION
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, User, Mail, Calendar, Award, MessageSquare,
    Plus, Check, X, Edit2, Save, Trash2, Send, BookOpen,
    Play, FileText, Target, TrendingUp, Clock, Brain,
    AlertCircle, CheckCircle2, Flame, GraduationCap
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const AdminUserDetail = () => {
    const { userId } = useParams();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [missions, setMissions] = useState([]);
    const [adminMessage, setAdminMessage] = useState('');
    const [loading, setLoading] = useState(true);

    // Edit user state
    const [isEditingUser, setIsEditingUser] = useState(false);
    const [editUserData, setEditUserData] = useState({
        displayName: '',
        email: '',
        grade: ''
    });

    // Mission creation modal
    const [showMissionModal, setShowMissionModal] = useState(false);
    const [newMission, setNewMission] = useState({
        title: '',
        description: '',
        type: 'practice',
        topicId: ''
    });

    // Available topics (should come from curriculum)
    const [availableTopics, setAvailableTopics] = useState([]);

    useEffect(() => {
        if (userId) {
            loadUserData();
            loadUserMissions();
            loadAdminMessage();
            loadAvailableTopics();
        }
    }, [userId]);

    const loadUserData = async () => {
        try {
            setLoading(true);

            // Load user profile
            const userResponse = await fetch(`${API_URL}/api/admin/users/${userId}`);
            const userData = await userResponse.json();

            // Load user stats - FIXED PATH
            const statsResponse = await fetch(`${API_URL}/api/admin/profile/stats/${userId}`);
            const statsData = await statsResponse.json();

            if (userData.success) {
                setUser(userData.user);
                setEditUserData({
                    displayName: userData.user.displayName || '',
                    email: userData.user.email || '',
                    grade: userData.user.grade || ''
                });
            }

            if (statsData.success) {
                setStats(statsData.stats);
            }
        } catch (error) {
            console.error('❌ Error loading user data:', error);
            toast.error('שגיאה בטעינת נתוני משתמש');
        } finally {
            setLoading(false);
        }
    };

    const saveUserEdit = async () => {
        if (!editUserData.displayName.trim()) {
            toast.error('אנא הכנס שם');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editUserData)
            });

            const data = await response.json();

            if (data.success) {
                setUser(data.user);
                setIsEditingUser(false);
                toast.success('פרטי המשתמש עודכנו בהצלחה! ✅');
            } else {
                toast.error('שגיאה בעדכון פרטים');
            }
        } catch (error) {
            console.error('❌ Error updating user:', error);
            toast.error('שגיאה בעדכון פרטים');
        }
    };

    const loadUserMissions = async () => {
        try {
            // FIXED PATH
            const response = await fetch(`${API_URL}/api/admin/missions/user/${userId}`);
            const data = await response.json();

            if (data.success) {
                setMissions(data.missions || []);
            }
        } catch (error) {
            console.error('❌ Error loading missions:', error);
        }
    };

    const loadAdminMessage = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/user-message/${userId}`);
            const data = await response.json();

            if (data.success && data.message) {
                setAdminMessage(data.message);
            }
        } catch (error) {
            console.error('❌ Error loading admin message:', error);
        }
    };

    const loadAvailableTopics = async () => {
        try {
            // FIXED PATH
            const response = await fetch(`${API_URL}/api/admin/curriculum/topics`);
            const data = await response.json();

            if (data.success) {
                setAvailableTopics(data.topics || []);
            }
        } catch (error) {
            console.error('❌ Error loading topics:', error);
            // Fallback topics
            setAvailableTopics([
                { id: 'algebra', name: 'אלגברה' },
                { id: 'geometry', name: 'גאומטריה' },
                { id: 'functions', name: 'פונקציות' },
                { id: 'calculus', name: 'חשבון אינפיניטסימלי' },
                { id: 'statistics', name: 'סטטיסטיקה והסתברות' }
            ]);
        }
    };

    const saveAdminMessage = async () => {
        if (!adminMessage.trim()) {
            toast.error('אנא כתוב הודעה');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/admin/user-message/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: adminMessage })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('ההודעה נשמרה בהצלחה! ✅');
            } else {
                toast.error('שגיאה בשמירת ההודעה');
            }
        } catch (error) {
            console.error('❌ Error saving message:', error);
            toast.error('שגיאה בשמירת ההודעה');
        }
    };

    const createMission = async () => {
        if (!newMission.title.trim()) {
            toast.error('אנא הכנס כותרת למשימה');
            return;
        }

        try {
            // FIXED PATH
            const response = await fetch(`${API_URL}/api/admin/missions/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    title: newMission.title,
                    description: newMission.description,
                    type: newMission.type,
                    topicId: newMission.topicId
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('המשימה נוצרה בהצלחה! 🎯');
                setShowMissionModal(false);
                setNewMission({ title: '', description: '', type: 'practice', topicId: '' });
                loadUserMissions();
            } else {
                toast.error('שגיאה ביצירת המשימה');
            }
        } catch (error) {
            console.error('❌ Error creating mission:', error);
            toast.error('שגיאה ביצירת המשימה');
        }
    };

    const deleteMission = async (missionId) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) {
            return;
        }

        try {
            // FIXED PATH
            const response = await fetch(`${API_URL}/api/admin/missions/${missionId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                toast.success('המשימה נמחקה');
                loadUserMissions();
            } else {
                toast.error('שגיאה במחיקת המשימה');
            }
        } catch (error) {
            console.error('❌ Error deleting mission:', error);
            toast.error('שגיאה במחיקת המשימה');
        }
    };

    const toggleMissionComplete = async (missionId, currentStatus) => {
        try {
            // FIXED PATH
            const response = await fetch(`${API_URL}/api/admin/missions/${missionId}/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !currentStatus })
            });

            const data = await response.json();

            if (data.success) {
                toast.success(currentStatus ? 'המשימה סומנה כפתוחה' : 'המשימה סומנה כהושלמה');
                loadUserMissions();
            }
        } catch (error) {
            console.error('❌ Error toggling mission:', error);
            toast.error('שגיאה בעדכון המשימה');
        }
    };

    const getMissionIcon = (type) => {
        switch (type) {
            case 'practice': return <Play className="w-5 h-5" />;
            case 'lecture': return <GraduationCap className="w-5 h-5" />;
            case 'review': return <FileText className="w-5 h-5" />;
            default: return <BookOpen className="w-5 h-5" />;
        }
    };

    const getMissionColor = (type) => {
        switch (type) {
            case 'practice': return 'from-green-500 to-emerald-600';
            case 'lecture': return 'from-blue-500 to-cyan-600';
            case 'review': return 'from-purple-500 to-pink-600';
            default: return 'from-gray-500 to-gray-600';
        }
    };

    const getMissionTypeLabel = (type) => {
        switch (type) {
            case 'practice': return 'תרגול';
            case 'lecture': return 'הרצאה';
            case 'review': return 'חזרה';
            default: return type;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                <div className="animate-spin w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center" dir="rtl">
                <div className="text-center">
                    <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">משתמש לא נמצא</h2>
                    <button
                        onClick={() => navigate('/admin/users')}
                        className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700"
                    >
                        חזרה לרשימת משתמשים
                    </button>
                </div>
            </div>
        );
    }

    const practiceMissions = missions.filter(m => m.type === 'practice');
    const lectureMissions = missions.filter(m => m.type === 'lecture');
    const reviewMissions = missions.filter(m => m.type === 'review');

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-8 px-4" dir="rtl">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/admin/users')}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>חזרה</span>
                    </motion.button>

                    <h1 className="text-4xl font-black text-white">ניהול תלמיד</h1>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Right Column - User Info & Stats */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* User Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 shadow-xl"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                                    <User className="w-10 h-10 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                    {isEditingUser ? (
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={editUserData.displayName}
                                                onChange={(e) => setEditUserData({ ...editUserData, displayName: e.target.value })}
                                                placeholder="שם מלא"
                                                className="w-full px-3 py-2 bg-white/90 rounded-lg text-gray-900 text-lg font-bold"
                                            />
                                            <input
                                                type="email"
                                                value={editUserData.email}
                                                onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                                                placeholder="אימייל"
                                                className="w-full px-3 py-2 bg-white/90 rounded-lg text-gray-900 text-sm"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <h2 className="text-2xl font-black text-white">
                                                {user.name || user.displayName || 'ללא שם'}
                                            </h2>
                                            <p className="text-white/80">{user.email || 'אין אימייל'}</p>
                                        </>
                                    )}
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                        if (isEditingUser) {
                                            saveUserEdit();
                                        } else {
                                            setIsEditingUser(true);
                                        }
                                    }}
                                    className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                                >
                                    {isEditingUser ? (
                                        <Save className="w-5 h-5 text-white" />
                                    ) : (
                                        <Edit2 className="w-5 h-5 text-white" />
                                    )}
                                </motion.button>
                                {isEditingUser && (
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => {
                                            setIsEditingUser(false);
                                            setEditUserData({
                                                displayName: user.displayName || '',
                                                email: user.email || '',
                                                grade: user.grade || ''
                                            });
                                        }}
                                        className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5 text-white" />
                                    </motion.button>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-white">
                                    <Calendar className="w-5 h-5" />
                                    {isEditingUser ? (
                                        <select
                                            value={editUserData.grade}
                                            onChange={(e) => setEditUserData({ ...editUserData, grade: e.target.value })}
                                            className="flex-1 px-3 py-2 bg-white/90 rounded-lg text-gray-900"
                                        >
                                            <option value="">בחר כיתה...</option>
                                            <option value="7">כיתה ז'</option>
                                            <option value="8">כיתה ח'</option>
                                            <option value="9">כיתה ט'</option>
                                            <option value="10">כיתה י'</option>
                                            <option value="11">כיתה י"א</option>
                                            <option value="12">כיתה י"ב</option>
                                        </select>
                                    ) : (
                                        <span>כיתה: {user.grade || 'לא צוין'}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-white">
                                    <Award className="w-5 h-5" />
                                    <span>מסלול: {user.track || user.grade || 'לא צוין'}</span>
                                </div>
                                {user.createdAt && (
                                    <div className="flex items-center gap-3 text-white">
                                        <Clock className="w-5 h-5" />
                                        <span>נרשם: {new Date(user.createdAt).toLocaleDateString('he-IL')}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Stats Card */}
                        {stats && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-gray-800 rounded-2xl p-6 shadow-xl border-2 border-gray-700"
                            >
                                <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                                    <TrendingUp className="w-6 h-6 text-green-400" />
                                    סטטיסטיקות
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-700 rounded-xl p-4">
                                        <Brain className="w-8 h-8 text-blue-400 mb-2" />
                                        <p className="text-3xl font-black text-white">{stats.questionsAnswered || 0}</p>
                                        <p className="text-sm text-gray-400">שאלות</p>
                                    </div>

                                    <div className="bg-gray-700 rounded-xl p-4">
                                        <Target className="w-8 h-8 text-green-400 mb-2" />
                                        <p className="text-3xl font-black text-white">
                                            {stats.questionsAnswered > 0
                                                ? Math.round((stats.correctAnswers / stats.questionsAnswered) * 100)
                                                : 0}%
                                        </p>
                                        <p className="text-sm text-gray-400">דיוק</p>
                                    </div>

                                    <div className="bg-gray-700 rounded-xl p-4">
                                        <Flame className="w-8 h-8 text-orange-400 mb-2" />
                                        <p className="text-3xl font-black text-white">{stats.streak || 0}</p>
                                        <p className="text-sm text-gray-400">רצף ימים</p>
                                    </div>

                                    <div className="bg-gray-700 rounded-xl p-4">
                                        <Clock className="w-8 h-8 text-purple-400 mb-2" />
                                        <p className="text-3xl font-black text-white">
                                            {Math.round((stats.practiceTime || 0) / 60)}
                                        </p>
                                        <p className="text-sm text-gray-400">דקות</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Left Column - Missions & Messages */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Admin Message Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 rounded-2xl p-6 shadow-xl"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <MessageSquare className="w-8 h-8 text-white" />
                                <h3 className="text-2xl font-black text-white">הודעה אישית מנקסון</h3>
                            </div>

                            <textarea
                                value={adminMessage}
                                onChange={(e) => setAdminMessage(e.target.value)}
                                placeholder="כתוב הודעה אישית שתוצג לתלמיד באזור האישי שלו..."
                                className="w-full min-h-[150px] p-4 rounded-xl bg-white/90 border-2 border-white/30 focus:border-white focus:outline-none text-gray-900 text-lg resize-y"
                            />

                            <div className="flex justify-end mt-4">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={saveAdminMessage}
                                    className="flex items-center gap-2 px-6 py-3 bg-white text-orange-600 rounded-xl font-black hover:bg-gray-100 shadow-lg"
                                >
                                    <Send className="w-5 h-5" />
                                    <span>שמור הודעה</span>
                                </motion.button>
                            </div>

                            <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-xl p-4">
                                <p className="text-white text-sm">
                                    💡 <strong>טיפ:</strong> ההודעה תוצג לתלמיד באזור האישי שלו.
                                    השתמש בה למשוב אישי, עידוד, או הנחיות ספציפיות.
                                </p>
                            </div>
                        </motion.div>

                        {/* Missions Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gray-800 rounded-2xl p-6 shadow-xl border-2 border-gray-700"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-black text-white flex items-center gap-2">
                                    <BookOpen className="w-8 h-8 text-purple-400" />
                                    משימות התלמיד
                                </h3>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowMissionModal(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-black hover:shadow-xl"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>משימה חדשה</span>
                                </motion.button>
                            </div>

                            {/* Mission Stats */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-gray-700 rounded-xl p-4 text-center">
                                    <p className="text-3xl font-black text-white">{missions.length}</p>
                                    <p className="text-sm text-gray-400">סה"כ משימות</p>
                                </div>
                                <div className="bg-gray-700 rounded-xl p-4 text-center">
                                    <p className="text-3xl font-black text-green-400">
                                        {missions.filter(m => m.completed).length}
                                    </p>
                                    <p className="text-sm text-gray-400">הושלמו</p>
                                </div>
                                <div className="bg-gray-700 rounded-xl p-4 text-center">
                                    <p className="text-3xl font-black text-orange-400">
                                        {missions.filter(m => !m.completed).length}
                                    </p>
                                    <p className="text-sm text-gray-400">פתוחות</p>
                                </div>
                            </div>

                            {/* Missions List */}
                            {missions.length === 0 ? (
                                <div className="text-center py-12">
                                    <BookOpen className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                                    <p className="text-xl text-gray-400 font-bold">אין עדיין משימות לתלמיד זה</p>
                                    <p className="text-gray-500 mt-2">לחץ על "משימה חדשה" כדי להתחיל</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Practice Missions */}
                                    {practiceMissions.length > 0 && (
                                        <div>
                                            <h4 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
                                                <Play className="w-5 h-5" />
                                                משימות תרגול ({practiceMissions.length})
                                            </h4>
                                            {practiceMissions.map((mission) => (
                                                <MissionCard
                                                    key={mission.id}
                                                    mission={mission}
                                                    onToggle={toggleMissionComplete}
                                                    onDelete={deleteMission}
                                                    getMissionIcon={getMissionIcon}
                                                    getMissionColor={getMissionColor}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Lecture Missions */}
                                    {lectureMissions.length > 0 && (
                                        <div>
                                            <h4 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
                                                <GraduationCap className="w-5 h-5" />
                                                משימות הרצאה ({lectureMissions.length})
                                            </h4>
                                            {lectureMissions.map((mission) => (
                                                <MissionCard
                                                    key={mission.id}
                                                    mission={mission}
                                                    onToggle={toggleMissionComplete}
                                                    onDelete={deleteMission}
                                                    getMissionIcon={getMissionIcon}
                                                    getMissionColor={getMissionColor}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Review Missions */}
                                    {reviewMissions.length > 0 && (
                                        <div>
                                            <h4 className="text-lg font-bold text-purple-400 mb-3 flex items-center gap-2">
                                                <FileText className="w-5 h-5" />
                                                משימות חזרה ({reviewMissions.length})
                                            </h4>
                                            {reviewMissions.map((mission) => (
                                                <MissionCard
                                                    key={mission.id}
                                                    mission={mission}
                                                    onToggle={toggleMissionComplete}
                                                    onDelete={deleteMission}
                                                    getMissionIcon={getMissionIcon}
                                                    getMissionColor={getMissionColor}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>

                {/* Create Mission Modal */}
                <AnimatePresence>
                    {showMissionModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                            onClick={() => setShowMissionModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-gray-800 rounded-2xl p-8 max-w-2xl w-full shadow-2xl border-2 border-gray-700"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-3xl font-black text-white">יצירת משימה חדשה</h3>
                                    <button
                                        onClick={() => setShowMissionModal(false)}
                                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        <X className="w-6 h-6 text-gray-400" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Mission Type */}
                                    <div>
                                        <label className="block text-white font-bold mb-3">סוג משימה</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['practice', 'lecture', 'review'].map((type) => (
                                                <button
                                                    key={type}
                                                    onClick={() => setNewMission({ ...newMission, type })}
                                                    className={`p-4 rounded-xl font-bold transition-all ${
                                                        newMission.type === type
                                                            ? `bg-gradient-to-r ${getMissionColor(type)} text-white shadow-lg`
                                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                    }`}
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        {getMissionIcon(type)}
                                                        <span>{getMissionTypeLabel(type)}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <div>
                                        <label className="block text-white font-bold mb-2">כותרת המשימה *</label>
                                        <input
                                            type="text"
                                            value={newMission.title}
                                            onChange={(e) => setNewMission({ ...newMission, title: e.target.value })}
                                            placeholder="לדוגמה: תרגול בחוקי חזקות"
                                            className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-white font-bold mb-2">תיאור (אופציונלי)</label>
                                        <textarea
                                            value={newMission.description}
                                            onChange={(e) => setNewMission({ ...newMission, description: e.target.value })}
                                            placeholder="תיאור מפורט של המשימה..."
                                            className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white focus:border-purple-500 focus:outline-none resize-y min-h-[100px]"
                                        />
                                    </div>

                                    {/* Topic Selection */}
                                    <div>
                                        <label className="block text-white font-bold mb-2">נושא (אופציונלי)</label>
                                        <select
                                            value={newMission.topicId}
                                            onChange={(e) => setNewMission({ ...newMission, topicId: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                                        >
                                            <option value="">בחר נושא...</option>
                                            {availableTopics.map((topic) => (
                                                <option key={topic.id} value={topic.id}>
                                                    {topic.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={createMission}
                                            className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-black hover:shadow-xl flex items-center justify-center gap-2"
                                        >
                                            <Plus className="w-5 h-5" />
                                            <span>צור משימה</span>
                                        </motion.button>
                                        <button
                                            onClick={() => setShowMissionModal(false)}
                                            className="px-6 py-4 bg-gray-700 text-gray-300 rounded-xl font-bold hover:bg-gray-600"
                                        >
                                            ביטול
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// Mission Card Component
const MissionCard = ({ mission, onToggle, onDelete, getMissionIcon, getMissionColor }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: 5 }}
            className={`bg-gray-700 rounded-xl p-4 mb-3 border-2 ${
                mission.completed ? 'border-green-500' : 'border-gray-600'
            }`}
        >
            <div className="flex items-start gap-4">
                <div className={`p-3 bg-gradient-to-r ${getMissionColor(mission.type)} rounded-lg`}>
                    {getMissionIcon(mission.type)}
                </div>

                <div className="flex-1">
                    <h4 className={`text-lg font-bold mb-1 ${
                        mission.completed ? 'text-green-400 line-through' : 'text-white'
                    }`}>
                        {mission.title}
                    </h4>
                    {mission.description && (
                        <p className="text-sm text-gray-400 mb-2">{mission.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{new Date(mission.createdAt).toLocaleDateString('he-IL')}</span>
                        {mission.completed && mission.completedAt && (
                            <>
                                <span>•</span>
                                <span>הושלם: {new Date(mission.completedAt).toLocaleDateString('he-IL')}</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onToggle(mission.id, mission.completed)}
                        className={`p-2 rounded-lg ${
                            mission.completed
                                ? 'bg-green-500 hover:bg-green-600'
                                : 'bg-gray-600 hover:bg-gray-500'
                        }`}
                        title={mission.completed ? 'סמן כלא הושלם' : 'סמן כהושלם'}
                    >
                        {mission.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-white" />
                        ) : (
                            <Check className="w-5 h-5 text-white" />
                        )}
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onDelete(mission.id)}
                        className="p-2 bg-red-500 hover:bg-red-600 rounded-lg"
                        title="מחק משימה"
                    >
                        <Trash2 className="w-5 h-5 text-white" />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};

export default AdminUserDetail;