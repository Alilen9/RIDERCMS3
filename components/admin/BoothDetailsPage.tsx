import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BoothDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { boothUid } = useParams<{ boothUid: string }>();

  const id =
    boothUid || '672a4e90-146b-4fbb-a48d-ec768f28dd70';

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200">

      {/* HEADER */}
      <div className="border-b border-slate-800 bg-[#070b14]/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg border border-slate-700 hover:bg-slate-800"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h1 className="text-lg font-semibold text-white">
                Fleet Booth Monitoring
              </h1>
              <p className="text-xs text-slate-400">
                Real-time operational intelligence
              </p>
            </div>
          </div>

          <span className="px-3 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ● LIVE
          </span>

        </div>
      </div>

      {/* BODY */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT SIDE */}
        <div className="lg:col-span-8 space-y-6">

          {/* HERO */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800">

            <img
              src="https://images.unsplash.com/photo-1620216500398-78da1f2d5258"
              className="h-60 w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30" />

            <div className="absolute bottom-4 left-4">
              <p className="text-xs text-slate-400 uppercase">
                Booth ID
              </p>
              <p className="text-white font-mono text-sm">{id}</p>
              <p className="text-xs text-slate-400 mt-1">
                Westlands • Nairobi • Kenya
              </p>
            </div>

            <div className="absolute top-3 right-3">
              <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>

          </div>

          {/* METRICS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            <Metric label="Swaps Today" value="18" />
            <Metric label="Total Swaps" value="247" />
            <Metric label="Success Rate" value="98.4%" />
            <Metric label="Revenue" value="Ksh 0" />

          </div>

          {/* SLOT GRID */}
          <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-5">

            <h3 className="text-sm text-slate-400 uppercase mb-4">
              Battery Slot Status
            </h3>

            <div className="grid grid-cols-6 gap-3">

              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-12 rounded-lg border flex items-center justify-center text-xs font-bold
                  ${i < 6
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : i < 9
                        ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}
                >
                  {i + 1}
                </div>
              ))}

            </div>

          </div>

          {/* LIVE FEED */}
          <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-5">

            <h3 className="text-sm text-slate-400 uppercase mb-4">
              Live System Feed
            </h3>

            <div className="space-y-3">
              <Feed text="Battery swapped successfully" time="now" />
              <Feed text="M-PESA payment confirmed" time="1m ago" />
              <Feed text="Slot 4 activated" time="2m ago" />
              <Feed text="System heartbeat OK" time="5m ago" />
            </div>

          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="lg:col-span-4 space-y-6">

          {/* SYSTEM HEALTH */}
          <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-5">

            <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-5">
              System Health
            </h3>

            <div className="space-y-3">

              <Status label="Network Connection" level="good" />
              <Status label="Power Supply" level="good" />
              <Status label="Payment System" level="good" />
              <Status label="Security System" level="good" />
              <Status label="Temperature" level="warning" />

            </div>

          </div>

          {/* CONFIGURATION */}
          <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-5">

            <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-5">
              System Configuration
            </h3>

            <div className="grid grid-cols-2 gap-3">

              <Tile label="Software" value="v2.1.4" />
              <Tile label="Hardware" value="HW-3.2" />
              <Tile label="Slots" value="12" />
              <Tile label="Mode" value="Auto" />
              <Tile label="Network" value="4G LTE" />
              <Tile label="Access" value="Secure" />

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
    <p className="text-[10px] text-slate-500 uppercase">{label}</p>
    <p className="text-lg font-semibold text-white mt-1">{value}</p>
  </div>
);

const Tile = ({ label, value }: any) => (
  <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/20 h-[70px] flex flex-col justify-center">
    <p className="text-[10px] uppercase text-slate-500 tracking-wider">
      {label}
    </p>
    <p className="text-sm font-semibold text-white mt-1">
      {value}
    </p>
  </div>
);

const Status = ({ label, level }: any) => {
  const styles: any = {
    good: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
    warning: "text-yellow-400 border-yellow-500/20 bg-yellow-500/5",
    bad: "text-red-400 border-red-500/20 bg-red-500/5",
  };

  const dot: any = {
    good: "bg-emerald-400",
    warning: "bg-yellow-400",
    bad: "bg-red-400",
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border ${styles[level]}`}>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dot[level]}`} />
        <span className="text-sm text-slate-200">{label}</span>
      </div>

      <span className="text-xs font-bold uppercase">
        {level}
      </span>
    </div>
  );
};

const Feed = ({ text, time }: any) => (
  <div className="flex justify-between text-sm">
    <span className="text-slate-300">{text}</span>
    <span className="text-slate-500 text-xs">{time}</span>
  </div>
);

export default BoothDetailsPage;