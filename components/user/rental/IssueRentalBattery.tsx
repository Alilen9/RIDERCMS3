import React from 'react';

interface IssueRentalBatteryProps {
  batteryId: string;
  soc: number;
  onUnlock: () => void;
  onBack: () => void;
}

const IssueRentalBattery: React.FC<IssueRentalBatteryProps> = ({
  batteryId,
  soc,
  onUnlock,
  onBack,
}) => {
  return (
    <div className="min-h-full animate-fade-in px-4 py-6 sm:px-6">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors mb-10"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800 border border-gray-700 group-hover:bg-gray-700 group-hover:border-gray-600 transition-all">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M15 19l-7-7 7-7"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">

          <div className="relative inline-flex mb-6">

            <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-2xl" />

            <div className="relative w-24 h-24 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">

              <svg
                className="w-11 h-11 text-indigo-400"
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
          </div>

          <p className="text-xs uppercase tracking-[0.2em] text-indigo-400 font-semibold mb-3">
            Rental Battery
          </p>

          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Battery Ready
          </h1>

          <p className="text-gray-400 mt-3 max-w-md mx-auto leading-relaxed">
            Your selected battery is ready. Unlock the compartment
            to collect it and begin your rental session.
          </p>

        </div>

        {/* Battery card */}
        <div className="relative overflow-hidden rounded-[28px] bg-gray-900/80 border border-gray-800">

          {/* Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />

          <div className="relative p-6 sm:p-7">

            {/* Selected battery */}
            <div className="flex items-center justify-between mb-7">

              <div className="flex items-center gap-4">

                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">

                  <svg
                    className="w-7 h-7 text-indigo-400"
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
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Selected battery
                  </p>

                  <p className="text-lg font-bold text-white mt-1">
                    {batteryId}
                  </p>
                </div>

              </div>

              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Ready
              </span>

            </div>

            {/* Battery level */}
            <div className="rounded-2xl bg-gray-950/60 border border-gray-800 p-5">

              <div className="flex items-end justify-between mb-3">

                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    State of charge
                  </p>

                  <p className="text-3xl font-bold text-emerald-400 mt-1">
                    {soc}%
                  </p>
                </div>

                <span className="text-xs text-gray-600">
                  Ready for use
                </span>

              </div>

              {/* Battery level */}
              <div className="h-3 rounded-full bg-gray-800 overflow-hidden">

                <div
                  className={`
                    h-full rounded-full transition-all
                    ${soc >= 70
                      ? 'bg-emerald-400'
                      : soc >= 40
                        ? 'bg-yellow-400'
                        : 'bg-orange-400'
                    }
                  `}
                  style={{
                    width: `${Math.min(Math.max(soc, 0), 100)}%`,
                  }}
                />

              </div>

              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-gray-600">
                  0%
                </span>

                <span className="text-[10px] text-gray-600">
                  100%
                </span>
              </div>

            </div>

            {/* Unlock instruction */}
            <div className="mt-5 rounded-2xl bg-yellow-500/[0.06] border border-yellow-500/15 p-5">

              <div className="flex items-start gap-4">

                <div className="shrink-0 w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/15 flex items-center justify-center">

                  <svg
                    className="w-5 h-5 text-yellow-400"
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

                  <p className="text-sm font-semibold text-yellow-300">
                    Ready to unlock
                  </p>

                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    The battery compartment will unlock when you
                    continue. Remove only the selected battery.
                  </p>

                </div>

              </div>

            </div>

            {/* Unlock button */}
            <button
              onClick={onUnlock}
              className="group relative w-full mt-6 overflow-hidden rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold py-4 transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20"
            >

              <span className="relative flex items-center justify-center gap-3">

                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/10">

                  <svg
                    className="w-4 h-4 group-hover:rotate-[-10deg] transition-transform"
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
                  </svg>

                </span>

                Unlock & Collect Battery

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

        {/* Security footer */}
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

          <p className="text-[11px] text-gray-600">
            Your own battery remains secured in the charging station.
          </p>

        </div>

      </div>
    </div>
  );
};

export default IssueRentalBattery;