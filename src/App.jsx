// src/App.jsx - COMPLETE WITH MISSIONS ROUTE
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';

// Components
import Layout from './components/layout/Layout';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminRoute from './components/auth/AdminRoute';
import NexonAsk from './components/ai/NexonAsk';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import NotebookPage from './pages/NotebookPage';
import PlansPage from './pages/PlansPage';
import PremiumSuccess from './pages/PremiumSuccess';
import LearnPage from './pages/LearnPage';

// AI & Practice
import MathTutor from './components/ai/MathTutor';

// Onboarding & Personalized
import OnboardingFlow from './pages/OnboardingFlow';
import PersonalizedDashboard from './pages/PersonalizedDashboard';

// ✅ NEW LEARNING SPACE SYSTEM
import LearningSpaceHub from './pages/LearningSpaceHub';
import PracticeRoom from './pages/PracticeRoom';
import LectureRoom from './pages/LectureRoom';

// 🎓 BAGRUT EXAMS SYSTEM
import BagrutExamsPage from './pages/BagrutExamsPage';
import AdminAddQuestion from './pages/AdminAddQuestion';

// Admin - Main Dashboard
import AdminDashboard from './pages/AdminDashboard';
import AdminExamView from './pages/AdminExamView';

// Admin - Student Management ✨
import AdminUsersList from './pages/AdminUsersList';
import AdminUserDetail from './pages/AdminUserDetail';

// Admin - Missions Management 🎯 NEW!
import AdminMissions from './pages/AdminMissions';

// Admin - Other
import AdminGoals from './pages/AdminGoals';
import AdminCodes from './pages/AdminCodes';
import ManageCurriculum from './pages/ManageCurriculum';
import AddLesson from './pages/AddLesson';
import AdminNotifications from './pages/AdminNotifications';
import AdminProblemUploader from './pages/AdminProblemUploader';
import PersonalityUploader from './pages/PersonalityUploader';

// ✅ Component to conditionally show NexonAsk
function GlobalNexonAsk() {
    const location = useLocation();
    const user = useAuthStore(state => state.user);
    const isPremium = useAuthStore(state => state.isPremium);

    const hiddenPaths = [
        '/onboarding',
        '/login',
        '/register',
        '/math-tutor',
        '/bagrut-exams',
        '/admin',
        '/learning-space',
        '/practice-room',
        '/lecture-room'
    ];

    const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));

    if (!user || shouldHide || !isPremium) {
        return null;
    }

    return <NexonAsk />;
}

function App() {
    const initAuth = useAuthStore(state => state.initAuth);
    const loading = useAuthStore(state => state.loading);

    useEffect(() => {
        initAuth();
    }, [initAuth]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-white text-xl font-bold">טוען נקסון...</p>
                </div>
            </div>
        );
    }

    return (
        <Router>
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                        fontWeight: 'bold',
                    },
                }}
            />

            <Routes>
                {/* ============================================ */}
                {/* FULLSCREEN ROUTES (No Layout)                */}
                {/* ============================================ */}

                {/* ONBOARDING */}
                <Route
                    path="/onboarding"
                    element={
                        <PrivateRoute>
                            <OnboardingFlow />
                        </PrivateRoute>
                    }
                />

                {/* 🎓 BAGRUT EXAMS */}
                <Route
                    path="/bagrut-exams"
                    element={
                        <PrivateRoute>
                            <BagrutExamsPage />
                        </PrivateRoute>
                    }
                />

                {/* ✅ LEARNING SPACE SYSTEM */}
                <Route
                    path="/learning-space"
                    element={
                        <PrivateRoute>
                            <LearningSpaceHub />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/practice-room"
                    element={
                        <PrivateRoute>
                            <PracticeRoom />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/lecture-room"
                    element={
                        <PrivateRoute>
                            <LectureRoom />
                        </PrivateRoute>
                    }
                />

                {/* ============================================ */}
                {/* ROUTES WITH LAYOUT                           */}
                {/* ============================================ */}

                <Route path="/" element={<Layout />}>
                    {/* ============================================ */}
                    {/* PUBLIC ROUTES                                */}
                    {/* ============================================ */}
                    <Route index element={<Home />} />
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="payment-success" element={<PaymentSuccess />} />
                    <Route path="payment-cancel" element={<PaymentCancel />} />
                    <Route path="plans" element={<PlansPage />} />
                    <Route path="premium-success" element={<PremiumSuccess />} />
                    <Route path="learn" element={<LearnPage />} />

                    {/* ============================================ */}
                    {/* PROTECTED USER ROUTES                        */}
                    {/* ============================================ */}

                    {/* Math Tutor */}
                    <Route
                        path="math-tutor"
                        element={
                            <PrivateRoute>
                                <MathTutor />
                            </PrivateRoute>
                        }
                    />

                    {/* Main Dashboard - Smart Router */}
                    <Route
                        path="dashboard"
                        element={
                            <PrivateRoute>
                                <SmartDashboard />
                            </PrivateRoute>
                        }
                    />

                    {/* User Dashboard (Fallback) */}
                    <Route
                        path="user-dashboard"
                        element={
                            <PrivateRoute>
                                <UserDashboard />
                            </PrivateRoute>
                        }
                    />

                    {/* Notebook */}
                    <Route
                        path="notebook"
                        element={
                            <PrivateRoute>
                                <NotebookPage />
                            </PrivateRoute>
                        }
                    />

                    {/* ============================================ */}
                    {/* ADMIN ROUTES - MAIN                          */}
                    {/* ============================================ */}

                    {/* Admin Dashboard - Main */}
                    <Route
                        path="admin"
                        element={
                            <AdminRoute>
                                <AdminDashboard />
                            </AdminRoute>
                        }
                    />

                    {/* ============================================ */}
                    {/* ADMIN ROUTES - MISSIONS MANAGEMENT 🎯 NEW!  */}
                    {/* ============================================ */}

                    {/* Missions Management */}
                    <Route
                        path="admin/missions"
                        element={
                            <AdminRoute>
                                <AdminMissions />
                            </AdminRoute>
                        }
                    />

                    {/* ============================================ */}
                    {/* ADMIN ROUTES - STUDENT MANAGEMENT ✨         */}
                    {/* ============================================ */}

                    {/* Students List */}
                    <Route
                        path="admin/users"
                        element={
                            <AdminRoute>
                                <AdminUsersList />
                            </AdminRoute>
                        }
                    />

                    {/* Individual Student Detail */}
                    <Route
                        path="admin/user/:userId"
                        element={
                            <AdminRoute>
                                <AdminUserDetail />
                            </AdminRoute>
                        }
                    />

                    {/* ============================================ */}
                    {/* ADMIN ROUTES - EXAMS                         */}
                    {/* ============================================ */}

                    {/* View Specific Exam */}
                    <Route
                        path="admin/exam/:id"
                        element={
                            <AdminRoute>
                                <AdminExamView />
                            </AdminRoute>
                        }
                    />

                    {/* Add Question to Exam */}
                    <Route
                        path="admin/exams/:examId/add-question"
                        element={
                            <AdminRoute>
                                <AdminAddQuestion />
                            </AdminRoute>
                        }
                    />

                    {/* ============================================ */}
                    {/* ADMIN ROUTES - CURRICULUM                    */}
                    {/* ============================================ */}

                    {/* Manage Curriculum */}
                    <Route
                        path="admin/course/:courseId/curriculum"
                        element={
                            <AdminRoute>
                                <ManageCurriculum />
                            </AdminRoute>
                        }
                    />

                    {/* Add Lesson */}
                    <Route
                        path="admin/course/:courseId/section/:sectionId/add-lesson"
                        element={
                            <AdminRoute>
                                <AddLesson />
                            </AdminRoute>
                        }
                    />

                    {/* ============================================ */}
                    {/* ADMIN ROUTES - OTHER                         */}
                    {/* ============================================ */}

                    {/* Goals Management */}
                    <Route
                        path="admin/goals"
                        element={
                            <AdminRoute>
                                <AdminGoals />
                            </AdminRoute>
                        }
                    />

                    {/* Codes Management */}
                    <Route
                        path="admin/codes"
                        element={
                            <AdminRoute>
                                <AdminCodes />
                            </AdminRoute>
                        }
                    />

                    {/* Notifications */}
                    <Route
                        path="admin/notifications"
                        element={
                            <AdminRoute>
                                <AdminNotifications />
                            </AdminRoute>
                        }
                    />

                    {/* Problem Uploader */}
                    <Route
                        path="admin/problems"
                        element={
                            <AdminRoute>
                                <AdminProblemUploader />
                            </AdminRoute>
                        }
                    />

                    {/* AI Personality Uploader */}
                    <Route
                        path="admin/ai-upload"
                        element={
                            <AdminRoute>
                                <PersonalityUploader />
                            </AdminRoute>
                        }
                    />
                </Route>
            </Routes>

            {/* Global NexonAsk Chat */}
            <GlobalNexonAsk />
        </Router>
    );
}

// Smart Dashboard Component - Routes to appropriate dashboard
function SmartDashboard() {
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);
    const needsOnboarding = useAuthStore(state => state.needsOnboarding);
    const studentProfile = useAuthStore(state => state.studentProfile);
    const nexonProfile = useAuthStore(state => state.nexonProfile);
    const isAdmin = useAuthStore(state => state.isAdmin);

    useEffect(() => {
        // Admin users go to admin dashboard
        if (isAdmin) {
            navigate('/admin', { replace: true });
            return;
        }

        // Users who haven't completed onboarding
        if (needsOnboarding) {
            navigate('/onboarding', { replace: true });
            return;
        }
    }, [isAdmin, needsOnboarding, navigate]);

    // Show loading while redirecting
    if (needsOnboarding) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-white text-xl font-bold">מעביר לטופס הכנה...</p>
                </div>
            </div>
        );
    }

    if (isAdmin) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-300 text-xl font-bold">מעביר לניהול...</p>
                </div>
            </div>
        );
    }

    // Users with completed profile get PersonalizedDashboard (Personal Area)
    const profile = studentProfile || nexonProfile;
    if (profile && profile.onboardingCompleted) {
        return <PersonalizedDashboard />;
    }

    // Fallback to old user dashboard
    return <UserDashboard />;
}

export default App;