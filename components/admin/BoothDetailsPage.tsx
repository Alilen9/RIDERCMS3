import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  ShieldCheck,
  BatteryCharging,
  Wifi,
  Zap,
  Circle,
  Clock3,
  Cpu,
} from 'lucide-react';

/* ================= TYPES ================= */

interface BoothData {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'offline' | 'maintenance';
  swapsToday: number;
  totalSwaps: number;
  successRate: string;
  revenue: string;
  slots: {
    id: number;
    status: 'active' | 'charging' | 'empty';
  }[];
  systemHealth: {
    network: string;
    power: string;
    payments: string;
    security: string;
    temperature: string;
  };
  configuration: {
    software: string;
    hardware: string;
    slots: string;
    mode: string;
    network: string;
    access: string;
  };
  feed: {
    text: string;
    time: string;
  }[];
}

/* ================= PAGE ================= */

const BoothDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { boothUid } = useParams<{ boothUid: string }>();

  const [loading, setLoading] = useState(true);
  const [booth, setBooth] = useState<BoothData | null>(null);

  /* ================= FETCH ================= */

  useEffect(() => {
    const fetchBooth = async () => {
      setLoading(true);

      // Simulated API request
      setTimeout(() => {
        const fakeData: BoothData = {
          id:
            boothUid ||
            '672a4e90-146b-4fbb-a48d-ec768f28dd70',

          name: 'RIDER Swap Station Alpha',
          location: 'Westlands • Nairobi • Kenya',
          status: 'active',

          swapsToday: 18,
          totalSwaps: 247,
          successRate: '98.4%',
          revenue: 'Ksh 12,400',

          slots: Array.from({ length: 12 }).map((_, i) => ({
            id: i + 1,
            status:
              i < 5
                ? 'active'
                : i < 9
                  ? 'charging'
                  : 'empty',
          })),

          systemHealth: {
            network: 'Stable',
            power: 'Optimal',
            payments: 'Online',
            security: 'Protected',
            temperature: '32°C',
          },

          configuration: {
            software: 'v2.1.4',
            hardware: 'HW-3.2',
            slots: '12',
            mode: 'Auto',
            network: '4G LTE',
            access: 'Secure',
          },

          feed: [
            {
              text: 'Battery swapped successfully',
              time: 'now',
            },
            {
              text: 'M-PESA payment confirmed',
              time: '1m ago',
            },
            {
              text: 'Slot 4 activated',
              time: '2m ago',
            },
            {
              text: 'System heartbeat OK',
              time: '5m ago',
            },
          ],
        };

        setBooth(fakeData);
        setLoading(false);
      }, 1200);
    };

    fetchBooth();
  }, [boothUid]);

  /* ================= LOADING ================= */

  if (loading || !booth) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-slate-400">
        Loading Booth Details...
      </div>
    );
  }

  /* ================= STATUS ================= */

  const boothStatusStyles = {
    active:
      'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    offline:
      'bg-red-500/10 border-red-500/20 text-red-400',
    maintenance:
      'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200">

      {/* HEADER */}
      <div className="sticky top-0 z-50 border-b border-slate-800 bg-[#070b14]/90 backdrop-blur">

        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">

          <div className="flex items-center gap-4">

            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl border border-slate-700 hover:bg-slate-800 transition"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h1 className="text-xl font-bold text-white">
                Fleet Booth Monitoring
              </h1>

              <p className="text-xs text-slate-400 mt-1">
                Real-time operational intelligence
              </p>
            </div>

          </div>

          <div
            className={`px-3 py-1 rounded-full border text-xs font-bold uppercase flex items-center gap-2 ${boothStatusStyles[booth.status]}`}
          >
            <Circle size={8} className="fill-current" />
            {booth.status}
          </div>

        </div>

      </div>

      {/* BODY */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT */}
        <div className="lg:col-span-8 space-y-6">

          {/* HERO */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-[#0b1220]">

            <img
              src="https://images.unsplash.com/photo-1620216500398-78da1f2d5258?q=80&w=1200"
              className="h-72 w-full object-cover"
              alt="Booth"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30" />

            <div className="absolute bottom-6 left-6">

              <p className="text-xs uppercase tracking-widest text-slate-400">
                Booth Identifier
              </p>

              <h2 className="text-white font-mono text-lg mt-1">
                {booth.id}
              </h2>

              <p className="text-sm text-slate-300 mt-2">
                {booth.location}
              </p>

            </div>

          </div>

          {/* METRICS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            <Metric
              icon={<Activity size={18} />}
              label="Swaps Today"
              value={String(booth.swapsToday)}
            />

            <Metric
              icon={<BatteryCharging size={18} />}
              label="Total Swaps"
              value={String(booth.totalSwaps)}
            />

            <Metric
              icon={<ShieldCheck size={18} />}
              label="Success Rate"
              value={booth.successRate}
            />

            <Metric
              icon={<Zap size={18} />}
              label="Revenue"
              value={booth.revenue}
            />

          </div>

          {/* SLOT GRID */}
          <div className="bg-[#0b1220] border border-slate-800 rounded-3xl p-6">

            <div className="flex items-center justify-between mb-6">

              <div>
                <h3 className="text-white font-semibold">
                  Battery Slot Status
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  Live slot occupancy monitoring
                </p>
              </div>

              <div className="text-xs text-slate-500">
                {booth.slots.length} Slots
              </div>

            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">

              {booth.slots.map((slot) => {
                const styles = {
                  active:
                    'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
                  charging:
                    'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
                  empty:
                    'bg-slate-800 border-slate-700 text-slate-500',
                };

                return (
                  <div
                    key={slot.id}
                    className={`h-14 rounded-2xl border flex items-center justify-center text-sm font-bold transition hover:scale-105 cursor-pointer ${styles[slot.status]}`}
                  >
                    {slot.id}
                  </div>
                );
              })}

            </div>

          </div>

          {/* LIVE FEED */}
          <div className="bg-[#0b1220] border border-slate-800 rounded-3xl p-6">

            <div className="flex items-center gap-2 mb-5">

              <Clock3 size={18} className="text-cyan-400" />

              <h3 className="text-white font-semibold">
                Live Activity Feed
              </h3>

            </div>

            <div className="space-y-5">

              {booth.feed.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-3"
                >
                  <div className="mt-1 w-2 h-2 rounded-full bg-cyan-400" />

                  <div className="flex-1">

                    <p className="text-sm text-slate-200">
                      {item.text}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      {item.time}
                    </p>

                  </div>
                </div>
              ))}

            </div>

          </div>

        </div>

        {/* RIGHT */}
        <div className="lg:col-span-4 space-y-6">

          {/* HEALTH */}
          <div className="bg-[#0b1220] border border-slate-800 rounded-3xl p-6">

            <div className="flex items-center gap-2 mb-6">

              <Wifi size={18} className="text-cyan-400" />

              <h3 className="text-white font-semibold">
                System Health
              </h3>

            </div>

            <div className="space-y-4">

              <StatusCard
                label="Network"
                value={booth.systemHealth.network}
                color="emerald"
              />

              <StatusCard
                label="Power"
                value={booth.systemHealth.power}
                color="emerald"
              />

              <StatusCard
                label="Payments"
                value={booth.systemHealth.payments}
                color="emerald"
              />

              <StatusCard
                label="Security"
                value={booth.systemHealth.security}
                color="emerald"
              />

              <StatusCard
                label="Temperature"
                value={booth.systemHealth.temperature}
                color="yellow"
              />

            </div>

          </div>

          {/* CONFIG */}
          <div className="bg-[#0b1220] border border-slate-800 rounded-3xl p-6">

            <div className="flex items-center gap-2 mb-6">

              <Cpu size={18} className="text-cyan-400" />

              <h3 className="text-white font-semibold">
                Configuration
              </h3>

            </div>

            <div className="grid grid-cols-2 gap-4">

              {Object.entries(booth.configuration).map(
                ([key, value]) => (
                  <ConfigCard
                    key={key}
                    label={key}
                    value={value}
                  />
                )
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

/* ================= COMPONENTS ================= */

const Metric = ({
  icon,
  label,
  value,
}: any) => (
  <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-5">

    <div className="flex items-center justify-between mb-4">

      <span className="text-[10px] uppercase tracking-widest text-slate-500">
        {label}
      </span>

      <div className="text-cyan-400">
        {icon}
      </div>

    </div>

    <p className="text-2xl font-bold text-white">
      {value}
    </p>

  </div>
);

const StatusCard = ({
  label,
  value,
  color,
}: any) => {
  const colors: any = {
    emerald:
      'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
    yellow:
      'text-yellow-400 border-yellow-500/20 bg-yellow-500/5',
  };

  return (
    <div
      className={`p-4 rounded-2xl border flex items-center justify-between ${colors[color]}`}
    >
      <span className="text-sm text-slate-300">
        {label}
      </span>

      <span className="text-sm font-semibold">
        {value}
      </span>
    </div>
  );
};

const ConfigCard = ({
  label,
  value,
}: any) => (
  <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/30">

    <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
      {label}
    </p>

    <p className="text-sm font-semibold text-white capitalize">
      {value}
    </p>

  </div>
);

export default BoothDetailsPage;