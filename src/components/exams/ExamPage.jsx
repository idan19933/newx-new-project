// src/components/exams/ExamPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, ArrowRight, Clock, Camera, Upload, Send,
    CheckCircle, XCircle, AlertCircle, Eye, BookOpen,
    Lightbulb, Save, Flag
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import MathDisplay from '../math/MathDisplay';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const ExamPage = ({ examId, attemptId, onComplete, onExit }) => {
    const { user } = useAuthStore();
    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Timer
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [timerActive, setTimerActive] = useState(true);

    // Answer input
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [answerImage, setAnswerImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // Camera
    const [showCamera, setShowCamera] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    // Verification results
    const [verificationResult, setVerificationResult] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);

    const currentQuestion = questions[currentQuestionIndex];

    useEffect(() => {
        loadExam();
    }, [examId]);

    // Timer
    useEffect(() => {
        if (!timerActive) return;

        const interval = setInterval(() => {
            setTimeElapsed(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [timerActive]);

    const loadExam = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/bagrut/exams/${examId}`);

            if (response.data.success) {
                setExam(response.data.exam);
                setQuestions(response.data.questions);
            }
        } catch (error) {
            console.error('Error loading exam:', error);
            toast.error('שגיאה בטעינת המבחן');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAnswerImage(file);
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            }
            setShowCamera(true);
        } catch (error) {
            console.error('Camera error:', error);
            toast.error('לא ניתן לגשת למצלמה');
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);

            canvas.toBlob((blob) => {
                const file = new File([blob], 'answer.jpg', { type: 'image/jpeg' });
                setAnswerImage(file);
                setImagePreview(canvas.toDataURL());
                stopCamera();
                toast.success('תמונה נשמרה! 📸');
            }, 'image/jpeg', 0.9);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setShowCamera(false);
    };

    const submitAnswer = async () => {
        if (!currentAnswer && !answerImage) {
            toast.error('אנא כתוב תשובה או העלה תמונה');
            return;
        }

        try {
            setSubmitting(true);

            const formData = new FormData();
            formData.append('questionId', currentQuestion.id);
            formData.append('answer', currentAnswer);
            formData.append('timeSpent', timeElapsed);

            if (answerImage) {
                formData.append('answerImage', answerImage);
            }

            const response = await axios.post(
                `${API_URL}/api/bagrut/attempts/${attemptId}/answers`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${user?.token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data.success) {
                setVerificationResult(response.data);
                setShowFeedback(true);

                // Save answer locally
                setAnswers({
                    ...answers,
                    [currentQuestion.id]: {
                        answer: currentAnswer,
                        image: imagePreview,
                        result: response.data
                    }
                });

                toast.success('תשובה נשלחה! ✅');
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
            toast.error('שגיאה בשליחת התשובה');
        } finally {
            setSubmitting(false);
        }
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setCurrentAnswer('');
            setAnswerImage(null);
            setImagePreview(null);
            setShowFeedback(false);
            setVerificationResult(null);
            setTimeElapsed(0);
        }
    };

    const previousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
            setShowFeedback(false);
            setVerificationResult(null);
        }
    };

    const finishExam = async () => {
        try {
            const response = await axios.post(
                `${API_URL}/api/bagrut/attempts/${attemptId}/complete`,
                {},
                { headers: { Authorization: `Bearer ${user?.token}` }}
            );

            if (response.data.success) {
                toast.success('מבחן הושלם! 🎉');
                onComplete?.(response.data.summary);
            }
        } catch (error) {
            console.error('Error completing exam:', error);
            toast.error('שגיאה בסיום המבחן');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-xl font-bold text-gray-700">טוען מבחן...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50" dir="rtl">
            {/* Top Bar */}
            <div className="bg-white shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onExit}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl font-bold"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>יציאה</span>
                        </motion.button>

                        <div className="text-center flex-1 mx-4">
                            <h1 className="text-xl font-black text-gray-900">{exam?.exam_name}</h1>
                            <p className="text-sm text-gray-600">
                                שאלה {currentQuestionIndex + 1} מתוך {questions.length}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-xl">
                                <Clock className="w-5 h-5 text-blue-600" />
                                <span className="font-mono font-bold text-blue-900">
                                    {formatTime(timeElapsed)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-6 py-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestionIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        {/* Question Card */}
                        <div className="bg-white rounded-2xl p-8 shadow-xl">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                                            שאלה {currentQuestion?.question_number}
                                        </span>
                                        {currentQuestion?.section_number && (
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                                                פרק {currentQuestion.section_number}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {currentQuestion?.topic}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-black text-purple-600">
                                        {currentQuestion?.points}
                                    </div>
                                    <div className="text-xs text-gray-600">נקודות</div>
                                </div>
                            </div>

                            {/* Question Text */}
                            <div className="mb-6">
                                <MathDisplay content={currentQuestion?.question_text} />
                            </div>

                            {/* Question Image */}
                            {currentQuestion?.question_image_url && (
                                <div className="mb-6">
                                    <img
                                        src={currentQuestion.question_image_url}
                                        alt="Question"
                                        className="max-w-full rounded-xl shadow-lg"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Answer Section */}
                        {!showFeedback && (
                            <div className="bg-white rounded-2xl p-8 shadow-xl space-y-6">
                                <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                                    <Send className="w-6 h-6 text-purple-600" />
                                    התשובה שלך
                                </h3>

                                {/* Text Answer */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        כתוב את התשובה שלך:
                                    </label>
                                    <textarea
                                        value={currentAnswer}
                                        onChange={(e) => setCurrentAnswer(e.target.value)}
                                        placeholder="הקלד את התשובה כאן..."
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
                                        rows={6}
                                        dir="rtl"
                                    />
                                </div>

                                {/* Image Upload Options */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={startCamera}
                                        className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold shadow-lg"
                                    >
                                        <Camera className="w-5 h-5" />
                                        <span>צלם תשובה 📸</span>
                                    </motion.button>

                                    <label className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold shadow-lg cursor-pointer hover:scale-102 transition-transform">
                                        <Upload className="w-5 h-5" />
                                        <span>העלה תמונה 📁</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                    </label>
                                </div>

                                {/* Image Preview */}
                                {imagePreview && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="relative"
                                    >
                                        <img
                                            src={imagePreview}
                                            alt="Answer preview"
                                            className="w-full rounded-xl shadow-lg"
                                        />
                                        <button
                                            onClick={() => {
                                                setAnswerImage(null);
                                                setImagePreview(null);
                                            }}
                                            className="absolute top-2 left-2 p-2 bg-red-500 text-white rounded-full"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </motion.div>
                                )}

                                {/* Submit Button */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={submitAnswer}
                                    disabled={submitting || (!currentAnswer && !answerImage)}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                            <span>בודק תשובה...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            <span>שלח תשובה לבדיקה ✨</span>
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        )}

                        {/* Feedback Section */}
                        {showFeedback && verificationResult && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`bg-white rounded-2xl p-8 shadow-xl border-4 ${
                                    verificationResult.isCorrect
                                        ? 'border-green-400'
                                        : 'border-red-400'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        {verificationResult.isCorrect ? (
                                            <CheckCircle className="w-12 h-12 text-green-500" />
                                        ) : (
                                            <XCircle className="w-12 h-12 text-red-500" />
                                        )}
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900">
                                                {verificationResult.isCorrect ? 'תשובה נכונה! 🎉' : 'תשובה לא נכונה'}
                                            </h3>
                                            <p className="text-gray-600">
                                                {verificationResult.feedback}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-4xl font-black text-purple-600">
                                            {verificationResult.pointsEarned}/{currentQuestion?.points}
                                        </div>
                                        <div className="text-sm text-gray-600">נקודות</div>
                                    </div>
                                </div>

                                {/* Correct Answer */}
                                {!verificationResult.isCorrect && (
                                    <div className="bg-blue-50 rounded-xl p-6">
                                        <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                                            <Lightbulb className="w-5 h-5" />
                                            התשובה הנכונה:
                                        </h4>
                                        <MathDisplay content={verificationResult.correctAnswer} />
                                        {verificationResult.explanation && (
                                            <div className="mt-4 text-sm text-blue-800">
                                                <strong>הסבר:</strong> {verificationResult.explanation}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Navigation */}
                        <div className="flex items-center justify-between">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={previousQuestion}
                                disabled={currentQuestionIndex === 0}
                                className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ArrowRight className="w-5 h-5" />
                                <span>שאלה קודמת</span>
                            </motion.button>

                            {currentQuestionIndex === questions.length - 1 ? (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={finishExam}
                                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold shadow-lg"
                                >
                                    <Flag className="w-5 h-5" />
                                    <span>סיים מבחן 🏁</span>
                                </motion.button>
                            ) : (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={nextQuestion}
                                    disabled={!showFeedback}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span>שאלה הבאה</span>
                                    <ArrowLeft className="w-5 h-5" />
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Camera Modal */}
            <AnimatePresence>
                {showCamera && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-white rounded-2xl p-6 max-w-2xl w-full"
                        >
                            <h3 className="text-2xl font-black text-gray-900 mb-4">
                                📸 צלם את התשובה
                            </h3>

                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full rounded-xl mb-4"
                            />

                            <canvas ref={canvasRef} className="hidden" />

                            <div className="flex gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={capturePhoto}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold"
                                >
                                    📸 צלם
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={stopCamera}
                                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-bold"
                                >
                                    ביטול
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ExamPage;