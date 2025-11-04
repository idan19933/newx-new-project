// src/services/notebookService.js - FRONTEND SERVICE ✅
const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

class NotebookService {
    /**
     * Save an exercise to the notebook
     */
    async saveExercise(userId, exerciseData) {
        try {
            console.log('📝 Saving exercise to notebook:', {
                userId,
                topic: exerciseData.topic,
                isCorrect: exerciseData.isCorrect,
                difficulty: exerciseData.difficulty
            });

            const response = await fetch(`${API_URL}/api/notebook/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    question: exerciseData.question,
                    correctAnswer: exerciseData.answer,
                    studentAnswer: exerciseData.studentAnswer,
                    isCorrect: exerciseData.isCorrect,
                    topic: exerciseData.topic || 'כללי',
                    subtopic: exerciseData.subtopic || '',
                    difficulty: exerciseData.difficulty || 'medium', // ✅ DIFFICULTY
                    hintsUsed: exerciseData.hintsUsed || 0,
                    attempts: exerciseData.attempts || 1,
                    timeSpent: exerciseData.timeSpent || 0
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                console.log('✅ Exercise saved successfully');
            }

            return data;

        } catch (error) {
            console.error('❌ Error saving exercise:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get all notebook entries
     */
    async getEntries(userId) {
        try {
            const response = await fetch(`${API_URL}/api/notebook/entries?userId=${userId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error('❌ Error getting entries:', error);
            return {
                success: false,
                error: error.message,
                entries: []
            };
        }
    }

    /**
     * Get notebook stats
     */
    async getStats(userId) {
        try {
            const response = await fetch(`${API_URL}/api/notebook/stats?userId=${userId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error('❌ Error getting stats:', error);
            return {
                success: false,
                error: error.message,
                stats: null
            };
        }
    }
}

export default new NotebookService();