import React from 'react';

export interface RentalBatteryOption {
  id: string;
  soc: number;
  status: 'available' | 'charging';
}

interface ChooseRentalBatteryProps {
  batteries: RentalBatteryOption[];
  onSelect: (battery: RentalBatteryOption) => void;
  onBack: () => void;
}

const ChooseRentalBattery: React.FC<ChooseRentalBatteryProps> = ({
  batteries,
  onSelect,
  onBack,
}) => {
  const availableBatteries = batteries.filter(
    (battery) => battery.status === 'available'
  );

  const chargingBatteries = batteries.filter(
    (battery) => battery.status === 'charging'
  );

  return (
    <div className="min-h-full animate-fade-in py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">

        {/* Back button */}
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors mb-8"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800 border border-gray-700 group-hover:border-gray-600 group-hover:bg-gray-700 transition-all">
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
          </span>

          Back
        </button>

        {/* Header */}
        <div className="text-center mb-10">

          {/* Battery icon */}
          <div className="relative inline-flex mb-6">
            <div className="absolute inset-0 rounded-3xl bg-indigo-500/20 blur-2xl" />

            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <svg
                className="w-10 h-10 text-indigo-400"
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
            Battery Rental
          </p>

          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Choose a Battery
          </h1>

          <p className="text-gray-400 mt-3 max-w-md mx-auto leading-relaxed">
            Select an available battery to use while your own battery
            continues charging.
          </p>
        </div>

        {/* Availability summary */}
        <div className="grid grid-cols-2 gap-3 mb-6">

          <div className="rounded-2xl bg-gray-900/70 border border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/40" />
              </div>

              <div>
                <p className="text-2xl font-bold text-white">
                  {availableBatteries.length}
                </p>
                <p className="text-xs text-gray-500">
                  Available
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gray-900/70 border border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6l4 2"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    strokeWidth={2}
                  />
                </svg>
              </div>

              <div>
                <p className="text-2xl font-bold text-white">
                  {chargingBatteries.length}
                </p>
                <p className="text-xs text-gray-500">
                  Charging
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Battery list */}
        {batteries.length > 0 ? (
          <div className="space-y-4">

            {batteries.map((battery) => {
              const isAvailable = battery.status === 'available';

              return (
                <button
                  key={battery.id}
                  type="button"
                  onClick={() => isAvailable && onSelect(battery)}
                  disabled={!isAvailable}
                  className={`
                    group relative w-full text-left
                    rounded-2xl border
                    p-5 sm:p-6
                    transition-all duration-300
                    ${isAvailable
                      ? 'bg-gray-900/80 border-gray-800 hover:border-indigo-500/60 hover:bg-gray-800/90 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/5 cursor-pointer'
                      : 'bg-gray-900/40 border-gray-800/70 opacity-60 cursor-not-allowed'
                    }
                  `}
                >

                  {/* Hover glow */}
                  {isAvailable && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/[0.03] to-purple-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  )}

                  <div className="relative flex items-center gap-4 sm:gap-5">

                    {/* Battery icon */}
                    <div
                      className={`
                        shrink-0
                        w-14 h-14 sm:w-16 sm:h-16
                        rounded-2xl
                        flex items-center justify-center
                        border
                        ${isAvailable
                          ? 'bg-emerald-500/10 border-emerald-500/20'
                          : 'bg-gray-800 border-gray-700'
                        }
                      `}
                    >
                      <svg
                        className={`w-7 h-7 ${isAvailable
                            ? 'text-emerald-400'
                            : 'text-gray-500'
                          }`}
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

                    {/* Battery information */}
                    <div className="min-w-0 flex-1">

                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-white truncate">
                          {battery.id}
                        </h3>

                        {isAvailable ? (
                          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Available
                          </span>
                        ) : (
                          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-semibold text-amber-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Charging
                          </span>
                        )}
                      </div>

                      {/* Mobile status */}
                      <div className="sm:hidden mb-3">
                        <span
                          className={`
                            inline-flex items-center gap-1.5
                            px-2 py-1 rounded-full
                            text-[10px] font-semibold
                            ${isAvailable
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-amber-500/10 text-amber-400'
                            }
                          `}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${isAvailable
                                ? 'bg-emerald-400'
                                : 'bg-amber-400'
                              }`}
                          />

                          {isAvailable ? 'Available' : 'Charging'}
                        </span>
                      </div>

                      {/* SoC progress */}
                      <div className="max-w-xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-gray-500">
                            Battery level
                          </span>

                          <span className="text-xs font-medium text-gray-400">
                            {battery.soc}%
                          </span>
                        </div>

                        <div className="h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
                          <div
                            className={`
                              h-full rounded-full transition-all
                              ${battery.soc >= 70
                                ? 'bg-emerald-400'
                                : battery.soc >= 40
                                  ? 'bg-yellow-400'
                                  : 'bg-orange-400'
                              }
                            `}
                            style={{
                              width: `${Math.min(
                                Math.max(battery.soc, 0),
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                    </div>

                    {/* SoC percentage */}
                    <div className="shrink-0 text-right">

                      <div
                        className={`
                          text-2xl sm:text-3xl
                          font-bold tracking-tight
                          ${battery.soc >= 70
                            ? 'text-emerald-400'
                            : battery.soc >= 40
                              ? 'text-yellow-400'
                              : 'text-orange-400'
                          }
                        `}
                      >
                        {battery.soc}%
                      </div>

                      <p className="text-[10px] uppercase tracking-wider text-gray-600 mt-0.5">
                        SoC
                      </p>

                    </div>

                    {/* Arrow */}
                    {isAvailable && (
                      <div className="hidden sm:flex shrink-0 w-9 h-9 rounded-xl bg-gray-800 items-center justify-center text-gray-500 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-all">
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
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    )}

                  </div>
                </button>
              );
            })}

          </div>
        ) : (
          /* Empty state */
          <div className="rounded-3xl bg-gray-900/70 border border-gray-800 p-10 text-center">

            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-500"
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
                />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-white">
              No batteries available
            </h3>

            <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
              There are currently no rental batteries ready to use.
              Please check again shortly.
            </p>

          </div>
        )}

        {/* Information footer */}
        {availableBatteries.length > 0 && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-indigo-500/[0.06] border border-indigo-500/10 p-4">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  strokeWidth={1.8}
                />
                <path
                  d="M12 11v5"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
                <circle
                  cx="12"
                  cy="8"
                  r="0.5"
                  fill="currentColor"
                />
              </svg>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-300">
                Your battery keeps charging
              </p>

              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Once you select a rental battery, you can continue your
                journey while your own battery charges in the cabinet.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ChooseRentalBattery;