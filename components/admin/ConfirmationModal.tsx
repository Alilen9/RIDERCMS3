import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonText?: string;
  isDestructive?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmButtonText = 'Confirm',
  isDestructive = false,
}) => {
  if (!isOpen) return null;

  const confirmButtonClasses = isDestructive
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-indigo-600 hover:bg-indigo-700';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 animate-fade-in pt-20">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl p-8 max-w-md w-full animate-fade-in">
        <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
        <p className="text-gray-400 mb-8">{message}</p>
        <div className="flex justify-end gap-4">
          <button onClick={onCancel} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">Cancel</button>
          <button onClick={onConfirm} className={`${confirmButtonClasses} text-white font-bold py-2 px-6 rounded-lg transition-colors`}>{confirmButtonText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;