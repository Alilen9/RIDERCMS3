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
  // The identifier can be an email or a phone number.
  identifier: z.string().min(1, 'Email or phone number is required'),
  // We don't need to validate if it's an email or phone here,
  // as we'll do that in the submission handler.
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  // Validate phone number for Kenyan format (+254 followed by 9 digits)
  phoneNumber: z.string().regex(/^\+254\d{9}$/, 'Please enter a valid Kenyan phone number (e.g., +254712345678).'),
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
    setValue,
  } = useForm<FormInputs>({
    resolver: getResolver(mode),
  });

  // Effect to auto-fill the country code when switching to register mode
  useEffect(() => {
    if (mode === 'register') {
      setValue('phoneNumber', '+254');
    }
  }, [mode, setValue]);

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

      let identifier = data.identifier;
      // Check if the identifier looks like a local Kenyan number (e.g., 07... or 01...)
      // and format it to the E.164 standard.
      if (/^0[17]\d{8}$/.test(identifier)) {
        // Replace the leading 0 with +254
        identifier = `+254${identifier.substring(1)}`;
      }

      // 2. Authenticate with Firebase client-side first
      // Determine if the identifier is an email or phone number
      const isEmail = z.string().email().safeParse(identifier).success;
      let emailToLogin: string;

      if (isEmail) {
        emailToLogin = identifier;
      } else {
        // It's not an email, so we assume it's a phone number.
        // We need to get the user's email from our backend.
        const user = await authService.getUserByPhone(identifier);
        if (!user || !user.email) {
          throw new Error('No user found with that phone number.');
        }
        emailToLogin = user.email;
      }

      const userCredential = await signInWithEmailAndPassword(auth, emailToLogin, data.password);
      const idToken = await userCredential.user.getIdToken();

      // 3. With the user signed into Firebase, fetch their profile from our backend.
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
      } else if (error.message.includes('phone number')) {
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

      // Display the success message from the backend (e.g., "pending admin approval")
      toast.success('Registration successful! Your account is pending admin approval.', { duration: 6000 });
      
      // Switch back to login mode and clear the form
      switchMode('login');
    } catch (err: any) {
      let errorMessage = 'Registration failed. Please try again.';
      if (err.response?.status === 409 && err.response?.data?.error) {
        errorMessage = err.response.data.error; // "The email address is already in use..."
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message.includes('reCAPTCHA')) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
    }
  }, [onLogin]);

  // Combine loading states for the UI
  const isLoading = isSubmitting;
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1E4B] px-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
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
              label="Email or Phone Number"
              type="text"
              placeholder="user@example.com or +254712345678"
              registration={register('identifier')}
              error={errors.identifier?.message}
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
              placeholder="+254712345678"
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
