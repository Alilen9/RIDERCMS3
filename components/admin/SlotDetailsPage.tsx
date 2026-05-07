import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Circle } from 'lucide-react';

const SlotDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { slotIdentifier } = useParams<{ slotIdentifier: string }>();

  const id = slotIdentifier || 'slot-002';

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200">

      {/* HEADER */}
      <div className="border-b border-slate-800 bg-[#070b14]/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg border border-slate-700 hover:bg-slate-800"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h1 className="text-lg font-semibold text-white">
                Slot Control Panel
              </h1>
              <p className="text-xs text-slate-400">
                Real-time battery slot intelligence
              </p>
            </div>
          </div>

          <span className="px-3 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-2">
            <Circle size={8} className="fill-emerald-400" />
            ACTIVE
          </span>

        </div>
      </div>

      {/* BODY */}
      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT */}
        <div className="lg:col-span-8 space-y-6">

          {/* SLOT HERO */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-[#0b1220]">

            <div className="h-56 flex items-center justify-center relative">

              {/* Slot core visualization */}
              <div className="w-44 h-44 rounded-2xl border border-slate-700 bg-slate-900 flex flex-col items-center justify-center relative">

                <div className="absolute top-3 w-28 h-1 bg-emerald-500 rounded-full shadow-[0_0_12px_#10b981]" />
                <div className="absolute bottom-3 w-28 h-1 bg-emerald-500 rounded-full shadow-[0_0_12px_#10b981]" />

                <div className="text-4xl font-black text-slate-700">
                  {id.split('-').pop()}
                </div>

                <p className="text-xs text-slate-500 mt-2">
                  SLOT STATUS: AVAILABLE
                </p>

              </div>
            </div>

          </div>

          {/* METRICS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            <Metric label="Uptime" value="99.9%" />
            <Metric label="Cycles" value="247" />
            <Metric label="Health" value="Good" />
            <Metric label="Temperature" value="32°C" />

          </div>

          {/* SPECIFICATIONS */}
          <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-5">

            <h3 className="text-xs uppercase text-slate-500 mb-5 tracking-widest">
              Slot Specifications
            </h3>

            <div className="space-y-3">
              <Spec label="Type" value="Battery Slot" />
              <Spec label="Capacity" value="2.0kWh - 3.0kWh" />
              <Spec label="Max Weight" value="15kg" />
              <Spec label="Position" value="Column 1 • Row 2" />
              <Spec label="Connection" value="RIDER Protocol v2" />
            </div>

          </div>

        </div>

        {/* RIGHT */}
        <div className="lg:col-span-4 space-y-6">

          {/* STATUS PANEL */}
          <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-5">

            <h3 className="text-xs uppercase text-slate-500 mb-4 tracking-widest">
              Live Status
            </h3>

            <div className="space-y-3">

              <Status label="Slot State" value="Available" color="emerald" />
              <Status label="Battery" value="Empty" color="slate" />
              <Status label="Lock System" value="Ready" color="emerald" />
              <Status label="Power Flow" value="Idle" color="yellow" />

            </div>

          </div>

          {/* ACTIVITY LOG */}
          <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-5">

            <h3 className="text-xs uppercase text-slate-500 mb-4 tracking-widest">
              Activity Log
            </h3>

            <div className="space-y-3 text-sm">

              <Log text="Slot initialized" time="now" />
              <Log text="System check passed" time="2m ago" />
              <Log text="Battery removed" time="5m ago" />

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

/* ================= COMPONENTS ================= */

const Metric = ({ label, value }: any) => (
  <div className="p-4 rounded-xl border border-slate-800 bg-[#0b1220]">
    <p className="text-[10px] uppercase text-slate-500">{label}</p>
    <p className="text-lg font-semibold text-white mt-1">{value}</p>
  </div>
);

const Spec = ({ label, value }: any) => (
  <div className="flex justify-between border-b border-slate-800/40 pb-2 text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="text-slate-200 font-medium">{value}</span>
  </div>
);

const Status = ({ label, value, color }: any) => {
  const colors: any = {
    emerald: "text-emerald-400",
    yellow: "text-yellow-400",
    slate: "text-slate-400",
  };

  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className={`font-semibold ${colors[color]}`}>{value}</span>
    </div>
  );
};

const Log = ({ text, time }: any) => (
  <div className="flex justify-between">
    <span className="text-slate-300">{text}</span>
    <span className="text-slate-500 text-xs">{time}</span>
  </div>
);

export default SlotDetailsPage;