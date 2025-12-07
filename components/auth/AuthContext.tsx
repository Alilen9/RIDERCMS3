import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../../types';
import * as authService from '../../services/authService';
import { auth } from '../../firebase';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in according to Firebase.
        // Now, fetch our application-specific user profile from our backend.
        try {
          const userProfile = await authService.getUserProfile();
          setUser(userProfile);
        } catch (error) {
          console.error("Failed to fetch user profile, logging out.", error);
          // If we can't get their profile, something is wrong. Log them out.
          await authService.logout();
          setUser(null);
        }
      } else {
        // User is signed out.
        setUser(null);
      }
      setIsLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = useCallback((userData: User) => {
    // This function is called from Auth.tsx after a successful login.
    // It sets the user state immediately for a faster UI update,
    // while the onAuthStateChanged listener confirms in the background.
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout(); // This will now just call Firebase signOut
    setUser(null);
    navigate('/auth'); // Redirect to login after logout
  }, [navigate]);

  const value = { user, isLoading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for easy consumption of the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};