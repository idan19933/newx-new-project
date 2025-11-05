// src/pages/AdminExamView.jsx - ENHANCED VERSION WITH EQUATIONS AND DIAGRAMS
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    ArrowLeft, FileText, Calendar, Award, Zap,
    BookOpen, Trash2, CheckCircle, XCircle,
    Loader, Brain, Target, Image as ImageIcon,
    Function, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import EnhancedQuestionCard from '../components/questions/EnhancedQuestionCard';

const API_URL = 'https://nexons-production-1915.up.railway.app';

const AdminExamView = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalQuestions: 0,
        totalDiagrams: 0,
        totalEquations: 0
    });

    useEffect(() => {
        loadExam();
    }, [id]);

    const loadExam = async () => {
        try {
            setLoading(true);

            // Load exam with enhanced data
            const response = await axios.get(`${API_URL}/api/admin/exam/${id}/enhanced`);

            setExam(response.data.exam);
            setQuestions(response.data.questions || []);
            setStats({
                totalQuestions: response.data.totalQuestions || 0,
                totalDiagrams: response.data.totalDiagrams || 0,
                totalEquations: response.data.totalEquations || 0
            });

        } catch (error) {
            console.error('❌ Load exam error:', error);
            toast.error('שגיאה בטעינת המבחן');
        } finally {
            setLoading(false);
        }
    };

    const deleteQuestion = async (questionId) => {
        if (!confirm('האם למחוק שאלה זו?')) return;

        try {
            await axios.delete(`${API_URL}/api/admin/questions/${questionId}`);
            toast.success('השאלה נמחקה');
            loadExam();
        } catch (error) {
            console.error('❌ Delete error:', error);
            toast.error('שגיאה במחיקת השאלה');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                    <Loader className="w-16 h-16 text-white" />
                </motion.div>
            </div>
        );
    }

    if (!exam) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <div className="text-center text-white">
                    <XCircle className="w-16 h-16 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold">המבחן לא נמצא</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 py-8 px-4" dir="rtl">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <button
                        onClick={() => navigate('/admin')}
                        className="flex items-center gap-2 text-white hover:text-purple-200 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        חזרה לדף הניהול
                    </button>

                    <div className="bg-white rounded-3xl p-8 shadow-2xl">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex-1">
                                <h1 className="text-4xl font-black text-gray-800 mb-2">
                                    {exam.exam_title || 'Untitled Exam'}
                                </h1>
                                <div className="flex items-center gap-4 text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5" />
                                        <span>{new Date(exam.uploaded_at).toLocaleDateString('he-IL')}</span>
                                    </div>
                                    {exam.status === 'completed' ? (
                                        <div className="flex items-center gap-2 text-green-600">
                                            <CheckCircle className="w-5 h-5" />
                                            <span>הושלם</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-blue-600">
                                            <Loader className="w-5 h-5 animate-spin" />
                                            <span>מעבד...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Enhanced Stats */}
                        <div className="grid md:grid-cols-5 gap-4">
                            <div className="bg-purple-50 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <Award className="w-8 h-8 text-purple-600" />
                                    <div>
                                        <p className="text-sm text-gray-600">כיתה</p>
                                        <p className="text-2xl font-black text-gray-800">{exam.grade_level}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-orange-50 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <Zap className="w-8 h-8 text-orange-600" />
                                    <div>
                                        <p className="text-sm text-gray-600">יחידות</p>
                                        <p className="text-2xl font-black text-gray-800">{exam.units}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <Brain className="w-8 h-8 text-blue-600" />
                                    <div>
                                        <p className="text-sm text-gray-600">שאלות</p>
                                        <p className="text-2xl font-black text-gray-800">{stats.totalQuestions}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-green-50 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="w-8 h-8 text-green-600" />
                                    <div>
                                        <p className="text-sm text-gray-600">משוואות</p>
                                        <p className="text-2xl font-black text-gray-800">{stats.totalEquations}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-pink-50 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <ImageIcon className="w-8 h-8 text-pink-600" />
                                    <div>
                                        <p className="text-sm text-gray-600">גרפים</p>
                                        <p className="text-2xl font-black text-gray-800">{stats.totalDiagrams}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Image Preview */}
                        {exam.image_url && (
                            <div className="mt-6">
                                <button
                                    onClick={() => window.open(exam.image_url, '_blank')}
                                    className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-bold transition-colors"
                                >
                                    <ImageIcon className="w-5 h-5" />
                                    צפה בתמונה המקורית
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Questions List with Enhanced Display */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="bg-white rounded-3xl p-8 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <BookOpen className="w-8 h-8 text-blue-600" />
                            <h2 className="text-3xl font-black text-gray-800">שאלות המבחן</h2>
                            <span className="bg-blue-100 text-blue-800 px-4 py-1 rounded-full font-bold">
                                {questions.length} שאלות
                            </span>
                        </div>

                        {questions.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                <p className="text-xl">אין שאלות במבחן זה</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {questions.map((question, index) => (
                                    <div key={question.id} className="relative">
                                        <EnhancedQuestionCard
                                            question={question}
                                            questionNumber={index + 1}
                                            showSolutionButton={question.has_solution}
                                        />

                                        {/* Delete Button */}
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => deleteQuestion(question.id)}
                                            className="absolute top-4 left-4 p-3 bg-red-100 hover:bg-red-200 rounded-xl transition-colors shadow-lg"
                                            title="מחק שאלה"
                                        >
                                            <Trash2 className="w-5 h-5 text-red-600" />
                                        </motion.button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminExamView;