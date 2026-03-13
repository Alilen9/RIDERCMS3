import React from 'react';
import { Battery, Slot } from '../../types';

interface ChargingStatusViewProps {
  activeBattery: Battery;
  assignedSlot: Slot | null;
  aiAnalysis: string;
  isAnalyzing: boolean;
  loading: boolean;
  runAiAnalysis: () => void;
  initiateCollection: () => void;
}

const ChargingStatusView: React.FC<ChargingStatusViewProps> = ({
  activeBattery,
  assignedSlot,
  aiAnalysis,
  isAnalyzing,
  loading,
  runAiAnalysis,
  initiateCollection,
}) => {
  const getChargeColor = (level: number): string => {
    if (level < 20) {
      return 'bg-red-500';
    }
    if (level < 80) {
      return 'bg-yellow-400';
    }
    return 'bg-emerald-500';
  };

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

        <div className="flex flex-col items-center justify-center mb-6">
          {/* Battery Icon */}
          <div className="relative w-24 h-40">
            {/* Battery Body */}
            <div className="h-full w-full border-4 border-gray-500 rounded-2xl p-1.5 flex flex-col-reverse bg-gray-900/50">
              {/* Charge Level */}
              <div
                className={`relative overflow-hidden w-full ${getChargeColor(activeBattery.chargeLevel)} rounded-lg transition-all duration-1000 ease-linear`}
                style={{ height: `${activeBattery.chargeLevel}%` }}
              >
                {/* Bubbles */}
                <span className="bubble" style={{ left: '15%', width: '15px', height: '15px', animationDuration: '5s', animationDelay: '0s' }}></span>
                <span className="bubble" style={{ left: '40%', width: '8px', height: '8px', animationDuration: '8s', animationDelay: '2s' }}></span>
                <span className="bubble" style={{ left: '65%', width: '12px', height: '12px', animationDuration: '6s', animationDelay: '1s' }}></span>
                <span className="bubble" style={{ left: '85%', width: '10px', height: '10px', animationDuration: '10s', animationDelay: '4s' }}></span>
              </div>
            </div>
            {/* Battery Cap */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-10 bg-gray-500 rounded-t-md"></div>
            {/* Lightning Bolt Icon */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white/90 drop-shadow-lg animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <span className="text-sm text-emerald-400 font-medium animate-pulse mt-4">Charging...</span>
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

      {/* Gemini AI Card */}
      <div className="bg-gradient-to-br from-indigo-900/80 to-purple-900/80 p-6 rounded-2xl border border-indigo-500/30 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="font-bold text-indigo-100">AI Battery Doctor</h3>
        </div>
        {aiAnalysis ? (
          <p className="text-sm text-indigo-200 italic leading-relaxed">"{aiAnalysis}"</p>
        ) : (
          <button
            onClick={runAiAnalysis}
            disabled={isAnalyzing}
            className="text-xs bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 px-3 py-2 rounded-lg border border-indigo-500/30 transition-colors w-full disabled:opacity-50"
          >
            {isAnalyzing ? "Running Diagnostics..." : "Analyze Battery Health"}
          </button>
        )}
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