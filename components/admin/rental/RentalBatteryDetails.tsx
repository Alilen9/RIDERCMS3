import React from 'react';
import type { RentalBattery } from './types';

interface RentalBatteryDetailsProps {
  battery: RentalBattery;
  onBack: () => void;
}

const RentalBatteryDetails: React.FC<RentalBatteryDetailsProps> = ({
  battery,
  onBack,
}) => {
  const isInUse = battery.status === 'issued';

  const currentRental = battery.currentRental;
  const lastRental = battery.lastRental;

  const getStatusStyle = () => {
    switch (battery.status) {
      case 'available':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';

      case 'issued':
        return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400';

      case 'charging':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-400';

      case 'maintenance':
        return 'bg-orange-500/10 border-orange-500/20 text-orange-400';

      case 'disabled':
        return 'bg-red-500/10 border-red-500/20 text-red-400';

      default:
        return 'bg-gray-500/10 border-gray-500/20 text-gray-400';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-KE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getSocColor = () => {
    if (battery.soc >= 70) return 'text-emerald-400';
    if (battery.soc >= 40) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Back */}
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors mb-6"
        >
          <span className="w-9 h-9 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center group-hover:bg-gray-800 transition-all">
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

          Back to Rental Batteries
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">

          <div className="flex items-center gap-4">

            {/* Battery icon */}
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-indigo-400"
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
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                Rental Battery
              </p>

              <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                {battery.id}
              </h1>

              <p className="text-sm text-gray-500 mt-1">
                Slot {battery.slotId}
              </p>
            </div>

          </div>

          {/* Status */}
          <span
            className={`inline-flex self-start md:self-auto items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wide ${getStatusStyle()}`}
          >
            <span className="w-2 h-2 rounded-full bg-current" />

            {battery.status}
          </span>

        </div>

        {/* Current Battery Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

          {/* SoC */}
          <div className="lg:col-span-1 rounded-3xl bg-gray-900/80 border border-gray-800 p-6">

            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500">
                  Current Battery Level
                </p>

                <h2 className={`text-5xl font-bold mt-2 ${getSocColor()}`}>
                  {battery.soc}%
                </h2>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center">
                <svg
                  className={`w-7 h-7 ${getSocColor()}`}
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
            </div>

            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${battery.soc >= 70
                  ? 'bg-emerald-400'
                  : battery.soc >= 40
                    ? 'bg-yellow-400'
                    : 'bg-orange-400'
                  }`}
                style={{
                  width: `${Math.min(
                    Math.max(battery.soc, 0),
                    100
                  )}%`,
                }}
              />
            </div>

            <p className="text-xs text-gray-500 mt-3">
              Last updated {battery.lastUpdated}
            </p>

          </div>

          {/* Current renter */}
          <div className="lg:col-span-2 rounded-3xl bg-gray-900/80 border border-gray-800 p-6">

            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500">
                  Current Renter
                </p>

                <h2 className="text-xl font-bold text-white mt-1">
                  {isInUse && currentRental
                    ? currentRental.renter.name
                    : 'No Active Renter'}
                </h2>
              </div>

              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle
                    cx="12"
                    cy="8"
                    r="3"
                    strokeWidth={1.8}
                  />

                  <path
                    d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {isInUse && currentRental ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="rounded-2xl bg-gray-800/60 p-4">
                  <p className="text-xs text-gray-500">
                    Rider ID
                  </p>

                  <p className="text-sm font-semibold text-white mt-1">
                    {currentRental.renter.id}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-800/60 p-4">
                  <p className="text-xs text-gray-500">
                    Phone Number
                  </p>

                  <p className="text-sm font-semibold text-white mt-1">
                    {currentRental.renter.phone}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-800/60 p-4">
                  <p className="text-xs text-gray-500">
                    Rental Started
                  </p>

                  <p className="text-sm font-semibold text-white mt-1">
                    {formatDate(currentRental.startTime)}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-800/60 p-4">
                  <p className="text-xs text-gray-500">
                    Duration
                  </p>

                  <p className="text-sm font-semibold text-white mt-1">
                    {currentRental.durationMinutes} minutes
                  </p>
                </div>

              </div>
            ) : (
              <div className="rounded-2xl bg-gray-800/40 border border-gray-800 p-6 text-center">
                <p className="text-gray-400 text-sm">
                  This battery is not currently rented.
                </p>

                {lastRental && (
                  <p className="text-gray-600 text-xs mt-2">
                    Last rented by {lastRental.renterName}
                  </p>
                )}
              </div>
            )}

          </div>

        </div>

        {/* Active rental details */}
        {isInUse && currentRental && (
          <div className="rounded-3xl bg-gray-900/80 border border-gray-800 p-6 mb-6">

            <div className="mb-6">
              <p className="text-xs uppercase tracking-widest text-indigo-400">
                Active Rental
              </p>

              <h2 className="text-xl font-bold text-white mt-1">
                Rental Session Details
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

              <div className="rounded-2xl bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500">
                  Session ID
                </p>

                <p className="text-sm text-white font-semibold mt-1">
                  {currentRental.sessionId}
                </p>
              </div>

              <div className="rounded-2xl bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500">
                  Starting SoC
                </p>

                <p className="text-2xl text-white font-bold mt-1">
                  {currentRental.startSoc}%
                </p>
              </div>

              <div className="rounded-2xl bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500">
                  Current SoC
                </p>

                <p className={`text-2xl font-bold mt-1 ${getSocColor()}`}>
                  {currentRental.currentSoc}%
                </p>
              </div>

              <div className="rounded-2xl bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500">
                  Duration
                </p>

                <p className="text-2xl text-white font-bold mt-1">
                  {currentRental.durationMinutes}
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    min
                  </span>
                </p>
              </div>

            </div>

          </div>
        )}

        {/* Financial details */}
        {isInUse && currentRental && (
          <div className="rounded-3xl bg-gray-900/80 border border-gray-800 p-6 mb-6">

            <div className="mb-6">
              <p className="text-xs uppercase tracking-widest text-gray-500">
                Financial Information
              </p>

              <h2 className="text-xl font-bold text-white mt-1">
                Rental Charges
              </h2>
            </div>

            <div className="space-y-3">

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  Rental Energy
                </span>

                <span className="text-sm text-white font-medium">
                  KES {currentRental.rentalEnergy.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  Rental Time
                </span>

                <span className="text-sm text-white font-medium">
                  KES {currentRental.rentalTime.toLocaleString()}
                </span>
              </div>

              <div className="border-t border-gray-800 pt-4 flex justify-between items-center">
                <span className="text-base font-semibold text-white">
                  Current Total
                </span>

                <span className="text-2xl font-bold text-indigo-400">
                  KES {currentRental.totalAmount.toLocaleString()}
                </span>
              </div>

            </div>

          </div>
        )}

        {/* Last rental */}
        {lastRental && (
          <div className="rounded-3xl bg-gray-900/80 border border-gray-800 p-6">

            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500">
                  Previous Rental
                </p>

                <h2 className="text-xl font-bold text-white mt-1">
                  Last Rental
                </h2>
              </div>

              <span className="text-xs text-gray-500">
                Rental History
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              <div className="rounded-2xl bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500">
                  Renter
                </p>

                <p className="text-sm text-white font-semibold mt-1">
                  {lastRental.renterName}
                </p>
              </div>

              <div className="rounded-2xl bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500">
                  Started
                </p>

                <p className="text-sm text-white font-semibold mt-1">
                  {formatDate(lastRental.startTime)}
                </p>
              </div>

              <div className="rounded-2xl bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500">
                  Returned
                </p>

                <p className="text-sm text-white font-semibold mt-1">
                  {formatDate(lastRental.endTime)}
                </p>
              </div>

              <div className="rounded-2xl bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500">
                  Amount
                </p>

                <p className="text-lg text-emerald-400 font-bold mt-1">
                  KES {lastRental.amount.toLocaleString()}
                </p>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default RentalBatteryDetails;