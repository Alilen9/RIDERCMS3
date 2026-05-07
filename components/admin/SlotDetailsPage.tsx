import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Circle,
  BatteryCharging,
  Cpu,
  Activity,
  ShieldCheck,
  Zap,
  Thermometer,
  Clock3,
} from 'lucide-react';

/* ================= TYPES ================= */

interface SlotData {
  id: string;
  status: 'available' | 'occupied' | 'charging';
  batteryStatus: string;
  uptime: string;
  cycles: number;
  health: string;
  temperature: string;
  lockSystem: string;
  powerFlow: string;
  type: string;
  capacity: string;
  maxWeight: string;
  position: string;
  protocol: string;
  logs: {
    text: string;
    time: string;
  }[];
}

/* ================= PAGE ================= */

const SlotDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { slotIdentifier } = useParams<{ slotIdentifier: string }>();

  const [loading, setLoading] = useState(true);
  const [slot, setSlot] = useState<SlotData | null>(null);

  /* ================= FETCH SLOT ================= */

  useEffect(() => {
    const fetchSlot = async () => {
      setLoading(true);

      // Simulated API request
      setTimeout(() => {
        const fakeApiData: SlotData = {
          id: slotIdentifier || 'slot-002',
          status: 'available',
          batteryStatus: 'Empty',
          uptime: '99.9%',
          cycles: 247,
          health: 'Excellent',
          temperature: '32°C',
          lockSystem: 'Ready',
          powerFlow: 'Idle',
          type: 'Battery Slot',
          capacity: '2.0kWh - 3.0kWh',
          maxWeight: '15kg',
          position: 'Column 1 • Row 2',
          protocol: 'RIDER Protocol v2',
          logs: [
            {
              text: 'Slot initialized',
              time: 'now',
            },
            {
              text: 'System diagnostics passed',
              time: '2m ago',
            },
            {
              text: 'Battery removed',
              time: '5m ago',
            },
            {
              text: 'Charging cycle completed',
              time: '12m ago',
            },
          ],
        };

        setSlot(fakeApiData);
        setLoading(false);
      }, 1000);
    };

    fetchSlot();
  }, [slotIdentifier]);

  /* ================= LOADING ================= */

  if (loading || !slot) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-slate-400">
        Loading Slot Details...
      </div>
    );
  }

  /* ================= STATUS COLOR ================= */

  const statusStyles = {
    available:
      'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    occupied:
      'bg-red-500/10 border-red-500/20 text-red-400',
    charging:
      'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200">

      {/* HEADER */}
      <div className="border-b border-slate-800 bg-[#070b14]/90 backdrop-blur sticky top-0 z-50">
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
                Slot Control Center
              </h1>

              <p className="text-xs text-slate-400 mt-1">
                Real-time slot monitoring & diagnostics
              </p>
            </div>

          </div>

          <div
            className={`px-3 py-1 rounded-full border text-xs font-bold uppercase flex items-center gap-2 ${statusStyles[slot.status]}`}
          >
            <Circle
              size={8}
              className={`fill-current`}
            />
            {slot.status}
          </div>

        </div>
      </div>

      {/* BODY */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT SIDE */}
        <div className="lg:col-span-8 space-y-6">

          {/* HERO */}
          <div className="bg-[#0b1220] border border-slate-800 rounded-3xl overflow-hidden">

            <div className="relative h-[320px] flex items-center justify-center">

              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent" />

              {/* SLOT MACHINE */}
              <div className="relative w-64 h-64 rounded-3xl border border-slate-700 bg-[#111827] flex flex-col items-center justify-center shadow-2xl">

                <div className="absolute top-4 w-36 h-1 rounded-full bg-emerald-500 shadow-[0_0_20px_#10b981]" />

                <div className="absolute bottom-4 w-36 h-1 rounded-full bg-emerald-500 shadow-[0_0_20px_#10b981]" />

                <BatteryCharging
                  className="text-emerald-400 mb-4"
                  size={50}
                />

                <div className="text-5xl font-black text-slate-700">
                  {slot.id.split('-').pop()}
                </div>

                <p className="text-xs tracking-widest uppercase text-slate-500 mt-4">
                  Slot Operational
                </p>

              </div>

            </div>

            {/* SLOT FOOTER */}
            <div className="border-t border-slate-800 px-6 py-4 flex justify-between items-center">

              <div>
                <p className="text-xs uppercase text-slate-500">
                  Slot Identifier
                </p>

                <p className="font-mono text-cyan-400 text-sm">
                  {slot.id}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs uppercase text-slate-500">
                  Battery Status
                </p>

                <p className="text-sm font-semibold text-white">
                  {slot.batteryStatus}
                </p>
              </div>

            </div>

          </div>

          {/* METRICS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            <Metric
              icon={<Activity size={18} />}
              label="Uptime"
              value={slot.uptime}
            />

            <Metric
              icon={<Zap size={18} />}
              label="Cycles"
              value={String(slot.cycles)}
            />

            <Metric
              icon={<ShieldCheck size={18} />}
              label="Health"
              value={slot.health}
            />

            <Metric
              icon={<Thermometer size={18} />}
              label="Temperature"
              value={slot.temperature}
            />

          </div>

          {/* SLOT SPECS */}
          <div className="bg-[#0b1220] border border-slate-800 rounded-3xl p-6">

            <div className="flex items-center gap-3 mb-6">
              <Cpu className="text-cyan-400" size={20} />

              <h3 className="text-white font-semibold">
                Slot Specifications
              </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-4">

              <SpecCard label="Slot Type" value={slot.type} />
              <SpecCard label="Capacity" value={slot.capacity} />
              <SpecCard label="Max Weight" value={slot.maxWeight} />
              <SpecCard label="Position" value={slot.position} />
              <SpecCard label="Protocol" value={slot.protocol} />
              <SpecCard label="Power Flow" value={slot.powerFlow} />

            </div>

          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="lg:col-span-4 space-y-6">

          {/* LIVE STATUS */}
          <div className="bg-[#0b1220] border border-slate-800 rounded-3xl p-6">

            <h3 className="text-white font-semibold mb-5">
              Live Status
            </h3>

            <div className="space-y-4">

              <StatusRow
                label="Slot State"
                value={slot.status}
                color="emerald"
              />

              <StatusRow
                label="Battery"
                value={slot.batteryStatus}
                color="slate"
              />

              <StatusRow
                label="Lock System"
                value={slot.lockSystem}
                color="emerald"
              />

              <StatusRow
                label="Power Flow"
                value={slot.powerFlow}
                color="yellow"
              />

            </div>

          </div>

          {/* ACTIVITY LOG */}
          <div className="bg-[#0b1220] border border-slate-800 rounded-3xl p-6">

            <div className="flex items-center gap-2 mb-5">
              <Clock3 size={18} className="text-cyan-400" />

              <h3 className="text-white font-semibold">
                Activity Timeline
              </h3>
            </div>

            <div className="space-y-5">

              {slot.logs.map((log, index) => (
                <div
                  key={index}
                  className="flex gap-3"
                >
                  <div className="mt-1 w-2 h-2 rounded-full bg-cyan-400" />

                  <div className="flex-1">

                    <p className="text-sm text-slate-200">
                      {log.text}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      {log.time}
                    </p>

                  </div>
                </div>
              ))}

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
  <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-5 hover:border-cyan-500/20 transition">

    <div className="flex items-center justify-between mb-4">

      <div className="text-slate-500 text-xs uppercase tracking-widest">
        {label}
      </div>

      <div className="text-cyan-400">
        {icon}
      </div>

    </div>

    <div className="text-2xl font-bold text-white">
      {value}
    </div>

  </div>
);

const SpecCard = ({
  label,
  value,
}: any) => (
  <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/30">

    <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">
      {label}
    </p>

    <p className="text-sm text-white font-semibold">
      {value}
    </p>

  </div>
);

const StatusRow = ({
  label,
  value,
  color,
}: any) => {
  const colors: any = {
    emerald: 'text-emerald-400',
    yellow: 'text-yellow-400',
    slate: 'text-slate-400',
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-800 bg-slate-900/30">

      <span className="text-sm text-slate-400">
        {label}
      </span>

      <span
        className={`text-sm font-semibold capitalize ${colors[color]}`}
      >
        {value}
      </span>

    </div>
  );
};

export default SlotDetailsPage;