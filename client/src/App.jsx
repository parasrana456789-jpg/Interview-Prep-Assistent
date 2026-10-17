import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { ProtectedRoute, AdminRoute } from './components/guards.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import { ForgotPassword, ResetPassword } from './pages/PasswordPages.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import Aptitude from './pages/Aptitude.jsx';
import Coding from './pages/Coding.jsx';
import MockInterview from './pages/MockInterview.jsx';
import QuestionBank from './pages/QuestionBank.jsx';
import ResumeBuilder from './pages/ResumeBuilder.jsx';
import Analytics from './pages/Analytics.jsx';
import Admin from './pages/Admin.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="aptitude" element={<Aptitude />} />
        <Route path="coding" element={<Coding />} />
        <Route path="interview" element={<MockInterview />} />
        <Route path="questions" element={<QuestionBank />} />
        <Route path="resume" element={<ResumeBuilder />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="admin" element={<AdminRoute><Admin /></AdminRoute>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
