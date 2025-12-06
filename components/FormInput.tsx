import React, { useState } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { EyeIcon, EyeOffIcon } from './icons'; // We'll create this helper file

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  registration: Partial<UseFormRegisterReturn>;
  error?: string;
  togglePassword?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({ label, registration, error, ...props }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  // Use the input's name (from react-hook-form) as a base for unique IDs
  const inputId = registration.name;
  const errorId = inputId ? `${inputId}-error` : undefined;

  const handleToggleVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  const inputType = props.togglePassword
    ? isPasswordVisible
      ? 'text'
      : 'password'
    : props.type;

  return (
    <div className="relative">
      <label htmlFor={inputId} className="block text-xs font-medium text-black mb-1 uppercase tracking-wider">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={errorId}
        type={inputType}
        {...props}
        {...registration}
        className={`w-full bg-white text-black border ${error ? 'border-red-500' : 'border-gray-400'} rounded-lg px-4 py-3 ${props.togglePassword ? 'pr-10' : ''} focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all`}
      />
      {props.togglePassword && (
        <button
          type="button"
          onClick={handleToggleVisibility}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
          aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
        >
          {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      )}
      {error && <p id={errorId} role="alert" className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default FormInput;