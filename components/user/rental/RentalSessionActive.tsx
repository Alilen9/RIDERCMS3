import React, { useEffect, useState } from 'react';

interface RentalSessionActiveProps {
  ownBatterySoc: number;
  rentalBatteryId: string;
  rentalBatterySoc: number;
  rentalStartSoc: number;
  startTime: Date;
  onReturn: () => void;
}

const RentalSessionActive: React.FC<RentalSessionActiveProps> = ({
  ownBatterySoc,
  rentalBatteryId,
  rentalBatterySoc,
  rentalStartSoc,
  startTime,
  onReturn,
}) => {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    const updateElapsedTime = () => {
      const elapsed = Math.max(
        0,
        Math.floor(
          (Date.now() - startTime.getTime()) / 60000
        )
      );

      setElapsedMinutes(elapsed);
    };

    updateElapsedTime();

    const interval = setInterval(
      updateElapsedTime,
      1000
    );

    return () => clearInterval(interval);
  }, [startTime]);

  const energyUsed = Math.max(
    0,
    rentalStartSoc - rentalBatterySoc
  );

  const rentalBatteryPercentage = Math.min(
    Math.max(rentalBatterySoc, 0),
    100
  );

  const ownBatteryPercentage = Math.min(
    Math.max(ownBatterySoc, 0),
    100
  );

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }

    return `${mins} min`;
  };

  return (
    <div className="min-h-full animate-fade-in px-4 py-6 sm:px-6">
      <div className="max-w-2xl mx-auto">

        {/* =========================
            HEADER
        ========================== */}

        <div className="text-center mb-8">

          {/* Active indicator */}
          <div className="relative inline-flex mb-6">

            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl scale-150" />

            <div className="relative w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">

              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">

                <svg
                  className="w-8 h-8 text-emerald-400"
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

            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-3">

            <span className="relative flex h-2.5 w-2.5">

              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50 animate-ping" />

              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />

            </span>

            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-emerald-400">
              Live Session
            </span>

          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Rental Session Active
          </h1>

          <p className="text-gray-400 mt-3 max-w-md mx-auto">
            You're using a rental battery while your own battery
            continues charging at the station.
          </p>

        </div>

        {/* =========================
            RENTAL BATTERY HERO
        ========================== */}

        <div className="relative overflow-hidden rounded-[30px] bg-gray-900/80 border border-indigo-500/20">

          {/* Background glow */}
          <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative p-6 sm:p-8">

            {/* Battery heading */}
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

                    <path
                      d="M7 10v4M10 10v4M13 10v4"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                    />
                  </svg>

                </div>

                <div>

                  <p className="text-xs uppercase tracking-wider text-gray-500">
                    Rental battery
                  </p>

                  <p className="text-lg font-bold text-white mt-1">
                    {rentalBatteryId}
                  </p>

                </div>

              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">

                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />

                IN USE

              </span>

            </div>

            {/* Current SoC */}
            <div className="rounded-3xl bg-gray-950/60 border border-gray-800 p-6">

              <div className="flex items-end justify-between">

                <div>

                  <p className="text-xs uppercase tracking-wider text-gray-500">
                    Current charge
                  </p>

                  <div className="flex items-baseline gap-1 mt-1">

                    <span className="text-5xl font-bold text-indigo-400">
                      {rentalBatterySoc}
                    </span>

                    <span className="text-xl text-indigo-400/60 font-semibold">
                      %
                    </span>

                  </div>

                </div>

                <div className="text-right">

                  <p className="text-xs text-gray-500">
                    Started at
                  </p>

                  <p className="text-lg font-semibold text-white mt-1">
                    {rentalStartSoc}%
                  </p>

                </div>

              </div>

              {/* Battery bar */}
              <div className="mt-6">

                <div className="h-3 rounded-full bg-gray-800 overflow-hidden">

                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                    style={{
                      width: `${rentalBatteryPercentage}%`,
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

            </div>

            {/* Live statistics */}
            <div className="grid grid-cols-2 gap-3 mt-4">

              {/* Rental duration */}
              <div className="rounded-2xl bg-gray-800/40 border border-gray-800 p-4">

                <div className="flex items-center gap-2 mb-3">

                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">

                    <svg
                      className="w-4 h-4 text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="8"
                        strokeWidth={1.8}
                      />

                      <path
                        d="M12 7v5l3 2"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                      />
                    </svg>

                  </div>

                  <span className="text-xs text-gray-500">
                    Rental time
                  </span>

                </div>

                <p className="text-xl font-bold text-white">
                  {formatTime(elapsedMinutes)}
                </p>

                <p className="text-[11px] text-gray-600 mt-1">
                  Live
                </p>

              </div>

              {/* Energy used */}
              <div className="rounded-2xl bg-gray-800/40 border border-gray-800 p-4">

                <div className="flex items-center gap-2 mb-3">

                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">

                    <svg
                      className="w-4 h-4 text-orange-400"
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

                  <span className="text-xs text-gray-500">
                    Energy used
                  </span>

                </div>

                <p className="text-xl font-bold text-white">
                  {energyUsed}%
                </p>

                <p className="text-[11px] text-gray-600 mt-1">
                  Since rental started
                </p>

              </div>

            </div>

          </div>
        </div>

        {/* =========================
            OWN BATTERY
        ========================== */}

        <div className="relative overflow-hidden mt-5 rounded-[28px] bg-gray-900/70 border border-emerald-500/15">

          <div className="p-6">

            <div className="flex items-center justify-between mb-5">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">

                  <svg
                    className="w-5 h-5 text-emerald-400"
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
                    My Battery
                  </p>

                  <p className="text-xs text-gray-500 mt-0.5">
                    Charging at station
                  </p>

                </div>

              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-400">

                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />

                CHARGING

              </span>

            </div>

            <div className="flex items-center gap-5">

              {/* Circular-ish visual */}
              <div className="relative shrink-0 w-20 h-20 rounded-full border-4 border-gray-800 flex items-center justify-center">

                <div
                  className="absolute inset-[-4px] rounded-full border-4 border-emerald-400"
                  style={{
                    clipPath: `inset(${100 - ownBatteryPercentage}% 0 0 0)`,
                  }}
                />

                <div className="text-center">

                  <p className="text-xl font-bold text-emerald-400">
                    {ownBatterySoc}%
                  </p>

                </div>

              </div>

              <div className="flex-1">

                <div className="flex items-center justify-between mb-2">

                  <span className="text-xs text-gray-500">
                    Charging progress
                  </span>

                  <span className="text-xs font-semibold text-emerald-400">
                    {ownBatterySoc}%
                  </span>

                </div>

                <div className="h-2.5 rounded-full bg-gray-800 overflow-hidden">

                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                    style={{
                      width: `${ownBatteryPercentage}%`,
                    }}
                  />

                </div>

                <p className="text-xs text-gray-600 mt-2">
                  Your battery remains safely secured in the station.
                </p>

              </div>

            </div>

          </div>
        </div>

        {/* =========================
            INFO MESSAGE
        ========================== */}

        <div className="mt-5 rounded-2xl bg-indigo-500/[0.06] border border-indigo-500/10 p-5">

          <div className="flex items-start gap-3">

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
                  r="8"
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
                  r="1"
                  fill="currentColor"
                />
              </svg>

            </div>

            <div>

              <p className="text-sm font-semibold text-gray-300">
                Your charging continues
              </p>

              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                You can continue using the rental battery. Your own
                battery is charging safely in the station and will be
                ready when you return the rental battery.
              </p>

            </div>

          </div>

        </div>

        {/* =========================
            RETURN BUTTON
        ========================== */}

        <button
          onClick={onReturn}
          className="group w-full mt-6 py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20"
        >

          <span className="flex items-center justify-center gap-3">

            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10">

              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M4 12h16M12 5l7 7-7 7"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

            </span>

            Return Rental Battery

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
          Rental charges are calculated from your usage time and energy consumed.
        </p>

      </div>
    </div>
  );
};

export default RentalSessionActive;