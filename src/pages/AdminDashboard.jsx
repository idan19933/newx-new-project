// src/pages/AdminDashboard.jsx - FIXED FOR RAILWAY
import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    Upload, Image, FileText, CheckCircle, XCircle,
    Loader, Eye, RefreshCw, Camera, Sparkles,
    Brain, Zap, Award, BookOpen
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

// ✅ API URL from environment variable
const API_URL =
    'https://nexons-production-1915.up.railway.app';

console.log('🔧 API_URL configured:', API_URL);

const AdminDashboard = () => {
    const { user } = useAuthStore();
    const [uploads, setUploads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);

    const [formData, setFormData] = useState({
        examTitle: '',
        gradeLevel: '12',
        subject: 'mathematics',
        units: '5',
        examType: 'bagrut'
    });

    // 📤 Handle file drop
    const onDrop = useCallback((acceptedFiles) => {
        acceptedFiles.forEach(file => {
            handleImageUpload(file);
        });
    }, [formData]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
        },
        multiple: true
    });

    /**
     * 📸 העלאת תמונה - FIXED VERSION
     */
    /**
     * 📸 העלאת תמונה ויצירת מבחן
     */
    const handleImageUpload = async (file) => {
        const uploadToast = toast.loading('מעלה תמונה...');

        try {
            console.log('📤 Uploading to:', `${API_URL}/api/admin/upload-image`);
            console.log('📤 File:', file.name, file.size, 'bytes');

            setProcessing(true);

            const uploadFormData = new FormData();
            uploadFormData.append('image', file);

            // Step 1: Upload image
            const uploadResponse = await axios.post(
                `${API_URL}/api/admin/upload-image`,
                uploadFormData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    timeout: 30000
                }
            );

            console.log('✅ Upload response:', uploadResponse.data);

            if (!uploadResponse.data.success) {
                throw new Error(uploadResponse.data.error || 'Upload failed');
            }

            toast.success('✅ התמונה הועלתה!', { id: uploadToast });

            // Step 2: Create exam from image
            const createToast = toast.loading('מעבד עם AI...');

            const examData = {
                imageUrl: uploadResponse.data.imageUrl,
                examTitle: formData.examTitle,
                gradeLevel: formData.gradeLevel,
                subject: formData.subject,
                units: formData.units,
                examType: formData.examType
            };

            const createResponse = await axios.post(
                `${API_URL}/api/admin/create-exam`,
                examData,
                { timeout: 60000 } // 60 seconds for AI processing
            );

            console.log('✅ Exam created:', createResponse.data);

            toast.success(`✅ נוצר מבחן עם ${createResponse.data.questionsExtracted} שאלות!`, {
                id: createToast,
                duration: 5000
            });

            // Refresh uploads list
            await loadUploads();

            return createResponse.data;

        } catch (error) {
            console.error('❌ Upload error:', error);

            let errorMessage = 'שגיאה בהעלאת התמונה';

            if (error.code === 'ERR_NETWORK') {
                errorMessage = 'אין חיבור לשרת';
            } else if (error.response) {
                errorMessage = error.response.data?.error || `שגיאה: ${error.response.status}`;
            } else if (error.request) {
                errorMessage = 'השרת לא מגיב';
            } else {
                errorMessage = error.message;
            }

            toast.error(errorMessage, { id: uploadToast });
            throw error;

        } finally {
            setProcessing(false);
        }
    };
    /**
     * 📊 טעינת העלאות קיימות
     */
    const loadUploads = async () => {
        try {
            setLoading(true);
            console.log('📥 Loading uploads from:', `${API_URL}/api/admin/uploads`);

            const response = await axios.get(`${API_URL}/api/admin/uploads`, {
                timeout: 10000
            });

            console.log('✅ Uploads loaded:', response.data);

            if (response.data.success) {
                setUploads(response.data.uploads || []);
            }

        } catch (error) {
            console.error('❌ Load uploads error:', error);

            if (error.code === 'ERR_NETWORK') {
                toast.error('אין חיבור לשרת');
            } else {
                toast.error('שגיאה בטעינת המבחנים');
            }

        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadUploads();
    }, []);

    /**
     * 🧪 בדיקת חיבור לשרת
     */
    const testConnection = async () => {
        const testToast = toast.loading('בודק חיבור לשרת...');

        try {
            console.log('🧪 Testing connection to:', `${API_URL}/health`);

            const response = await axios.get(`${API_URL}/health`, {
                timeout: 5000
            });

            console.log('✅ Server health:', response.data);

            toast.success('✅ השרת פעיל!', { id: testToast });

        } catch (error) {
            console.error('❌ Connection test failed:', error);
            toast.error('❌ השרת לא זמין', { id: testToast });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 py-8 px-4" dir="rtl">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="inline-block text-6xl mb-4"
                    >
                        👨‍💼
                    </motion.div>
                    <h1 className="text-5xl font-black text-white mb-4">
                        פאנל ניהול - Admin Dashboard
                    </h1>
                    <p className="text-xl text-gray-200 mb-4">
                        העלה תמונות של מבחנים וה-AI יחלץ את השאלות אוטומטית 🚀
                    </p>

                    {/* Server Status */}
                    <div className="flex items-center justify-center gap-4 mt-4">
                        <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                            🌐 Server: {API_URL}
                        </div>
                        <button
                            onClick={testConnection}
                            className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-full text-white text-sm font-bold transition-colors"
                        >
                            🧪 בדוק חיבור
                        </button>
                    </div>
                </motion.div>

                {/* Upload Form */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl p-8 shadow-2xl mb-8"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <Camera className="w-8 h-8 text-purple-600" />
                        <h2 className="text-3xl font-black text-gray-800">העלאת מבחן חדש</h2>
                    </div>

                    {/* Form Fields */}
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                כותרת המבחן
                            </label>
                            <input
                                type="text"
                                value={formData.examTitle}
                                onChange={(e) => setFormData({ ...formData, examTitle: e.target.value })}
                                placeholder="לדוגמה: מבחן בגרות מתמטיקה 5 יחידות - מועד 806"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                כיתה
                            </label>
                            <select
                                value={formData.gradeLevel}
                                onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 font-medium"
                            >
                                <option value="7">כיתה ז'</option>
                                <option value="8">כיתה ח'</option>
                                <option value="9">כיתה ט'</option>
                                <option value="10">כיתה י'</option>
                                <option value="11">כיתה יא'</option>
                                <option value="12">כיתה יב'</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                מספר יחידות
                            </label>
                            <select
                                value={formData.units}
                                onChange={(e) => setFormData({ ...formData, units: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 font-medium"
                            >
                                <option value="3">3 יחידות</option>
                                <option value="4">4 יחידות</option>
                                <option value="5">5 יחידות</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                סוג מבחן
                            </label>
                            <select
                                value={formData.examType}
                                onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 font-medium"
                            >
                                <option value="bagrut">בגרות</option>
                                <option value="monthly">מבחן חודשי</option>
                                <option value="practice">תרגול</option>
                                <option value="mock">מבחן מבחן</option>
                            </select>
                        </div>
                    </div>

                    {/* Dropzone */}
                    <div
                        {...getRootProps()}
                        className={`border-4 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer ${
                            isDragActive
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                        } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <input {...getInputProps()} disabled={processing} />
                        <motion.div
                            animate={{ scale: isDragActive ? 1.1 : 1 }}
                            className="flex flex-col items-center"
                        >
                            {processing ? (
                                <>
                                    <Loader className="w-20 h-20 text-purple-600 animate-spin mb-4" />
                                    <p className="text-2xl font-black text-purple-600 mb-2">
                                        מעלה תמונה... ⚡
                                    </p>
                                    <p className="text-gray-600">
                                        אנא המתן...
                                    </p>
                                </>
                            ) : isDragActive ? (
                                <>
                                    <Upload className="w-20 h-20 text-purple-600 mb-4" />
                                    <p className="text-2xl font-black text-purple-600">
                                        שחרר כאן! 📸
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Image className="w-20 h-20 text-gray-400 mb-4" />
                                    <p className="text-2xl font-black text-gray-800 mb-2">
                                        גרור תמונות לכאן או לחץ לבחירה
                                    </p>
                                    <p className="text-gray-600 mb-4">
                                        תומך ב-PNG, JPG, JPEG, GIF, WEBP
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-purple-600 font-bold">
                                        <Sparkles className="w-5 h-5" />
                                        <span>AI מתקדם יחלץ את כל השאלות אוטומטית</span>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </div>
                </motion.div>

                {/* Uploads List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-3xl p-8 shadow-2xl"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <FileText className="w-8 h-8 text-blue-600" />
                            <h2 className="text-3xl font-black text-gray-800">מבחנים שהועלו</h2>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={loadUploads}
                            disabled={loading}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl disabled:opacity-50"
                        >
                            <RefreshCw className={`w-5 h-5 inline-block ml-2 ${loading ? 'animate-spin' : ''}`} />
                            רענן
                        </motion.button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <Loader className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
                            <p className="text-gray-600">טוען...</p>
                        </div>
                    ) : uploads.length === 0 ? (
                        <div className="text-center py-12">
                            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-xl text-gray-600">אין מבחנים עדיין</p>
                            <p className="text-gray-500">העלה את המבחן הראשון שלך! 🚀</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {uploads.map((upload, index) => (
                                <motion.div
                                    key={upload.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="border-2 border-gray-200 rounded-2xl p-6 hover:border-purple-400 hover:shadow-lg transition-all"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                {upload.status === 'completed' ? (
                                                    <CheckCircle className="w-6 h-6 text-green-500" />
                                                ) : upload.status === 'failed' ? (
                                                    <XCircle className="w-6 h-6 text-red-500" />
                                                ) : (
                                                    <Loader className="w-6 h-6 text-blue-500 animate-spin" />
                                                )}
                                                <h3 className="text-xl font-black text-gray-800">
                                                    {upload.exam_title || upload.original_name}
                                                </h3>
                                            </div>

                                            <div className="grid md:grid-cols-4 gap-4 mt-4">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Award className="w-4 h-4 text-purple-600" />
                                                    <span className="font-bold">כיתה {upload.grade_level}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Zap className="w-4 h-4 text-orange-600" />
                                                    <span className="font-bold">{upload.units} יחידות</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Brain className="w-4 h-4 text-blue-600" />
                                                    <span className="font-bold">{upload.total_questions || 0} שאלות</span>
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {new Date(upload.uploaded_at).toLocaleDateString('he-IL')}
                                                </div>
                                            </div>

                                            {upload.status === 'completed' && (
                                                <div className="mt-4 p-4 bg-green-50 rounded-xl">
                                                    <p className="text-sm font-bold text-green-800">
                                                        ✅ חולצו {upload.questions_extracted} שאלות מהמבחן
                                                    </p>
                                                </div>
                                            )}

                                            {upload.status === 'failed' && (
                                                <div className="mt-4 p-4 bg-red-50 rounded-xl">
                                                    <p className="text-sm font-bold text-red-800">
                                                        ❌ שגיאה: {upload.error_message}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            {upload.image_url && (
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => window.open(upload.image_url, '_blank')}
                                                    className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                                                    title="צפה בתמונה"
                                                >
                                                    <Eye className="w-5 h-5 text-blue-600" />
                                                </motion.button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default AdminDashboard;