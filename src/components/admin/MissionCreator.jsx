// client/src/components/admin/MissionCreator.jsx - CREATE MISSIONS
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Plus, Save, X, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const MissionCreator = ({ userId, userName, onClose, onCreated }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        missionType: 'practice',
        points: 10,
        deadline: ''
    });

    const [config, setConfig] = useState({
        // Practice config
        topicId: '',
        subtopicId: '',
        requiredQuestions: 10,
        minAccuracy: 70,

        // Lecture config
        lectureId: '',
        requiredSections: []
    });

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            console.log('📝 Creating mission:', formData);

            const missionConfig = formData.missionType === 'practice'
                ? {
                    topicId: config.topicId,
                    subtopicId: config.subtopicId,
                    requiredQuestions: parseInt(config.requiredQuestions),
                    minAccuracy: parseFloat(config.minAccuracy)
                }
                : {
                    lectureId: config.lectureId,
                    requiredSections: config.requiredSections
                };

            const response = await axios.post(`${API_URL}/api/missions/create`, {
                userId,
                title: formData.title,
                description: formData.description,
                missionType: formData.missionType,
                config: missionConfig,
                points: parseInt(formData.points),
                deadline: formData.deadline || null,
                createdBy: 1 // Admin user ID
            });

            if (response.data.success) {
                toast.success('✅ משימה נוצרה בהצלחה!');
                if (onCreated) onCreated();
                if (onClose) onClose();
            } else {
                toast.error('❌ שגיאה ביצירת משימה');
            }

        } catch (error) {
            console.error('❌ Error creating mission:', error);
            toast.error('שגיאה ביצירת משימה');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
                <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <Target className="w-7 h-7 text-purple-400" />
                        יצירת משימה חדשה
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Student Info */}
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                        <p className="text-white font-bold">תלמיד: {userName}</p>
                        <p className="text-gray-400 text-sm">ID: {userId}</p>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-white font-bold mb-2">
                            כותרת המשימה *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="לדוגמה: תרגול בחוקי חזקות"
                            className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-2 border-gray-600 focus:border-purple-500 focus:outline-none"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-white font-bold mb-2">
                            תיאור (אופציונלי)
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="הוסף פרטים נוספים על המשימה..."
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-2 border-gray-600 focus:border-purple-500 focus:outline-none resize-none"
                        />
                    </div>

                    {/* Mission Type */}
                    <div>
                        <label className="block text-white font-bold mb-3">
                            סוג משימה *
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, missionType: 'practice' })}
                                className={`py-4 px-6 rounded-xl border-2 font-bold transition-all ${
                                    formData.missionType === 'practice'
                                        ? 'bg-purple-600 border-purple-500 text-white'
                                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                                }`}
                            >
                                💪 תרגול
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, missionType: 'lecture' })}
                                className={`py-4 px-6 rounded-xl border-2 font-bold transition-all ${
                                    formData.missionType === 'lecture'
                                        ? 'bg-purple-600 border-purple-500 text-white'
                                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                                }`}
                            >
                                📚 הרצאה
                            </button>
                        </div>
                    </div>

                    {/* Practice Configuration */}
                    {formData.missionType === 'practice' && (
                        <div className="space-y-4 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                💪 הגדרות תרגול
                            </h3>

                            <div>
                                <label className="block text-white font-bold mb-2 text-sm">
                                    מספר שאלות נדרש *
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={config.requiredQuestions}
                                    onChange={(e) => setConfig({ ...config, requiredQuestions: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border-2 border-gray-600 focus:border-blue-500 focus:outline-none"
                                    required
                                />
                                <p className="text-gray-400 text-xs mt-1">
                                    💡 שאלות זהות לא נספרות פעמיים
                                </p>
                            </div>

                            <div>
                                <label className="block text-white font-bold mb-2 text-sm">
                                    אחוז דיוק מינימלי (%)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={config.minAccuracy}
                                    onChange={(e) => setConfig({ ...config, minAccuracy: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border-2 border-gray-600 focus:border-blue-500 focus:outline-none"
                                />
                                <p className="text-gray-400 text-xs mt-1">
                                    אופציונלי - דרוש דיוק מינימלי להשלמת המשימה
                                </p>
                            </div>

                            <div className="bg-blue-600/20 rounded-lg p-3">
                                <p className="text-blue-300 text-sm flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>
                                        התלמיד צריך לפתור <strong>{config.requiredQuestions} שאלות שונות</strong> עם דיוק של לפחות <strong>{config.minAccuracy}%</strong> כדי להשלים את המשימה.
                                    </span>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Lecture Configuration */}
                    {formData.missionType === 'lecture' && (
                        <div className="space-y-4 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                📚 הגדרות הרצאה
                            </h3>

                            <div className="bg-green-600/20 rounded-lg p-3">
                                <p className="text-green-300 text-sm flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>
                                        ההרצאה תסומן כהושלמה אוטומטית כאשר התלמיד יסיים את כל הסקשנים.
                                    </span>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Points & Deadline */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-white font-bold mb-2">
                                נקודות 🏆
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="5"
                                value={formData.points}
                                onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-2 border-gray-600 focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-white font-bold mb-2">
                                מועד אחרון ⏰
                            </label>
                            <input
                                type="date"
                                value={formData.deadline}
                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-2 border-gray-600 focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={loading || !formData.title}
                            className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-black text-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin w-5 h-5 border-3 border-white border-t-transparent rounded-full"></div>
                                    <span>יוצר משימה...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    <span>צור משימה</span>
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-4 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600"
                        >
                            ביטול
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default MissionCreator;