import React, { useEffect, useState } from 'react';
import {
  Battery,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

interface VerifyRentalReturnProps {
  batteryId: string;
  onVerified: () => void;
  onRetry: () => void;
}

const VerifyRentalReturn: React.FC<VerifyRentalReturnProps> = ({
  batteryId,
  onVerified,
  onRetry,
}) => {
  const [status, setStatus] = useState<
    'verifying' | 'correct' | 'incorrect'
  >('verifying');

  /*
   * TEMPORARY MOCK VERIFICATION
   *
   * Replace this timeout with your backend verification call.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus('correct');
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  /* =========================
     VERIFYING STATE
  ========================= */
  if (status === 'verifying') {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl text-center animate-fade-in">

          {/* Loader */}
          <div className="relative inline-flex mb-7">

            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full scale-150" />

            <div className="relative w-24 h-24 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <Loader2
                size={46}
                strokeWidth={1.8}
                className="text-indigo-400 animate-spin"
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              VERIFYING RETURN
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Checking your battery
          </h1>

          <p className="text-gray-400 mt-3 max-w-md mx-auto leading-relaxed">
            The station is verifying that the returned battery
            matches the one issued to you.
          </p>

          {/* Battery Being Checked */}
          <div className="mt-8 bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden text-left shadow-xl">

            <div className="p-6">

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Battery
                    size={24}
                    className="text-indigo-400"
                  />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                    Battery being checked
                  </p>

                  <p className="text-xl font-bold text-white mt-1">
                    {batteryId}
                  </p>
                </div>
              </div>

              {/* Verification steps */}
              <div className="mt-6 space-y-3">

                <VerificationStep
                  label="Battery detected"
                  active
                />

                <VerificationStep
                  label="Checking battery identity"
                  active
                />

                <VerificationStep
                  label="Confirming rental session"
                  active
                />

              </div>
            </div>

            {/* Security */}
            <div className="px-6 py-4 bg-gray-800/30 border-t border-gray-800 flex items-center gap-3">
              <ShieldCheck
                size={18}
                className="text-emerald-400"
              />

              <p className="text-xs text-gray-500">
                Do not remove the battery while verification is in progress.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================
     INCORRECT BATTERY
  ========================= */
  if (status === 'incorrect') {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl text-center animate-fade-in">

          {/* Error Icon */}
          <div className="relative inline-flex mb-6">

            <div className="absolute inset-0 bg-red-500/10 blur-2xl rounded-full scale-150" />

            <div className="relative w-24 h-24 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <XCircle
                size={48}
                strokeWidth={1.8}
                className="text-red-400"
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold tracking-wider">
              <CircleAlert size={14} />
              VERIFICATION FAILED
            </span>
          </div>

          <h1 className="text-3xl font-bold text-white">
            Incorrect battery
          </h1>

          <p className="text-gray-400 mt-3 max-w-md mx-auto leading-relaxed">
            The battery detected by the station does not match
            the rental battery issued to you.
          </p>

          {/* Expected Battery */}
          <div className="mt-8 bg-gray-900 border border-gray-800 rounded-3xl p-6 text-left">

            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
              Expected rental battery
            </p>

            <div className="flex items-center gap-3 mt-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Battery
                  size={22}
                  className="text-indigo-400"
                />
              </div>

              <div>
                <p className="text-lg font-bold text-white">
                  {batteryId}
                </p>

                <p className="text-xs text-gray-500">
                  Battery issued for this session
                </p>
              </div>
            </div>

            {/* Warning */}
            <div className="mt-5 rounded-2xl bg-red-500/5 border border-red-500/20 p-4">
              <div className="flex gap-3">

                <CircleAlert
                  size={19}
                  className="text-red-400 shrink-0 mt-0.5"
                />

                <div>
                  <p className="text-sm font-semibold text-red-300">
                    Please check the battery
                  </p>

                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Remove the incorrect battery and return the
                    rental battery assigned to this session.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Retry */}
          <button
            onClick={onRetry}
            className="
              group
              w-full
              mt-7
              flex
              items-center
              justify-center
              gap-3
              bg-indigo-600
              hover:bg-indigo-500
              active:bg-indigo-700
              text-white
              font-bold
              py-4
              px-6
              rounded-2xl
              transition-all
              duration-200
              shadow-lg
              shadow-indigo-600/20
            "
          >
            <RefreshCcw
              size={20}
              className="transition-transform duration-300 group-hover:rotate-180"
            />

            <span>Try Verification Again</span>
          </button>

          <p className="text-xs text-gray-600 mt-4">
            Make sure the correct rental battery is inserted into the station.
          </p>
        </div>
      </div>
    );
  }

  /* =========================
     SUCCESS STATE
  ========================= */
  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl text-center animate-fade-in">

        {/* Success Icon */}
        <div className="relative inline-flex mb-6">

          <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full scale-150" />

          <div className="relative w-24 h-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2
              size={50}
              strokeWidth={1.8}
              className="text-emerald-400"
            />
          </div>
        </div>

        {/* Status */}
        <div className="flex justify-center mb-4">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wider">
            <CheckCircle2 size={14} />
            BATTERY VERIFIED
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white">
          Battery returned successfully
        </h1>

        <p className="text-gray-400 mt-3 max-w-md mx-auto leading-relaxed">
          The rental battery has been verified and your return
          has been recorded successfully.
        </p>

        {/* Verified Battery Card */}
        <div className="mt-8 bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden text-left shadow-2xl">

          <div className="p-6">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Battery
                    size={24}
                    className="text-emerald-400"
                  />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                    Returned battery
                  </p>

                  <p className="text-xl font-bold text-white mt-1">
                    {batteryId}
                  </p>
                </div>
              </div>

              <CheckCircle2
                size={25}
                className="text-emerald-400"
              />
            </div>

            {/* Verification Results */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">

              <Result
                title="Identity"
                value="Verified"
              />

              <Result
                title="Session"
                value="Matched"
              />

              <Result
                title="Return"
                value="Accepted"
              />

            </div>
          </div>

          {/* Success Message */}
          <div className="px-6 py-4 bg-emerald-500/5 border-t border-emerald-500/10">
            <div className="flex gap-3">

              <ShieldCheck
                size={19}
                className="text-emerald-400 shrink-0"
              />

              <div>
                <p className="text-sm font-semibold text-emerald-300">
                  Return confirmed
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Your rental return has been successfully recorded.
                  You can now continue to the next step.
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Continue */}
        <button
          onClick={onVerified}
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
          "
        >
          <span>Continue</span>

          <ChevronRight
            size={21}
            className="transition-transform duration-200 group-hover:translate-x-1"
          />
        </button>

        <p className="text-xs text-gray-600 mt-4">
          Your rental return has been successfully processed.
        </p>
      </div>
    </div>
  );
};

/* =========================
   VERIFICATION STEP
========================= */

const VerificationStep = ({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) => {
  return (
    <div className="flex items-center gap-3">

      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center ${active
            ? 'bg-indigo-500/10 text-indigo-400'
            : 'bg-gray-800 text-gray-600'
          }`}
      >
        {active ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
        )}
      </div>

      <span
        className={`text-sm ${active ? 'text-gray-300' : 'text-gray-600'
          }`}
      >
        {label}
      </span>
    </div>
  );
};

/* =========================
   RESULT
========================= */

const Result = ({
  title,
  value,
}: {
  title: string;
  value: string;
}) => {
  return (
    <div className="rounded-xl bg-gray-800/60 border border-gray-700/50 p-3">
      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
        {title}
      </p>

      <div className="flex items-center gap-1.5 mt-1">
        <CheckCircle2
          size={13}
          className="text-emerald-400"
        />

        <p className="text-sm font-semibold text-emerald-400">
          {value}
        </p>
      </div>
    </div>
  );
};

export default VerifyRentalReturn;