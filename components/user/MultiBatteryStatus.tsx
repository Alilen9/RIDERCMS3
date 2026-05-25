import React from 'react';
import { ActiveBatteryEntry } from '../../types';

interface MultiBatteryStatusProps {
  batteries: ActiveBatteryEntry[];
  onCollect: (index: number) => void;
  onAddBattery: () => void;
}

const MultiBatteryStatus: React.FC<MultiBatteryStatusProps> = ({ batteries, onCollect, onAddBattery }) => {
  return (
    <div className="animate-fade-in space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Your Batteries</h2>
        <button
          onClick={onAddBattery}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
        >
          + Add Battery
        </button>
      </div>

      {batteries.map((entry, index) => {
        const { battery, slot } = entry;
        const canCollect = battery.chargeLevel >= 20;

        return (
          <div
            key={entry.sessionId ?? `battery-${index}`}
            className="bg-gray-800 rounded-2xl p-5 border border-gray-700 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500"></div>

            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{battery.type || 'E-Bike'}</h3>
                <p className="text-xs text-gray-400">ID: {battery.id} · Slot {slot.identifier}</p>
              </div>
              <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                slot.doorStatus === 'locked'
                  ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30'
                  : 'bg-red-900/30 text-red-400 border-red-500/30 animate-pulse'
              }`}>
                {slot.doorStatus}
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path className="text-gray-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" />
                  <path className="text-emerald-500 transition-all duration-1000 ease-linear" strokeDasharray={`${battery.chargeLevel}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">{battery.chargeLevel}%</span>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div className="text-gray-500">Temp</div>
                <div className="text-orange-400 font-mono text-right">{battery.temperature}°C</div>
                <div className="text-gray-500">Voltage</div>
                <div className="text-blue-400 font-mono text-right">{battery.voltage.toFixed(1)}V</div>
              </div>
            </div>

            <button
              onClick={() => onCollect(index)}
              disabled={!canCollect}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors text-sm"
            >
              {!canCollect ? 'Charge > 20% to Collect' : 'Collect Battery & Pay'}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default MultiBatteryStatus;
