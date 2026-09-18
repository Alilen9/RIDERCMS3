import React from 'react';

interface OwnBatteryChargingCompleteProps {
  batterySoc: number;
  onContinue: () => void;
}

const OwnBatteryChargingComplete: React.FC<
  OwnBatteryChargingCompleteProps
> = ({
  batterySoc,
  onContinue,
}) => {
    return (
      <div className="min-h-full animate-fade-in px-4 py-10 sm:px-6">
        <div className="max-w-2xl mx-auto">

          {/* Success header */}
          <div className="text-center">

            {/* Success icon */}
            <div className="relative inline-flex mb-7">

              <div className="absolute inset-0 rounded-full bg-emerald-500/25 blur-3xl scale-150" />

              <div className="relative w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center">

                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">

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

            <p className="text-xs uppercase tracking-[0.2em] text-emerald-400 font-semibold mb-3">
              Charging Complete
            </p>

            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Your Battery is Ready
            </h1>

            <p className="text-gray-400 mt-3 max-w-md mx-auto leading-relaxed">
              Your battery has finished charging and is ready for collection.
            </p>

          </div>

          {/* Main battery card */}
          <div className="relative overflow-hidden mt-9 rounded-[30px] bg-gray-900/80 border border-gray-800">

            {/* Background glow */}
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            <div className="relative p-6 sm:p-8">

              {/* Battery title */}
              <div className="flex items-center justify-between mb-8">

                <div className="flex items-center gap-3">

                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">

                    <svg
                      className="w-6 h-6 text-emerald-400"
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
                    <p className="text-sm font-semibold text-white">
                      Your battery
                    </p>

                    <p className="text-xs text-gray-500 mt-0.5">
                      Charging session completed
                    </p>
                  </div>

                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">

                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />

                  Ready

                </span>

              </div>

              {/* SoC hero */}
              <div className="rounded-3xl bg-gray-950/70 border border-gray-800 p-7 sm:p-9 text-center">

                <p className="text-xs uppercase tracking-[0.18em] text-gray-500 font-semibold">
                  Final battery level
                </p>

                <div className="flex items-baseline justify-center gap-1 mt-3">

                  <span className="text-6xl sm:text-7xl font-bold tracking-tight text-emerald-400">
                    {batterySoc}
                  </span>

                  <span className="text-2xl sm:text-3xl font-semibold text-emerald-400/70">
                    %
                  </span>

                </div>

                <p className="text-sm text-gray-500 mt-2">
                  State of Charge
                </p>

                {/* Battery level */}
                <div className="mt-7">

                  <div className="h-3 rounded-full bg-gray-800 overflow-hidden">

                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                      style={{
                        width: `${Math.min(
                          Math.max(batterySoc, 0),
                          100
                        )}%`,
                      }}
                    />

                  </div>

                  <div className="flex justify-between mt-2">
                    <span className="text-[10px] text-gray-600">
                      Empty
                    </span>

                    <span className="text-[10px] text-gray-600">
                      Full
                    </span>
                  </div>

                </div>

              </div>

              {/* Status information */}
              <div className="grid grid-cols-2 gap-3 mt-4">

                <div className="rounded-2xl bg-gray-800/40 border border-gray-800 p-4">

                  <div className="flex items-center gap-2 mb-2">

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

                    <span className="text-xs text-gray-500">
                      Charging
                    </span>

                  </div>

                  <p className="text-sm font-semibold text-white">
                    Complete
                  </p>

                </div>

                <div className="rounded-2xl bg-gray-800/40 border border-gray-800 p-4">

                  <div className="flex items-center gap-2 mb-2">

                    <svg
                      className="w-4 h-4 text-indigo-400"
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

                    <span className="text-xs text-gray-500">
                      Battery
                    </span>

                  </div>

                  <p className="text-sm font-semibold text-white">
                    Secured
                  </p>

                </div>

              </div>

              {/* Collection notice */}
              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-indigo-500/[0.06] border border-indigo-500/10 p-4">

                <div className="shrink-0 w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">

                  <svg
                    className="w-4 h-4 text-indigo-400"
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

                </div>

                <div>

                  <p className="text-sm font-semibold text-gray-300">
                    Battery ready for collection
                  </p>

                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Your battery remains safely locked in the station.
                    Complete your payment to continue to collection.
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* CTA */}
          <button
            onClick={onContinue}
            className="group w-full mt-6 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold transition-all shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20"
          >

            <span className="flex items-center justify-center gap-3">

              View Final Bill

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
            Your battery will remain secured until the session is completed.
          </p>

        </div>
      </div>
    );
  };

export default OwnBatteryChargingComplete;