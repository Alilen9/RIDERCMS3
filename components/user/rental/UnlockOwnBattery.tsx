import React from 'react';
import {
  Battery,
  CheckCircle2,
  ChevronRight,
  LockKeyholeOpen,
  MapPin,
  ShieldCheck,
} from 'lucide-react';

interface UnlockOwnBatteryProps {
  slotIdentifier: string;
  onUnlock: () => void;
}

const UnlockOwnBattery: React.FC<UnlockOwnBatteryProps> = ({
  slotIdentifier,
  onUnlock,
}) => {
  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl animate-fade-in">

        {/* Success / Unlock Icon */}
        <div className="text-center">

          <div className="relative inline-flex mb-6">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl scale-150" />

            <div className="relative w-24 h-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <LockKeyholeOpen
                size={46}
                strokeWidth={1.8}
                className="text-emerald-400"
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wider">
              <CheckCircle2 size={14} />
              PAYMENT CONFIRMED
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Your battery is ready
          </h1>

          <p className="text-gray-400 mt-3 max-w-md mx-auto leading-relaxed">
            Your payment has been confirmed. Your own battery is
            ready for collection.
          </p>
        </div>

        {/* Battery Collection Card */}
        <div className="mt-8 rounded-3xl bg-gray-900 border border-gray-800 overflow-hidden shadow-2xl">

          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">

            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                Your battery
              </p>

              <div className="flex items-center gap-2 mt-1">
                <Battery
                  size={18}
                  className="text-emerald-400"
                />

                <span className="text-xl font-bold text-white">
                  Ready for collection
                </span>
              </div>
            </div>

            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2
                size={22}
                className="text-emerald-400"
              />
            </div>
          </div>

          {/* Slot */}
          <div className="p-6">

            <div className="rounded-2xl bg-gray-800/60 border border-gray-700/60 p-5">

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <MapPin
                    size={20}
                    className="text-indigo-400"
                  />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                    Battery slot
                  </p>

                  <p className="text-2xl font-bold text-white mt-0.5">
                    {slotIdentifier}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-700/60 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />

                <span className="text-sm text-gray-400">
                  Slot is ready to unlock
                </span>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-4">
              <div className="flex gap-3">
                <ShieldCheck
                  size={20}
                  className="text-emerald-400 shrink-0 mt-0.5"
                />

                <div>
                  <p className="text-sm font-semibold text-emerald-300">
                    Secure collection
                  </p>

                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Unlocking this slot will release the battery assigned
                    to your completed charging session.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action */}
        <button
          onClick={onUnlock}
          className="
            group
            w-full
            mt-7
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
          <LockKeyholeOpen size={21} />

          <span>Unlock My Battery</span>

          <ChevronRight
            size={21}
            className="transition-transform duration-200 group-hover:translate-x-1"
          />
        </button>

        <p className="text-center text-xs text-gray-600 mt-4">
          The cabinet will unlock the assigned battery slot.
        </p>

      </div>
    </div>
  );
};

export default UnlockOwnBattery;