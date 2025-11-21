// src/pages/LearningSpaceHub.jsx - 3 LEARNING ROOMS
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    BookOpen, Dumbbell, GraduationCap,
    Trophy, Target, Flame, Star, Clock,
    ChevronRight, Sparkles, Brain, Zap
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const LearningSpaceHub = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [stats, setStats] = useState(null);
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.uid) {
            loadLearningSpaceData();
        }
    }, [user]);

    const loadLearningSpaceData = async () => {
        try {
            setLoading(true);

            // Load user stats
            const statsRes = await axios.get(`${API_URL}/api/curriculum/stats/overall/${user.uid}`);
            if (statsRes.data) {
                setStats(statsRes.data);
            }

            // Load assigned missions
            const missionsRes = await axios.get(`${API_URL}/api/admin/missions/user/${user.uid}`);
            if (missionsRes.data.success) {
                setMissions(missionsRes.data.missions || []);
            }
        } catch (error) {
            console.error('❌ Error loading learning space:', error);
        } finally {
            setLoading(false);
        }
    };

    const learningRooms = [
        {
            id: 'lecture',
            title: '📚 חדר הרצאה',
            subtitle: 'למד נושאים חדשים עם הסברים מפורטים',
            description: 'צפה בהסברים אינטראקטיביים ולמד נושאים חדשים עם דוגמאות ותרגילים',
            icon: BookOpen,
            color: 'from-blue-600 to-cyan-600',
            path: '/lecture-room',
            features: ['הסברים מפורטים', 'דוגמאות עם פתרונות', 'שאלות בדיקה'],
            stats: {
                completed: stats?.lecturesCompleted || 0,
                total: stats?.totalLectures || 10
            }
        },
        {
            id: 'practice',
            title: '💪 חדר תרגול',
            subtitle: 'תרגל ושפר את הכישורים שלך',
            description: 'פתור שאלות מותאמות אישית לרמתך ושפר את הביצועים',
            icon: Dumbbell,
            color: 'from-purple-600 to-pink-600',
            path: '/practice-room',
            features: ['שאלות מותאמות אישית', 'משוב מיידי', 'מעקב אחר התקדמות'],
            stats: {
                completed: stats?.questionsAnswered || 0,
                accuracy: stats?.accuracy || 0
            }
        },
        {
            id: 'notebook',
            title: '📓 המחברת שלי',
            subtitle: 'סיכומים והערות אישיות',
            description: 'צפה בסיכומי שיעורים, תרגולים והערות שרשמת במהלך הלמידה',
            icon: BookOpen,
            color: 'from-emerald-600 to-teal-600',
            path: '/notebook',
            features: ['סיכומי שיעורים', 'היסטוריית תרגולים', 'הערות אישיות'],
            stats: {
                notes: stats?.totalNotes || 0,
                summaries: stats?.completedLessons || 0
            }
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
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 py-12 px-4" dir="rtl">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-6xl font-black text-white mb-4 flex items-center justify-center gap-4">
                        <Sparkles className="w-12 h-12 text-yellow-400" />
                        מרחב הלמידה
                        <Sparkles className="w-12 h-12 text-yellow-400" />
                    </h1>
                    <p className="text-2xl text-gray-300">
                        בחר את חדר הלמידה המתאים לך והתחל ללמוד! 🚀
                    </p>
                </motion.div>

                {/* Stats Bar */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border-2 border-purple-500/30"
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Trophy className="w-5 h-5 text-yellow-400" />
                                <span className="text-3xl font-black text-white">{stats?.totalPoints || 0}</span>
                            </div>
                            <p className="text-gray-400 text-sm">נקודות כוללות</p>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Flame className="w-5 h-5 text-orange-400" />
                                <span className="text-3xl font-black text-white">{stats?.streak || 0}</span>
                            </div>
                            <p className="text-gray-400 text-sm">רצף ימים</p>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Star className="w-5 h-5 text-purple-400" />
                                <span className="text-3xl font-black text-white">{stats?.level || 1}</span>
                            </div>
                            <p className="text-gray-400 text-sm">רמה</p>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Target className="w-5 h-5 text-green-400" />
                                <span className="text-3xl font-black text-white">{stats?.accuracy || 0}%</span>
                            </div>
                            <p className="text-gray-400 text-sm">דיוק</p>
                        </div>
                    </div>
                </motion.div>

                {/* Active Missions */}
                {missions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h2 className="text-3xl font-black text-white mb-4 flex items-center gap-3">
                            <Target className="w-8 h-8 text-yellow-400" />
                            המשימות שלך
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {missions.slice(0, 4).map((mission, index) => (
                                <motion.div
                                    key={mission.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-gray-800 rounded-xl p-4 border-2 border-purple-500/30 hover:border-purple-500 transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-white font-bold">{mission.title}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            mission.status === 'completed'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                            {mission.status === 'completed' ? 'הושלם ✓' : 'פעיל'}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-sm mb-3">{mission.description}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-purple-400 text-sm">
                                            <Clock className="w-4 h-4" />
                                            <span>{mission.deadline || 'ללא מועד'}</span>
                                        </div>
                                        <div className="text-yellow-400 font-bold text-sm">
                                            +{mission.points || 0} נקודות
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Learning Rooms */}
                <div className="grid md:grid-cols-3 gap-8">
                    {learningRooms.map((room, index) => (
                        <motion.div
                            key={room.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.15 }}
                            whileHover={{ scale: 1.05, y: -10 }}
                            onClick={() => navigate(room.path)}
                            className="relative bg-gray-800 rounded-3xl p-8 cursor-pointer border-2 border-gray-700 hover:border-purple-500 transition-all group overflow-hidden"
                        >
                            {/* Gradient Background */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${room.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>

                            {/* Icon */}
                            <div className={`w-20 h-20 bg-gradient-to-br ${room.color} rounded-2xl flex items-center justify-center mb-6 mx-auto transform group-hover:scale-110 transition-transform`}>
                                <room.icon className="w-10 h-10 text-white" />
                            </div>

                            {/* Title */}
                            <h3 className="text-3xl font-black text-white text-center mb-2">
                                {room.title}
                            </h3>
                            <p className="text-purple-400 text-center font-bold mb-4">
                                {room.subtitle}
                            </p>

                            {/* Description */}
                            <p className="text-gray-400 text-center text-sm mb-6">
                                {room.description}
                            </p>

                            {/* Features */}
                            <div className="space-y-2 mb-6">
                                {room.features.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Stats */}
                            <div className="bg-gray-700/50 rounded-xl p-4 mb-6">
                                {room.id === 'lecture' && (
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-white">
                                            {room.stats.completed}/{room.stats.total}
                                        </p>
                                        <p className="text-gray-400 text-sm">שיעורים הושלמו</p>
                                    </div>
                                )}
                                {room.id === 'practice' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center">
                                            <p className="text-2xl font-black text-white">{room.stats.completed}</p>
                                            <p className="text-gray-400 text-xs">שאלות נפתרו</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-black text-green-400">{room.stats.accuracy}%</p>
                                            <p className="text-gray-400 text-xs">דיוק</p>
                                        </div>
                                    </div>
                                )}
                                {room.id === 'notebook' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center">
                                            <p className="text-2xl font-black text-white">{room.stats.notes}</p>
                                            <p className="text-gray-400 text-xs">הערות</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-black text-emerald-400">{room.stats.summaries}</p>
                                            <p className="text-gray-400 text-xs">סיכומים</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Enter Button */}
                            <button className={`w-full py-4 bg-gradient-to-r ${room.color} text-white rounded-xl font-black text-lg flex items-center justify-center gap-2 group-hover:shadow-lg transition-shadow`}>
                                <span>כנס לחדר</span>
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </motion.div>
                    ))}
                </div>

                {/* Quick Tips */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-12 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-6 border-2 border-purple-500/30"
                >
                    <div className="flex items-start gap-4">
                        <Brain className="w-8 h-8 text-purple-400 flex-shrink-0" />
                        <div>
                            <h3 className="text-xl font-black text-white mb-2">💡 טיפ ללמידה יעילה</h3>
                            <p className="text-gray-300">
                                התחל עם חדר ההרצאה כדי ללמוד נושא חדש, המשך לחדר התרגול כדי לתרגל, ובסוף סקור את המחברת שלך!
                                למידה עקבית של 20-30 דקות ביום עדיפה על מפגש ארוך אחד בשבוע.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LearningSpaceHub;