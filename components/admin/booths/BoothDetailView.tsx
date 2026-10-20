import React from 'react';
import { Booth } from '@/types';
import { AdminBoothStatus, SlotCommand } from '../../../services/adminService';
import { Phone, PhoneCall, MessageCircle } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

const formatWhatsAppNumber = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.startsWith('0') ? `254${cleaned.slice(1)}` : cleaned;
};

// Read temperature from battery or telemetry data.
const getBatteryTemperature = (battery: unknown, telemetry: unknown): string => {
  const temperatureKeys = [
    'temperature',
    'temperatureC',
    'temperature_c',
    'temp',
    'tempC',
    'temp_c',
    'batteryTemperature',
    'batteryTemperatureC',
    'battery_temperature',
    'battery_temperature_c',
    'temperature_celsius',
  ];

  const readTemperature = (value: unknown): number | null => {
    if (!value || typeof value !== 'object') return null;

    const record = value as Record<string, unknown>;

    for (const key of temperatureKeys) {
      const candidate = record[key];

      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        return candidate;
      }

      if (typeof candidate === 'string' && candidate.trim() !== '') {
        const parsed = Number(candidate);
        if (Number.isFinite(parsed)) return parsed;
      }
    }

    for (const key of ['battery', 'sensor', 'sensors', 'data', 'metrics', 'readings']) {
      const nested = readTemperature(record[key]);
      if (nested !== null) return nested;
    }

    return null;
  };

  const temperature = readTemperature(battery) ?? readTemperature(telemetry);
  return temperature === null ? 'N/A' : `${temperature.toFixed(1)}°C`;
};

interface BoothDetailViewProps {
  booth: Booth;
  boothStatus: AdminBoothStatus | undefined;
  onBack: () => void;
  onUpdateSlotStatus: (slotIdentifier: string, status: 'available' | 'disabled') => void;
  onShowConfirmation: (
    action: () => void,
    title: string,
    message: string,
    isDestructive?: boolean
  ) => void;
  onSendCommand: (slotIdentifier: string, command: SlotCommand) => void;
  onManualWithdraw?: (slotIdentifier: string, boothUid: string) => void;
  onReconcileDeposit?: (slotIdentifier: string) => void;
  onWithdrawRental?: (slotIdentifier: string, batteryUid: string) => void;
  onOpenRentalForm?: (details: {
    boothUid: string;
    slotIdentifier: string;
    batteryUid: string | null;
  }) => void;
  formatTimeAgo: (timestamp: string | undefined | null) => string;
  getSlotStatusDisplay: (
    status: string | null | undefined
  ) => { classes: string; text: string };
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
  const refreshStatusRef = React.useRef(onRefreshStatus);
  const refreshInFlightRef = React.useRef(false);

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
    void refreshStatus();

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refreshStatus();
      }
    }, 30000);

    return () => window.clearInterval(interval);
  }, [booth.booth_uid, refreshStatus]);

  const handleConvertToRental = (
    slotIdentifier: string,
    existingUid: string | null
  ) => {
    if (!onOpenRentalForm) {
      window.alert('The Add Rental Battery page is not connected to this button yet.');
      return;
    }

    onShowConfirmation(
      () =>
        onOpenRentalForm({
          boothUid: booth.booth_uid,
          slotIdentifier,
          batteryUid: existingUid,
        }),
      'Convert Battery to Rental?',
      `Open rental registration for slot ${slotIdentifier}${existingUid ? ` with battery ${existingUid}` : ''
      }?`,
      false
    );
  };

  const mergedSlots = React.useMemo(() => {
    return (booth.slots || []).map((adminSlot) => {
      const liveSlot = boothStatus?.slots?.find(
        (s) => s.slotIdentifier === adminSlot.identifier
      );

      return {
        slotIdentifier: adminSlot.identifier,
        status: ['disabled', 'maintenance', 'faulty', 'opening'].includes(
          adminSlot.status
        )
          ? adminSlot.status
          : liveSlot?.battery
            ? liveSlot.battery.isOccupied
              ? 'occupied'
              : 'available'
            : adminSlot.status,
        doorStatus: liveSlot?.doorStatus || adminSlot.doorStatus,
        battery:
          liveSlot?.battery ||
          (adminSlot.chargeLevel !== null
            ? { chargeLevel: adminSlot.chargeLevel }
            : null),
        userName:
          adminSlot.userName || liveSlot?.userName || liveSlot?.batteryOwner,
        userPhone: adminSlot.userPhone || liveSlot?.userPhone || null,
        pendingManualUnlock: liveSlot?.pendingManualUnlock || false,
        awaitingWithdrawal:
          adminSlot.awaitingWithdrawal === true ||
          liveSlot?.awaitingWithdrawal === true,
        isRentalPool:
          adminSlot.isRentalPool === true || liveSlot?.isRentalPool === true,
        batteryUid: adminSlot.batteryUid ?? null,
        hasPhysicalBattery: liveSlot?.battery?.isOccupied === true,
        telemetry: liveSlot?.telemetry,
      };
    });
  }, [booth, boothStatus]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="bg-gray-800 hover:bg-gray-700 p-2 rounded-lg"
          aria-label="Back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className="flex-grow">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            {booth.name}
            <span className="text-gray-500 text-lg font-normal">
              ({booth.booth_uid.substring(0, 8)}...)
            </span>
          </h2>

          <div className="flex items-center gap-3 mt-1">
            {booth.phoneNumber && (
              <>
                <span className="text-gray-600">|</span>
                <a
                  href={`tel:${booth.phoneNumber}`}
                  title="Call"
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  <Phone size={14} />
                </a>
                <a
                  href={`https://wa.me/${formatWhatsAppNumber(booth.phoneNumber)}`}
                  title="WhatsApp"
                  className="text-green-400 hover:text-green-300"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {mergedSlots.length > 0 ? (
          mergedSlots.map((slot) => {
            const { classes, text } = getSlotStatusDisplay(slot.status);
            const pendingCommand = pendingCommands[slot.slotIdentifier];
            const isDoorCommandPending =
              pendingCommand === 'forceLock' ||
              pendingCommand === 'forceUnlock';
            const isRelayCommandPending =
              pendingCommand === 'startCharging' ||
              pendingCommand === 'stopCharging';
            const isOccupied = slot.status === 'occupied';
            const isRentalOccupied = slot.isRentalPool;

            const doorIsLocked = slot.doorStatus === 'locked';
            const toggleLabel = doorIsLocked ? 'Unlock' : 'Lock';
            const toggleCommand: SlotCommand = doorIsLocked
              ? { forceUnlock: true }
              : { forceLock: true };

            const actionButtonBase =
              'w-full min-h-[40px] px-2.5 py-2 rounded-lg border text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 disabled:opacity-40 disabled:cursor-not-allowed';

            return (
              <div
                key={slot.slotIdentifier}
                className={`relative bg-gray-800 border ${slot.status === 'booting'
                    ? 'border-red-500'
                    : 'border-gray-700'
                  } rounded-xl overflow-hidden`}
              >
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                  <span className="font-bold text-gray-200">
                    {slot.slotIdentifier}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${classes}`}
                  >
                    {text}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-500">Door</span>
                    {isDoorCommandPending ? (
                      <span className="text-xs font-semibold text-yellow-400 animate-pulse">
                        Updating...
                      </span>
                    ) : (
                      <span
                        className={`font-semibold capitalize ${slot.doorStatus === 'unlocked'
                            ? 'text-yellow-400'
                            : 'text-emerald-400'
                          }`}
                      >
                        {slot.doorStatus || 'Unknown'}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-500">Relay</span>
                    {isRelayCommandPending ? (
                      <span className="text-xs font-semibold text-yellow-400 animate-pulse">
                        Updating...
                      </span>
                    ) : (
                      <span
                        className={`font-semibold ${slot.telemetry?.relayOn === true
                            ? 'text-blue-400'
                            : 'text-gray-500'
                          }`}
                      >
                        {slot.telemetry?.relayOn === true ? 'ON' : 'OFF'}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Battery</span>
                    <span className="text-white">
                      {slot.battery
                        ? `${slot.battery.chargeLevel ?? 'N/A'}%`
                        : 'N/A'}
                    </span>
                  </div>

                  {slot.battery && (
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-gray-500">Battery Temperature</span>
                      <span className="text-white font-medium">
                        {getBatteryTemperature(slot.battery, slot.telemetry)}
                      </span>
                    </div>
                  )}

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
                        <span
                          className="text-cyan-400 font-semibold truncate"
                          title={slot.userName}
                        >
                          {slot.userName}
                        </span>

                        {slot.userPhone && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <a
                              href={`tel:${slot.userPhone}`}
                              title="Call customer"
                              className="text-gray-400 hover:text-green-400"
                            >
                              <PhoneCall size={14} className="text-green-500" />
                            </a>
                            <span className="text-gray-600">|</span>
                            <a
                              href={`https://wa.me/${formatWhatsAppNumber(slot.userPhone)}`}
                              title="WhatsApp customer"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-green-400"
                            >
                              <FaWhatsapp size={16} className="text-green-500" />
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-600">None</span>
                    )}
                  </div>

                  {slot.pendingManualUnlock && (
                    <div className="bg-amber-900/40 border border-amber-600/40 rounded-lg p-3 text-sm">
                      <p className="text-amber-300 font-semibold">
                        Manual withdrawal paid
                      </p>
                      <p className="text-amber-400/80 text-xs mt-1">
                        Press Unlock to release battery.
                      </p>
                    </div>
                  )}

                  <div className="border-t border-gray-700/50 pt-3 mt-3">
                    <p className="text-xs font-bold text-gray-400 mb-2">
                      Quick actions
                    </p>

                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-900/50 border border-gray-700/60 p-3">
                      <div className="col-span-2 text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400 mt-1 mb-1">
                        01 / Device
                      </div>

                      {!slot.awaitingWithdrawal && (
                        <button
                          onClick={() =>
                            onShowConfirmation(
                              () => {
                                onSendCommand(slot.slotIdentifier, toggleCommand);
                                window.setTimeout(() => {
                                  void refreshStatus();
                                }, 1500);
                              },
                              `${toggleLabel} Slot?`,
                              `Are you sure you want to ${doorIsLocked ? 'unlock' : 'lock'} slot ${slot.slotIdentifier}?`,
                              false
                            )
                          }
                          disabled={isRentalOccupied || Boolean(pendingCommand)}
                          title={
                            isRentalOccupied
                              ? 'Rental batteries are handled with Rental Withdrawal.'
                              : `Currently ${slot.doorStatus || 'unknown'}`
                          }
                          className={`${actionButtonBase} ${doorIsLocked
                              ? 'border-emerald-500/60 bg-emerald-600/20 text-emerald-200 hover:bg-emerald-600/35 focus-visible:ring-emerald-400'
                              : 'border-rose-500/60 bg-rose-600/20 text-rose-200 hover:bg-rose-600/35 focus-visible:ring-rose-400'
                            }`}
                        >
                          {toggleLabel}
                        </button>
                      )}

                      {slot.telemetry?.relayOn === true ? (
                        <button
                          onClick={() =>
                            onShowConfirmation(
                              () => {
                                onSendCommand(slot.slotIdentifier, {
                                  stopCharging: true,
                                });
                                window.setTimeout(() => {
                                  void refreshStatus();
                                }, 1500);
                              },
                              'Stop Charging?',
                              `Are you sure you want to stop charging on slot ${slot.slotIdentifier}?`,
                              true
                            )
                          }
                          disabled={Boolean(pendingCommand)}
                          className={`${actionButtonBase} border-orange-500/60 bg-orange-600/20 hover:bg-orange-600/35 hover:border-orange-400 text-orange-200 focus-visible:ring-orange-400`}
                        >
                          Stop Charging
                        </button>
                      ) : slot.status === 'disabled' ? (
                        <button
                          onClick={() =>
                            onShowConfirmation(
                              () =>
                                onSendCommand(slot.slotIdentifier, {
                                  enableSlot: true,
                                }),
                              'Enable Slot?',
                              `Are you sure you want to enable slot ${slot.slotIdentifier}?`,
                              false
                            )
                          }
                          disabled={Boolean(pendingCommand)}
                          className={`${actionButtonBase} border-emerald-500/60 bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-200 focus-visible:ring-emerald-400`}
                        >
                          Enable Slot
                        </button>
                      ) : slot.battery ? (
                        <button
                          onClick={() =>
                            onShowConfirmation(
                              () => {
                                onSendCommand(slot.slotIdentifier, {
                                  startCharging: true,
                                });
                                window.setTimeout(() => {
                                  void refreshStatus();
                                }, 1500);
                              },
                              'Start Charging?',
                              `Are you sure you want to start charging on slot ${slot.slotIdentifier}?`,
                              false
                            )
                          }
                          disabled={Boolean(pendingCommand)}
                          className={`${actionButtonBase} border-blue-500/60 bg-blue-600/20 hover:bg-blue-600/35 hover:border-blue-400 text-blue-200 focus-visible:ring-blue-400`}
                        >
                          Start Charging
                        </button>
                      ) : null}

                      <div className="col-span-2 text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400 mt-3 mb-1 border-t border-gray-700/50 pt-3">
                        02 / Battery &amp; rentals
                      </div>

                      {onManualWithdraw &&
                        slot.userName &&
                        !slot.pendingManualUnlock &&
                        !slot.awaitingWithdrawal &&
                        !isRentalOccupied && (
                          <button
                            onClick={() =>
                              onShowConfirmation(
                                () =>
                                  onManualWithdraw(
                                    slot.slotIdentifier,
                                    booth.booth_uid
                                  ),
                                'Manual Withdraw?',
                                `Manually withdraw the battery from slot ${slot.slotIdentifier}? The customer's deposit will be redeemed, cost calculated, and slot released.`,
                                true
                              )
                            }
                            className={`${actionButtonBase} border-orange-500/50 bg-orange-900/20 hover:bg-orange-900/40 text-orange-200 focus-visible:ring-orange-400`}
                          >
                            Manual Withdraw
                          </button>
                        )}

                      {slot.hasPhysicalBattery &&
                        !slot.isRentalPool &&
                        !slot.userName &&
                        !slot.awaitingWithdrawal &&
                        !slot.pendingManualUnlock &&
                        ![
                          'disabled',
                          'maintenance',
                          'faulty',
                          'opening',
                        ].includes(slot.status) && (
                          <button
                            onClick={() =>
                              handleConvertToRental(
                                slot.slotIdentifier,
                                slot.batteryUid
                              )
                            }
                            disabled={Boolean(pendingCommand)}
                            title="Register this existing battery as a rental battery"
                            className="col-span-2 w-full min-h-[42px] px-3 py-2 rounded-lg border border-sky-500/50 bg-sky-600/20 hover:bg-sky-600/35 text-sky-100 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Convert to Rental
                          </button>
                        )}

                      {onWithdrawRental &&
                        isRentalOccupied &&
                        slot.batteryUid && (
                          <button
                            onClick={() =>
                              onShowConfirmation(
                                () =>
                                  onWithdrawRental(
                                    slot.slotIdentifier,
                                    slot.batteryUid as string
                                  ),
                                'Rental Withdrawal?',
                                `Withdraw rental battery ${slot.batteryUid} from slot ${slot.slotIdentifier}?`,
                                true
                              )
                            }
                            className={`${actionButtonBase} border-purple-500/50 bg-purple-600/20 hover:bg-purple-600/35 text-purple-200 focus-visible:ring-purple-400`}
                          >
                            Rental Withdrawal
                          </button>
                        )}

                      <div className="col-span-2 text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400 mt-3 mb-1 border-t border-gray-700/50 pt-3">
                        03 / Manage slot
                      </div>

                      {onReconcileDeposit &&
                        !slot.isRentalPool &&
                        slot.status !== 'disabled' &&
                        slot.battery && (
                          <button
                            onClick={() =>
                              onReconcileDeposit(slot.slotIdentifier)
                            }
                            title="Re-sync a deposit if the battery is still present."
                            className={`${actionButtonBase} border-cyan-500/50 bg-cyan-600/20 hover:bg-cyan-600/35 text-cyan-200 focus-visible:ring-cyan-400`}
                          >
                            Re-sync Deposit
                          </button>
                        )}

                      <button
                        onClick={() =>
                          onShowConfirmation(
                            () => onResetSlot(slot.slotIdentifier),
                            'Reset Slot?',
                            `Reset slot ${slot.slotIdentifier}? This will clear its linked battery data.`,
                            true
                          )
                        }
                        className={`${actionButtonBase} border-slate-600/50 bg-slate-800 hover:bg-slate-700 text-slate-100 focus-visible:ring-sky-500`}
                      >
                        Reset Slot
                      </button>

                      {slot.status !== 'disabled' && (
                        <button
                          onClick={() =>
                            onShowConfirmation(
                              () =>
                                onUpdateSlotStatus(
                                  slot.slotIdentifier,
                                  'disabled'
                                ),
                              'Disable Slot?',
                              `Disable slot ${slot.slotIdentifier}?`,
                              true
                            )
                          }
                          disabled={isOccupied}
                          title={
                            isOccupied
                              ? 'Slot is occupied. Empty it before disabling.'
                              : undefined
                          }
                          className={`${actionButtonBase} border-rose-500/50 bg-rose-600/10 hover:bg-rose-600/25 text-rose-200 focus-visible:ring-rose-400`}
                        >
                          Disable Slot
                        </button>
                      )}

                      {!isOccupied && (
                        <button
                          onClick={() =>
                            onShowConfirmation(
                              () => onDeleteSlot(slot.slotIdentifier),
                              'Delete Slot?',
                              `Permanently delete slot ${slot.slotIdentifier}? This cannot be undone.`,
                              true
                            )
                          }
                          className="col-span-2 w-full min-h-[40px] px-3 py-2 rounded-lg border border-rose-900/60 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-rose-500"
                        >
                          Delete Slot
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">
            <p>This booth has no slots configured.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoothDetailView;