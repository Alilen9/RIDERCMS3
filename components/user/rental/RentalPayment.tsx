import React, { useState } from 'react';
import {
  Smartphone,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';

interface RentalPaymentProps {
  amount: number;

  /**
   * This should:
   * 1. Call your backend
   * 2. Trigger M-Pesa STK Push
   * 3. Return true if payment succeeds
   * 4. Return false if payment fails
   */
  onPay: () => Promise<boolean>;

  onSuccess: () => void;
  onBack: () => void;
}

const RentalPayment: React.FC<RentalPaymentProps> = ({
  amount,
  onPay,
  onSuccess,
  onBack,
}) => {
  const [status, setStatus] = useState<
    'idle' | 'waiting' | 'success' | 'failed'
  >('idle');

  const [error, setError] = useState('');

  const handlePay = async () => {
    if (status === 'waiting') return;

    setStatus('waiting');
    setError('');

    try {
      const success = await onPay();

      if (success) {
        setStatus('success');

        // Small delay so user sees successful payment
        setTimeout(() => {
          onSuccess();
        }, 1200);
      } else {
        setStatus('failed');
        setError(
          'The payment was not completed. Please try again.'
        );
      }
    } catch (error) {
      console.error('M-Pesa payment error:', error);

      setStatus('failed');

      setError(
        'Unable to process the payment. Please try again.'
      );
    }
  };

  /*
   * WAITING SCREEN
   */
  if (status === 'waiting') {
    return (
      <div className="min-h-full px-4 py-10 sm:px-6 animate-fade-in">
        <div className="max-w-xl mx-auto">

          <div className="text-center">

            <div className="relative inline-flex mb-7">

              <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-3xl scale-150" />

              <div className="relative w-24 h-24 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">

                <Loader2
                  size={42}
                  className="text-indigo-400 animate-spin"
                />

              </div>

            </div>

            <p className="text-xs uppercase tracking-[0.2em] text-indigo-400 font-semibold">
              M-Pesa Payment
            </p>

            <h1 className="text-3xl sm:text-4xl font-bold text-white mt-3">
              Waiting for Payment
            </h1>

            <p className="text-gray-400 mt-3 leading-relaxed max-w-md mx-auto">
              We have sent an M-Pesa payment request to your phone.
            </p>

          </div>

          <div className="mt-8 rounded-[28px] bg-gray-900/80 border border-gray-800 p-7">

            {/* Amount */}
            <div className="text-center pb-6 border-b border-gray-800">

              <p className="text-xs uppercase tracking-widest text-gray-500">
                Amount to pay
              </p>

              <div className="flex items-baseline justify-center gap-2 mt-2">

                <span className="text-sm text-gray-500">
                  KES
                </span>

                <span className="text-4xl font-bold text-white">
                  {amount.toFixed(2)}
                </span>

              </div>

            </div>

            {/* Phone instruction */}
            <div className="mt-6 rounded-2xl bg-green-500/5 border border-green-500/20 p-5">

              <div className="flex items-start gap-4">

                <div className="w-11 h-11 shrink-0 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">

                  <Smartphone
                    size={22}
                    className="text-green-400"
                  />

                </div>

                <div>

                  <h3 className="text-sm font-semibold text-white">
                    Check your phone
                  </h3>

                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    An M-Pesa prompt has been sent to your phone.
                    Enter your M-Pesa PIN to complete the payment.
                  </p>

                </div>

              </div>

            </div>

            {/* Spinner */}
            <div className="flex flex-col items-center justify-center py-8">

              <div className="relative w-16 h-16">

                <div className="absolute inset-0 rounded-full border-4 border-gray-800" />

                <div className="absolute inset-0 rounded-full border-4 border-indigo-400 border-t-transparent animate-spin" />

              </div>

              <p className="text-sm text-gray-300 mt-5">
                Waiting for M-Pesa confirmation...
              </p>

              <p className="text-xs text-gray-600 mt-2">
                Please do not close this page.
              </p>

            </div>

          </div>

        </div>
      </div>
    );
  }

  /*
   * SUCCESS SCREEN
   */
  if (status === 'success') {
    return (
      <div className="min-h-full px-4 py-10 sm:px-6 animate-fade-in">
        <div className="max-w-xl mx-auto text-center">

          <div className="relative inline-flex">

            <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-3xl scale-150" />

            <div className="relative w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center">

              <CheckCircle2
                size={44}
                className="text-gray-950"
              />

            </div>

          </div>

          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400 font-semibold mt-7">
            Payment Successful
          </p>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mt-3">
            Payment Confirmed
          </h1>

          <p className="text-gray-400 mt-3">
            Your payment has been successfully received.
          </p>

        </div>
      </div>
    );
  }

  /*
   * NORMAL / FAILED SCREEN
   */
  return (
    <div className="min-h-full px-4 py-10 sm:px-6 animate-fade-in">
      <div className="max-w-xl mx-auto">

        <div className="text-center">

          <div className="relative inline-flex">

            <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-3xl scale-150" />

            <div className="relative w-24 h-24 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">

              <Smartphone
                size={40}
                className="text-indigo-400"
              />

            </div>

          </div>

          <p className="text-xs uppercase tracking-[0.2em] text-indigo-400 font-semibold mt-7">
            M-Pesa
          </p>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mt-3">
            Complete Your Payment
          </h1>

          <p className="text-gray-400 mt-3">
            Pay for your rental, energy and charging session.
          </p>

        </div>

        <div className="mt-8 rounded-[28px] bg-gray-900/80 border border-gray-800 p-7">

          {/* Amount */}
          <div className="text-center pb-7 border-b border-gray-800">

            <p className="text-xs uppercase tracking-widest text-gray-500">
              Total amount
            </p>

            <div className="flex items-baseline justify-center gap-2 mt-2">

              <span className="text-sm text-gray-500">
                KES
              </span>

              <span className="text-5xl font-bold text-white">
                {amount.toFixed(2)}
              </span>

            </div>

          </div>

          {/* Error */}
          {status === 'failed' && (
            <div className="mt-6 rounded-2xl bg-red-500/5 border border-red-500/20 p-4">

              <div className="flex items-start gap-3">

                <XCircle
                  size={22}
                  className="text-red-400 shrink-0"
                />

                <div>

                  <p className="text-sm font-semibold text-red-300">
                    Payment Failed
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {error}
                  </p>

                </div>

              </div>

            </div>
          )}

          {/* Pay */}
          <button
            type="button"
            onClick={handlePay}
            className="group w-full mt-7 py-4 rounded-2xl bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-semibold transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-3"
          >
            <Smartphone size={20} />

            <span>
              Pay KES {amount.toFixed(2)}
            </span>

            <ArrowRight
              size={20}
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full mt-3 py-3 text-sm text-gray-500 hover:text-gray-300 transition"
          >
            Back to bill
          </button>

        </div>

      </div>
    </div>
  );
};

export default RentalPayment;