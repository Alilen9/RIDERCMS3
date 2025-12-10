import React from 'react';

// We can extend all standard input attributes to make the component highly reusable.
type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string; // The error message is optional
};

const Input: React.FC<InputProps> = ({ label, name, error, ...rest }) => {
  // Dynamically set border color based on the error prop
  const errorClasses = error ? 'border-red-500' : 'border-gray-600';
  const baseClasses = 'w-full bg-gray-900 border rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all';

  return (
    <div>
      <label htmlFor={name} className="block text-xs uppercase text-gray-500 mb-2 font-bold tracking-wider">
        {label}
      </label>
      <input
        id={name} // Good for accessibility
        name={name}
        className={`${baseClasses} ${errorClasses}`}
        {...rest} // Pass through other props like type, placeholder, value, onChange
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default Input;