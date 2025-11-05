// src/components/exams/BagrutExamsDashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Trophy, Clock } from 'lucide-react';

const BagrutExamsDashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500" dir="rtl">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => navigate('/dashboard')}
                    className="mb-8 flex items-center gap-2 px-6 py-3 bg-white text-gray-800 rounded-xl font-bold shadow-lg"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>חזרה לדף הבית</span>
                </motion.button>

                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-white mb-12"
                >
                    <motion.h1
                        className="text-5xl md:text-7xl font-black mb-4"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        🎓 מבחני בגרות במתמטיקה
                    </motion.h1>
                    <p className="text-2xl font-bold">
                        תרגול מבחנים אמיתיים עם בדיקה אוטומטית של AI
                    </p>
                </motion.div>

                {/* Coming Soon Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-4xl mx-auto bg-white rounded-3xl p-12 shadow-2xl text-center"
                >
                    <div className="text-8xl mb-8">🚧</div>
                    <h2 className="text-4xl font-black text-gray-900 mb-6">
                        המערכת בבנייה!
                    </h2>
                    <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                        אנחנו עובדים קשה כדי להביא לך את מערכת מבחני הבגרות הכי מתקדמת!
                        <br />
                        בקרוב תוכל לתרגל מבחנים אמיתיים עם בדיקה אוטומטית חכמה.
                    </p>

                    {/* Features Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
                            <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                            <h3 className="font-bold text-gray-900 mb-2">מבחנים אמיתיים</h3>
                            <p className="text-sm text-gray-600">מבחני בגרות מהשנים האחרונות</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6">
                            <Trophy className="w-12 h-12 text-green-600 mx-auto mb-4" />
                            <h3 className="font-bold text-gray-900 mb-2">בדיקה אוטומטית</h3>
                            <p className="text-sm text-gray-600">AI חכם שבודק את התשובות שלך</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6">
                            <Clock className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                            <h3 className="font-bold text-gray-900 mb-2">משוב מיידי</h3>
                            <p className="text-sm text-gray-600">קבל משוב על כל תשובה במקום</p>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/dashboard')}
                        className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg shadow-lg"
                    >
                        חזרה לתרגול רגיל
                    </motion.button>
                </motion.div>

                {/* Timeline */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="max-w-2xl mx-auto mt-12 bg-white/20 backdrop-blur-lg rounded-2xl p-6 text-center"
                >
                    <p className="text-white text-lg font-bold">
                        📅 השקה משוערת: בקרוב מאוד!
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default BagrutExamsDashboard;