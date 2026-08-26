import React from 'react';

interface RentalEligibilityProps {
  onContinue: () => void;
  onBack: () => void;
}

const RentalEligibility: React.FC<RentalEligibilityProps> = ({
  onContinue,
  onBack,
}) => {
  return (
    <div className="min-h-full px-4 py-6 sm:px-6">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition mb-10"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>

          Back
        </button>

        {/* Main card */}
        <div className="relative overflow-hidden rounded-[28px] border border-gray-800 bg-gray-900/80">

          {/* Top gradient */}
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />

          <div className="relative p-6 sm:p-10">

            {/* Success icon */}
            <div className="flex justify-center mb-7">

              <div className="relative">

                <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl scale-150" />

                <div className="relative w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center">

                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center">

                    <svg
                      className="w-8 h-8 text-emerald-400"
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

            </div>

            {/* Heading */}
            <div className="text-center">

              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                RENTAL ELIGIBILITY
              </span>

              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                You're ready to rent
              </h1>

              <p className="text-gray-400 mt-3 max-w-md mx-auto leading-relaxed">
                Your battery and charging session have been verified.
                You can now choose a rental battery.
              </p>

            </div>

            {/* Battery status visual */}
            <div className="mt-9 rounded-2xl bg-gray-950/60 border border-gray-800 p-5">

              <div className="flex items-center justify-between mb-5">

                <div className="flex items-center gap-3">

                  <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">

                    <svg
                      className="w-5 h-5 text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <rect
                        x="3"
                        y="7"
                        width="16"
                        height="10"
                        rx="2"
                        strokeWidth={1.8}
                      />
                      <path
                        d="M21 10v4"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                      />
                    </svg>

                  </div>

                  <div>
                    <p className="text-sm font-semibold text-white">
                      Your battery
                    </p>

                    <p className="text-xs text-gray-500">
                      Secured in charging station
                    </p>
                  </div>

                </div>

                <span className="text-emerald-400 text-sm font-semibold">
                  Secure
                </span>

              </div>

              {/* Status line */}
              <div className="flex items-center gap-3">

                <div className="flex-1">

                  <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div className="h-full w-full rounded-full bg-emerald-400" />
                  </div>

                </div>

                <span className="text-xs text-gray-500">
                  Charging
                </span>

              </div>

            </div>

            {/* What happens next */}
            <div className="mt-6">

              <p className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-4">
                What happens next
              </p>

              <div className="grid sm:grid-cols-3 gap-3">

                {/* Step 1 */}
                <div className="rounded-2xl bg-gray-800/40 border border-gray-800 p-4">

                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs font-bold mb-3">
                    01
                  </div>

                  <p className="text-sm font-semibold text-gray-200">
                    Choose
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    Select an available rental battery.
                  </p>

                </div>

                {/* Step 2 */}
                <div className="rounded-2xl bg-gray-800/40 border border-gray-800 p-4">

                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs font-bold mb-3">
                    02
                  </div>

                  <p className="text-sm font-semibold text-gray-200">
                    Use
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    Ride while your battery keeps charging.
                  </p>

                </div>

                {/* Step 3 */}
                <div className="rounded-2xl bg-gray-800/40 border border-gray-800 p-4">

                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs font-bold mb-3">
                    03
                  </div>

                  <p className="text-sm font-semibold text-gray-200">
                    Return
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    Return the rental battery when finished.
                  </p>

                </div>

              </div>

            </div>

            {/* Security notice */}
            <div className="mt-6 flex gap-3 rounded-2xl bg-indigo-500/[0.06] border border-indigo-500/10 p-4">

              <svg
                className="w-5 h-5 shrink-0 text-indigo-400 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <div>
                <p className="text-sm font-medium text-gray-300">
                  Your battery stays protected
                </p>

                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Your own battery remains locked inside the station
                  throughout the rental session.
                </p>
              </div>

            </div>

            {/* CTA */}
            <button
              onClick={onContinue}
              className="w-full mt-7 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 group"
            >
              Choose Rental Battery

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
            </button>

          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-5">
          Rental availability is subject to the batteries currently available at this station.
        </p>

      </div>
    </div>
  );
};

export default RentalEligibility;