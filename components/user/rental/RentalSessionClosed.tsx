import React from 'react';
import {
  CheckCircle2,
  BatteryCharging,
  Clock3,
  Receipt,
  ArrowRight,
  Home,
} from 'lucide-react';

interface RentalSessionClosedProps {
  onDone: () => void;
}

const RentalSessionClosed: React.FC<RentalSessionClosedProps> = ({
  onDone,
}) => {
  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">

        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl scale-150" />

            <div className="relative w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle2
                  size={38}
                  strokeWidth={2.5}
                  className="text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wider mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            SESSION COMPLETED
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            You're all done!
          </h1>

          <p className="text-gray-400 mt-3 max-w-md mx-auto leading-relaxed">
            Your battery rental and charging session have been
            successfully completed.
          </p>
        </div>

        {/* Completion Card */}
        <div className="mt-8 bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">

          {/* Card Header */}
          <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                Session status
              </p>

              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-white font-semibold">
                  Completed successfully
                </span>
              </div>
            </div>

            <div className="w-11 h-11 rounded-xl bg-gray-800 flex items-center justify-center">
              <Receipt size={21} className="text-gray-300" />
            </div>
          </div>

          {/* Summary */}
          <div className="p-6">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Charging */}
              <div className="rounded-2xl bg-gray-800/60 border border-gray-700/60 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <BatteryCharging
                      size={20}
                      className="text-blue-400"
                    />
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Charging
                    </p>
                    <p className="text-white font-semibold mt-0.5">
                      Completed
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-400 mt-4">
                  Your own battery is ready for collection.
                </p>
              </div>

              {/* Rental */}
              <div className="rounded-2xl bg-gray-800/60 border border-gray-700/60 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Clock3
                      size={20}
                      className="text-purple-400"
                    />
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Rental
                    </p>
                    <p className="text-white font-semibold mt-0.5">
                      Returned
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-400 mt-4">
                  Rental battery successfully returned.
                </p>
              </div>
            </div>

            {/* Final message */}
            <div className="mt-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-5">
              <div className="flex gap-3">
                <CheckCircle2
                  size={21}
                  className="text-emerald-400 shrink-0 mt-0.5"
                />

                <div>
                  <p className="text-emerald-400 font-semibold">
                    Transaction complete
                  </p>

                  <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                    Your rental, charging and payment records have
                    been successfully processed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6">

          <button
            onClick={onDone}
            className="
              group
              w-full
              flex
              items-center
              justify-center
              gap-3
              bg-emerald-500
              hover:bg-emerald-400
              active:bg-emerald-600
              text-white
              font-bold
              py-4
              px-6
              rounded-2xl
              transition-all
              duration-200
              shadow-lg
              shadow-emerald-500/20
              hover:shadow-emerald-500/30
            "
          >
            <Home size={20} />

            <span>Back to Dashboard</span>

            <ArrowRight
              size={20}
              className="
                transition-transform
                duration-200
                group-hover:translate-x-1
              "
            />
          </button>

          <p className="text-center text-xs text-gray-600 mt-4">
            Thank you for using RIDERCMS
          </p>
        </div>
      </div>
    </div>
  );
};

export default RentalSessionClosed;