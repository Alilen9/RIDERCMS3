import React from 'react';

interface RentalBatteryCollectedProps {
  batteryId: string;
  onContinue: () => void;
}

const RentalBatteryCollected: React.FC<
  RentalBatteryCollectedProps
> = ({
  batteryId,
  onContinue,
}) => {
    return (
      <div className="min-h-full animate-fade-in px-4 py-10 sm:px-6">
        <div className="max-w-2xl mx-auto">

          {/* Success area */}
          <div className="text-center">

            {/* Success icon */}
            <div className="relative inline-flex mb-7">

              <div className="absolute inset-0 rounded-full bg-emerald-500/25 blur-3xl scale-150" />

              <div className="relative w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center">

                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">

                  <svg
                    className="w-8 h-8 text-white"
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

            {/* Label */}
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-400 font-semibold mb-3">
              Session Complete
            </p>

            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Battery Collected
            </h1>

            <p className="text-gray-400 mt-3 max-w-md mx-auto leading-relaxed">
              Your battery has been successfully released from the
              charging station.
            </p>

          </div>

          {/* Battery card */}
          <div className="relative overflow-hidden mt-9 rounded-[30px] bg-gray-900/80 border border-gray-800">

            <div className="absolute -top-28 -right-28 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            <div className="relative p-6 sm:p-8">

              {/* Card header */}
              <div className="flex items-center justify-between mb-7">

                <div className="flex items-center gap-4">

                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">

                    <svg
                      className="w-7 h-7 text-emerald-400"
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

                      <path
                        d="M7 10v4M10 10v4M13 10v4"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                      />
                    </svg>

                  </div>

                  <div>

                    <p className="text-xs uppercase tracking-wider text-gray-500">
                      Your battery
                    </p>

                    <p className="text-lg font-bold text-white mt-1">
                      {batteryId}
                    </p>

                  </div>

                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">

                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />

                  Collected

                </span>

              </div>

              {/* Collection confirmation */}
              <div className="rounded-3xl bg-gray-950/60 border border-gray-800 p-6 text-center">

                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">

                  <svg
                    className="w-6 h-6 text-emerald-400"
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

                </div>

                <p className="text-lg font-semibold text-white">
                  Successfully released
                </p>

                <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
                  Your battery is no longer locked in the charging
                  station and is ready for you to use.
                </p>

              </div>

              {/* Session summary */}
              <div className="grid grid-cols-2 gap-3 mt-4">

                <div className="rounded-2xl bg-gray-800/40 border border-gray-800 p-4">

                  <p className="text-xs text-gray-500 mb-2">
                    Rental
                  </p>

                  <div className="flex items-center gap-2">

                    <svg
                      className="w-4 h-4 text-gray-400"
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

                    <span className="text-sm font-semibold text-white">
                      Returned
                    </span>

                  </div>

                </div>

                <div className="rounded-2xl bg-gray-800/40 border border-gray-800 p-4">

                  <p className="text-xs text-gray-500 mb-2">
                    Own battery
                  </p>

                  <div className="flex items-center gap-2">

                    <svg
                      className="w-4 h-4 text-emerald-400"
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

                    <span className="text-sm font-semibold text-white">
                      Collected
                    </span>

                  </div>

                </div>

              </div>

            </div>
          </div>

          {/* Completion message */}
          <div className="mt-5 rounded-2xl bg-indigo-500/[0.06] border border-indigo-500/10 p-5">

            <div className="flex items-start gap-3">

              <div className="shrink-0 w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">

                <svg
                  className="w-4 h-4 text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

              </div>

              <div>

                <p className="text-sm font-semibold text-gray-300">
                  You're all set
                </p>

                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Your charging and rental session has been completed.
                  Thank you for using the battery service.
                </p>

              </div>

            </div>

          </div>

          {/* Complete button */}
          <button
            onClick={onContinue}
            className="group w-full mt-6 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold transition-all shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20"
          >

            <span className="flex items-center justify-center gap-3">

              Complete Session

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

          <p className="text-center text-[11px] text-gray-600 mt-4">
            Session completed successfully.
          </p>

        </div>
      </div>
    );
  };

export default RentalBatteryCollected;