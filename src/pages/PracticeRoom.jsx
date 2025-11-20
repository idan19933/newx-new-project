// src/pages/LectureRoom.jsx - FINAL VERSION WITH GRADELEVEL
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen, Brain, Play, ArrowLeft, GraduationCap,
    CheckCircle2, Clock, Target, Sparkles, Lightbulb,
    ChevronRight, Activity
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { getUserGradeId, getGradeConfig } from '../config/israeliCurriculum';
import toast from 'react-hot-toast';
import LearningSpace from '../components/ai/LearningSpace';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const LectureRoom = () => {
    const navigate = useNavigate();
    const { user, studentProfile, nexonProfile } = useAuthStore();
    const profile = studentProfile || nexonProfile;

    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMission, setSelectedMission] = useState(null);
    const [view, setView] = useState('missions'); // 'missions' or 'learning'

    const currentGrade = profile?.grade || user?.grade || 'grade10';
    const currentTrack = profile?.track || user?.track || '3-units';
    const gradeId = getUserGradeId(currentGrade, currentTrack);
    const gradeConfig = getGradeConfig(gradeId);

    // ✅ Extract numeric grade from 'grade10' -> '10'
    const numericGrade = currentGrade.replace('grade', '');

    useEffect(() => {
        if (user?.uid) {
            loadLectureMissions();
        }
    }, [user?.uid]);

    const loadLectureMissions = async () => {
        try {
            setLoading(true);
            console.log('🔍 Loading lecture missions for user:', user.uid);

            // ✅ FIXED: Using correct endpoint
            const response = await fetch(`${API_URL}/api/admin/missions/user/${user.uid}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📋 Missions response:', data);

            if (data.success && data.missions && Array.isArray(data.missions)) {
                // ✅ Filter for lecture missions only
                const lectureMissions = data.missions.filter(m => m.type === 'lecture');
                console.log('📚 Lecture missions:', lectureMissions);
                setMissions(lectureMissions);
            } else {
                console.warn('⚠️ No missions found or invalid format');
                setMissions([]);
            }
        } catch (error) {
            console.error('❌ Error loading lecture missions:', error);
            toast.error('שגיאה בטעינת משימות הרצאה');
            setMissions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleStartLearning = (mission) => {
        setSelectedMission(mission);
        setView('learning');
        toast.success('פותח חומר לימוד! 📚');
    };

    const handleStartPractice = () => {
        if (selectedMission) {
            navigate('/practice-room', {
                state: {
                    topicId: selectedMission.topicId,
                    subtopicId: selectedMission.subtopicId,
                    missionId: selectedMission.id
                }
            });
        }
    };

    const handleBackToMissions = () => {
        setView('missions');
        setSelectedMission(null);
    };

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

    // Learning Space View
    if (view === 'learning' && selectedMission) {
        return (
            <LearningSpace
                topic={{
                    id: selectedMission.topicId,
                    name: selectedMission.title,
                    icon: '📚',
                    gradeLevel: numericGrade // ✅ PASS gradeLevel
                }}
                subtopic={selectedMission.subtopicId ? {
                    id: selectedMission.subtopicId,
                    name: selectedMission.description
                } : null}
                onStartPractice={handleStartPractice}
                onBack={handleBackToMissions}
                userId={user?.uid}
            />
        );
    }

    // Missions List View
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900" dir="rtl">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12 space-y-6 md:space-y-8">

                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/learning-space')}
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-md text-white rounded-xl font-bold hover:bg-white/30 transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>חזרה למרחב הלמידה</span>
                </motion.button>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-white"
                >
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-7xl mb-4"
                    >
                        📚
                    </motion.div>
                    <h1 className="text-5xl md:text-7xl font-black mb-4">
                        חדר ההרצאות
                    </h1>
                    <p className="text-2xl md:text-3xl font-bold">
                        למד נושאים חדשים עם הסברים מפורטים
                    </p>
                </motion.div>

                {/* Missions Grid */}
                {missions.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {missions.map((mission, index) => (
                            <motion.div
                                key={mission.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.03, y: -5 }}
                                className="bg-white/95 backdrop-blur-lg rounded-3xl p-6 shadow-2xl cursor-pointer"
                                onClick={() => handleStartLearning(mission)}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl">
                                        <BookOpen className="w-8 h-8 text-white" />
                                    </div>
                                    {mission.completed && (
                                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                                    )}
                                </div>

                                <h3 className="text-2xl font-black text-gray-900 mb-2">
                                    {mission.title}
                                </h3>

                                {mission.description && (
                                    <p className="text-gray-600 mb-4 line-clamp-2">
                                        {mission.description}
                                    </p>
                                )}

                                <div className="flex items-center gap-2 mb-4">
                                    <Target className="w-5 h-5 text-blue-600" />
                                    <span className="text-sm font-bold text-gray-700">
                                        {mission.topicId || 'נושא כללי'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm">~20 דקות</span>
                                    </div>
                                    <ChevronRight className="w-6 h-6 text-blue-600" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/95 backdrop-blur-lg rounded-3xl p-12 shadow-2xl text-center"
                    >
                        <div className="text-7xl mb-6">🎯</div>
                        <h3 className="text-3xl font-black text-gray-900 mb-4">
                            אין משימות הרצאה פתוחות
                        </h3>
                        <p className="text-xl text-gray-600 mb-8">
                            כרגע אין משימות הרצאה חדשות. בקר שוב מאוחר יותר!
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/practice-room')}
                            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-black text-xl rounded-2xl shadow-xl hover:shadow-2xl transition-all"
                        >
                            עבור לחדר תרגול
                        </motion.button>
                    </motion.div>
                )}

                {/* Info Cards */}
                <div className="grid md:grid-cols-3 gap-6 mt-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white"
                    >
                        <Lightbulb className="w-10 h-10 mb-3" />
                        <h3 className="text-xl font-bold mb-2">למידה מעמיקה</h3>
                        <p className="text-blue-100">הסברים מפורטים עם דוגמאות מעשיות</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white"
                    >
                        <Activity className="w-10 h-10 mb-3" />
                        <h3 className="text-xl font-bold mb-2">תרגול מיידי</h3>
                        <p className="text-purple-100">עבור ישר לתרגול אחרי כל הרצאה</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white"
                    >
                        <GraduationCap className="w-10 h-10 mb-3" />
                        <h3 className="text-xl font-bold mb-2">למידה מותאמת</h3>
                        <p className="text-green-100">תוכן מותאם לרמה ולמסלול שלך</p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default LectureRoom;