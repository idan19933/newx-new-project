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

    if (!questions || questions.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">המבחן עדיין לא מוכן</h2>
                    <p className="text-gray-600 mb-4">אין שאלות במבחן זה כרגע</p>
                    <button
                        onClick={onExit}
                        className="px-6 py-3 bg-purple-500 text-white rounded-xl font-bold"
                    >
                        חזרה למבחנים
                    </button>
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
                <div className="bg-white rounded-2xl p-8 shadow-xl mb-6">
                    <h2 className="text-3xl font-black text-gray-900 mb-6">
                        שאלה {currentQuestionIndex + 1}
                    </h2>
                    <p className="text-xl text-gray-700">
                        {currentQuestion?.question_text || 'שאלה לא זמינה'}
                    </p>

                    {!showFeedback && (
                        <div className="mt-6">
                            <textarea
                                value={currentAnswer}
                                onChange={(e) => setCurrentAnswer(e.target.value)}
                                placeholder="כתוב את התשובה שלך..."
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 resize-none"
                                rows={4}
                            />

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={submitAnswer}
                                disabled={submitting}
                                className="w-full mt-4 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold disabled:opacity-50"
                            >
                                {submitting ? 'שולח...' : 'שלח תשובה'}
                            </motion.button>
                        </div>
                    )}

                    {showFeedback && verificationResult && (
                        <div className={`mt-6 p-6 rounded-xl ${verificationResult.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                            <h3 className="text-2xl font-bold mb-2">
                                {verificationResult.isCorrect ? '✅ תשובה נכונה!' : '❌ תשובה לא נכונה'}
                            </h3>
                            <p>{verificationResult.feedback}</p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={previousQuestion}
                        disabled={currentQuestionIndex === 0}
                        className="px-6 py-3 bg-white rounded-xl font-bold shadow-lg disabled:opacity-50"
                    >
                        ← קודם
                    </button>

                    {currentQuestionIndex === questions.length - 1 ? (
                        <button
                            onClick={finishExam}
                            className="px-8 py-3 bg-green-500 text-white rounded-xl font-bold shadow-lg"
                        >
                            סיים מבחן 🏁
                        </button>
                    ) : (
                        <button
                            onClick={nextQuestion}
                            disabled={!showFeedback}
                            className="px-6 py-3 bg-purple-500 text-white rounded-xl font-bold shadow-lg disabled:opacity-50"
                        >
                            הבא →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExamPage;