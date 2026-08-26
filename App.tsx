import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';

import Auth from './components/auth/Auth';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { UserRole } from './types';

import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import RentalPage from './components/user/RentalPage';
import NotFound from './components/NotFound';

import BoothDetailsPage from './components/admin/BoothDetailsPage';
import SlotDetailsPage from './components/admin/SlotDetailsPage';

import { useAuth, AuthProvider } from './components/auth/AuthContext';
import PaymentWaitingPage from "./components/admin/payment/PaymentWaitingPage";
import ManualWithdrawPage from "./components/admin/payment/ManualWithdrawPage";

/**
 * Handles redirect logic after login
 */
const AuthHandler = () => {
  const { user, login, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      switch (user.role) {
        case UserRole.ADMIN:
        case UserRole.DEVELOPER:
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
  }, [user, isLoading, navigate]);

  return <Auth onLogin={login} />;
};

/**
 * All app routes
 */
const AppContent: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <Routes>
      {/* Auth */}
      <Route path="/auth" element={<AuthHandler />} />

      {/* Admin Dashboard */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.DEVELOPER]}>
            <AdminDashboard onLogout={logout} />
          </ProtectedRoute>
        }
      />

      {/* 🔥 NEW: Booth Details Page */}
      <Route
        path="/admin/booths/:boothId"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.DEVELOPER]}>
            <BoothDetailsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/rental"
        element={
          <ProtectedRoute
            allowedRoles={[
              UserRole.USER,
              UserRole.DEVELOPER,
            ]}
          >
            <RentalPage />
          </ProtectedRoute>
        }
      />


      {/* 🔥 NEW: Slot Details Page */}
      <Route
        path="/admin/slots/:slotId"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.DEVELOPER]}>
            <SlotDetailsPage />
          </ProtectedRoute>
        }
      />

      {/* User Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={[UserRole.USER, UserRole.DEVELOPER]}>
            <UserDashboard
              user={user!}
              onLogout={logout}
            />
          </ProtectedRoute>
        }
      />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/auth" replace />} />



      <Route path="*" element={<NotFound />} />
      <Route
        path="/admin/payment/waiting"
        element={<PaymentWaitingPage />}
      />


    </Routes>

  );
};

/**
 * Main App wrapper
 */
const App: React.FC = () => (
  <Router>
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1F2937',
            color: '#F9FAFB',
            border: '1px solid #374151',
          },
        }}
      />
      <AppContent />
    </AuthProvider>
  </Router>
);

export default App;