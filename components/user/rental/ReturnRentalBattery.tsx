import React from 'react';
import {
  Battery,
  CheckCircle2,
  ChevronRight,
  DoorClosed,
  PlugZap,
  ShieldCheck,
} from 'lucide-react';

interface ReturnRentalBatteryProps {
  batteryId: string;
  onContinue: () => void;
}

const ReturnRentalBattery: React.FC<ReturnRentalBatteryProps> = ({
  batteryId,
  onContinue,
}) => {
  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl animate-fade-in">

        {/* =========================
            HEADER
        ========================== */}
        <div className="text-center">

          {/* Battery Icon */}
          <div className="relative inline-flex mb-6">
            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full scale-150" />

            <div className="relative w-24 h-24 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <Battery
                size={48}
                strokeWidth={1.8}
                className="text-indigo-400"
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              RETURN BATTERY
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Return your rental battery
          </h1>

          <p className="text-gray-400 mt-3 max-w-md mx-auto leading-relaxed">
            Place the rental battery back into the station so we
            can verify and complete your rental session.
          </p>
        </div>

        {/* =========================
            BATTERY CARD
        ========================== */}
        <div className="mt-8 rounded-3xl bg-gray-900 border border-gray-800 overflow-hidden shadow-xl">

          <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">

            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                Rental battery
              </p>

              <p className="text-xl font-bold text-white mt-1">
                {batteryId}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Battery
                size={22}
                className="text-indigo-400"
              />
            </div>
          </div>

          {/* Current Status */}
          <div className="px-6 py-4 bg-gray-800/30 flex items-center gap-3">

            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
              <ShieldCheck
                size={17}
                className="text-amber-400"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-white">
                Awaiting return
              </p>

              <p className="text-xs text-gray-500 mt-0.5">
                Return this battery to the station
              </p>
            </div>
          </div>
        </div>

        {/* =========================
            INSTRUCTIONS
        ========================== */}
        <div className="mt-7">

          <div className="flex items-center justify-between mb-4">

            <div>
              <h3 className="text-lg font-bold text-white">
                How to return
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Follow these four simple steps
              </p>
            </div>

            <span className="text-xs font-medium text-gray-600">
              4 STEPS
            </span>
          </div>

          <div className="space-y-3">

            <Instruction
              number="01"
              icon={<Battery size={19} />}
              title="Insert the battery"
              text="Place the rental battery securely into the cabinet."
            />

            <Instruction
              number="02"
              icon={<PlugZap size={19} />}
              title="Connect the plug"
              text="Connect the charging plug to the battery."
            />

            <Instruction
              number="03"
              icon={<DoorClosed size={19} />}
              title="Close the cabinet"
              text="Make sure the cabinet door is properly closed."
            />

            <Instruction
              number="04"
              icon={<ShieldCheck size={19} />}
              title="Wait for verification"
              text="The station will automatically verify the returned battery."
              last
            />

          </div>
        </div>

        {/* =========================
            IMPORTANT WARNING
        ========================== */}
        <div className="mt-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 p-4">

          <div className="flex gap-3">

            <ShieldCheck
              size={20}
              className="text-amber-400 shrink-0 mt-0.5"
            />

            <div>
              <p className="text-sm font-semibold text-amber-300">
                Keep the cabinet closed
              </p>

              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                After inserting the battery, keep the cabinet closed
                until the station finishes verification.
              </p>
            </div>

          </div>
        </div>

        {/* =========================
            BATTERY MATCH NOTICE
        ========================== */}
        <div className="mt-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 p-4">

          <div className="flex gap-3">

            <CheckCircle2
              size={20}
              className="text-indigo-400 shrink-0 mt-0.5"
            />

            <div>
              <p className="text-sm font-semibold text-indigo-300">
                Return the same battery
              </p>

              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Make sure the battery you're returning matches the
                rental battery ID shown above.
              </p>
            </div>

          </div>
        </div>

        {/* =========================
            ACTION
        ========================== */}
        <button
          onClick={onContinue}
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
            hover:shadow-indigo-600/30
          "
        >
          <ShieldCheck size={20} />

          <span>Verify Returned Battery</span>

          <ChevronRight
            size={20}
            className="transition-transform duration-200 group-hover:translate-x-1"
          />
        </button>

        <p className="text-center text-xs text-gray-600 mt-4">
          Verification will confirm that the correct rental battery
          has been returned.
        </p>
      </div>
    </div>
  );
};

/* =========================
   INSTRUCTION COMPONENT
========================= */

interface InstructionProps {
  number: string;
  icon: React.ReactNode;
  title: string;
  text: string;
  last?: boolean;
}

const Instruction: React.FC<InstructionProps> = ({
  number,
  icon,
  title,
  text,
  last = false,
}) => {
  return (
    <div className="relative">

      {/* Connector */}
      {!last && (
        <div className="absolute left-[22px] top-[52px] bottom-[-12px] w-px bg-gray-800" />
      )}

      <div className="relative flex gap-4 p-4 rounded-2xl bg-gray-900/70 border border-gray-800 hover:border-gray-700 transition-colors">

        {/* Icon */}
        <div className="shrink-0">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            {icon}
          </div>
        </div>

        {/* Content */}
        <div className="pt-0.5">

          <div className="flex items-center gap-2">

            <span className="text-[10px] font-bold tracking-wider text-indigo-400">
              {number}
            </span>

            <h4 className="text-sm font-semibold text-white">
              {title}
            </h4>

          </div>

          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            {text}
          </p>

        </div>
      </div>
    </div>
  );
};

export default ReturnRentalBattery;