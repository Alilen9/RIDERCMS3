import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';

import Auth from './components/auth/Auth';
import ForgotPassword from './components/auth/ForgotPassword';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { UserRole } from './types';
import { readLastVisitedPath } from './utils/lastVisitedPath';

import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import RentalPage from './components/user/RentalPage';
import NotFound from './components/NotFound';

import BoothDetailsPage from './components/admin/BoothDetailsPage';
import SlotDetailsPage from './components/admin/SlotDetailsPage';

import { useAuth, AuthProvider } from './components/auth/AuthContext';
import PaymentWaitingPage from "./components/admin/payment/PaymentWaitingPage";
import ManualWithdrawPage from "./components/admin/payment/ManualWithdrawPage";
import RentalManagement from './components/admin/rental/RentalManagement';

/**
 * Handles redirect logic after login
 */
/**
 * Handles redirect logic after login.
 *
 * Auth uses inMemoryPersistence, so the user is re-logged in on every
 * reload. Instead of always dumping them on their role dashboard, we
 * restore the page they were on before (explicit redirect target first,
 * then the last visited page, then the role default).
 */
const DEFAULT_HOME: Record<UserRole, string> = {
  [UserRole.ADMIN]: '/admin/dashboard',
  [UserRole.DEVELOPER]: '/admin/dashboard',
  [UserRole.OPERATOR]: '/operator/scan',
  [UserRole.USER]: '/dashboard',
};

/**
 * Mirrors the allowedRoles used in ProtectedRoute for the given role.
 */
const isPathAllowedForRole = (
  pathname: string,
  role: UserRole
): boolean => {
  const area = pathname.split('/')[1];

  switch (role) {
    case UserRole.OPERATOR:
      return area === 'operator';
    case UserRole.USER:
      return (
        area === 'dashboard' ||
        area === 'rental'
      );
    case UserRole.ADMIN:
      return area === 'admin';
    case UserRole.DEVELOPER:
      return (
        area === 'admin' ||
        area === 'dashboard' ||
        area === 'rental'
      );
    default:
      return false;
  }
};

/**
 * Picks where to land after login:
 * 1. the protected page the user originally tried to open,
 * 2. the last visited protected page,
 * 3. the role-appropriate dashboard.
 */
const resolveLandingPage = (
  role: UserRole,
  from?: { pathname?: string } | null
): string => {
  const candidates = [
    from?.pathname,
    readLastVisitedPath(),
  ];

  for (const candidate of candidates) {
    if (
      candidate &&
      candidate !== '/auth' &&
      candidate !== '/forgot-password' &&
      isPathAllowedForRole(candidate, role)
    ) {
      return candidate;
    }
  }

  return DEFAULT_HOME[role] ?? '/dashboard';
};

const AuthHandler = () => {
  const { user, login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      const from = (
        location.state as
          | { from?: { pathname?: string } }
          | null
        | undefined
      )?.from;

      navigate(
        resolveLandingPage(user.role, from),
        { replace: true }
      );
    }
  }, [
    user,
    isLoading,
    navigate,
    location.state,
  ]);

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
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Admin Dashboard */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.DEVELOPER]}>
            <AdminDashboard onLogout={logout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/rentals"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.DEVELOPER]}>
            <RentalManagement />
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
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.DEVELOPER]}>
            <PaymentWaitingPage />
          </ProtectedRoute>
        }
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