import React from 'react';

import { Booth } from '@/types';

import { AdminBoothStatus, SlotCommand } from '../../../services/adminService';

import { Phone, PhoneCall, MessageCircle } from 'lucide-react';

import { FaWhatsapp } from 'react-icons/fa';

// Convert phone number to WhatsApp format

const formatWhatsAppNumber = (phone: string) => {

  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('0')) {

    return `254${cleaned.slice(1)}`;

  }

  return cleaned;

};

interface BoothDetailViewProps {

  booth: Booth;

  boothStatus: AdminBoothStatus | undefined;

  onBack: () => void;

  onUpdateSlotStatus: (slotIdentifier: string, status: 'available' | 'disabled') => void;

  onShowConfirmation: (action: () => void, title: string, message: string, isDestructive?: boolean) => void;

  onSendCommand: (slotIdentifier: string, command: SlotCommand) => void;

  onManualWithdraw?: (slotIdentifier: string, boothUid: string) => void;

  onReconcileDeposit?: (slotIdentifier: string) => void;

  onWithdrawRental?: (slotIdentifier: string, batteryUid: string) => void;

  // Open the existing Add Rental Battery page in conversion mode.
  onOpenRentalForm?: (details: {
    boothUid: string;
    slotIdentifier: string;
    batteryUid: string | null;
  }) => void;

  formatTimeAgo: (timestamp: string | undefined | null) => string;

  getSlotStatusDisplay: (status: string | null | undefined) => { classes: string; text: string };

  onRefreshStatus: () => Promise<void> | void;

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

  onManualWithdraw,

  onReconcileDeposit,

  onWithdrawRental,

  onOpenRentalForm,

  formatTimeAgo,

  getSlotStatusDisplay,

  onRefreshStatus,

  onResetSlots,

  onDeleteSlot,

  onResetSlot,

  pendingCommands,

}) => {

  // Refresh once when this booth opens and every 30 seconds thereafter.

  // Promise-returning refresh callbacks are awaited to avoid overlapping requests.

  const refreshStatusRef = React.useRef(onRefreshStatus);

  const refreshInFlightRef = React.useRef(false);

  const mountedRef = React.useRef(true);

  React.useEffect(() => {

    refreshStatusRef.current = onRefreshStatus;

  }, [onRefreshStatus]);

  const refreshStatus = React.useCallback(async () => {

    if (refreshInFlightRef.current) return;

    refreshInFlightRef.current = true;

    try {

      await refreshStatusRef.current();

    } catch (error) {

      console.error('Failed to refresh booth status:', error);

    } finally {

      refreshInFlightRef.current = false;

    }

  }, []);

  React.useEffect(() => {

    mountedRef.current = true;

    void refreshStatus();

    const interval = window.setInterval(() => {

      if (document.visibilityState === 'visible') void refreshStatus();

    }, 30000);

    return () => {

      mountedRef.current = false;

      window.clearInterval(interval);

    };

  }, [booth.booth_uid, refreshStatus]);



  const handleConvertToRental = (slotIdentifier: string, existingUid: string | null) => {
    if (!onOpenRentalForm) {
      window.alert('The Add Rental Battery page is not connected to this button yet.');
      return;
    }

    // Do not submit or create anything here; navigation opens the form.
    onOpenRentalForm({
      boothUid: booth.booth_uid,
      slotIdentifier,
      batteryUid: existingUid,
    });
  };

  // Merge administrative slot data (from `booth.slots`) with live telemetry data (from `boothStatus.slots`).

  // We use `booth.slots` as the base so the UI renders immediately using DB records while telemetry loads.

  const mergedSlots = React.useMemo(() => {

    return (booth.slots || []).map(adminSlot => {

      const liveSlot = boothStatus?.slots?.find(s => s.slotIdentifier === adminSlot.identifier);

      return {

        slotIdentifier: adminSlot.identifier,

        // Administrative/in-flight states win; otherwise trust live telemetry

        // ('occupied' requires a battery physically detected in the slot).

        status: ['disabled', 'maintenance', 'faulty', 'opening'].includes(adminSlot.status)

          ? adminSlot.status

          : liveSlot?.battery

            ? (liveSlot.battery.isOccupied ? 'occupied' : 'available')

            : adminSlot.status,

        doorStatus: liveSlot?.doorStatus || adminSlot.doorStatus,

        // Combine battery info: live telemetry takes precedence

        battery: liveSlot?.battery || (adminSlot.chargeLevel !== null ? { chargeLevel: adminSlot.chargeLevel } : null),

        // "Rented By" comes from the DB (adminSlot)

        userName: adminSlot.userName || liveSlot?.userName || liveSlot?.batteryOwner,

        userPhone: adminSlot.userPhone || liveSlot?.userPhone || null,

        userEmail: (adminSlot as any).userEmail ?? (liveSlot as any)?.userEmail ?? null,

        pendingManualUnlock: liveSlot?.pendingManualUnlock || false,

        awaitingWithdrawal: adminSlot.awaitingWithdrawal === true || liveSlot?.awaitingWithdrawal === true,

        isRentalPool: adminSlot.isRentalPool === true || liveSlot?.isRentalPool === true,

        batteryUid: adminSlot.batteryUid ?? null,

        hasPhysicalBattery: liveSlot?.battery?.isOccupied === true,

        telemetry: liveSlot?.telemetry,

      };

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

            <div className="flex items-center gap-3 mt-1">

              {booth.phoneNumber && (

                <>

                  <span className="text-gray-600">|</span>

                  <a

                    href={`tel:${booth.phoneNumber}`}

                    title="Call"

                    className="text-emerald-400 hover:text-emerald-300 transition-colors"

                    target="_blank"

                    rel="noopener noreferrer"

                  >

                    <Phone size={14} />

                  </a>

                  <a

                    href={`https://wa.me/${booth.phoneNumber.replace(/[^0-9]/g, '')}`}

                    title="WhatsApp"

                    className="text-green-400 hover:text-green-300 transition-colors"

                    target="_blank"

                    rel="noopener noreferrer"

                  >

                    <MessageCircle size={14} />

                  </a>

                </>

              )}



            </div>

          </div>

        </div>

      </div>

      {/* Slot Grid */}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

        {booth ? (

          mergedSlots.length > 0 ? (

            mergedSlots.map(slot => (

              <div key={slot.slotIdentifier} className={`relative bg-gray-800 border ${slot.status === 'booting' ? 'border-red-500' : 'border-gray-700'} rounded-xl overflow-hidden`}>

                {(() => {

                  const { classes, text } = getSlotStatusDisplay(slot.status);

                  const pendingCommand = pendingCommands[slot.slotIdentifier];

                  const isDoorCommandPending = pendingCommand === 'forceLock' || pendingCommand === 'forceUnlock';

                  const isRelayCommandPending = pendingCommand === 'startCharging' || pendingCommand === 'stopCharging';

                  const isOccupied = slot.status === 'occupied';

                  const isRentalOccupied = slot.isRentalPool === true;

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

                            <span className={`font-semibold ${slot.telemetry?.relayOn === true ? 'text-blue-400' : 'text-gray-600'}`}>{slot.telemetry?.relayOn ? 'ON' : 'OFF'.toUpperCase() || 'N/A'}</span>

                          )}

                        </div>

                        <div className="flex justify-between text-sm">

                          <span className="text-gray-500">Battery</span>

                          <span className="text-white">{slot.battery ? `${slot.battery.chargeLevel}%` : 'N/A'}</span>

                        </div>

                        <div className="flex justify-between text-sm items-center gap-2">

                          <span className="text-gray-500 flex-shrink-0">Rented By</span>

                          {slot.awaitingWithdrawal ? (

                            <span className="bg-amber-900/50 border border-amber-700/50 text-amber-300 text-xs font-bold px-2 py-0.5 rounded">

                              Awaiting Withdrawal

                            </span>

                          ) : slot.isRentalPool ? (

                            <span className="bg-purple-900/50 border border-purple-700/50 text-purple-300 text-xs font-bold px-2 py-0.5 rounded">

                              Rental Pool

                            </span>

                          ) : slot.userName ? (

                            <div className="flex items-center gap-2 min-w-0">

                              <span className="text-cyan-400 font-semibold truncate" title={slot.userName}>{slot.userName}</span>

                              {slot.userPhone && (

                                <div className="flex items-center gap-1.5 flex-shrink-0">

                                  <a

                                    href={`tel:${slot.userPhone}`}

                                    title="Call"

                                    className="text-gray-400 hover:text-green-400"

                                  >

                                    <PhoneCall size={14} className="text-green-500" />

                                  </a>

                                  <span className="text-gray-600">|</span>

                                  <a

                                    href={`https://wa.me/${formatWhatsAppNumber(slot.userPhone)}`}

                                    title="WhatsApp"

                                    target="_blank"

                                    rel="noopener noreferrer"

                                    className="text-gray-400 hover:text-green-400"

                                  >

                                    <FaWhatsapp size={16} className="text-green-500" />

                                  </a>

                                </div>

                              )}

                            </div>

                          ) : (<span className="text-gray-600">None</span>)}

                        </div>

                        {slot.pendingManualUnlock && (

                          <div className="bg-amber-900/40 border border-amber-600/40 rounded-lg p-3 text-sm">

                            <p className="text-amber-300 font-semibold flex items-center gap-2">

                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>

                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />

                              </svg>

                              Manual withdrawal paid

                            </p>

                            <p className="text-amber-400/80 text-xs mt-1">Press <strong>Unlock</strong> to release battery</p>

                          </div>

                        )}

                        <div className="border-t border-gray-700/50 pt-3 mt-3">

                          <p className="text-xs font-bold text-gray-400 mb-2">Quick actions</p>

                          <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-900/50 border border-gray-700/60 p-3">
                            <div className="col-span-2 text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400 mt-1 mb-1">01 / Device</div>

                            {(() => {

                              const doorIsLocked = slot.doorStatus === 'locked';

                              const toggleLabel = doorIsLocked ? 'Unlock' : 'Lock';

                              const toggleCommand = doorIsLocked

                                ? { forceUnlock: true }

                                : { forceLock: true };

                              const toggleConfirmation =

                                `Are you sure you want to ${doorIsLocked ? 'unlock' : 'lock'} slot ${slot.slotIdentifier}?`;

                              // Hide generic lock/unlock when there's an active withdrawal in progress

                              // to prevent accidental force completion of withdrawal sessions

                              if (slot.awaitingWithdrawal) {

                                return null;

                              }

                              return (

                                <button

                                  onClick={() => onShowConfirmation(

                                    () => {

                                      onSendCommand(slot.slotIdentifier, toggleCommand);

                                      setTimeout(() => { void refreshStatus(); }, 1500); // Refresh after a delay

                                    },

                                    `${toggleLabel} Slot?`,

                                    toggleConfirmation,

                                    false

                                  )}

                                  disabled={isRentalOccupied}

                                  title={isRentalOccupied ? 'Rental batteries are handled with Rental Withdrawal.' : `Currently ${slot.doorStatus}`}

                                  className="w-full min-h-[40px] px-2.5 py-2 rounded-lg border border-slate-600/50 bg-slate-800 hover:bg-slate-700 hover:border-slate-500 text-slate-100 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-40 disabled:cursor-not-allowed"

                                >

                                  {toggleLabel}

                                </button>

                              );

                            })()}

                            {slot.telemetry?.relayOn === true ? (

                              <button onClick={() => onShowConfirmation(

                                () => onSendCommand(slot.slotIdentifier, { stopCharging: true }),

                                'Stop Charging?',

                                `Are you sure you want to stop charging on slot ${slot.slotIdentifier}?`,

                                true

                              )} className="w-full min-h-[40px] px-2.5 py-2 rounded-lg border border-slate-600/50 bg-slate-800 hover:bg-slate-700 hover:border-slate-500 text-slate-100 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-40 disabled:cursor-not-allowed">

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

                                  className="w-full min-h-[40px] px-2.5 py-2 rounded-lg border border-slate-600/50 bg-slate-800 hover:bg-slate-700 hover:border-slate-500 text-slate-100 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-40 disabled:cursor-not-allowed"

                                >

                                  Enable Slot

                                </button>

                              ) :

                                slot.battery ? (

                                  <button

                                    onClick={() => onShowConfirmation(

                                      () => {

                                        onSendCommand(slot.slotIdentifier, { startCharging: true });

                                        setTimeout(() => { void refreshStatus(); }, 1500);

                                      },

                                      'Start Charging?',

                                      `Are you sure you want to start charging for slot ${slot.slotIdentifier}?`,

                                      false

                                    )}

                                    className="w-full min-h-[40px] px-2.5 py-2 rounded-lg border border-slate-600/50 bg-slate-800 hover:bg-slate-700 hover:border-slate-500 text-slate-100 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-40 disabled:cursor-not-allowed"

                                  >

                                    Start Charging

                                  </button>

                                ) : null

                            )}

                            <div className="col-span-2 text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400 mt-3 mb-1 border-t border-gray-700/50 pt-3">02 / Battery &amp; rentals</div>
                            {onManualWithdraw && slot.userName && !slot.pendingManualUnlock && !slot.awaitingWithdrawal && !isRentalOccupied && (

                              <button

                                onClick={() => onShowConfirmation(

                                  () => onManualWithdraw(slot.slotIdentifier, booth.booth_uid),

                                  'Manual Withdraw?',

                                  `Manually withdraw battery from slot ${slot.slotIdentifier}? The customer's deposit will be redeemed, cost calculated, and slot released.`,

                                  true

                                )}

                                className="w-full min-h-[40px] px-2.5 py-2 rounded-lg border border-slate-600/50 bg-slate-800 hover:bg-slate-700 hover:border-slate-500 text-slate-100 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-40 disabled:cursor-not-allowed"

                              >

                                Manual Withdraw

                              </button>

                            )}

                            {/* Convert only a telemetry-confirmed physical battery without an active customer session. */}

                            {slot.hasPhysicalBattery && !slot.isRentalPool && !slot.userName &&

                              !slot.awaitingWithdrawal && !slot.pendingManualUnlock &&

                              !['disabled', 'maintenance', 'faulty', 'opening'].includes(slot.status) && (

                                <button

                                  onClick={() => handleConvertToRental(slot.slotIdentifier, slot.batteryUid)}

                                  disabled={Boolean(pendingCommands[slot.slotIdentifier])}

                                  title="Open the Add Rental Battery form for this existing battery"

                                  className="col-span-2 w-full min-h-[42px] px-3 py-2 rounded-lg border border-sky-500/40 bg-sky-600/20 hover:bg-sky-600/30 text-sky-100 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-40 disabled:cursor-not-allowed"

                                >

                                  Convert to Rental

                                </button>

                              )}

                            {onWithdrawRental && isRentalOccupied && slot.batteryUid && (

                              <button

                                onClick={() => onShowConfirmation(

                                  () => onWithdrawRental(slot.slotIdentifier, slot.batteryUid as string),

                                  'Rental Withdrawal?',

                                  `Withdraw the rental battery ${slot.batteryUid} from slot ${slot.slotIdentifier}? It will be marked as withdrawn and this slot cleared.`,

                                  true

                                )}

                                className="w-full min-h-[40px] px-2.5 py-2 rounded-lg border border-slate-600/50 bg-slate-800 hover:bg-slate-700 hover:border-slate-500 text-slate-100 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-40 disabled:cursor-not-allowed"

                              >

                                Rental Withdrawal

                              </button>

                            )}

                            <div className="col-span-2 text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400 mt-3 mb-1 border-t border-gray-700/50 pt-3">03 / Manage slot</div>
                            {onReconcileDeposit && !slot.isRentalPool && slot.status !== 'disabled' && slot.battery && (

                              <button

                                onClick={() => onReconcileDeposit(slot.slotIdentifier)}

                                title="If the battery is still in the slot but the deposit was wrongly marked failed, restore the deposit so the customer's credit and withdrawal path are recovered."

                                className="w-full min-h-[40px] px-2.5 py-2 rounded-lg border border-slate-600/50 bg-slate-800 hover:bg-slate-700 hover:border-slate-500 text-slate-100 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-40 disabled:cursor-not-allowed"

                              >

                                Re-sync Deposit

                              </button>

                            )}

                            <button

                              onClick={() => onShowConfirmation(

                                () => onResetSlot(slot.slotIdentifier),

                                'Reset Slot?',

                                (() => {
                                  const name = (slot as any).userName?.trim?.();
                                  const phone = (slot as any).userPhone?.trim?.();
                                  const email = (slot as any).userEmail?.trim?.();
                                  let riderLabel: string | null = null;
                                  if (name) riderLabel = phone ? `${name} (${phone})` : name;
                                  else riderLabel = phone || email || null;
                                  return riderLabel
                                    ? `Slot ${slot.slotIdentifier} holds a deposit for ${riderLabel}. Resetting will not remove their credit. Continue?`
                                    : `Are you sure you want to reset slot ${slot.slotIdentifier}? This will set it to available and clear any linked battery data.`;
                                })(),

                                true

                              )}

                                className="w-full min-h-[40px] px-2.5 py-2 rounded-lg border border-slate-600/50 bg-slate-800 hover:bg-slate-700 hover:border-slate-500 text-slate-100 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-40 disabled:cursor-not-allowed">
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

                                disabled={isOccupied}

                                title={isOccupied ? 'Slot is occupied. Empty it before disabling.' : undefined}

                                className="w-full min-h-[40px] px-2.5 py-2 rounded-lg border border-slate-600/50 bg-slate-800 hover:bg-slate-700 hover:border-slate-500 text-slate-100 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-40 disabled:cursor-not-allowed"

                              >

                                Disable Slot

                              </button>

                            )}

                            {!isOccupied && (

                              <button

                                onClick={() => onShowConfirmation(

                                  () => onDeleteSlot(slot.slotIdentifier),

                                  'Delete Slot?',

                                  `Are you sure you want to permanently delete slot ${slot.slotIdentifier}? This action cannot be undone.`,

                                  true

                                )}

                                className="col-span-2 w-full min-h-[40px] px-3 py-2 rounded-lg border border-rose-900/60 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"

                              >

                                Delete Slot

                              </button>

                            )}

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
