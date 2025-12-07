import React, { JSX } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { UserRole } from '../../types';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // While checking the session, show a loading indicator.
  // This prevents a flicker from the login page to the dashboard.
  if (isLoading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  // If the user is not logged in, redirect them to the login page.
  // We also pass the original location they tried to access.
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If the user is logged in but their role is not in the allowed list,
  // redirect them to a "not authorized" page or their default dashboard.
  if (!allowedRoles.includes(user.role)) {
    // Redirect to a safe, role-appropriate default page to prevent loops.
    switch (user.role) {
      case UserRole.ADMIN:
        return <Navigate to="/admin/dashboard" replace />;
      case UserRole.OPERATOR:
        return <Navigate to="/operator/scan" replace />; // Or another operator default
      case UserRole.USER:
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  // If the user is authenticated and authorized, render the requested component.
  return children;
};

export default ProtectedRoute;