import React, { useState, useEffect } from 'react';
import * as adminService from '../../services/adminService';

const BoothStatus: React.FC = () => {
  const [booths, setBooths] = useState<adminService.AdminBoothStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBoothStatus = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminService.getBoothStatus();
        setBooths(response);
      } catch (err) {
        setError('Failed to load booth status data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBoothStatus();
    // Optional: Set up an interval to refresh the data every 30 seconds
    const intervalId = setInterval(fetchBoothStatus, 30000);
    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, []);

  if (loading && booths.length === 0) {
    // Show skeleton only on initial load
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-gray-800 rounded-xl border border-gray-700 p-4 animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, slotIndex) => (
                <div key={slotIndex} className="h-20 bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-center p-8 text-red-400">{error}</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
      {booths.map(booth => (
        <div key={booth.boothUid} className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold text-lg truncate">{booth.location}</h3>
            <p className="text-xs text-gray-500 font-mono">{booth.boothUid}</p>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {booth.slots.map(slot => {
              const isCharging = slot.status === 'OCCUPIED_CHARGING';
              const isFull = slot.status === 'OCCUPIED_FULL';
              const isEmpty = slot.status === 'EMPTY';
              const isFaulty = slot.status === 'FAULTY';

              let bgColor = 'bg-gray-700/50'; // Default for empty
              if (isCharging) bgColor = 'bg-blue-500/20 border-blue-500';
              if (isFull) bgColor = 'bg-emerald-500/20 border-emerald-500';
              if (isFaulty) bgColor = 'bg-red-500/20 border-red-500';

              return (
                <div key={slot.slotIdentifier} className={`border ${bgColor} rounded-lg p-2 text-center flex flex-col justify-center items-center h-24`}>
                  <span className="text-xs text-gray-400">Slot {slot.slotIdentifier}</span>
                  {slot.battery ? (
                    <div className="mt-1">
                      <p className="font-bold text-2xl text-white">{slot.battery.chargeLevel}<span className="text-sm">%</span></p>
                      <p className="text-[10px] text-gray-500 font-mono truncate">{slot.battery.batteryUid}</p>
                    </div>
                  ) : (
                    <p className="text-lg font-bold text-gray-600 mt-1">--</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BoothStatus;

