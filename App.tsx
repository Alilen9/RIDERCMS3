
import React, { useEffect, useState } from 'react'; // Keep for local station state
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Auth from './components/auth/Auth';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { User, UserRole, Station, SlotStatus, BatteryType } from './types'; // Keep for station data

// --- Your Page/Dashboard Components ---
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import { useAuth, AuthProvider } from './components/auth/AuthContext';

// Mock Initial Station Data with Hardware Telemetry
const INITIAL_STATION: Station = {
  id: 'ST-001',
  name: 'Central Hub',
  location: 'Downtown Market',
  coordinates: { lat: -1.2921, lng: 36.8219 }, // Example Coordinates
  slots: [
    { 
      id: 1, 
      status: SlotStatus.EMPTY, 
      isDoorOpen: false,
      doorClosed: true,
      doorLocked: true,
      relayOn: false
    },
    { 
      id: 2, 
      status: SlotStatus.OCCUPIED_FULL, 
      battery: { 
        id: 'b2', 
        type: BatteryType.SCOOTER, 
        chargeLevel: 100, 
        health: 95, 
        temperature: 25, 
        voltage: 54.2, 
        cycles: 50,
        status: 'ACTIVE'
      }, 
      isDoorOpen: false,
      doorClosed: true,
      doorLocked: true,
      relayOn: false // Fully charged, relay off
    },
    { 
      id: 3, 
      status: SlotStatus.OCCUPIED_CHARGING, 
      battery: { 
        id: 'b3', 
        type: BatteryType.E_BIKE, 
        chargeLevel: 45, 
        health: 80, 
        temperature: 40, 
        voltage: 49.5, 
        cycles: 300,
        status: 'ACTIVE'
      }, 
      isDoorOpen: false,
      doorClosed: true,
      doorLocked: true,
      relayOn: true // Charging, relay on
    },
    { 
      id: 4, 
      status: SlotStatus.MAINTENANCE, 
      isDoorOpen: false,
      doorClosed: true,
      doorLocked: false,
      relayOn: false
    },
  ]
};

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

// This component will manage the state that is NOT related to auth, like station data
const AppContent: React.FC = () => {
  const [station, setStation] = useState<Station>(INITIAL_STATION);
  const { user, logout } = useAuth(); // Get user and logout from context

  const updateStation = (updatedStation: Station) => {
    setStation(updatedStation);
  };

  return (
    <Routes>
      <Route path="/auth" element={<AuthHandler />} />

      {/* Admin Route */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminDashboard
              station={station}
              onUpdateStation={updateStation}
              onLogout={logout}
            />
          </ProtectedRoute>
        }
      />

      {/* User Route */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={[UserRole.USER, UserRole.OPERATOR]}>
            <UserDashboard
              user={user!} // We know user is not null here because of ProtectedRoute
              station={station}
              onUpdateStation={updateStation}
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
