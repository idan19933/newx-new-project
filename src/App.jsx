// src/App.jsx - UPDATED WITH ADMIN EXAM VIEW
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

// 🎓 BAGRUT EXAMS SYSTEM
import BagrutExamsPage from './pages/BagrutExamsPage';
import AdminAddQuestion from './pages/AdminAddQuestion';

// Admin
import AdminDashboard from './pages/AdminDashboard';
import AdminExamView from './pages/AdminExamView';  // ✅ NEW!
import AdminUsers from './pages/AdminUsers';
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

    const hiddenPaths = ['/onboarding', '/login', '/register', '/math-tutor', '/bagrut-exams', '/admin'];
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
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-400">טוען...</p>
                </div>
            </div>
        );
    }

    return (
        <Router>
            <Toaster position="top-center" />

            <Routes>
                {/* ONBOARDING - Fullscreen */}
                <Route
                    path="/onboarding"
                    element={
                        <PrivateRoute>
                            <OnboardingFlow />
                        </PrivateRoute>
                    }
                />

                {/* 🎓 BAGRUT EXAMS - Fullscreen Route */}
                <Route
                    path="/bagrut-exams"
                    element={
                        <PrivateRoute>
                            <BagrutExamsPage />
                        </PrivateRoute>
                    }
                />

                {/* Routes with Layout */}
                <Route path="/" element={<Layout />}>
                    {/* Public Routes */}
                    <Route index element={<Home />} />
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="payment-success" element={<PaymentSuccess />} />
                    <Route path="payment-cancel" element={<PaymentCancel />} />

                    {/* Premium Routes */}
                    <Route path="plans" element={<PlansPage />} />
                    <Route path="premium-success" element={<PremiumSuccess />} />

                    {/* Protected User Routes */}
                    <Route
                        path="math-tutor"
                        element={
                            <PrivateRoute>
                                <MathTutor />
                            </PrivateRoute>
                        }
                    />

                    <Route
                        path="learn"
                        element={
                            <LearnPage />
                        }
                    />

                    <Route
                        path="dashboard"
                        element={
                            <PrivateRoute>
                                <SmartDashboard />
                            </PrivateRoute>
                        }
                    />

                    <Route
                        path="user-dashboard"
                        element={
                            <PrivateRoute>
                                <UserDashboard />
                            </PrivateRoute>
                        }
                    />

                    <Route
                        path="notebook"
                        element={
                            <PrivateRoute>
                                <NotebookPage />
                            </PrivateRoute>
                        }
                    />

                    {/* Admin Routes */}
                    <Route
                        path="admin"
                        element={
                            <AdminRoute>
                                <AdminDashboard />
                            </AdminRoute>
                        }
                    />

                    {/* ✅ NEW - Admin Exam View */}
                    <Route
                        path="admin/exam/:id"
                        element={
                            <AdminRoute>
                                <AdminExamView />
                            </AdminRoute>
                        }
                    />

                    <Route
                        path="admin/goals"
                        element={
                            <AdminRoute>
                                <AdminGoals />
                            </AdminRoute>
                        }
                    />

                    <Route
                        path="admin/codes"
                        element={
                            <AdminRoute>
                                <AdminCodes />
                            </AdminRoute>
                        }
                    />

                    <Route
                        path="admin/users"
                        element={
                            <AdminRoute>
                                <AdminUsers />
                            </AdminRoute>
                        }
                    />

                    <Route
                        path="admin/notifications"
                        element={
                            <AdminRoute>
                                <AdminNotifications />
                            </AdminRoute>
                        }
                    />

                    <Route
                        path="admin/problems"
                        element={
                            <AdminRoute>
                                <AdminProblemUploader />
                            </AdminRoute>
                        }
                    />

                    <Route
                        path="admin/ai-upload"
                        element={
                            <AdminRoute>
                                <PersonalityUploader />
                            </AdminRoute>
                        }
                    />

                    {/* 🎓 BAGRUT ADMIN ROUTES */}
                    <Route
                        path="admin/exams/:examId/add-question"
                        element={
                            <AdminRoute>
                                <AdminAddQuestion />
                            </AdminRoute>
                        }
                    />

                    <Route
                        path="admin/course/:courseId/curriculum"
                        element={
                            <AdminRoute>
                                <ManageCurriculum />
                            </AdminRoute>
                        }
                    />

                    <Route
                        path="admin/course/:courseId/section/:sectionId/add-lesson"
                        element={
                            <AdminRoute>
                                <AddLesson />
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

// Smart Dashboard Component
function SmartDashboard() {
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);
    const needsOnboarding = useAuthStore(state => state.needsOnboarding);
    const studentProfile = useAuthStore(state => state.studentProfile);
    const isAdmin = useAuthStore(state => state.isAdmin);

    useEffect(() => {
        if (isAdmin) {
            navigate('/admin', { replace: true });
            return;
        }

        if (needsOnboarding) {
            navigate('/onboarding', { replace: true });
            return;
        }
    }, [isAdmin, needsOnboarding, navigate]);

    if (needsOnboarding) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-300">מעביר לטופס הכנה...</p>
                </div>
            </div>
        );
    }

    if (isAdmin) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-300">מעביר לניהול...</p>
                </div>
            </div>
        );
    }

    if (studentProfile && studentProfile.onboardingCompleted) {
        return <PersonalizedDashboard />;
    }

    return <UserDashboard />;
}

export default App;