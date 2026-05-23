import React from 'react';
import { Battery, Slot } from '../../types';

interface ChargingStatusViewProps {
  activeBattery: Battery;
  assignedSlot: Slot | null;
  loading: boolean;
  initiateCollection: () => void;
}

const ChargingStatusView: React.FC<ChargingStatusViewProps> = ({
  activeBattery,
  assignedSlot,
  loading,
  initiateCollection,
}) => {
  return (
    <div className="animate-fade-in space-y-6 pt-4">
      
      {/* Charging Card */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500"></div>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">{activeBattery.type || 'E-Bike'}</h2>
            <p className="text-sm text-gray-400">ID: {activeBattery.id}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Slot</span>
            <span className="text-2xl font-mono font-bold text-emerald-400">{assignedSlot?.identifier}</span>
            {assignedSlot?.status && (
              <div className={`flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                assignedSlot.doorStatus === 'locked' 
                  ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' 
                  : 'bg-red-900/30 text-red-400 border-red-500/30 animate-pulse shadow-[0_0_10px_rgba(248,113,113,0.3)]'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  {assignedSlot.doorStatus === 'locked' 
                    ? <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                    : <path fillRule="evenodd" d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" clipRule="evenodd" />}
                </svg>
                {assignedSlot.doorStatus}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <div className="relative w-48 h-48">
            {/* Circular Progress */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path className="text-gray-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <path className="text-emerald-500 transition-all duration-1000 ease-linear" strokeDasharray={`${activeBattery.chargeLevel}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-white">{activeBattery.chargeLevel}<span className="text-2xl">%</span></span>
              <span className="text-sm text-emerald-400 font-medium animate-pulse">Charging...</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-gray-900/50 p-3 rounded-lg">
            <p className="text-[10px] text-gray-500 uppercase">Temp</p>
            <p className="font-mono text-orange-400">{activeBattery.temperature}°C</p>
          </div>
          <div className="bg-gray-900/50 p-3 rounded-lg">
            <p className="text-[10px] text-gray-500 uppercase">Voltage</p>
            <p className="font-mono text-blue-400">{activeBattery.voltage.toFixed(1)}V</p>
          </div>
        </div>
      </div>

      {/* Collect Button */}
      <button
        onClick={initiateCollection}
        disabled={activeBattery.chargeLevel < 20 || loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg transition-colors mt-4"
      >
        {loading ? 'Processing...' : activeBattery.chargeLevel < 20 ? 'Charge > 20% to Collect' : 'Collect Battery & Pay'}
      </button>
    </div>
  );
};

export default ChargingStatusView;