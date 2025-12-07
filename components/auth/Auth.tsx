import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User } from '../../types';
import FormInput from './FormInput';
import * as authService from '../../services/authService';
import { Toaster, toast } from 'react-hot-toast';
import { signInWithEmailAndPassword } from 'firebase/auth';
import ReCAPTCHA from 'react-google-recaptcha';
import { auth } from '../../firebase';

interface AuthProps {
  onLogin: (user: User) => void;
}

// Define validation schemas with Zod
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  // Validate phone number against E.164 format
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, 'The phone number is not valid. Please use E.164 format (e.g., +15551234567).'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Infer types from schemas for type safety
type LoginFormInputs = z.infer<typeof loginSchema>;
type RegisterFormInputs = z.infer<typeof registerSchema>;
type FormInputs = LoginFormInputs & RegisterFormInputs;

// A factory function to get the correct, typed Zod resolver.
// This avoids the need for `as any`.
const getResolver = (mode: 'login' | 'register') => {
  return zodResolver(mode === 'login' ? loginSchema : registerSchema);
};

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  // react-hook-form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormInputs>({
    resolver: getResolver(mode),
  });

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    reset(); // Clear form fields and errors on mode switch
  };

  const handleLogin: SubmitHandler<LoginFormInputs> = useCallback(async (data) => {
    try {
      // 1. Get reCAPTCHA token
      const recaptchaToken = await recaptchaRef.current?.executeAsync();
      if (!recaptchaToken) {
        throw new Error('Could not verify reCAPTCHA. Please try again.');
      }

      // 2. Authenticate with Firebase client-side first
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const idToken = await userCredential.user.getIdToken();

      // 3. With the user signed into Firebase, fetch their profile from our backend.
      // The API client will automatically attach the token.
      const userProfile = await authService.getUserProfile();

      // 4. Update app state to log the user in.
      onLogin(userProfile);
    } catch (error: any) {
      // Check for the specific 404 error from our backend
      if (error.response?.status === 404) {
        toast.error('Login failed: User profile not found. Please try registering again or contact support.');
        console.error('Login error: User exists in Firebase Auth but not in the application database.', error);
      } else if (error.code === 'auth/invalid-credential') {
        // Handle standard Firebase auth errors
        toast.error('Invalid email or password.');
      } else if (error.message.includes('reCAPTCHA')) {
        toast.error(error.message);
      } else {
        // Handle other unexpected errors
        toast.error('An unexpected error occurred during login.');
        console.error('Login error:', error);
      }
    }
  }, [onLogin]);

  const handleRegister: SubmitHandler<RegisterFormInputs> = useCallback(async (data) => {
    // This is a multi-step async process
    try {
      // Step 1: Get reCAPTCHA token
      const recaptchaToken = await recaptchaRef.current?.executeAsync();
      if (!recaptchaToken) {
        throw new Error('Could not verify reCAPTCHA. Please try again.');
      }

      // Step 2: Register the user in our backend.
      await authService.register({ ...data, recaptchaToken });

      toast.success('Registration successful! Logging you in...');

      // Step 3: Sign in with the credentials just used for registration
      await signInWithEmailAndPassword(auth, data.email, data.password);

      // Step 4: Fetch the user profile from our backend
      const userProfile = await authService.getUserProfile();

      // Step 5: Log the user in
      onLogin(userProfile);

    } catch (err: any) {
      let errorMessage = 'Registration failed. Please try again.';
      if (err.response?.status === 409 && err.response?.data?.error) {
        errorMessage = err.response.data.error; // "The email address is already in use..."
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message.includes('reCAPTCHA')) {
        errorMessage = err.message;
      } else {
        console.error('OTP Request Error:', err); // Log the full error for debugging
      }
      toast.error(errorMessage);
    }
  }, [onLogin]);

  // Combine loading states for the UI
  const isLoading = isSubmitting;
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1E4B] px-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
        {/* 
          The Toaster component renders the notifications. 
          For a real app, it's best to place this in your root layout component (like App.tsx) 
          so toasts can appear on any page.
        */}
        <Toaster position="top-center" reverseOrder={false} />
        {/* This div is required for Firebase's invisible reCAPTCHA to mount */}
        <ReCAPTCHA
          ref={recaptchaRef}
          size="invisible"
          sitekey="6LdPVSMsAAAAAJxGBy0C4NfY05CjfhNQ6tp4h-el" // Your reCAPTCHA v3 Site Key
          // You can also use the onload callback if needed
          // onLoad={() => console.log('reCAPTCHA v3 loaded.')}
        />
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-black mb-1">RIDERCMS</h1>
          <p className="text-gray-800 text-sm">Charge. Swap. Go.</p>
        </div>

        {/* Tabs */}
        <div role="tablist" aria-label="Authentication Options" className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => switchMode('login')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'login' ? 'bg-gray-300 text-black shadow' : 'text-gray-600 hover:text-black'
              }`}
          >
            Login
          </button>
          <button
            onClick={() => switchMode('register')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'register' ? 'bg-[#0B1E4B] text-white shadow' : 'text-gray-600 hover:text-black'
              }`}
          >
            Register
          </button>
        </div>

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleSubmit(handleLogin as SubmitHandler<FormInputs>)} className="space-y-4 animate-fade-in">
            <FormInput
              label="Email"
              type="email"
              placeholder="user@example.com"
              registration={register('email')}
              error={errors.email?.message}
            />
            <FormInput
              label="Password"
              type="password"
              placeholder="••••••••"
              registration={register('password')}
              error={errors.password?.message}
              togglePassword
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
            >
              {isLoading ? 'Authenticating...' : 'Login'}

            </button>
          </form>
        )}

        {/* Register Form */}
        {mode === 'register' && (
          <form onSubmit={handleSubmit(handleRegister as SubmitHandler<FormInputs>)} className="space-y-4 animate-fade-in">
            <FormInput
              label="Full Name"
              type="text"
              placeholder="Jane Doe"
              registration={register('name')}
              error={errors.name?.message}
            />
            <FormInput
              label="Email"
              type="email"
              placeholder="user@example.com"
              registration={register('email')}
              error={errors.email?.message}
            />
            <FormInput
              label="Phone Number"
              type="tel"
              placeholder="+254 700 000 000"
              registration={register('phoneNumber')}
              error={errors.phoneNumber?.message}
            />
            <FormInput
              label="Password"
              type="password"
              placeholder="Create a strong password"
              registration={register('password')}
              error={errors.password?.message}
              togglePassword
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
            >
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}

      </div>
      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Auth;
