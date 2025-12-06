import { EyeIcon, EyeSlashIcon } from '@heroicons/react/16/solid';
import React, { useState } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  registration: Partial<UseFormRegisterReturn>;
  error?: string;
  togglePassword?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({ label, registration, error, togglePassword, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordInput = props.type === 'password' && togglePassword;

  return (
    <div>
      <label className="block text-xs font-medium text-black mb-1 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          {...props}
          type={isPasswordInput && showPassword ? 'text' : props.type}
          {...registration}
          className={`w-full bg-white text-black border ${error ? 'border-red-500' : 'border-gray-400'} rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${isPasswordInput ? 'pr-10' : ''}`}
        />
        {isPasswordInput && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-black"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default FormInput;