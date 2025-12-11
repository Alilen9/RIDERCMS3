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