// src/components/exams/ExamPageWrapper.jsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const ExamPageWrapper = () => {
    const navigate = useNavigate();
    const { examId } = useParams();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" dir="rtl">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => navigate('/bagrut-exams')}
                    className="mb-8 flex items-center gap-2 px-6 py-3 bg-white text-gray-800 rounded-xl font-bold shadow-lg"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>חזרה למבחני בגרות</span>
                </motion.button>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-4xl mx-auto bg-white rounded-3xl p-12 shadow-2xl text-center"
                >
                    <div className="text-8xl mb-8">📝</div>
                    <h1 className="text-4xl font-black text-gray-900 mb-4">
                        מבחן #{examId}
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        המערכת בבנייה - בקרוב תוכל לבצע את המבחן הזה!
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/bagrut-exams')}
                        className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg shadow-lg"
                    >
                        חזרה לרשימת המבחנים
                    </motion.button>
                </motion.div>
            </div>
        </div>
    );
};

export default ExamPageWrapper;
