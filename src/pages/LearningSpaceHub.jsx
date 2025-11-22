// src/pages/LearningSpaceHub.jsx - NEW PROTOTYPE DESIGN
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    BookOpen, Dumbbell, Target, CheckCircle, Circle,
    TrendingUp, Zap, Brain, MessageSquare
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const LearningSpaceHub = () => {
    const navigate = useNavigate();
    const { user, nexonProfile } = useAuthStore();
    const [stats, setStats] = useState(null);
    const [missions, setMissions] = useState([]);
    const [adminMessage, setAdminMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.uid) {
            loadLearningSpaceData();
        }
    }, [user]);

    const loadLearningSpaceData = async () => {
        try {
            setLoading(true);

            // Load notebook stats
            const notebookRes = await axios.get(`${API_URL}/api/notebook/stats?userId=${user.uid}`);
            if (notebookRes.data.success) {
                setStats(notebookRes.data.stats);
            }

            // Load missions (if available)
            try {
                const missionsRes = await axios.get(`${API_URL}/api/admin/missions/user/${user.uid}`);
                if (missionsRes.data.success) {
                    setMissions(missionsRes.data.missions || []);
                }
            } catch (e) {
                console.log('No missions found');
            }

            // Load admin message (if exists)
            try {
                const msgRes = await axios.get(`${API_URL}/api/admin/message/${user.uid}`);
                if (msgRes.data.success) {
                    setAdminMessage(msgRes.data.message);
                }
            } catch (e) {
                console.log('No admin message');
            }

        } catch (error) {
            console.error('❌ Error loading learning space:', error);
        } finally {
            setLoading(false);
        }
    };

    const userName = user?.displayName || user?.name || nexonProfile?.name || 'תלמיד';

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="animate-spin w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4" dir="rtl">
            <div className="max-w-4xl mx-auto">
                {/* Header with Nexon Logo */}
                <div className="bg-gray-700 text-white py-4 px-6 rounded-t-2xl">
                    <h1 className="text-3xl font-black text-center">נקסון</h1>
                </div>

                {/* Main Content Box */}
                <div className="bg-white rounded-b-2xl shadow-xl p-8 mb-8">
                    {/* Section 1: Stats from Nexon */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-600 text-white rounded-xl p-6 mb-8"
                    >
                        <h2 className="text-xl font-bold mb-4 border-b border-gray-500 pb-3">
                            סטטיסטיקות למידה:
                        </h2>

                        {/* Admin Message / Nexon Feedback */}
                        {adminMessage ? (
                            <div className="bg-gray-700 rounded-lg p-4 mb-4">
                                <p className="text-sm leading-relaxed">{adminMessage}</p>
                            </div>
                        ) : (
                            <div className="bg-gray-700 rounded-lg p-4 mb-4">
                                <p className="text-sm leading-relaxed">
                                    משוב נקודתי מאת נקסון על מאפיינים אלו בלבד
                                </p>
                            </div>
                        )}

                        {/* Stats Display */}
                        <div className="bg-gray-500 rounded-lg p-4">
                            <p className="text-sm mb-2 font-bold">המשימות שלי:</p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                    <span>רמת קושי: {stats?.difficulty || 'בינוני'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                    <span>רצף שאלות: {stats?.streak || 0}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                    <span>דיוק: {stats?.accuracy || 0}%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                    <span>סה"כ שאלות: {stats?.totalEntries || 0}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Section 2: My Missions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-8"
                    >
                        <div className="bg-gray-500 text-white rounded-lg p-4 mb-4">
                            <h3 className="font-bold text-center">המשימות שלי:</h3>
                        </div>

                        <div className="space-y-3">
                            {missions.length > 0 ? (
                                missions.map((mission, index) => (
                                    <motion.div
                                        key={mission.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 + index * 0.05 }}
                                        className="flex items-center gap-3 text-gray-800"
                                    >
                                        {mission.status === 'completed' ? (
                                            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                                        ) : (
                                            <Circle className="w-6 h-6 text-blue-400 flex-shrink-0" />
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">{index + 1}.</span>
                                                <span className={mission.status === 'completed' ? 'line-through text-gray-500' : ''}>
                                                    {mission.title}
                                                </span>
                                            </div>
                                            {mission.description && (
                                                <p className="text-sm text-gray-600 mr-8">{mission.description}</p>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 text-gray-800">
                                        <CheckCircle className="w-6 h-6 text-green-500" />
                                        <span><strong>1.</strong> תרגול בחוקי חזקות</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-800">
                                        <CheckCircle className="w-6 h-6 text-green-500" />
                                        <span><strong>2.</strong> שיעור בנושא חוג הפיזור</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-800">
                                        <Circle className="w-6 h-6 text-blue-400" />
                                        <span><strong>3.</strong> מעבר על סיכומי מחברת של משימות 1 ו 2</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>

                    {/* Section 3: Learning Areas */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="bg-gray-500 text-white rounded-lg p-4 mb-4">
                            <h3 className="font-bold text-center">אזורי למידה</h3>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            {/* Notebook */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/notebook')}
                                className="bg-gray-500 hover:bg-gray-600 text-white rounded-2xl p-8 transition-colors flex flex-col items-center justify-center gap-3 min-h-[180px]"
                            >
                                <BookOpen className="w-12 h-12" />
                                <span className="font-bold text-lg text-center">המחברת שלי</span>
                            </motion.button>

                            {/* Lecture Room */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/lecture-room')}
                                className="bg-gray-500 hover:bg-gray-600 text-white rounded-2xl p-8 transition-colors flex flex-col items-center justify-center gap-3 min-h-[180px]"
                            >
                                <Brain className="w-12 h-12" />
                                <span className="font-bold text-lg text-center">חדר הרצאות</span>
                            </motion.button>

                            {/* Practice Room */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/practice-room')}
                                className="bg-gray-500 hover:bg-gray-600 text-white rounded-2xl p-8 transition-colors flex flex-col items-center justify-center gap-3 min-h-[180px]"
                            >
                                <Dumbbell className="w-12 h-12" />
                                <span className="font-bold text-lg text-center">חדר תרגול</span>
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Optional: Link to relevant page */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mt-8 text-center"
                    >
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="text-purple-600 hover:text-purple-700 font-bold text-sm underline"
                        >
                            לחיצה על אזור מעבירה לעמוד הרלוונטי
                        </button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default LearningSpaceHub;