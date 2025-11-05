import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Eye, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import ExamPage from '../components/exams/ExamPage';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const BagrutExamsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedExam, setSelectedExam] = useState(null);
    const [attemptId, setAttemptId] = useState(null);
    const [groupedExams, setGroupedExams] = useState({});

    useEffect(() => {
        loadExams();
    }, []);

    useEffect(() => {
        const grouped = exams.reduce((acc, exam) => {
            if (!acc[exam.exam_code]) {
                acc[exam.exam_code] = [];
            }
            acc[exam.exam_code].push(exam);
            return acc;
        }, {});
        setGroupedExams(grouped);
    }, [exams]);

    const loadExams = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/bagrut/exams`);

            if (response.data.success) {
                setExams(response.data.exams);
                toast.success(`נמצאו ${response.data.total} מבחנים! 📚`);
            }
        } catch (error) {
            console.error('Error loading exams:', error);
            toast.error('שגיאה בטעינת המבחנים');
        } finally {
            setLoading(false);
        }
    };

    const startExam = async (examId) => {
        try {
            const response = await axios.post(
                `${API_URL}/api/bagrut/exams/${examId}/start`,
                { isPractice: true },
                {
                    headers: {
                        'Authorization': `Bearer ${user?.token}`
                    }
                }
            );

            if (response.data.success) {
                setSelectedExam(examId);
                setAttemptId(response.data.attempt.id);
                toast.success('מבחן התחיל! 🎯');
            }
        } catch (error) {
            console.error('Error starting exam:', error);
            toast.error('שגיאה בהתחלת המבחן');
        }
    };

    const handleExamComplete = (summary) => {
        setSelectedExam(null);
        setAttemptId(null);
        toast.success(`סיימת! ציון: ${summary.percentage}% 🎉`);
    };

    const handleExitExam = () => {
        setSelectedExam(null);
        setAttemptId(null);
    };

    // If exam is selected, show ExamPage
    if (selectedExam && attemptId) {
        return (
            <ExamPage
                examId={selectedExam}
                attemptId={attemptId}
                onComplete={handleExamComplete}
                onExit={handleExitExam}
            />
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-xl font-bold text-gray-700">טוען מבחנים...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50" dir="rtl">
            {/* Header */}
            <div className="bg-white shadow-lg">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl font-bold mb-6"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>חזרה לדשבורד</span>
                    </motion.button>

                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <h1 className="text-5xl font-black text-gray-900 mb-2">
                            🎓 מבחני בגרות במתמטיקה
                        </h1>
                        <p className="text-xl text-gray-600">
                            תרגול מבחנים אמיתיים עם בדיקה אוטומטית של AI
                        </p>
                        <div className="flex items-center justify-center gap-4 mt-4">
                            <div className="px-4 py-2 bg-blue-100 rounded-full">
                                <span className="font-bold text-blue-900">
                                    {Object.keys(groupedExams).length} שאלונים
                                </span>
                            </div>
                            <div className="px-4 py-2 bg-purple-100 rounded-full">
                                <span className="font-bold text-purple-900">
                                    {exams.length} מבחנים
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="space-y-6">
                    {Object.entries(groupedExams).sort().map(([examCode, examsList]) => {
                        const firstExam = examsList[0];

                        return (
                            <motion.div
                                key={examCode}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl shadow-xl overflow-hidden"
                            >
                                {/* Exam Header */}
                                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-3xl font-black text-white mb-1">
                                                שאלון {examCode}
                                            </h2>
                                            <p className="text-purple-100">
                                                {firstExam.units} יחידות | כיתה {firstExam.grade_level}
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-4xl font-black text-white">
                                                {examsList.length}
                                            </div>
                                            <div className="text-sm text-purple-100">מבחנים</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Exams List */}
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {examsList.map((exam) => (
                                            <motion.div
                                                key={exam.id}
                                                whileHover={{ scale: 1.02 }}
                                                className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 hover:border-purple-400 transition-all"
                                            >
                                                <h3 className="font-bold text-gray-900 mb-2 text-sm">
                                                    {exam.exam_name}
                                                </h3>

                                                <div className="flex gap-2">
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => window.open(exam.pdf_url, '_blank')}
                                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-bold"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        <span>צפה ב-PDF</span>
                                                    </motion.button>

                                                    {exam.question_count > 0 && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => startExam(exam.id)}
                                                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-bold"
                                                        >
                                                            <BookOpen className="w-4 h-4" />
                                                            <span>פתור</span>
                                                        </motion.button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {exams.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-gray-700 mb-2">
                            לא נמצאו מבחנים
                        </h3>
                        <p className="text-gray-600">
                            המערכת עדיין בבנייה
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BagrutExamsPage;