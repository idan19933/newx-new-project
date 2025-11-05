import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AdminAddQuestion() {
    const { examId } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        questionNumber: '',
        sectionNumber: '1',
        subQuestion: '',
        questionText: '',
        correctAnswer: '',
        points: '10',
        topic: 'אלגברה',
        difficulty: 'medium',
        hints: ['', '', ''],
        solutionSteps: [''],
        hasMultipleParts: false
    });

    const [diagram, setDiagram] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            data.append('questionNumber', formData.questionNumber);
            data.append('sectionNumber', formData.sectionNumber);
            data.append('subQuestion', formData.subQuestion);
            data.append('questionText', formData.questionText);
            data.append('correctAnswer', formData.correctAnswer);
            data.append('points', formData.points);
            data.append('topic', formData.topic);
            data.append('difficulty', formData.difficulty);
            data.append('hints', JSON.stringify(formData.hints.filter(h => h)));
            data.append('solutionSteps', JSON.stringify(formData.solutionSteps.filter(s => s)));
            data.append('hasMultipleParts', formData.hasMultipleParts);

            if (diagram) {
                data.append('diagram', diagram);
            }

            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/admin/bagrut/exams/${examId}/questions`,
                data,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            alert('✅ השאלה נוספה בהצלחה!');
            navigate(`/admin/exams/${examId}`);

        } catch (error) {
            console.error('Error:', error);
            alert('❌ שגיאה בהוספת השאלה');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
                <h1 className="text-3xl font-bold mb-6 text-right">➕ הוספת שאלה למבחן</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Question Number */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-right mb-2 font-semibold">מספר שאלה</label>
                            <input
                                type="number"
                                value={formData.questionNumber}
                                onChange={(e) => setFormData({...formData, questionNumber: e.target.value})}
                                className="w-full p-2 border rounded text-right"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-right mb-2 font-semibold">חלק</label>
                            <input
                                type="number"
                                value={formData.sectionNumber}
                                onChange={(e) => setFormData({...formData, sectionNumber: e.target.value})}
                                className="w-full p-2 border rounded text-right"
                            />
                        </div>

                        <div>
                            <label className="block text-right mb-2 font-semibold">תת-שאלה</label>
                            <input
                                type="text"
                                value={formData.subQuestion}
                                onChange={(e) => setFormData({...formData, subQuestion: e.target.value})}
                                className="w-full p-2 border rounded text-right"
                                placeholder="א, ב, ג..."
                            />
                        </div>
                    </div>

                    {/* Question Text */}
                    <div>
                        <label className="block text-right mb-2 font-semibold">נוסח השאלה</label>
                        <textarea
                            value={formData.questionText}
                            onChange={(e) => setFormData({...formData, questionText: e.target.value})}
                            className="w-full p-3 border rounded text-right h-32"
                            required
                        />
                    </div>

                    {/* Diagram Upload */}
                    <div>
                        <label className="block text-right mb-2 font-semibold">תרשים / איור (אופציונלי)</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setDiagram(e.target.files[0])}
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    {/* Answer & Points */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-right mb-2 font-semibold">תשובה נכונה</label>
                            <input
                                type="text"
                                value={formData.correctAnswer}
                                onChange={(e) => setFormData({...formData, correctAnswer: e.target.value})}
                                className="w-full p-2 border rounded text-right"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-right mb-2 font-semibold">נקודות</label>
                            <input
                                type="number"
                                value={formData.points}
                                onChange={(e) => setFormData({...formData, points: e.target.value})}
                                className="w-full p-2 border rounded text-right"
                            />
                        </div>
                    </div>

                    {/* Topic & Difficulty */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-right mb-2 font-semibold">נושא</label>
                            <select
                                value={formData.topic}
                                onChange={(e) => setFormData({...formData, topic: e.target.value})}
                                className="w-full p-2 border rounded text-right"
                            >
                                <option>אלגברה</option>
                                <option>גאומטריה</option>
                                <option>טריגונומטריה</option>
                                <option>פונקציות</option>
                                <option>סטטיסטיקה</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-right mb-2 font-semibold">רמת קושי</label>
                            <select
                                value={formData.difficulty}
                                onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                                className="w-full p-2 border rounded text-right"
                            >
                                <option value="easy">קל</option>
                                <option value="medium">בינוני</option>
                                <option value="hard">קשה</option>
                            </select>
                        </div>
                    </div>

                    {/* Hints */}
                    <div>
                        <label className="block text-right mb-2 font-semibold">רמזים</label>
                        {formData.hints.map((hint, i) => (
                            <input
                                key={i}
                                type="text"
                                value={hint}
                                onChange={(e) => {
                                    const newHints = [...formData.hints];
                                    newHints[i] = e.target.value;
                                    setFormData({...formData, hints: newHints});
                                }}
                                className="w-full p-2 border rounded text-right mb-2"
                                placeholder={`רמז ${i + 1}`}
                            />
                        ))}
                    </div>

                    {/* Solution Steps */}
                    <div>
                        <label className="block text-right mb-2 font-semibold">שלבי פתרון</label>
                        {formData.solutionSteps.map((step, i) => (
                            <textarea
                                key={i}
                                value={step}
                                onChange={(e) => {
                                    const newSteps = [...formData.solutionSteps];
                                    newSteps[i] = e.target.value;
                                    setFormData({...formData, solutionSteps: newSteps});
                                }}
                                className="w-full p-2 border rounded text-right mb-2 h-20"
                                placeholder={`שלב ${i + 1}`}
                            />
                        ))}
                        <button
                            type="button"
                            onClick={() => setFormData({...formData, solutionSteps: [...formData.solutionSteps, '']})}
                            className="text-blue-600 hover:underline text-sm"
                        >
                            + הוסף שלב
                        </button>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? '⏳ שומר...' : '✅ הוסף שאלה'}
                    </button>
                </form>
            </div>
        </div>
    );
}