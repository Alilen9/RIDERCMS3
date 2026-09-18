import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  X,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  createRentalBattery,
  getBoothStatus,
  getRentalPlacementStatus,
  cancelRentalPlacement,
} from '../../../services/adminService';

import type {
  AdminBoothStatus,
  RentalPlacementStatus,
} from '../../../services/adminService';

type PendingPlacement = {
  placementId: string;
  batteryUid: string;
  chargeLevel: number;
  boothUid: string;
  slotIdentifier: string;
};

interface AddRentalBatteryPageProps {
  onBack: () => void;
}

const AddRentalBatteryPage: React.FC<AddRentalBatteryPageProps> = ({
  onBack,
}) => {
  const [addForm, setAddForm] = useState({
    batteryUid: '',
    boothUid: '',
    slotIdentifier: '',
    notes: '',
  });

  const [addingBattery, setAddingBattery] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [boothOptions, setBoothOptions] =
    useState<AdminBoothStatus[]>([]);

  const [loadingBooths, setLoadingBooths] =
    useState(false);

  const [boothOptionsError, setBoothOptionsError] =
    useState<string | null>(null);

  const [pendingPlacement, setPendingPlacement] =
    useState<PendingPlacement | null>(null);

  const [placementPhase, setPlacementPhase] =
    useState<RentalPlacementStatus>('opening');

  const [placementError, setPlacementError] =
    useState<string | null>(null);

  const showError = (message: string) => {
    setError(message);
    toast.error(message, { duration: 6000 });
  };

  useEffect(() => {
    let disposed = false;

    const load = async () => {
      setLoadingBooths(true);
      setBoothOptionsError(null);

      try {
        const booths = await getBoothStatus();

        if (disposed) return;

        setBoothOptions(booths);
      } catch (err) {
        if (disposed) return;

        const message =
          (
            err as {
              response?: {
                data?: {
                  error?: string;
                };
              };
            }
          )?.response?.data?.error ||
          'Failed to load booths and slots.';

        setBoothOptionsError(message);
      } finally {
        if (!disposed) {
          setLoadingBooths(false);
        }
      }
    };

    load();

    return () => {
      disposed = true;
    };
  }, []);

  const selectedBoothSlots = useMemo(() => {
    if (!addForm.boothUid) return [];

    const booth = boothOptions.find(
      (option) => option.boothUid === addForm.boothUid
    );

    return booth?.slots ?? [];
  }, [boothOptions, addForm.boothUid]);

  // Rental batteries can only be placed into empty slots, so only surface
  // slots that are not occupied. Statuses other than 'available'/'booting'
  // (disabled, error, maintenance, offline, ...) mean the slot cannot be used.
  const availableSlots = useMemo(() => {
    const unusableStatuses = new Set([
      'occupied',
      'disabled',
      'error',
      'maintenance',
      'offline',
      'fault',
      'faulty',
    ]);

    return selectedBoothSlots.filter(
      (slot) =>
        slot.battery?.isOccupied !== true &&
        !unusableStatuses.has(slot.status)
    );
  }, [selectedBoothSlots]);

  const goBack = () => {
    onBack();
  };

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!addForm.batteryUid.trim()) {
      showError('Serial number is required.');
      return;
    }

    if (!addForm.boothUid.trim()) {
      showError('Booth ID is required.');
      return;
    }

    if (!addForm.slotIdentifier.trim()) {
      showError('Slot identifier is required.');
      return;
    }

    setAddingBattery(true);
    setError(null);

    try {
      /*
       * Register the battery with the backend so it
       * becomes part of the borrowable rental pool. For a
       * real booth the backend reserves the slot ('opening'),
       * opens the door, and waits for the battery to be
       * physically inserted.
       */
      const createdBattery = await createRentalBattery({
        batteryUid: addForm.batteryUid.trim(),
        boothUid: addForm.boothUid.trim(),
        slotIdentifier: addForm.slotIdentifier.trim(),
        notes: addForm.notes.trim() || undefined,
      });

      setAddForm({
        batteryUid: '',
        boothUid: '',
        slotIdentifier: '',
        notes: '',
      });

      /*
       * Placement pending: switch to the confirmation flow
       * that polls until the battery is detected in the slot.
       */
      if (
        createdBattery.placement &&
        createdBattery.placement.status === 'opening'
      ) {
        setPendingPlacement({
          placementId: createdBattery.placement.placementId,
          batteryUid: createdBattery.batteryUid,
          chargeLevel: createdBattery.chargeLevel,
          boothUid: createdBattery.boothUid,
          slotIdentifier: createdBattery.slotIdentifier,
        });

        setPlacementPhase('opening');
        setPlacementError(null);

        return;
      }

      toast.success(
        `Battery ${createdBattery.batteryUid} placed in ${createdBattery.boothUid} / ${createdBattery.slotIdentifier}.`
      );

      onBack();
    } catch (err) {
      const message =
        (
          err as {
            response?: {
              data?: {
                error?: string;
              };
            };
          }
        )?.response?.data?.error ||
        'Failed to add rental battery.';

      showError(message);
    } finally {
      setAddingBattery(false);
    }
  };

  /*
   * ============================================================
   * PLACEMENT POLLING
   * ============================================================
   */

  useEffect(() => {
    if (!pendingPlacement) return;

    if (
      placementPhase === 'placed' ||
      placementPhase === 'timeout' ||
      placementPhase === 'cancelled' ||
      placementPhase === 'reverted'
    ) {
      return;
    }

    let disposed = false;

    const poll = async () => {
      try {
        const response = await getRentalPlacementStatus(
          pendingPlacement.placementId
        );

        if (disposed) return;

        setPlacementError(null);

        setPlacementPhase(response.status);
      } catch (err) {
        if (disposed) return;

        const message =
          (
            err as {
              response?: {
                data?: {
                  error?: string;
                };
              };
            }
          )?.response?.data?.error ||
          'Failed to check placement status.';

        setPlacementError(message);
      }
    };

    poll();

    const interval = setInterval(poll, 2000);

    return () => {
      disposed = true;

      clearInterval(interval);
    };
  }, [pendingPlacement, placementPhase]);

  /*
   * ============================================================
   * PLACEMENT COMPLETION / FAILURE
   * ============================================================
   */

  useEffect(() => {
    if (
      !pendingPlacement ||
      placementPhase === 'opening' ||
      placementPhase === 'waiting'
    ) {
      return;
    }

    if (placementPhase === 'placed') {
      toast.success(
        `Battery ${pendingPlacement.batteryUid} placed in ${pendingPlacement.boothUid} / ${pendingPlacement.slotIdentifier}.`
      );

      onBack();
    } else if (placementPhase === 'timeout') {
      toast.error(
        `Placement timed out. No battery was detected in slot ${pendingPlacement.slotIdentifier} — the slot has been returned to available.`
      );

      onBack();
    } else if (placementPhase === 'cancelled') {
      toast.success(
        `Placement cancelled. Slot ${pendingPlacement.slotIdentifier} is available again.`
      );

      onBack();
    } else if (placementPhase === 'reverted') {
      toast.error(
        `Placement reverted. Slot ${pendingPlacement.slotIdentifier} is available again.`
      );

      onBack();
    }

    setPendingPlacement(null);
    setPlacementPhase('opening');
    setPlacementError(null);
  }, [pendingPlacement, placementPhase, onBack]);

  /*
   * ============================================================
   * CANCEL PLACEMENT
   * ============================================================
   */

  const handleCancelPlacement = async () => {
    if (!pendingPlacement) return;

    setPlacementError(null);

    try {
      const response = await cancelRentalPlacement(
        pendingPlacement.placementId
      );

      setPlacementPhase(response.status);
    } catch (err) {
      const message =
        (
          err as {
            response?: {
              data?: {
                error?: string;
              };
            };
          }
        )?.response?.data?.error ||
        'Failed to cancel placement.';

      setPlacementError(message);
    }
  };

  return (
    <div className="min-h-full bg-gray-950">

      <div className="space-y-6 ">

        {/* HEADER */}

        <div className="flex items-center justify-between gap-4">

          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm font-semibold text-gray-200 transition hover:border-gray-600 hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />

            Back to Fleet
          </button>

        </div>

        {/* ERROR */}

        {error && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-500/30 bg-red-500/5 p-5">

            <div className="flex items-center gap-3">

              <XCircle className="h-6 w-6 text-red-400" />

              <div>

                <p className="text-sm font-semibold text-red-300">
                  Add Rental Battery Error
                </p>

                <p className="text-sm text-gray-500">
                  {error}
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={() => setError(null)}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

          </div>
        )}

        {/* FORM / PLACEMENT FLOW */}

        {pendingPlacement ? (

          <div className="rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl">

            <div className="border-b border-gray-800">

              <h2 className="text-lg font-bold text-white">
                Place Rental Battery
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {pendingPlacement.batteryUid}
                {' '}→{' '}
                {pendingPlacement.boothUid} / {pendingPlacement.slotIdentifier}
              </p>

            </div>

            <div className="space-y-5 p-5">

              {/* Steps */}

              <ol className="space-y-3 text-sm">

                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="text-gray-300">
                    Slot secured — no other rider can claim it
                  </span>
                </li>

                <li className="flex items-center gap-3">
                  {placementPhase === 'opening' ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-indigo-400" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  )}
                  <span className="text-gray-300">
                    Door opening…
                  </span>
                </li>

                <li className="flex items-center gap-3">
                  {placementPhase === 'placed' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <Loader2
                      className={`h-4 w-4 shrink-0 animate-spin ${
                        placementPhase === 'opening'
                          ? 'text-gray-600'
                          : 'text-yellow-400'
                      }`}
                    />
                  )}
                  <span className="text-gray-300">
                    Place battery inside the slot
                    {placementPhase === 'opening' && (
                      <span className="text-gray-500">
                        {' '}(waiting for door)
                      </span>
                    )}
                  </span>
                </li>

                <li className="flex items-center gap-3">
                  {placementPhase === 'placed' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <Loader2
                      className={`h-4 w-4 shrink-0 animate-spin ${
                        placementPhase === 'opening'
                          ? 'text-gray-600'
                          : 'text-indigo-400'
                      }`}
                    />
                  )}
                  <span className="text-gray-300">
                    Confirming battery detected…
                    {placementPhase === 'placed' && (
                      <span className="text-emerald-400 font-semibold">
                        {' '}Done
                      </span>
                    )}
                  </span>
                </li>

              </ol>

              {/* Status / instruction box */}

              {placementPhase === 'opening' ||
              placementPhase === 'waiting' ? (
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-sm text-gray-400">
                  The slot is reserved and the door is open. Physically place
                  battery{' '}
                  <span className="font-semibold text-white">
                    {pendingPlacement.batteryUid}
                  </span>{' '}
                  into slot{' '}
                  <span className="font-semibold text-white">
                    {pendingPlacement.slotIdentifier}
                  </span>{' '}
                  at the booth — the door relocks and charging state is set once
                  the battery is detected.
                </div>
              ) : placementPhase === 'placed' ? (
                <div className="flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                  <p className="text-sm text-gray-400">
                    Battery detected in the slot. Placement complete.
                  </p>
                </div>
              ) : placementPhase === 'timeout' ? (
                <div className="flex gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <XCircle className="h-5 w-5 shrink-0 text-red-400" />
                  <p className="text-sm text-gray-400">
                    No battery was detected within the time limit — the slot has
                    been returned to available.
                  </p>
                </div>
              ) : (
                <div className="flex gap-3 rounded-xl border border-gray-700 bg-gray-800/50 p-4">
                  <XCircle className="h-5 w-5 shrink-0 text-gray-400" />
                  <p className="text-sm text-gray-400">
                    Placement cancelled — the slot is available again.
                  </p>
                </div>
              )}

              {/* Placement error */}

              {placementError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
                  {placementError}
                </div>
              )}

              {/* Buttons */}

              <div className="flex justify-end gap-3 border-t border-gray-800 pt-5">

                {(placementPhase === 'opening' ||
                  placementPhase === 'waiting') && (
                  <button
                    type="button"
                    onClick={handleCancelPlacement}
                    disabled={placementPhase === 'opening'}
                    title={
                      placementPhase === 'opening'
                        ? 'Wait for the door to open before cancelling.'
                        : undefined
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-5 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Cancel Placement
                  </button>
                )}

              </div>

            </div>

          </div>

        ) : (

          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-2xl"
          >

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              {/* Serial Number */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Serial Number
                </label>

                <input
                  type="text"
                  value={addForm.batteryUid}
                  onChange={(event) =>
                    setAddForm({
                      ...addForm,
                      batteryUid: event.target.value,
                    })
                  }
                  placeholder="e.g. R-1091"
                  className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-indigo-500"
                />

              </div>

              {/* Booth */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Booth
                </label>

                <select
                  value={addForm.boothUid}
                  onChange={(event) =>
                    setAddForm({
                      ...addForm,
                      boothUid: event.target.value,
                      slotIdentifier: '',
                    })
                  }
                  className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                  disabled={loadingBooths}
                >

                  <option value="">
                    {loadingBooths
                      ? 'Loading booths...'
                      : 'Select a booth...'}
                  </option>

                  {boothOptions.map((booth) => (
                    <option
                      key={booth.boothUid}
                      value={booth.boothUid}
                    >
                      {booth.name}
                    </option>
                  ))}

                </select>

                {boothOptionsError && (
                  <p className="mt-1 text-xs text-red-400">
                    {boothOptionsError}
                  </p>
                )}

              </div>

              {/* Slot */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Slot
                </label>

                <select
                  value={addForm.slotIdentifier}
                  onChange={(event) =>
                    setAddForm({
                      ...addForm,
                      slotIdentifier: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                  disabled={
                    loadingBooths || !addForm.boothUid
                  }
                >

                  <option value="">
                    {!addForm.boothUid
                      ? loadingBooths
                        ? 'Loading booths...'
                        : 'Select a booth first...'
                      : 'Select a slot...'}
                  </option>

                  {availableSlots.map((slot) => (
                    <option
                      key={slot.slotIdentifier}
                      value={slot.slotIdentifier}
                    >
                      {slot.slotIdentifier} — {slot.status}
                    </option>
                  ))}

                </select>

                {addForm.boothUid &&
                  selectedBoothSlots.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    No slots found for this booth.
                  </p>
                )}

                {addForm.boothUid &&
                  selectedBoothSlots.length > 0 &&
                  availableSlots.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    No available slots for this booth.
                  </p>
                )}

              </div>

            </div>

            {/* Notes */}

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-300">
                Notes
              </label>

              <textarea
                value={addForm.notes}
                onChange={(event) =>
                  setAddForm({
                    ...addForm,
                    notes: event.target.value,
                  })
                }
                rows={3}
                placeholder="Optional notes about this battery..."
                className="w-full resize-none rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-indigo-500"
              />

            </div>

            {/* Buttons */}

            <div className="flex justify-end gap-3 border-t border-gray-800 pt-5">

              <button
                type="button"
                onClick={goBack}
                className="rounded-xl border border-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={addingBattery}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >

                {addingBattery && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                Add Battery

              </button>

            </div>

          </form>

        )}

      </div>

    </div>
  );
};

export default AddRentalBatteryPage;