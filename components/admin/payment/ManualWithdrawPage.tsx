import React, { useState } from 'react';
import { usePayment } from '@/hooks/usePayment';

const ManualWithdrawPage: React.FC = () => {
  const { initiatePayment, status, loading, lastResponse } = usePayment();
  const [userId, setUserId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !phoneNumber || !amount) return;

    await initiatePayment({
      userId,
      phoneNumber,
      amount: parseFloat(amount),
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h2 className="text-xl font-bold mb-4">Manual Withdrawal</h2>
        <p className="text-gray-400 text-sm mb-6">
          Send an M-Pesa STK push to a user's phone to collect a payment.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">User ID (Firebase UID)</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. al7EuJwZFZPjL9omTVo2VtrC2Qy1"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 0712345678"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Amount (KES)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 150"
              min="1"
              step="1"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !userId || !phoneNumber || !amount}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Payment Prompt'}
          </button>
        </form>

        {/* Status display */}
        {status !== 'IDLE' && (
          <div className="mt-6 max-w-lg">
            {status === 'PENDING' && (
              <div className="p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg text-yellow-300 text-sm">
                Waiting for user to enter PIN on their phone...
              </div>
            )}
            {status === 'SUCCESS' && (
              <div className="p-4 bg-emerald-900/30 border border-emerald-700/50 rounded-lg text-emerald-400 text-sm">
                Payment completed successfully.
                {lastResponse?.sessionId && (
                  <span className="ml-2 text-gray-400">Session #{lastResponse.sessionId}</span>
                )}
              </div>
            )}
            {status === 'FAILED' && (
              <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-sm">
                Payment failed or was cancelled by the user.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualWithdrawPage;
