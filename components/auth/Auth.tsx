import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User } from '../../types';
import FormInput from './FormInput';
import * as authService from '../../services/authService';
import { Toaster, toast } from 'react-hot-toast';
import {
  signInWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import ReCAPTCHA from 'react-google-recaptcha';
import { auth, RECAPTCHA_CONTAINER_ID } from '../../firebase';

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

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  // We still need to hold the phone number for the OTP step UI
  const [verifiedPhoneNumber, setVerifiedPhoneNumber] = useState('');
  // We'll use a single loading state for all async operations
  const [loading, setLoading] = useState(false);
  // State to hold the Firebase confirmation result for OTP
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const recaptchaRef = useRef<ReCAPTCHA>(null);

  // react-hook-form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormInputs>({
    // Dynamically set the resolver based on the current mode
    resolver: zodResolver(
      mode === 'login' ? (loginSchema as any) : (registerSchema as any)
    ),
    // Re-validate on mode change
    context: { mode },
  });

  // --- Initialize Firebase's reCAPTCHA for Phone Auth ---
  // This is separate from the reCAPTCHA v3 used for form submission.
  // It's required by Firebase to prevent abuse of the SMS service.
  useEffect(() => {
    if (!window.recaptchaVerifier) {
      // The verifier is attached to the window object to prevent it from
      // being re-created on every render.
      window.recaptchaVerifier = new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER_ID, {
        'size': 'invisible',
        'callback': () => {
          // This callback is executed when the reCAPTCHA is successfully solved.
        }
      });
    }
  }, []); // The empty dependency array ensures this runs only once.

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setStep('form');
    setOtp('');
    reset(); // Clear form fields and errors on mode switch
  };

  const handleLogin: SubmitHandler<LoginFormInputs> = useCallback(async (data) => {
    setLoading(true);
    try {
      // 1. Get reCAPTCHA token
      const recaptchaToken = await recaptchaRef.current?.executeAsync();
      if (!recaptchaToken) {
        throw new Error('Could not verify reCAPTCHA. Please try again.');
      }

      // 2. Authenticate with Firebase client-side first
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const idToken = await userCredential.user.getIdToken();

      // 3. Call our backend to create a session cookie and get the user profile.
      const userProfile = await authService.sessionLogin(idToken, recaptchaToken);

      // 4. Update app state to log the user in
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
    } finally {
      setLoading(false);
    }
  }, [onLogin]);

  const handleRequestOtp: SubmitHandler<RegisterFormInputs> = useCallback(async (data) => {
    setLoading(true);

    // This is a multi-step async process
    try {
      // Step 1: Get reCAPTCHA token
      const recaptchaToken = await recaptchaRef.current?.executeAsync();
      if (!recaptchaToken) {
        throw new Error('Could not verify reCAPTCHA. Please try again.');
      }

      // Step 2: Register the user in our backend, passing the reCAPTCHA token.
      await authService.register({ ...data, recaptchaToken });

      // Step 3: After successful backend registration, ask the Firebase Client SDK to send an OTP.
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, data.phoneNumber, appVerifier);

      // Step 3: Store the confirmation object to use when verifying the OTP.
      setConfirmationResult(confirmation);

      toast.success('Verification code sent!');
      setVerifiedPhoneNumber(data.phoneNumber);
      setStep('otp');
    } catch (err: any) {
      let errorMessage = 'Registration failed. Please try again.';
      // Create a map for known Firebase error codes to user-friendly messages
      const firebaseErrorMap: { [key: string]: string } = {
        'auth/invalid-phone-number': 'The phone number is not valid. Please use E.164 format (e.g., +15551234567).',
        'auth/too-many-requests': 'Too many requests have been sent. Please try again later.',
        'auth/invalid-app-credential': 'Phone authentication is not configured correctly. This is a server-side issue.',
      };

      // Dynamically find the error message
      if (err.response?.status === 409 && err.response?.data?.error) {
        errorMessage = err.response.data.error; // "The email address is already in use..."
      } else if (err.code && firebaseErrorMap[err.code]) {
        errorMessage = firebaseErrorMap[err.code];
        if (err.code === 'auth/invalid-app-credential') {
          console.error('Phone Auth Configuration Issue: Check Firebase Console > Authentication > Settings > Authorized domains. See FIREBASE_RECAPTCHA_SETUP.md for a guide.');
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message.includes('reCAPTCHA')) {
        errorMessage = err.message;
      } else {
        console.error('OTP Request Error:', err); // Log the full error for debugging
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleVerifyOtp = useCallback(async () => {
    if (!otp || !confirmationResult) return;
    setLoading(true);

    try {
      // Step 1: Confirm the OTP with Firebase using the stored confirmation object.
      const userCredential = await confirmationResult.confirm(otp);
      const idToken = await userCredential.user.getIdToken();

      // Step 2: Inform our backend that the phone is verified.
      await authService.verifyPhone(idToken);

      // Step 3: Log the user in by creating a session.
      // We pass a special string 'phone_verified' because this login path is already
      // secured by the Firebase phone OTP flow, which has its own reCAPTCHA.
      // Our backend will be updated to accept this.
      const userProfile = await authService.sessionLogin(idToken, 'phone_verified');
      onLogin(userProfile);
    } catch (err: any) {
      if (err.code === 'auth/invalid-verification-code') {
        toast.error('Invalid verification code. Please try again.');
      }else if (err.code === 'auth/code-expired') {
        toast.error('The verification code has expired. Please request a new one.');
      } else if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error('An unexpected error occurred during registration.');
        console.error('OTP verification error:', err);
      }
      
    } finally {
      setLoading(false);
    }
  }, [otp, confirmationResult, onLogin]);

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
        <div id={RECAPTCHA_CONTAINER_ID}></div>
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
              disabled={isSubmitting || loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
            >
              {isSubmitting || loading ? 'Authenticating...' : 'Login'}
              
            </button>
          </form>
        )}

        {/* Register Form */}
        {mode === 'register' && step === 'form' && (
          <form onSubmit={handleSubmit(handleRequestOtp as SubmitHandler<FormInputs>)} className="space-y-4 animate-fade-in">
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
              disabled={isSubmitting || loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
            >
              {isSubmitting || loading ? 'Processing...' : 'Verify with OTP'}
            </button>
          </form>
        )}

        {/* OTP Form */}
        {mode === 'register' && step === 'otp' && (
          <div className="space-y-6 animate-fade-in text-center">
            <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
              <p className="text-black text-sm">OTP Sent to {verifiedPhoneNumber}</p>
            </div>
            <div>
              <label htmlFor="otp-input" className="block text-xs font-medium text-black mb-2 uppercase tracking-wider">Enter Verification Code</label>
              <input
                id="otp-input"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-white text-black border border-gray-400 rounded-lg px-4 py-4 text-center text-3xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="0000"
                maxLength={6}
                autoComplete="one-time-code"
              />
            </div>
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length !== 6}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Verifying...' : 'Complete Registration'}
            </button>
            <button
              onClick={() => setStep('form')}
              className="text-gray-600 text-sm hover:text-black underline"
            >
              Go Back
            </button>
          </div>
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
