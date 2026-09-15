import React, { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AdminSession, retryWithdrawalPayment, getSessionPaymentStatus, sendSlotCommand } from '../../../services/adminService';
import { ArrowLeft, RefreshCw, UserCheck, CreditCard, Zap, MapPin, Unlock } from 'lucide-react';

type PaymentPhase = 'idle' | 'sending' | 'waiting' | 'paid' | 'failed';

interface RetryPaymentViewProps {
  session: AdminSession;
  onBack: () => void;
  onDone?: () => void;
}

const RetryPaymentView: React.FC<RetryPaymentViewProps> = ({ session, onBack, onDone }) => {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [phase, setPhase] = useState<PaymentPhase>('idle');
  const [releasing, setReleasing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Prefill from the failed withdrawal session.
  useEffect(() => {
    setPhone(session.userPhoneNumber || '');
    setAmount(session.amount != null ? String(session.amount) : '');
  }, [session.id]);

  const clearPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => clearPolling, [clearPolling]);

  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim()) {
      toast.error('A phone number is required.');
      return;
    }

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount < 1) {
      toast.error('Amount must be at least KES 1.');
      return;
    }

    setPhase('sending');
    try {
      const result = await retryWithdrawalPayment(session.id, phone.trim(), numericAmount);
      toast.success(`M-Pesa prompt sent (Ksh ${result.amount.toLocaleString()}). Awaiting payment...`);
      setPhase('waiting');
    } catch (error) {
      const message = (error as any)?.response?.data?.error || 'Unable to send the payment prompt.';
      toast.error(message);
      setPhase('idle');
      return;
    }

    // Poll payment status until it resolves.
    pollRef.current = setInterval(async () => {
      try {
        const { paymentStatus } = await getSessionPaymentStatus(session.id);
        if (paymentStatus === 'paid') {
          clearPolling();
          setPhase('paid');
          toast.success('Payment received.');
        } else if (paymentStatus === 'failed') {
          clearPolling();
          setPhase('failed');
          toast.error('Payment failed. You can retry.');
        }
      } catch (error) {
        // Keep polling on transient errors; individual polls are fire-and-forget.
        console.error('Poll payment status error:', error);
      }
    }, 3000);
  };

  const handleRelease = async () => {
    if (!session.boothUid || !session.slotIdentifier) {
      toast.error('This session has no booth/slot reference to release.');
      return;
    }

    setReleasing(true);
    try {
      await sendSlotCommand(session.boothUid, session.slotIdentifier, { forceUnlock: true });
      toast.success('Battery release command sent. The slot is now unlocked.');
      onDone?.();
    } catch (error) {
      const message = (error as any)?.response?.data?.error || 'Failed to send release command.';
      toast.error(message);
    } finally {
      setReleasing(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-200"
        >
          <div className="p-2 rounded-lg bg-gray-800 group-hover:bg-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="font-semibold text-sm">Back</span>
        </button>

        <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full border ${phase === 'paid' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : phase === 'failed' ? 'text-red-400 bg-red-400/10 border-red-400/20' : phase === 'waiting' || phase === 'sending' ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' : 'text-gray-400 bg-gray-400/10 border-gray-400/20'}`}>
          {phase === 'paid' ? 'Paid' : phase === 'failed' ? 'Failed' : phase === 'waiting' ? 'Awaiting Payment' : phase === 'sending' ? 'Sending...' : 'Retry Payment'}
        </span>
      </div>

      {/* Session summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-gray-500 text-xs font-bold uppercase">Session</div>
              <div className="text-white font-mono font-bold">#{session.id}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-gray-500 text-xs font-bold uppercase">Slot</div>
              <div className="text-white font-mono font-bold">{session.slotIdentifier || 'N/A'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-gray-500 text-xs font-bold uppercase">Amount</div>
              <div className="text-white font-bold">
                Ksh {(Number(amount) || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment prompt form */}
      {phase === 'idle' || phase === 'sending' || phase === 'failed' ? (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-xl font-bold mb-1">Retry M-Pesa Payment</h2>
          <p className="text-gray-400 text-sm mb-6">
            Send a fresh M-Pesa STK push so the rider can complete the withdrawal payment.
          </p>

          <form onSubmit={handleSendPrompt} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0712345678"
                required
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Amount (KES)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="150"
                min="1"
                required
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2"
              />
            </div>

            <button
              type="submit"
              disabled={phase === 'sending' || !phone.trim() || !Number(amount)}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              {phase === 'sending' ? (
                <>
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  {phase === 'failed' ? 'Retry Payment Prompt' : 'Send Payment Prompt'}
                </>
              )}
            </button>

            {phase === 'failed' && (
              <p className="text-sm text-red-400 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                The previous payment was not completed. Correct the phone/amount and retry.
              </p>
            )}
          </form>
        </div>
      ) : null}

      {/* Waiting for payment */}
      {phase === 'waiting' ? (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-10 text-center">
          <div className="flex flex-col items-center gap-4">
            <span className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
            <div>
              <h3 className="text-lg font-bold text-white">Awaiting payment on {phone || 'the rider\'s phone'}</h3>
              <p className="text-gray-400 text-sm mt-1">
                Watching for the M-Pesa confirmation. This can take a minute.
              </p>
            </div>
            <button
              onClick={() => { clearPolling(); setPhase('idle'); }}
              className="text-sm text-gray-400 hover:text-white underline"
            >
              Cancel / go back
            </button>
          </div>
        </div>
      ) : null}

      {/* Paid -> explicit release (NOT automatic) */}
      {phase === 'paid' ? (
        <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-xl p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <UserCheck className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Payment confirmed</h3>
              <p className="text-gray-400 text-sm mt-1 max-w-md mx-auto">
                The rider has paid. Release the battery only once they are physically at the slot.
                This action unlocks and finalizes the withdrawal.
              </p>
            </div>
            <button
              onClick={handleRelease}
              disabled={releasing}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              {releasing ? (
                <>
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  Releasing...
                </>
              ) : (
                <>
                  <Unlock className="w-5 h-5" />
                  Release Battery
                </>
              )}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default RetryPaymentView;
