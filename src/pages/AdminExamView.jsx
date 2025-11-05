// src/pages/AdminExamView.jsx - FULL EXAM VIEW PAGE
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    ArrowLeft, FileText, Calendar, Users, Award, Zap,
    BookOpen, Edit, Trash2, Eye, CheckCircle, XCircle,
    Loader, Brain, Target, Clock, Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    'https://nexons-production-1915.up.railway.app';

const AdminExamView = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuestion, setSelectedQuestion] = useState(null);

    useEffect(() => {
        loadExam();
    }, [id]);

    const loadExam = async () => {
        try {
            setLoading(true);

            // Load exam details
            const examRes = await axios.get(`${API_URL}/api/admin/uploads/${id}`);
            setExam(examRes.data.upload);

            // Load questions
            const questionsRes = await axios.get(`${API_URL}/api/admin/exam/${id}/questions`);
            setQuestions(questionsRes.data.questions || []);

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

                        {/* Exam Stats */}
                        <div className="grid md:grid-cols-4 gap-4">
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
                                        <p className="text-2xl font-black text-gray-800">{exam.questions_extracted}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-green-50 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <Target className="w-8 h-8 text-green-600" />
                                    <div>
                                        <p className="text-sm text-gray-600">סוג</p>
                                        <p className="text-xl font-black text-gray-800">
                                            {exam.exam_type === 'bagrut' ? 'בגרות' : exam.exam_type}
                                        </p>
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

                {/* Questions List */}
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
                            <div className="space-y-4">
                                {questions.map((question, index) => (
                                    <motion.div
                                        key={question.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="border-2 border-gray-200 rounded-2xl p-6 hover:border-purple-400 hover:shadow-lg transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className="bg-purple-100 text-purple-800 w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                                                        {question.question_text?.split('\n')[0] || 'שאלה ללא כותרת'}
                                                    </h3>

                                                    <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap mb-4">
                                                        {question.question_text}
                                                    </div>

                                                    {/* Tags */}
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {question.topic && (
                                                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                                                                📚 {question.topic}
                                                            </span>
                                                        )}
                                                        {question.subtopic && (
                                                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                                                                📖 {question.subtopic}
                                                            </span>
                                                        )}
                                                        {question.difficulty && (
                                                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                                                question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                                                    question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-red-100 text-red-800'
                                                            }`}>
                                                                {question.difficulty === 'easy' ? '⭐ קל' :
                                                                    question.difficulty === 'medium' ? '⭐⭐ בינוני' :
                                                                        '⭐⭐⭐ קשה'}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Image indicator */}
                                                    {question.has_image && (
                                                        <div className="bg-purple-50 rounded-xl p-3 mb-4">
                                                            <p className="text-sm text-purple-800 font-bold flex items-center gap-2">
                                                                <ImageIcon className="w-4 h-4" />
                                                                השאלה כוללת תרשים או ציור
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Hints Preview */}
                                                    {question.hints && (
                                                        <details className="bg-yellow-50 rounded-xl p-4">
                                                            <summary className="font-bold text-yellow-800 cursor-pointer">
                                                                💡 רמזים ({JSON.parse(question.hints || '[]').length})
                                                            </summary>
                                                            <ul className="mt-3 space-y-2 text-sm text-yellow-900">
                                                                {JSON.parse(question.hints || '[]').map((hint, i) => (
                                                                    <li key={i} className="pr-4">{hint}</li>
                                                                ))}
                                                            </ul>
                                                        </details>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setSelectedQuestion(question)}
                                                    className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                                                    title="צפה בפרטים"
                                                >
                                                    <Eye className="w-5 h-5 text-blue-600" />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => deleteQuestion(question.id)}
                                                    className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                                                    title="מחק שאלה"
                                                >
                                                    <Trash2 className="w-5 h-5 text-red-600" />
                                                </motion.button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Question Details Modal */}
            {selectedQuestion && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    onClick={() => setSelectedQuestion(null)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-black text-gray-800">פרטי השאלה</h3>
                            <button
                                onClick={() => setSelectedQuestion(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="font-bold text-gray-700 mb-2">טקסט השאלה:</h4>
                                <div className="bg-gray-50 rounded-xl p-4 whitespace-pre-wrap">
                                    {selectedQuestion.question_text}
                                </div>
                            </div>

                            {selectedQuestion.explanation && (
                                <div>
                                    <h4 className="font-bold text-gray-700 mb-2">הסבר:</h4>
                                    <div className="bg-blue-50 rounded-xl p-4">
                                        {selectedQuestion.explanation}
                                    </div>
                                </div>
                            )}

                            {selectedQuestion.solution_steps && (
                                <div>
                                    <h4 className="font-bold text-gray-700 mb-2">שלבי פתרון:</h4>
                                    <div className="space-y-2">
                                        {JSON.parse(selectedQuestion.solution_steps || '[]').map((step, i) => (
                                            <div key={i} className="bg-green-50 rounded-xl p-4">
                                                <p className="font-bold text-green-800 mb-1">
                                                    שלב {step.step}: {step.description}
                                                </p>
                                                <p className="text-green-700">{step.details}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AdminExamView;