// client/src/components/missions/MissionTracker.jsx - STUDENT MISSION VIEW
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Target, CheckCircle, Circle, Clock, Trophy,
    TrendingUp, Brain, BookOpen, AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const MissionTracker = ({ userId }) => {
    const navigate = useNavigate();
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            loadMissions();
        }
    }, [userId]);

    const loadMissions = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/missions/my-missions/${userId}`);

            if (response.data.success) {
                setMissions(response.data.missions || []);
            }
        } catch (error) {
            console.error('❌ Error loading missions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getMissionIcon = (type) => {
        switch (type) {
            case 'practice':
                return Brain;
            case 'lecture':
                return BookOpen;
            default:
                return Target;
        }
    };

    const getMissionColor = (status) => {
        switch (status) {
            case 'completed':
                return 'from-green-600 to-emerald-600';
            case 'active':
                return 'from-purple-600 to-pink-600';
            case 'expired':
                return 'from-gray-600 to-gray-700';
            default:
                return 'from-blue-600 to-cyan-600';
        }
    };

    const handleMissionClick = (mission) => {
        if (mission.mission_type === 'practice') {
            navigate('/practice-room', { state: { missionId: mission.id } });
        } else if (mission.mission_type === 'lecture') {
            navigate('/lecture-room', { state: { missionId: mission.id } });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (missions.length === 0) {
        return (
            <div className="bg-gray-800 rounded-2xl p-8 border-2 border-gray-700 text-center">
                <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">אין משימות פעילות כרגע</p>
            </div>
        );
    }

    const activeMissions = missions.filter(m => m.status === 'active');
    const completedMissions = missions.filter(m => m.status === 'completed');

    return (
        <div className="space-y-6">
            {/* Active Missions */}
            {activeMissions.length > 0 && (
                <div>
                    <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
                        <Target className="w-6 h-6 text-yellow-400" />
                        משימות פעילות
                    </h3>
                    <div className="space-y-4">
                        {activeMissions.map((mission, index) => (
                            <MissionCard
                                key={mission.id}
                                mission={mission}
                                index={index}
                                onClick={() => handleMissionClick(mission)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Completed Missions */}
            {completedMissions.length > 0 && (
                <div>
                    <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                        משימות שהושלמו
                    </h3>
                    <div className="space-y-4">
                        {completedMissions.map((mission, index) => (
                            <MissionCard
                                key={mission.id}
                                mission={mission}
                                index={index}
                                completed
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const MissionCard = ({ mission, index, onClick, completed }) => {
    const Icon = mission.mission_type === 'practice' ? Brain : BookOpen;
    const progress = mission.progress_percentage || 0;
    const isOverdue = mission.deadline && new Date(mission.deadline) < new Date() && !completed;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={onClick}
            className={`bg-gray-800 rounded-2xl p-6 border-2 transition-all ${
                completed
                    ? 'border-green-500/30 opacity-75'
                    : isOverdue
                        ? 'border-red-500/50 hover:border-red-500 cursor-pointer'
                        : 'border-purple-500/30 hover:border-purple-500 cursor-pointer'
            }`}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                    <div className={`w-14 h-14 bg-gradient-to-br ${
                        completed ? 'from-green-600 to-emerald-600' : 'from-purple-600 to-pink-600'
                    } rounded-xl flex items-center justify-center flex-shrink-0`}>
                        {completed ? (
                            <CheckCircle className="w-7 h-7 text-white" />
                        ) : (
                            <Icon className="w-7 h-7 text-white" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="text-xl font-black text-white mb-1">{mission.title}</h4>
                        {mission.description && (
                            <p className="text-gray-400 text-sm mb-2">{mission.description}</p>
                        )}

                        {/* Mission Type Badge */}
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            mission.mission_type === 'practice'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-green-500/20 text-green-400'
                        }`}>
                            {mission.mission_type === 'practice' ? '💪 תרגול' : '📚 הרצאה'}
                        </span>
                    </div>
                </div>

                {/* Points */}
                {mission.points > 0 && (
                    <div className="flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 font-bold">{mission.points}</span>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            {!completed && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">
                            {mission.current_count || 0} / {mission.required_count || 0}
                            {mission.mission_type === 'practice' ? ' שאלות' : ' סקשנים'}
                        </span>
                        <span className="text-purple-400 font-bold">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                        />
                    </div>
                </div>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-6 text-sm">
                {mission.mission_type === 'practice' && mission.accuracy > 0 && (
                    <div className="flex items-center gap-2 text-green-400">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-bold">{mission.accuracy}% דיוק</span>
                    </div>
                )}

                {mission.deadline && (
                    <div className={`flex items-center gap-2 ${
                        isOverdue ? 'text-red-400' : 'text-gray-400'
                    }`}>
                        <Clock className="w-4 h-4" />
                        <span>
                            {isOverdue ? 'עבר המועד: ' : 'עד '}
                            {new Date(mission.deadline).toLocaleDateString('he-IL')}
                        </span>
                    </div>
                )}

                {completed && mission.completed_at && (
                    <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>
                            הושלם ב-{new Date(mission.completed_at).toLocaleDateString('he-IL')}
                        </span>
                    </div>
                )}
            </div>

            {/* Practice-specific Info */}
            {mission.mission_type === 'practice' && !completed && (
                <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-blue-300 text-sm flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                            💡 שאלות זהות לא נספרות פעמיים - פתור שאלות שונות!
                        </span>
                    </p>
                </div>
            )}

            {isOverdue && !completed && (
                <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-300 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-bold">המשימה עברה את המועד האחרון!</span>
                    </p>
                </div>
            )}
        </motion.div>
    );
};

export default MissionTracker;