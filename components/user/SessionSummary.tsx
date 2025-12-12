import React from 'react';

interface SessionSummaryProps {
  durationMinutes: number;
  energyDelivered: number;
  totalCost: number;
}

const SessionSummary: React.FC<SessionSummaryProps> = ({
  durationMinutes,
  energyDelivered,
  totalCost,
}) => {
  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 mb-6">
      <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Session Summary</h2>
      <div className="flex justify-between mb-2">
        <span className="text-gray-400">Energy Delivered</span>
        <span>{energyDelivered} SOC</span>
      </div>
      <div className="flex justify-between mb-2">
        <span className="text-gray-400">Duration</span>
        <span>{durationMinutes} mins</span>
      </div>
      <div className="flex justify-between mt-4 pt-4 border-t border-gray-700 text-lg font-bold">
        <span>Total Due</span>
        <span className="text-emerald-400">KES {totalCost.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default SessionSummary;