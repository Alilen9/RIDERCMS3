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

  const getSocColor = (soc: number) => {
    if (soc >= 70) {
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-400',
        light: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
      };
    }

    if (soc >= 40) {
      return {
        text: 'text-yellow-400',
        bg: 'bg-yellow-400',
        light: 'bg-yellow-500/10',
        border: 'border-yellow-500/20',
      };
    }

    return {
      text: 'text-orange-400',
      bg: 'bg-orange-400',
      light: 'bg-orange-500/10',
      border: 'border-orange-500/20',
    };
  };

  return (
    <div className="min-h-full animate-fade-in px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Back button */}
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors mb-8"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 group-hover:bg-gray-700 group-hover:border-gray-600 transition-all">
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
        <div className="text-center mb-10">

          {/* Icon */}
          <div className="relative inline-flex mb-6">
            <div className="absolute inset-0 rounded-3xl bg-indigo-500/20 blur-2xl scale-125" />

            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/30 flex items-center justify-center shadow-xl shadow-indigo-500/10">
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

          <p className="text-xs uppercase tracking-[0.2em] text-indigo-400 font-semibold">
            Battery Rental
          </p>

          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-2">
            Choose a Battery
          </h1>

          <p className="text-gray-400 mt-3 max-w-lg mx-auto leading-relaxed">
            Select an available battery to use while your own battery
            continues charging.
          </p>
        </div>

        {/* Availability summary */}
        <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto mb-10">

          {/* Available */}
          <div className="rounded-2xl bg-gray-900/70 border border-gray-800 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
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

          {/* Charging */}
          <div className="rounded-2xl bg-gray-900/70 border border-gray-800 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    strokeWidth={2}
                  />

                  <path
                    d="M12 7v5l3 2"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
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

        {/* Battery Cards */}
        {batteries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            {batteries.map((battery) => {
              const isAvailable =
                battery.status === 'available';

              const socColors = getSocColor(battery.soc);

              return (
                <div
                  key={battery.id}
                  className={`
                    group relative overflow-hidden rounded-3xl
                    border p-6
                    transition-all duration-300
                    ${isAvailable
                      ? `
                          bg-gray-900/80
                          border-gray-800
                          hover:border-indigo-500/50
                          hover:bg-gray-900
                          hover:-translate-y-1
                          hover:shadow-2xl
                          hover:shadow-indigo-500/10
                        `
                      : `
                          bg-gray-900/40
                          border-gray-800/70
                          opacity-60
                        `
                    }
                  `}
                >

                  {/* Background glow */}
                  {isAvailable && (
                    <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-indigo-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}

                  <div className="relative">

                    {/* Card top */}
                    <div className="flex items-center justify-between mb-6">

                      {/* Battery icon */}
                      <div
                        className={`
                          w-14 h-14 rounded-2xl
                          flex items-center justify-center
                          border
                          ${isAvailable
                            ? 'bg-emerald-500/10 border-emerald-500/20'
                            : 'bg-gray-800 border-gray-700'
                          }
                        `}
                      >
                        <svg
                          className={`
                            w-7 h-7
                            ${isAvailable
                              ? 'text-emerald-400'
                              : 'text-gray-500'
                            }
                          `}
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

                      {/* Status */}
                      <span
                        className={`
                          inline-flex items-center gap-1.5
                          px-3 py-1.5
                          rounded-full
                          text-[10px]
                          font-bold
                          uppercase
                          tracking-wide
                          ${isAvailable
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                          }
                        `}
                      >
                        <span
                          className={`
                            w-1.5 h-1.5 rounded-full
                            ${isAvailable
                              ? 'bg-emerald-400'
                              : 'bg-amber-400'
                            }
                          `}
                        />

                        {isAvailable
                          ? 'Available'
                          : 'Charging'}
                      </span>

                    </div>

                    {/* Battery ID */}
                    <div className="mb-6">
                      <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">
                        Rental Battery
                      </p>

                      <h3 className="text-xl font-bold text-white">
                        {battery.id}
                      </h3>
                    </div>

                    {/* SoC */}
                    <div className="mb-6">

                      <div className="flex items-end justify-between mb-3">

                        <div>
                          <p className="text-xs text-gray-500">
                            Battery level
                          </p>

                          <p
                            className={`
                              text-4xl
                              font-bold
                              tracking-tight
                              mt-1
                              ${socColors.text}
                            `}
                          >
                            {battery.soc}%
                          </p>
                        </div>

                        <span className="text-xs uppercase tracking-wider text-gray-600 mb-1">
                          SoC
                        </span>

                      </div>

                      {/* Progress */}
                      <div className="h-2 w-full rounded-full bg-gray-800 overflow-hidden">
                        <div
                          className={`
                            h-full
                            rounded-full
                            transition-all
                            ${socColors.bg}
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

                    {/* Action */}
                    <button
                      type="button"
                      disabled={!isAvailable}
                      onClick={() =>
                        isAvailable && onSelect(battery)
                      }
                      className={`
                        w-full
                        rounded-2xl
                        py-3.5
                        px-4
                        font-semibold
                        text-sm
                        flex
                        items-center
                        justify-center
                        gap-2
                        transition-all
                        ${isAvailable
                          ? `
                              bg-indigo-600
                              hover:bg-indigo-500
                              active:bg-indigo-700
                              text-white
                              shadow-lg
                              shadow-indigo-600/20
                            `
                          : `
                              bg-gray-800
                              text-gray-500
                              cursor-not-allowed
                            `
                        }
                      `}
                    >
                      {isAvailable ? (
                        <>
                          Select Battery

                          <svg
                            className="w-4 h-4"
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
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="9"
                              strokeWidth={2}
                            />

                            <path
                              d="M12 7v5l3 2"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>

                          Currently Charging
                        </>
                      )}
                    </button>

                  </div>
                </div>
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
                  strokeLinecap="round"
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
          <div className="mt-8 flex items-start gap-3 rounded-2xl bg-indigo-500/[0.06] border border-indigo-500/10 p-5">

            <div className="shrink-0 w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
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
                Select an available rental battery and continue
                your journey while your own battery charges in the
                cabinet.
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default ChooseRentalBattery;