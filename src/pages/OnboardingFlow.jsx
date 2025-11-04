// src/pages/OnboardingFlow.jsx - FIXED VERSION WITH UPDATED CURRICULUM
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, Brain, Target, BookOpen, Sparkles,
    Zap, Award, Star, ChevronRight, ChevronLeft
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { getUserGradeId, getGradeConfig } from '../config/israeliCurriculum';
import toast from 'react-hot-toast';

// ==================== GRADE CONFIGURATION ====================
const GRADES = [
    { value: '7', label: 'כיתה ז׳', displayName: 'ז׳', emoji: '7️⃣' },
    { value: '8', label: 'כיתה ח׳', displayName: 'ח׳', emoji: '8️⃣' },
    { value: '9', label: 'כיתה ט׳', displayName: 'ט׳', emoji: '9️⃣' },
    { value: '10', label: 'כיתה י׳', displayName: 'י׳', emoji: '🔟' },
    { value: '11', label: 'כיתה יא׳', displayName: 'יא׳', emoji: '1️⃣1️⃣' },
    { value: '12', label: 'כיתה יב׳', displayName: 'יב׳', emoji: '1️⃣2️⃣' }
];

// ==================== TRACK CONFIGURATION ====================
const TRACKS = {
    middle: [
        { value: 'regular', label: 'רגיל', description: 'מסלול רגיל', emoji: '📚' }
    ],
    high: [
        { value: '3-units', label: '3 יחידות', description: 'מסלול 3 יחידות', emoji: '📗' },
        { value: '4-units', label: '4 יחידות', description: 'מסלול 4 יחידות', emoji: '📘' },
        { value: '5-units', label: '5 יחידות', description: 'מסלול 5 יחידות', emoji: '📕' }
    ]
};

const OnboardingFlow = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { user, completeOnboarding } = useAuthStore();

    const [formData, setFormData] = useState({
        name: '',
        grade: '',
        educationLevel: '',
        track: '',
        mathFeeling: '',
        goalFocus: '',
        weakTopics: []
    });

    // Load saved progress from localStorage
    useEffect(() => {
        const savedProgress = localStorage.getItem('nexon_onboarding_progress');
        if (savedProgress) {
            try {
                const parsed = JSON.parse(savedProgress);
                setFormData(parsed.formData || formData);
                setStep(parsed.step || 1);
            } catch (e) {
                console.error('Failed to load saved progress:', e);
            }
        }
    }, []);

    // Save progress to localStorage
    useEffect(() => {
        if (step > 1 || formData.name || formData.grade) {
            localStorage.setItem('nexon_onboarding_progress', JSON.stringify({
                formData,
                step
            }));
        }
    }, [formData, step]);

    // Auto-fill name from user profile
    useEffect(() => {
        if (user && !formData.name) {
            const userName = user.displayName || user.email?.split('@')[0] || '';
            setFormData(prev => ({
                ...prev,
                name: userName
            }));
        }
    }, [user]);

    // Auto-set education level when grade changes
    useEffect(() => {
        if (formData.grade) {
            const gradeNum = parseInt(formData.grade);
            const level = gradeNum <= 9 ? 'middle' : 'high';
            setFormData(prev => ({
                ...prev,
                educationLevel: level,
                track: level === 'middle' ? 'regular' : prev.track
            }));
        }
    }, [formData.grade]);

    // Get curriculum topics dynamically - FIXED VERSION
    // Get curriculum topics dynamically - DIRECT ACCESS VERSION
    const getCurriculumTopics = () => {
        if (!formData.grade || !formData.track) {
            console.log('🔍 No grade or track selected');
            return [];
        }

        const gradeId = getUserGradeId(formData.grade, formData.track);
        console.log('🔍 Getting curriculum for:', { grade: formData.grade, track: formData.track, gradeId });

        // Import fresh every time
        import('../config/israeliCurriculum.js').then(module => {
            console.log('FRESH IMPORT - Topics:', module.ISRAELI_CURRICULUM[gradeId]?.topics?.length);
        });

        const gradeConfig = getGradeConfig(gradeId);

        if (!gradeConfig || !gradeConfig.topics) {
            console.log('❌ No grade config found for:', gradeId);
            return [];
        }

        console.log('✅ Found topics:', gradeConfig.topics.length);

        // Return topics directly as an array
        return gradeConfig.topics.map(topic => ({
            id: topic.id,
            name: topic.name,
            icon: topic.icon || '📚',
            difficulty: topic.difficulty
        }));
    };

    // ==================== FORM OPTIONS (SIMPLIFIED FOR KIDS) ====================

    const mathFeelings = [
        {
            value: 'love',
            emoji: '😍',
            title: 'אני אוהב/ת מתמטיקה!',
            text: 'זה כיף ומעניין'
        },
        {
            value: 'okay',
            emoji: '🙂',
            title: 'זה בסדר',
            text: 'לפעמים כיף, לפעמים קשה'
        },
        {
            value: 'struggle',
            emoji: '😓',
            title: 'זה קשה לי',
            text: 'אני צריך/ה עזרה'
        }
    ];

    const goalFocusOptions = [
        {
            value: 'understanding',
            emoji: '💡',
            title: 'להבין טוב יותר',
            text: 'אני רוצה להבין את החומר'
        },
        {
            value: 'grades',
            emoji: '⭐',
            title: 'לשפר ציונים',
            text: 'אני רוצה ציונים יותר טובים'
        },
        {
            value: 'confidence',
            emoji: '💪',
            title: 'להרגיש בטוח/ה',
            text: 'אני רוצה להרגיש שאני יכול/ה'
        },
        {
            value: 'exams',
            emoji: '🎯',
            title: 'להצליח במבחנים',
            text: 'אני רוצה להצליח במבחנים'
        }
    ];

    // ==================== HANDLERS ====================

    const handleTopicToggle = (topicId) => {
        setFormData(prev => ({
            ...prev,
            weakTopics: prev.weakTopics.includes(topicId)
                ? prev.weakTopics.filter(t => t !== topicId)
                : [...prev.weakTopics, topicId]
        }));
    };

    const canProceed = () => {
        switch (step) {
            case 1:
                return formData.name && formData.grade && formData.track;
            case 2:
                return formData.mathFeeling;
            case 3:
                return formData.goalFocus;
            case 4:
                return true; // Optional topics
            case 5:
                return true; // Summary
            default:
                return false;
        }
    };

    const nextStep = () => {
        if (canProceed()) {
            setStep(step + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            toast.error('אנא מלא/י את השדות הנדרשים');
        }
    };

    const prevStep = () => {
        setStep(Math.max(1, step - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        if (!canProceed()) {
            toast.error('אנא מלא/י את כל השדות הנדרשים');
            return;
        }

        setLoading(true);

        try {
            // Only send fields that are actually collected
            const profileData = {
                name: formData.name,
                grade: formData.grade,
                educationLevel: formData.educationLevel,
                track: formData.track,
                mathFeeling: formData.mathFeeling,
                goalFocus: formData.goalFocus,
                weakTopics: formData.weakTopics || [],
                onboardingCompleted: true,
                createdAt: new Date().toISOString()
            };

            console.log('📝 Submitting profile data:', profileData);

            await completeOnboarding(profileData);

            // Clear saved progress
            localStorage.removeItem('nexon_onboarding_progress');

            toast.success('🎉 הפרופיל שלך מוכן! ברוכ/ה הבא/ה לנקסון');

            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);

        } catch (error) {
            console.error('Onboarding error:', error);
            toast.error('אופס! משהו השתבש. נסה/י שוב.');
        } finally {
            setLoading(false);
        }
    };

    // ==================== RENDER STEPS ====================

    const renderStep = () => {
        switch (step) {
            // ==================== STEP 1: BASIC INFO ====================
            case 1:
                return (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="space-y-6 md:space-y-8"
                    >
                        <div className="text-center space-y-3 md:space-y-4">
                            <div className="inline-block">
                                <Sparkles className="w-12 h-12 md:w-16 md:h-16 text-yellow-400 mx-auto" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-white">
                                היי! בוא/י נכיר 👋
                            </h2>
                            <p className="text-base md:text-xl text-gray-300">
                                ספר/י לי קצת על עצמך
                            </p>
                        </div>

                        {/* Name */}
                        <div className="space-y-3">
                            <label className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                                <Heart className="w-5 h-5 md:w-6 md:h-6 text-pink-400" />
                                איך קוראים לך?
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="השם שלך..."
                                className="w-full p-4 md:p-5 bg-gray-800 border-2 border-gray-700 rounded-2xl text-white text-lg md:text-xl placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-all"
                                dir="auto"
                            />
                        </div>

                        {/* Grade Selection */}
                        <div className="space-y-3 md:space-y-4">
                            <label className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                                <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                                באיזו כיתה את/ה?
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                                {GRADES.map((grade) => (
                                    <motion.button
                                        key={grade.value}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setFormData({ ...formData, grade: grade.value })}
                                        className={`p-4 md:p-6 rounded-2xl border-2 transition-all text-center ${
                                            formData.grade === grade.value
                                                ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-400 shadow-xl shadow-blue-500/50'
                                                : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                        }`}
                                    >
                                        <div className="text-3xl md:text-4xl mb-2">
                                            {grade.emoji}
                                        </div>
                                        <div className="text-lg md:text-xl font-black text-white">
                                            {grade.displayName}
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Track Selection (only for high school) */}
                        {formData.grade && formData.educationLevel === 'high' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-3 md:space-y-4"
                            >
                                <label className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                                    <Target className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
                                    מה ההקבצה שלך?
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                                    {TRACKS.high.map((track) => (
                                        <motion.button
                                            key={track.value}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setFormData({ ...formData, track: track.value })}
                                            className={`p-4 md:p-6 rounded-2xl border-2 transition-all ${
                                                formData.track === track.value
                                                    ? 'bg-gradient-to-br from-green-600 to-green-700 border-green-400 shadow-xl shadow-green-500/50'
                                                    : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                            }`}
                                        >
                                            <div className="text-3xl md:text-4xl mb-2">{track.emoji}</div>
                                            <div className="text-lg md:text-xl font-black text-white mb-1">
                                                {track.label}
                                            </div>
                                            <div className="text-xs md:text-sm text-gray-300">
                                                {track.description}
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                );

            // ==================== STEP 2: MATH FEELING (SIMPLIFIED) ====================
            case 2:
                return (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="space-y-6 md:space-y-10"
                    >
                        <div className="text-center space-y-3">
                            <Heart className="w-12 h-12 md:w-16 md:h-16 text-red-400 mx-auto" />
                            <h2 className="text-3xl md:text-4xl font-black text-white">
                                מה אתה מרגיש/ה כלפי מתמטיקה?
                            </h2>
                            <p className="text-base md:text-lg text-gray-300">
                                תגיד/י לי בכנות - אין תשובות נכונות או לא נכונות! 😊
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:gap-5 max-w-2xl mx-auto">
                            {mathFeelings.map((feeling) => (
                                <motion.button
                                    key={feeling.value}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setFormData({ ...formData, mathFeeling: feeling.value })}
                                    className={`p-6 md:p-8 rounded-2xl border-2 transition-all text-right ${
                                        formData.mathFeeling === feeling.value
                                            ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-400 shadow-xl shadow-blue-500/50'
                                            : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                    }`}
                                >
                                    <div className="flex items-center gap-4 md:gap-6">
                                        <span className="text-5xl md:text-6xl">{feeling.emoji}</span>
                                        <div className="flex-1 text-right">
                                            <div className="text-xl md:text-2xl font-black text-white mb-1">
                                                {feeling.title}
                                            </div>
                                            <div className="text-sm md:text-base text-gray-300">
                                                {feeling.text}
                                            </div>
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                );

            // ==================== STEP 3: GOALS (SIMPLIFIED) ====================
            case 3:
                return (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="space-y-6 md:space-y-10"
                    >
                        <div className="text-center space-y-3">
                            <Target className="w-12 h-12 md:w-16 md:h-16 text-green-400 mx-auto" />
                            <h2 className="text-3xl md:text-4xl font-black text-white">
                                מה המטרה שלך השנה?
                            </h2>
                            <p className="text-base md:text-lg text-gray-300">
                                מה הכי חשוב לך להשיג?
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 max-w-4xl mx-auto">
                            {goalFocusOptions.map((goal) => (
                                <motion.button
                                    key={goal.value}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setFormData({ ...formData, goalFocus: goal.value })}
                                    className={`p-6 md:p-8 rounded-2xl border-2 transition-all text-center ${
                                        formData.goalFocus === goal.value
                                            ? 'bg-gradient-to-br from-green-600 to-green-700 border-green-400 shadow-xl shadow-green-500/50'
                                            : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                    }`}
                                >
                                    <div className="text-5xl md:text-6xl mb-3 md:mb-4">{goal.emoji}</div>
                                    <div className="text-xl md:text-2xl font-black text-white mb-2">
                                        {goal.title}
                                    </div>
                                    <div className="text-sm md:text-base text-gray-300">
                                        {goal.text}
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                );

            // ==================== STEP 4: WEAK TOPICS (CURRICULUM-BASED - FIXED) ====================
            case 4:
                const curriculumTopics = getCurriculumTopics();

                return (
                    <motion.div
                        key="step4"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="space-y-6 md:space-y-8"
                    >
                        <div className="text-center space-y-3">
                            <Brain className="w-12 h-12 md:w-16 md:h-16 text-purple-400 mx-auto" />
                            <h2 className="text-3xl md:text-4xl font-black text-white">
                                באילו נושאים תרצה/י עזרה?
                            </h2>
                            <p className="text-base md:text-lg text-gray-300">
                                בחר/י נושאים שקשה לך איתם (לא חובה)
                            </p>
                        </div>

                        {curriculumTopics.length > 0 ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {curriculumTopics.map((topic) => (
                                        <motion.button
                                            key={topic.id}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleTopicToggle(topic.id)}
                                            className={`p-4 rounded-xl border-2 transition-all text-right ${
                                                formData.weakTopics.includes(topic.id)
                                                    ? 'bg-gradient-to-br from-orange-600/30 to-red-600/30 border-orange-400'
                                                    : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{topic.icon}</span>
                                                <div className="text-sm md:text-base text-white flex-1">
                                                    {topic.name}
                                                </div>
                                                {formData.weakTopics.includes(topic.id) && (
                                                    <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <span className="text-white text-xs">✓</span>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 p-10">
                                <p className="text-lg">בחר/י כיתה והקבצה כדי לראות את הנושאים</p>
                            </div>
                        )}
                    </motion.div>
                );

            // ==================== STEP 5: SUMMARY ====================
            case 5:
                const selectedGrade = GRADES.find(g => g.value === formData.grade);
                const selectedTrack = formData.educationLevel === 'high'
                    ? TRACKS.high.find(t => t.value === formData.track)
                    : { label: 'רגיל' };

                return (
                    <motion.div
                        key="step5"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="space-y-6 md:space-y-8"
                    >
                        <div className="text-center space-y-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full">
                                <Zap className="w-8 h-8 md:w-10 md:h-10 text-white" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-white">
                                מעולה! הפרופיל שלך מוכן 🎉
                            </h2>
                            <p className="text-base md:text-xl text-gray-300">
                                הנה סיכום של מה שספרת לי
                            </p>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Basic Info */}
                            <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 border-2 border-blue-500/50 rounded-2xl p-5 md:p-6">
                                <h3 className="text-base md:text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5" />
                                    מידע בסיסי
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 text-sm md:text-base">שם:</span>
                                        <span className="text-white font-bold text-sm md:text-base">{formData.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 text-sm md:text-base">כיתה:</span>
                                        <span className="text-white font-bold text-sm md:text-base">{selectedGrade?.label}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 text-sm md:text-base">הקבצה:</span>
                                        <span className="text-white font-bold text-sm md:text-base">{selectedTrack?.label}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Feelings & Goals */}
                            <div className="bg-gradient-to-br from-green-900/40 to-green-800/40 border-2 border-green-500/50 rounded-2xl p-5 md:p-6">
                                <h3 className="text-base md:text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Target className="w-5 h-5" />
                                    מטרות ותחושות
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-sm md:text-base">יחס למתמטיקה:</span>
                                        <span className="text-2xl md:text-3xl">
                                            {mathFeelings.find(f => f.value === formData.mathFeeling)?.emoji}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-sm md:text-base">מטרה עיקרית:</span>
                                        <span className="text-2xl md:text-3xl">
                                            {goalFocusOptions.find(g => g.value === formData.goalFocus)?.emoji}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Weak Topics Summary */}
                        {formData.weakTopics.length > 0 && (
                            <div className="bg-gradient-to-br from-orange-900/40 to-red-900/40 border-2 border-orange-500/50 rounded-2xl p-5 md:p-6">
                                <h3 className="text-base md:text-lg font-bold text-white mb-3 flex items-center gap-2">
                                    <Brain className="w-5 h-5" />
                                    נושאים לחיזוק
                                </h3>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300 text-sm md:text-base">
                                        בחרת {formData.weakTopics.length} נושאים שתרצה/י לחזק
                                    </span>
                                    <span className="text-2xl md:text-3xl font-bold text-orange-400">
                                        {formData.weakTopics.length}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Ready to Start */}
                        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500 rounded-2xl p-6 md:p-8 text-center">
                            <div className="text-5xl md:text-6xl mb-4">🚀</div>
                            <h3 className="text-xl md:text-2xl font-black text-white mb-2">
                                אני מוכן ללוות אותך!
                            </h3>
                            <p className="text-base md:text-lg text-gray-300 mb-6">
                                עכשיו אני יודע בדיוק איך לעזור לך להצליח במתמטיקה
                            </p>
                            <div className="bg-white/10 rounded-xl p-4">
                                <p className="text-green-300 font-semibold text-sm md:text-base">
                                    ✨ לחץ/י על "בואו נתחיל!" כדי להתחיל את המסע שלנו יחד
                                </p>
                            </div>
                        </div>
                    </motion.div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4" dir="rtl">
            <div className="max-w-5xl w-full">
                {/* Progress Bar */}
                <div className="mb-6 md:mb-8">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-white font-semibold text-base md:text-lg">
                            שלב {step} מתוך 5
                        </span>
                        <span className="text-blue-300 font-bold text-base md:text-lg">
                            {Math.round((step / 5) * 100)}%
                        </span>
                    </div>
                    <div className="h-3 md:h-4 bg-gray-800 rounded-full overflow-hidden shadow-inner">
                        <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 via-green-500 to-emerald-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${(step / 5) * 100}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-gray-900/80 backdrop-blur-2xl rounded-3xl p-5 md:p-10 border border-gray-700 shadow-2xl min-h-[500px] md:min-h-[600px]">
                    <AnimatePresence mode="wait">
                        {renderStep()}
                    </AnimatePresence>
                </div>

                {/* Navigation Buttons - RTL Fixed */}
                <div className="flex justify-between mt-6 md:mt-8 gap-3 md:gap-4">
                    {/* Back Button - On the LEFT in RTL */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={prevStep}
                        disabled={step === 1}
                        className="px-6 md:px-8 py-3 md:py-4 bg-gray-800 text-white rounded-2xl hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold border border-gray-700 text-base md:text-lg flex items-center gap-2"
                    >
                        <ChevronRight className="w-5 h-5" />
                        <span>חזור</span>
                    </motion.button>

                    {/* Next/Finish Button - On the RIGHT in RTL */}
                    {step < 5 ? (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={nextStep}
                            disabled={!canProceed()}
                            className="px-8 md:px-12 py-3 md:py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-2xl hover:shadow-2xl hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-black text-base md:text-xl flex items-center gap-2"
                        >
                            <span>הבא</span>
                            <ChevronLeft className="w-5 h-5" />
                        </motion.button>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-8 md:px-12 py-3 md:py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl hover:shadow-2xl hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-black text-base md:text-xl flex items-center gap-2 md:gap-3"
                        >
                            {loading ? (
                                <>
                                    <div className="inline-block animate-spin rounded-full h-5 w-5 md:h-7 md:w-7 border-b-2 border-white"></div>
                                    <span>שומר...</span>
                                </>
                            ) : (
                                <>
                                    <span>בואו נתחיל!</span>
                                    <span className="text-2xl md:text-3xl">🚀</span>
                                </>
                            )}
                        </motion.button>
                    )}
                </div>

                {/* Help Text */}
                <div className="text-center mt-4 md:mt-6 text-gray-400 text-sm md:text-base">
                    💡 אפשר תמיד לשנות את ההעדפות בהגדרות
                </div>
            </div>
        </div>
    );
};

export default OnboardingFlow;