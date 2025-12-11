
import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Auth from './components/auth/Auth';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { UserRole } from './types';

// --- Your Page/Dashboard Components ---
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import { useAuth, AuthProvider } from './components/auth/AuthContext';

// This component will handle the logic for the /auth route
const AuthHandler = () => {
  const { user, login, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't do anything while the session is being checked
    if (isLoading) {
      return;
    }

    // If a user session exists, redirect them immediately from this page.
    if (user) {
      console.log("User redirected based on role:", user.role);
      switch (user.role) {
        case UserRole.ADMIN:
          navigate('/admin/dashboard', { replace: true });
          break;
        case UserRole.OPERATOR:
          navigate('/operator/scan', { replace: true });
          break;
        case UserRole.USER:
        default:
          navigate('/dashboard', { replace: true });
          break;
      }
    }
    // If no user, this effect does nothing, and the Auth form is shown.
  }, [user, isLoading, navigate]);


  // Otherwise, show the login/register form.
  // The onLogin prop is now wired to the context's login function.
  return <Auth onLogin={login} />;
};

const AppContent: React.FC = () => {
  const { user, logout } = useAuth(); // Get user and logout from context

  return (
    <Routes>
      <Route path="/auth" element={<AuthHandler />} />

      {/* Admin Route */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminDashboard onLogout={logout} />
          </ProtectedRoute>
        }
      />

      {/* User Route */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={[UserRole.USER, UserRole.OPERATOR]}>
            <UserDashboard
              user={user!} 
              onLogout={logout}
            />
          </ProtectedRoute>
        }
      />

      {/* Redirect root path to auth if not logged in */}
      <Route path="/" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <Router>
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#1F2937', // bg-gray-800
          color: '#F9FAFB', // text-gray-50
          border: '1px solid #374151', // border-gray-700
        },
      }} />
      <AppContent />
    </AuthProvider>
  </Router>
);

export default App;
