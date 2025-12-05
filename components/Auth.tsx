import React, { useState, useCallback } from 'react';
import { UserRole, User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

const LOCAL_STORAGE_KEY = 'ridercms_users';
const ADMIN_PHONE = '0000';

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setStep('form');
    setOtp('');
    setLoading(false);
    setName('');
    setPhoneNumber('');
    setPassword('');
  };

  const getUsers = (): User[] => {
    const users = localStorage.getItem(LOCAL_STORAGE_KEY);
    return users ? JSON.parse(users) : [];
  };

  const saveUser = (user: User) => {
    const users = getUsers();
    users.push(user);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(users));
  };

  const handleLogin = useCallback(() => {
    if (!phoneNumber || !password) return;
    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      // Admin login
      if (phoneNumber === ADMIN_PHONE && password === 'admin') {
        onLogin({
          id: 'admin-1',
          name: 'Admin',
          phoneNumber,
          role: UserRole.ADMIN,
          balance: 0
        });
        return;
      }

      const users = getUsers();
      const user = users.find(u => u.phoneNumber === phoneNumber && u.password === password);

      if (user) {
        onLogin(user);
      } else {
        alert('Invalid phone number or password');
      }
    }, 500);
  }, [phoneNumber, password, onLogin]);

  const handleRequestOtp = useCallback(() => {
    if (!phoneNumber || !name || !password) return;

    const users = getUsers();
    if (users.some(u => u.phoneNumber === phoneNumber)) {
      alert('User with this phone number already exists.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
      alert(`Simulated OTP for ${phoneNumber}: 1234`);
    }, 500);
  }, [phoneNumber, name, password]);

  const handleVerifyOtp = useCallback(() => {
    if (otp !== '1234') {
      alert('Invalid OTP (Try 1234)');
      return;
    }
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const newUser: User = {
        id: 'user-' + Math.random().toString(36).substr(2, 5),
        name,
        phoneNumber,
        password,
        role: UserRole.USER,
        balance: 0.0
      };
      saveUser(newUser);
      onLogin(newUser);
    }, 500);
  }, [otp, name, phoneNumber, password, onLogin]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-darkblue: '#0B1E4B' px-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
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
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => switchMode('login')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'login' ? 'bg-gray-300 text-black shadow' : 'text-gray-600 hover:text-black'
              }`}
          >
            Login
          </button>
          <button
            onClick={() => switchMode('register')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'register' ? 'bg-#0B1E4B text-black shadow' : 'text-gray-600 hover:text-black'
              }`}
          >
            Register
          </button>
        </div>

        {/* Login Form */}
        {mode === 'login' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-xs font-medium text-black mb-1 uppercase tracking-wider">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-white text-black border border-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="+254 700 000 000"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-black mb-1 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white text-black border border-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="••••••••"
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={loading || !phoneNumber || !password}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
            >
              {loading ? 'Authenticating...' : 'Login'}
            </button>
            <p className="text-xs text-center text-black mt-4">
              Admin Demo: {ADMIN_PHONE} / admin
            </p>
          </div>
        )}

        {/* Register Form */}
        {mode === 'register' && step === 'form' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-xs font-medium text-black mb-1 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white text-black border border-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-black mb-1 uppercase tracking-wider">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-white text-black border border-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="+254 700 000 000"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-black mb-1 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white text-black border border-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Create a strong password"
              />
            </div>
            <button
              onClick={handleRequestOtp}
              disabled={loading || !name || !phoneNumber || !password}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
            >
              {loading ? 'Processing...' : 'Verify with OTP'}
            </button>
          </div>
        )}

        {/* OTP Form */}
        {mode === 'register' && step === 'otp' && (
          <div className="space-y-6 animate-fade-in text-center">
            <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
              <p className="text-black text-sm">OTP Sent to {phoneNumber}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-black mb-2 uppercase tracking-wider">Enter Verification Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-white text-black border border-gray-400 rounded-lg px-4 py-4 text-center text-3xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="0000"
                maxLength={4}
              />
            </div>
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length !== 4}
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
