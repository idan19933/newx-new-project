// src/components/exams/ExamResults.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, TrendingUp, Home, RotateCcw } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const ExamResults = ({ results, onBackToDashboard, onRetry }) => {
    const { width, height } = useWindowSize();
    const isPassing = results.percentage >= 55;

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center p-6" dir="rtl">
            {isPassing && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}

            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-12 shadow-2xl max-w-2xl w-full"
            >
                {/* Icon */}
                <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-center mb-8"
                >
                    {isPassing ? (
                        <Trophy className="w-32 h-32 text-yellow-400 mx-auto" />
                    ) : (
                        <Award className="w-32 h-32 text-gray-400 mx-auto" />
                    )}
                </motion.div>

                {/* Title */}
                <h1 className="text-5xl font-black text-center mb-4">
                    {isPassing ? 'כל הכבוד! 🎉' : 'המשך לתרגל! 💪'}
                </h1>

                <p className="text-xl text-center text-gray-600 mb-8">
                    {isPassing
                        ? 'עברת את המבחן בהצלחה!'
                        : 'אל תתייאש - כל תרגול מקרב אותך ליעד!'}
                </p>

                {/* Score */}
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-8 mb-8">
                    <div className="text-center">
                        <div className="text-7xl font-black text-purple-600 mb-2">
                            {results.percentage}%
                        </div>
                        <div className="text-xl text-gray-700 font-bold">
                            {results.totalScore} / {results.maxScore} נקודות
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <div className="text-3xl font-black text-gray-900">
                            {results.questionsAnswered}
                        </div>
                        <div className="text-sm text-gray-600">שאלות נענו</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <div className="text-3xl font-black text-gray-900">
                            {results.timeSpent}
                        </div>
                        <div className="text-sm text-gray-600">דקות</div>
                    </div>
                </div>

                {/* Motivational Message */}
                <div className="bg-blue-50 rounded-xl p-6 mb-8">
                    <div className="flex items-start gap-3">
                        <TrendingUp className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="font-bold text-blue-900 mb-2">💡 טיפ לשיפור</h3>
                            <p className="text-blue-800 text-sm leading-relaxed">
                                {isPassing
                                    ? 'נהדר! המשך לתרגל מבחנים נוספים כדי לשמור על הרמה הגבוהה.'
                                    : 'חזור על החומר בנושאים שבהם נתקלת בקשיים, ונסה שוב. כל תרגול עושה את ההבדל!'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onBackToDashboard}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-lg"
                    >
                        <Home className="w-5 h-5" />
                        <span>חזרה לדף הבית</span>
                    </motion.button>

                    {onRetry && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onRetry}
                            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-purple-500 text-purple-600 rounded-xl font-bold"
                        >
                            <RotateCcw className="w-5 h-5" />
                            <span>נסה שוב</span>
                        </motion.button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ExamResults;