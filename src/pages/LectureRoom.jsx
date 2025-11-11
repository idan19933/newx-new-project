// src/pages/LectureRoom.jsx - LECTURE ROOM (חדר הרצאות)
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    GraduationCap, BookOpen, Lightbulb, CheckCircle2, MessageSquare,
    ArrowLeft, Brain, Sparkles, Star, Play, Trophy
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { getUserGradeId, getGradeConfig } from '../config/israeliCurriculum';
import AILearningArea from '../components/learning/AILearningArea';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const LectureRoom = () => {
    const navigate = useNavigate();
    const { user, studentProfile, nexonProfile } = useAuthStore();
    const profile = studentProfile || nexonProfile;

    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentMode, setCurrentMode] = useState('selection'); // 'selection' or 'lecture'
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [selectedSubtopic, setSelectedSubtopic] = useState(null);

    // Get grade and topics
    const currentGrade = profile?.grade || user?.grade || 'grade10';
    const currentTrack = profile?.track || user?.track || '3-units';
    const numericGrade = parseInt(currentGrade.replace('grade', ''));
    const gradeId = getUserGradeId(currentGrade, currentTrack);
    const gradeConfig = getGradeConfig(gradeId);
    const availableTopics = gradeConfig?.topics || [];

    // Filter topics based on weak topics from onboarding
    const weakTopics = profile?.weakTopics || [];
    const displayTopics = weakTopics && weakTopics.length > 0
        ? availableTopics.filter(topic => weakTopics.includes(topic.id))
        : availableTopics;

    useEffect(() => {
        if (user?.uid) {
            loadLectureMissions();
        }
    }, [user?.uid]);

    const loadLectureMissions = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/missions/user/${user.uid}?type=lecture`);
            const data = await response.json();

            if (data.success && data.missions) {
                setMissions(data.missions);
            }
        } catch (error) {
            console.error('❌ Error loading lecture missions:', error);
        } finally {
            setLoading(false);
        }
    };

    const startLecture = (topic, subtopic = null) => {
        setSelectedTopic(topic);
        setSelectedSubtopic(subtopic);
        setCurrentMode('lecture');

        toast.success(
            `📚 מתחיל הרצאה!\n${topic.name}${subtopic ? ` - ${subtopic.name}` : ''}`,
            { duration: 3000, icon: '🎓' }
        );
    };

    const handleBackToSelection = () => {
        setCurrentMode('selection');
        setSelectedTopic(null);
        setSelectedSubtopic(null);
    };

    const handleLectureComplete = () => {
        toast.success('🎉 הרצאה הושלמה! האם תרצה לעבור לתרגול?', {
            duration: 5000,
            icon: '✅'
        });
    };

    // Lecture Mode
    if (currentMode === 'lecture') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-4 md:p-6">
                <div className="max-w-7xl mx-auto">
                    <motion.button
                        onClick={handleBackToSelection}
                        whileHover={{ scale: 1.05 }}
                        className="mb-6 px-6 py-3 bg-white text-gray-800 rounded-xl font-bold shadow-lg flex items-center gap-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>חזרה לבחירת נושא</span>
                    </motion.button>

                    <AILearningArea
                        topic={selectedTopic}
                        subtopic={selectedSubtopic}
                        gradeLevel={numericGrade}
                        userId={user?.uid}
                        onComplete={handleLectureComplete}
                        mode="lecture"
                    />
                </div>
            </div>
        );
    }

    // Selection Mode
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500" dir="rtl">
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
                        animate={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-8xl mb-6"
                    >
                        📚
                    </motion.div>
                    <h1 className="text-6xl md:text-7xl font-black mb-4">חדר ההרצאות</h1>
                    <p className="text-2xl md:text-3xl font-bold">
                        למידת נושאים חדשים עם הסברים מפורטים ודוגמאות מלאות
                    </p>
                </motion.div>

                {/* Section 1: Lecture Missions from Nexon */}
                {missions && missions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/95 backdrop-blur-lg rounded-3xl p-6 md:p-8 shadow-2xl"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl">
                                <MessageSquare className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-gray-900">המשימות שלי מנקסון 📋</h2>
                                <p className="text-gray-600">הנחיות מפורשות - משימות הרצאה שנקבעו עבורך</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {missions.map((mission, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    whileHover={{ scale: 1.02, x: 5 }}
                                    className={`flex items-start gap-4 rounded-2xl p-5 border-2 transition-all cursor-pointer ${
                                        mission.completed
                                            ? 'bg-blue-50 border-blue-300'
                                            : 'bg-white border-gray-300 hover:border-blue-400 hover:shadow-lg'
                                    }`}
                                    onClick={() => {
                                        if (!mission.completed) {
                                            const topic = availableTopics.find(t => t.id === mission.topicId);
                                            if (topic) startLecture(topic);
                                        }
                                    }}
                                >
                                    <CheckCircle2
                                        className={`w-8 h-8 flex-shrink-0 ${
                                            mission.completed ? 'text-blue-600' : 'text-gray-400'
                                        }`}
                                    />
                                    <div className="flex-1">
                                        <h3 className="text-xl font-black text-gray-900 mb-1">
                                            {idx + 1}. {mission.title}
                                        </h3>
                                        {mission.description && (
                                            <p className="text-gray-700 mb-2">{mission.description}</p>
                                        )}
                                        {mission.completed && (
                                            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                                                <Trophy className="w-4 h-4" />
                                                <span>הושלם!</span>
                                            </div>
                                        )}
                                        {!mission.completed && (
                                            <div className="flex items-center gap-2 text-cyan-600 font-bold text-sm">
                                                <Play className="w-4 h-4" />
                                                <span>לחץ להתחלה</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200">
                            <div className="flex items-start gap-3">
                                <Sparkles className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-bold text-blue-900 mb-1">💡 טיפ מנקסון:</p>
                                    <p className="text-sm text-blue-800">
                                        קח את הזמן להבין כל דוגמה לעומק. אחרי ההרצאה תוכל לתרגל
                                        את מה שלמדת בחדר התרגול!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Section 2: Manual Topic Selection */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/95 backdrop-blur-lg rounded-3xl p-6 md:p-8 shadow-2xl"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
                            <Brain className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-900">נושאים להרצאה ידנית 🎓</h2>
                            <p className="text-gray-600">בחר נושא ללמידה חופשית עם נקסון</p>
                        </div>
                    </div>

                    {displayTopics.length === 0 ? (
                        <div className="text-center py-12">
                            <BookOpen className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                            <p className="text-xl text-gray-600 font-bold">
                                לא נמצאו נושאים זמינים
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {displayTopics.map((topic, idx) => (
                                <motion.button
                                    key={topic.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => startLecture(topic)}
                                    className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border-2 border-gray-200 hover:border-blue-400"
                                >
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-cyan-600/20 rounded-full blur-2xl group-hover:scale-150 transition-transform" />

                                    <div className="relative z-10">
                                        <div className="text-6xl mb-4 text-center">
                                            {topic.icon || '📚'}
                                        </div>

                                        <h3 className="text-2xl font-black text-gray-900 mb-2 text-center">
                                            {topic.name}
                                        </h3>

                                        <p className="text-gray-600 text-center mb-4">
                                            {topic.nameEn}
                                        </p>

                                        <div className="flex items-center justify-center gap-2 text-blue-600 font-bold">
                                            <GraduationCap className="w-5 h-5" />
                                            <span>התחל ללמוד</span>
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    )}

                    <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                        <div className="flex items-start gap-3">
                            <Lightbulb className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                            <div>
                                <p className="font-bold text-purple-900 mb-1">📚 מה תקבל בהרצאה:</p>
                                <ul className="text-sm text-purple-800 space-y-1">
                                    <li className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                                        <span>הסברים מפורטים ושלב אחר שלב</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                                        <span>דוגמאות פתורות במלואן</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                                        <span>אפשרות לשאול שאלות בכל שלב</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                                        <span>שמירת הערות אישיות במחברת</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LectureRoom;