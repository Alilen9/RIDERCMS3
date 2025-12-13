import React, { useState } from 'react';

interface InviteOperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (name: string, email: string) => Promise<void>;
  isInviting: boolean;
}

const InviteOperatorModal: React.FC<InviteOperatorModalProps> = ({
  isOpen,
  onClose,
  onInvite,
  isInviting,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    onInvite(name, email);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 animate-fade-in pt-20">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl p-8 max-w-md w-full animate-fade-in">
        <h2 className="text-2xl font-bold text-white mb-4">Invite New Operator</h2>
        <p className="text-gray-400 mb-8">
          The new operator will receive an email with instructions to set up their account and password.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="e.g. Jane Doe"
              required
            />
          </div>
          <div className="mb-8">
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="e.g. operator@example.com"
              required
            />
          </div>
          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={isInviting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-emerald-800 disabled:cursor-not-allowed">
              {isInviting ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteOperatorModal;