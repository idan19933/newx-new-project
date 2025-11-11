// src/pages/PracticeRoom.jsx - PRACTICE ROOM (חדר תרגול)
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Play, Target, Brain, Zap, CheckCircle2, MessageSquare,
    ArrowLeft, Book, Trophy, Star, Sparkles, TrendingUp
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { getUserGradeId, getGradeConfig } from '../config/israeliCurriculum';
import MathTutor from '../components/ai/MathTutor';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const PracticeRoom = () => {
    const navigate = useNavigate();
    const { user, studentProfile, nexonProfile } = useAuthStore();
    const profile = studentProfile || nexonProfile;

    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentMode, setCurrentMode] = useState('selection'); // 'selection' or 'practice'
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [selectedSubtopic, setSelectedSubtopic] = useState(null);
    const [suggestedDifficulty, setSuggestedDifficulty] = useState('medium');

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
            loadPracticeMissions();
            loadAdaptiveDifficulty();
        }
    }, [user?.uid]);

    const loadPracticeMissions = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/missions/user/${user.uid}?type=practice`);
            const data = await response.json();

            if (data.success && data.missions) {
                setMissions(data.missions);
            }
        } catch (error) {
            console.error('❌ Error loading practice missions:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAdaptiveDifficulty = async () => {
        try {
            const response = await fetch(`${API_URL}/api/adaptive/recommendation/${user.uid}`);
            const data = await response.json();

            if (data.success && data.recommendation) {
                setSuggestedDifficulty(data.recommendation.difficulty);
            }
        } catch (error) {
            console.error('❌ Error loading adaptive difficulty:', error);
        }
    };

    const startPractice = (topic, subtopic = null) => {
        setSelectedTopic(topic);
        setSelectedSubtopic(subtopic);
        setCurrentMode('practice');

        toast.success(
            `🚀 מתחיל תרגול!\n📚 ${topic.name}${subtopic ? ` - ${subtopic.name}` : ''}\n⭐ רמה: ${getDifficultyLabel(suggestedDifficulty)}`,
            { duration: 3000, icon: '🎯' }
        );
    };

    const handleBackToSelection = () => {
        setCurrentMode('selection');
        setSelectedTopic(null);
        setSelectedSubtopic(null);
    };

    const getDifficultyLabel = (difficulty) => {
        const labels = { easy: 'קל', medium: 'בינוני', hard: 'מאתגר' };
        return labels[difficulty] || 'בינוני';
    };

    const getDifficultyEmoji = (difficulty) => {
        const emojis = { easy: '🌱', medium: '⚡', hard: '🔥' };
        return emojis[difficulty] || '⚡';
    };

    // Practice Mode
    if (currentMode === 'practice') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4 md:p-6">
                <div className="max-w-7xl mx-auto">
                    <motion.button
                        onClick={handleBackToSelection}
                        whileHover={{ scale: 1.05 }}
                        className="mb-6 px-6 py-3 bg-white text-gray-800 rounded-xl font-bold shadow-lg flex items-center gap-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>חזרה לבחירת נושא</span>
                    </motion.button>

                    <MathTutor
                        selectedTopic={selectedTopic}
                        selectedSubtopic={selectedSubtopic}
                        userId={user?.uid}
                        gradeLevel={numericGrade}
                        initialDifficulty={suggestedDifficulty}
                        onClose={handleBackToSelection}
                        mode="practice"
                    />
                </div>
            </div>
        );
    }

    // Selection Mode
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500" dir="rtl">
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
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-8xl mb-6"
                    >
                        🎯
                    </motion.div>
                    <h1 className="text-6xl md:text-7xl font-black mb-4">חדר התרגול</h1>
                    <p className="text-2xl md:text-3xl font-bold">
                        תרגול שאלות ומשימות עם תמיכת AI בזמן אמת
                    </p>
                </motion.div>

                {/* Section 1: Practice Missions from Nexon */}
                {missions && missions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/95 backdrop-blur-lg rounded-3xl p-6 md:p-8 shadow-2xl"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl">
                                <MessageSquare className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-gray-900">המשימות שלי מנקסון 📋</h2>
                                <p className="text-gray-600">הנחיות מפורשות - משימות תרגול שנקבעו עבורך</p>
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
                                            ? 'bg-green-50 border-green-300'
                                            : 'bg-white border-gray-300 hover:border-green-400 hover:shadow-lg'
                                    }`}
                                    onClick={() => {
                                        if (!mission.completed) {
                                            const topic = availableTopics.find(t => t.id === mission.topicId);
                                            if (topic) startPractice(topic);
                                        }
                                    }}
                                >
                                    <CheckCircle2
                                        className={`w-8 h-8 flex-shrink-0 ${
                                            mission.completed ? 'text-green-600' : 'text-gray-400'
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
                                            <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
                                                <Trophy className="w-4 h-4" />
                                                <span>הושלם!</span>
                                            </div>
                                        )}
                                        {!mission.completed && (
                                            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                                                <Play className="w-4 h-4" />
                                                <span>לחץ להתחלה</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                            <div className="flex items-start gap-3">
                                <Sparkles className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-bold text-green-900 mb-1">💡 טיפ מנקסון:</p>
                                    <p className="text-sm text-green-800">
                                        השלם את המשימות לפי הסדר לקבלת חוויית למידה מיטבית.
                                        כל משימה בנויה על הקודמת!
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
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl">
                            <Brain className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-900">נושאים לתרגול ידני 🎓</h2>
                            <p className="text-gray-600">בחר נושא לתרגול חופשי</p>
                        </div>
                    </div>

                    {displayTopics.length === 0 ? (
                        <div className="text-center py-12">
                            <Book className="w-20 h-20 text-gray-400 mx-auto mb-4" />
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
                                    onClick={() => startPractice(topic)}
                                    className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border-2 border-gray-200 hover:border-green-400"
                                >
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/20 to-emerald-600/20 rounded-full blur-2xl group-hover:scale-150 transition-transform" />

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

                                        <div className="flex items-center justify-center gap-2 text-green-600 font-bold">
                                            <Play className="w-5 h-5" />
                                            <span>התחל תרגול</span>
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    )}

                    <div className="mt-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200">
                        <div className="flex items-start gap-3">
                            <Zap className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <p className="font-bold text-blue-900 mb-1">⚡ רמת קושי מותאמת:</p>
                                <p className="text-sm text-blue-800">
                                    המערכת תתחיל ברמה {getDifficultyEmoji(suggestedDifficulty)} {getDifficultyLabel(suggestedDifficulty)} ותתאים
                                    את עצמה אוטומטית בזמן אמת בהתאם לביצועים שלך!
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PracticeRoom;