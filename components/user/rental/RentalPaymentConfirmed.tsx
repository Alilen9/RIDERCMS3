import React from 'react';

interface RentalPaymentConfirmedProps {
  amount: number;
  onContinue: () => void;
}

const RentalPaymentConfirmed: React.FC<
  RentalPaymentConfirmedProps
> = ({
  amount,
  onContinue,
}) => {
    return (
      <div className="min-h-full animate-fade-in px-4 py-8 sm:px-6">
        <div className="max-w-xl mx-auto">

          {/* Top success section */}
          <div className="text-center">

            {/* Success icon */}
            <div className="relative inline-flex">

              {/* Glow */}
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl scale-150" />

              <div className="relative w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">

                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">

                  <svg
                    className="w-8 h-8 text-gray-950"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M5 12l4 4L19 7"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                </div>

              </div>
            </div>

            <p className="text-xs uppercase tracking-[0.2em] text-emerald-400 font-semibold mt-7">
              Payment Successful
            </p>

            <h1 className="text-3xl sm:text-4xl font-bold text-white mt-3">
              Payment Confirmed
            </h1>

            <p className="text-gray-400 mt-3 leading-relaxed">
              Your rental and charging payment has been successfully
              processed.
            </p>

          </div>

          {/* Main payment card */}
          <div className="relative mt-8 overflow-hidden rounded-[28px] bg-gray-900/80 border border-gray-800">

            {/* Background glow */}
            <div className="absolute -top-24 -right-24 w-52 h-52 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative p-6 sm:p-7">

              {/* Amount */}
              <div className="text-center pb-7 border-b border-gray-800">

                <p className="text-xs uppercase tracking-widest text-gray-500">
                  Amount paid
                </p>

                <div className="flex items-baseline justify-center gap-2 mt-2">

                  <span className="text-sm font-medium text-gray-500">
                    KES
                  </span>

                  <span className="text-4xl sm:text-5xl font-bold text-white">
                    {amount.toFixed(2)}
                  </span>

                </div>

                <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">

                  <span className="w-2 h-2 rounded-full bg-emerald-400" />

                  <span className="text-xs font-bold tracking-wide text-emerald-400">
                    PAID
                  </span>

                </div>

              </div>

              {/* Payment details */}
              <div className="py-6 space-y-4">

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <div className="w-11 h-11 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">

                      <span className="text-lg font-bold text-green-400">
                        M
                      </span>

                    </div>

                    <div>
                      <p className="text-sm font-semibold text-white">
                        M-Pesa
                      </p>

                      <p className="text-xs text-gray-500 mt-0.5">
                        Payment method
                      </p>
                    </div>

                  </div>

                  <div className="flex items-center gap-1.5 text-emerald-400">

                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M5 12l4 4L19 7"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    <span className="text-xs font-semibold">
                      Confirmed
                    </span>

                  </div>

                </div>

              </div>

              {/* Access authorization */}
              <div className="rounded-2xl bg-indigo-500/[0.06] border border-indigo-500/15 p-5">

                <div className="flex items-start gap-4">

                  <div className="shrink-0 w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">

                    <svg
                      className="w-5 h-5 text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M7 11V7a5 5 0 0110 0v4"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                      />

                      <rect
                        x="4"
                        y="11"
                        width="16"
                        height="10"
                        rx="2"
                        strokeWidth={1.8}
                      />

                      <circle
                        cx="12"
                        cy="16"
                        r="1"
                        fill="currentColor"
                      />
                    </svg>

                  </div>

                  <div>

                    <p className="text-sm font-semibold text-white">
                      Battery access authorized
                    </p>

                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Your payment has been verified. Your own battery
                      is ready to be released from the charging station.
                    </p>

                  </div>

                </div>

              </div>

              {/* Unlock action */}
              <button
                onClick={onContinue}
                className="group relative w-full mt-6 overflow-hidden rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold py-4 transition-all duration-200 shadow-lg shadow-indigo-600/20"
              >

                <span className="relative flex items-center justify-center gap-3">

                  {/* Lock icon */}
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10">

                    <svg
                      className="w-5 h-5 group-hover:scale-110 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M7 11V7a5 5 0 0110 0v2"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                      />

                      <rect
                        x="4"
                        y="11"
                        width="16"
                        height="10"
                        rx="2"
                        strokeWidth={1.8}
                      />

                      <circle
                        cx="12"
                        cy="16"
                        r="1"
                        fill="currentColor"
                      />
                    </svg>

                  </span>

                  <span>
                    Unlock My Battery
                  </span>

                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M5 12h14M13 6l6 6-6 6"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                </span>

              </button>

            </div>

          </div>

          {/* Bottom security message */}
          <div className="flex items-center justify-center gap-2 mt-5">

            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <span className="text-[11px] text-gray-600">
              Payment verified • Battery access authorized
            </span>

          </div>

        </div>
      </div>
    );
  };

export default RentalPaymentConfirmed;