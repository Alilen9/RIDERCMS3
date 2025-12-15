import React from 'react';
import { Booth } from '@/types';
import { AdminBoothStatus, SlotCommand } from '../../../services/adminService';

interface BoothDetailViewProps {
  booth: Booth;
  boothStatus: AdminBoothStatus | undefined;
  onBack: () => void;
  onUpdateSlotStatus: (slotIdentifier: string, status: 'available' | 'disabled') => void;
  onShowConfirmation: (action: () => void, title: string, message: string, isDestructive?: boolean) => void;
  onSendCommand: (slotIdentifier: string, command: SlotCommand) => void;
  formatTimeAgo: (timestamp: string | undefined | null) => string;
  getSlotStatusDisplay: (status: string | null | undefined) => { classes: string; text: string };
  onRefreshStatus: () => void;
  onResetSlots: () => void;
  onDeleteSlot: (slotIdentifier: string) => void;
  onResetSlot: (slotIdentifier: string) => void;
  pendingCommands: Record<string, string | null>;
}

const BoothDetailView: React.FC<BoothDetailViewProps> = ({
  booth,
  boothStatus,
  onBack,
  onUpdateSlotStatus,
  onShowConfirmation,
  onSendCommand,
  formatTimeAgo,
  getSlotStatusDisplay,
  onRefreshStatus,
  onResetSlots,
  onDeleteSlot,
  onResetSlot,
  pendingCommands,
}) => {

  // Merge administrative slot data (from `booth`) with live telemetry data (from `boothStatus`).
  // This ensures the administrative status (like 'disabled') is respected over the live status.
  const mergedSlots = React.useMemo(() => {
    if (!boothStatus?.slots) {
      return [];
    }
    return boothStatus.slots.map(liveSlot => {
      const adminSlot = booth.slots.find(s => s.identifier === liveSlot.slotIdentifier);
      // Combine live data with admin data, giving precedence to the admin status.
      return { ...liveSlot, status: adminSlot?.status || liveSlot.status };
    });
  }, [booth, boothStatus]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="bg-gray-800 hover:bg-gray-700 p-2 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-grow flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              {booth.name}
              <span className="text-gray-500 text-lg font-normal">({booth.booth_uid.substring(0, 8)}...)</span>
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-400 mt-1">Last Heartbeat: {formatTimeAgo(boothStatus?.lastHeartbeatAt)}</p>
              <button onClick={onRefreshStatus} className="text-cyan-400 hover:text-cyan-300 p-1 rounded-full" title="Refresh Status">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M20 4h-5v5M4 20h5v-5" /></svg>
              </button>
            </div>
          </div>
          <button
            onClick={onResetSlots}
            className="bg-red-800 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Reset All Slots
          </button>
        </div>
      </div>

      {/* Slot Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {boothStatus ? (
          mergedSlots.length > 0 ? (
            mergedSlots.map(slot => (
              <div key={slot.slotIdentifier} className={`relative bg-gray-800 border ${slot.status === 'booting' ? 'border-red-500' : 'border-gray-700'} rounded-xl overflow-hidden`}>
                {(() => {
                  const { classes, text } = getSlotStatusDisplay(slot.status);
                  const pendingCommand = pendingCommands[slot.slotIdentifier];
                  const isDoorCommandPending = pendingCommand === 'forceLock' || pendingCommand === 'forceUnlock';
                  const isRelayCommandPending = pendingCommand === 'startCharging' || pendingCommand === 'stopCharging';

                  return (
                    <>
                      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                        <span className="font-bold text-gray-200">{slot.slotIdentifier}</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${classes}`}>{text}</span>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between text-sm items-center">
                          <span className="text-gray-500">Door</span>
                          {isDoorCommandPending ? (
                            <span className="text-xs font-semibold text-yellow-400 animate-pulse">Updating...</span>
                          ) : (
                            <span className={`font-semibold capitalize ${slot.doorStatus === 'unlocked' ? 'text-yellow-400' : 'text-emerald-400'}`}>{slot.doorStatus || 'Unknown'}</span>
                          )}
                        </div>
                        <div className="flex justify-between text-sm items-center">
                          <span className="text-gray-500">Relay</span>
                          {isRelayCommandPending ? (
                            <span className="text-xs font-semibold text-yellow-400 animate-pulse">Updating...</span>
                          ) : (
                            <span className={`font-semibold ${slot.telemetry.relayOn === true ? 'text-blue-400' : 'text-gray-600'}`}>{slot.telemetry.relayOn ? 'ON' : 'OFF'.toUpperCase() || 'N/A'}</span>
                          )}
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Battery</span>
                          <span className="text-white">{slot.battery ? `${slot.battery.chargeLevel}%` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm items-center">
                          <span className="text-gray-500">Rented By</span>
                          {slot.battery?.ownerEmail ? (
                            <span className="text-cyan-400 font-semibold truncate" title={slot.battery.ownerEmail}>{slot.battery.ownerEmail}</span>
                          ) : (<span className="text-gray-600">None</span>)}

                        </div>
                        <div className="border-t border-gray-700/50 pt-3 mt-3">
                          <p className="text-xs font-bold text-gray-400 mb-2">Commands</p>
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => {
                              onSendCommand(slot.slotIdentifier, { forceUnlock: true });
                              setTimeout(onRefreshStatus, 1500); // Refresh after a delay
                            }}
                              className="bg-gray-700 hover:bg-gray-600 py-2 rounded text-xs font-bold text-gray-300"
                            >
                              Unlock
                            </button>
                            <button onClick={() => {
                              onSendCommand(slot.slotIdentifier, { forceLock: true });
                              setTimeout(onRefreshStatus, 1500); // Refresh after a delay
                            }}
                              className="bg-gray-700 hover:bg-gray-600 py-2 rounded text-xs font-bold text-gray-300"
                            >
                              Lock
                            </button>
                            {slot.telemetry.relayOn === true ? (
                              <button onClick={() => onSendCommand(slot.slotIdentifier, { stopCharging: true })} className="col-span-2 bg-red-800 hover:bg-red-700 py-2 rounded text-xs font-bold text-white">
                                Stop Charging
                              </button>
                            ) : (
                              slot.status === 'disabled' ? (
                                <button
                                  onClick={() => onShowConfirmation(
                                    () => onSendCommand(slot.slotIdentifier, { enableSlot: true }), // Assuming a command, or could be a direct status update
                                    'Enable Slot?',
                                    `Are you sure you want to enable slot ${slot.slotIdentifier}? This will make it available for new sessions.`,
                                    false
                                  )}
                                  className="col-span-2 bg-green-800 hover:bg-green-700 py-2 rounded text-xs font-bold text-white"
                                >
                                  Enable Slot
                                </button>
                              ) :
                              <button onClick={() => onSendCommand(slot.slotIdentifier, { startCharging: true })} className="col-span-2 bg-blue-800 hover:bg-blue-700 py-2 rounded text-xs font-bold text-white">
                                Start Charging
                              </button>
                            )}
                            <button
                              onClick={() => onResetSlot(slot.slotIdentifier)}
                              className="col-span-2 mt-2 bg-yellow-900/50 hover:bg-yellow-900/80 text-yellow-300 py-2 rounded text-xs font-bold border border-yellow-700/50"
                            >
                              Reset Slot
                            </button>
                            {slot.status !== 'disabled' && (
                              <button
                                onClick={() => onShowConfirmation(
                                  () => onUpdateSlotStatus(slot.slotIdentifier, 'disabled'),
                                  'Disable Slot?',
                                  `Are you sure you want to disable slot ${slot.slotIdentifier}? This will prevent it from being used until it's re-enabled.`,
                                  true
                                )}
                                className="col-span-2 bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 rounded text-xs font-bold"
                              >
                                Disable Slot
                              </button>
                            )}
                            <button
                              onClick={() => onDeleteSlot(slot.slotIdentifier)}
                              className="col-span-2 mt-2 bg-red-900/50 hover:bg-red-900/80 text-red-300 py-2 rounded text-xs font-bold border border-red-700/50"
                            >
                              Delete Slot
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              <p>This booth has no slots configured.</p>
            </div>
          )
        ) : (
          <div className="col-span-full text-center py-12 bg-gray-800/50 border border-dashed border-red-700/50 rounded-xl">
            <div className="text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="font-semibold text-red-400">Failed to Load Station Status</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">The server could not retrieve live data for this station.</p>
            <button onClick={onRefreshStatus} className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M20 4h-5v5M4 20h5v-5" /></svg>
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoothDetailView;