import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BatteryCharging,
  BatteryFull,
  BatteryMedium,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Settings,
  UserRound,
  Wrench,
  X,
  XCircle,
} from 'lucide-react';

import RentalBatteryCard from './RentalBatteryCard';
import RentalBatteryDetails from './RentalBatteryDetails';
import {
  getRentalFleet,
  createRentalBattery,
  withdrawRentalBattery,
  getBoothStatus,
} from '../../../services/adminService';

import type {
  AdminBoothStatus,
} from '../../../services/adminService';

import type {
  RentalBattery,
  CurrentRental,
} from './types';

const RentalManagement: React.FC = () => {
  const [selectedBattery, setSelectedBattery] =
    useState<RentalBattery | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  const [statusFilter, setStatusFilter] = useState<
    'all' | RentalBattery['status'] | 'withdrawn'
  >('all');

  const [batteries, setBatteries] = useState<RentalBattery[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  /*
   * ============================================================
   * ADD BATTERY MODAL
   * ============================================================
   */

  const [showAddModal, setShowAddModal] = useState(false);

  const [addingBattery, setAddingBattery] = useState(false);

  const [addForm, setAddForm] = useState({
    batteryUid: '',
    batteryType: 'E-Bike',
    boothUid: '',
    slotIdentifier: '',
    notes: '',
  });

  const [boothOptions, setBoothOptions] =
    useState<AdminBoothStatus[]>([]);

  const [loadingBooths, setLoadingBooths] =
    useState(false);

  const [boothOptionsError, setBoothOptionsError] =
    useState<string | null>(null);

  /*
   * ============================================================
   * WITHDRAW BATTERY MODAL
   * ============================================================
   */

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const [withdrawBattery, setWithdrawBattery] =
    useState<RentalBattery | null>(null);

  const [withdrawReason, setWithdrawReason] = useState('');

  const [withdrawNotes, setWithdrawNotes] = useState('');

  const [withdrawingBattery, setWithdrawingBattery] =
    useState(false);

  /*
   * ============================================================
   * FORMAT DATE
   * ============================================================
   */

  const formatUpdated = useCallback((value?: string) => {
    if (!value) return 'N/A';

    const then = new Date(value).getTime();

    const diffMs = Date.now() - then;

    if (diffMs < 0) return 'just now';

    const mins = Math.floor(diffMs / 60000);

    if (mins < 1) return 'just now';

    if (mins < 60) {
      return `${mins} min ago`;
    }

    const hours = Math.floor(mins / 60);

    if (hours < 24) {
      return `${hours}h ago`;
    }

    return `${Math.floor(hours / 24)}d ago`;
  }, []);

  /*
   * ============================================================
   * LOAD RENTAL FLEET
   * ============================================================
   */

  const loadFleet = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const fleet = await getRentalFleet();

      const fleetBatteries: RentalBattery[] = [];

      /*
       * Batteries currently issued to riders
       */
      for (const issued of fleet.issued) {
        const currentRental: CurrentRental = {
          sessionId: String(issued.sessionId),

          renter: {
            id:
              issued.user.email ||
              issued.user.phone ||
              '',

            name:
              issued.user.name ||
              issued.user.email ||
              'Rider',

            phone:
              issued.user.phone ||
              '',
          },

          startTime: issued.rentedAt,

          durationMinutes: 0,
          startSoc: 0,
          currentSoc: 0,
          rentalEnergy: 0,
          rentalTime: 0,
          totalAmount: 0,
        };

        fleetBatteries.push({
          id: issued.batteryUid,

          soc: 0,

          slotId:
            `${issued.sourceBoothUid} / ${issued.sourceSlotIdentifier}`,

          status: 'issued',

          lastUpdated: formatUpdated(issued.rentedAt),

          currentRental,
        });
      }

      /*
       * Batteries currently inside booth slots
       */
      for (const inSlot of fleet.inSlots) {
        fleetBatteries.push({
          id: inSlot.batteryUid,

          soc: inSlot.chargeLevel ?? 0,

          slotId:
            `${inSlot.boothUid} / ${inSlot.slotIdentifier}`,

          status:
            inSlot.chargeLevel !== null &&
              inSlot.chargeLevel < 30
              ? 'charging'
              : 'available',

          lastUpdated: 'Now',
        });
      }

      setBatteries(fleetBatteries);
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
        'Failed to load the rental fleet.';

      setError(message);

      setBatteries([]);
    } finally {
      setLoading(false);
    }
  }, [formatUpdated]);

  /*
   * ============================================================
   * INITIAL LOAD
   * ============================================================
   */

  useEffect(() => {
    loadFleet();
  }, [loadFleet]);

  /*
   * ============================================================
   * LOAD BOOTH OPTIONS FOR ADD BATTERY MODAL
   * ============================================================
   */

  const loadBoothOptions = useCallback(async () => {
    setLoadingBooths(true);
    setBoothOptionsError(null);

    try {
      const booths = await getBoothStatus();

      setBoothOptions(booths);
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
        'Failed to load booths and slots.';

      setBoothOptionsError(message);
    } finally {
      setLoadingBooths(false);
    }
  }, []);

  useEffect(() => {
    loadBoothOptions();
  }, [loadBoothOptions]);

  const selectedBoothSlots = useMemo(() => {
    if (!addForm.boothUid) return [];

    const booth = boothOptions.find(
      (option) => option.boothUid === addForm.boothUid
    );

    return booth?.slots ?? [];
  }, [boothOptions, addForm.boothUid]);

  /*
   * ============================================================
   * SUMMARY STATISTICS
   * ============================================================
   */

  const totalBatteryCount = batteries.length;

  const availableCount = batteries.filter(
    (battery) => battery.status === 'available'
  ).length;

  const issuedCount = batteries.filter(
    (battery) => battery.status === 'issued'
  ).length;

  const chargingCount = batteries.filter(
    (battery) => battery.status === 'charging'
  ).length;

  const maintenanceCount = batteries.filter(
    (battery) => battery.status === 'maintenance'
  ).length;

  const withdrawnCount = batteries.filter(
    (battery) => battery.status === 'withdrawn'
  ).length;

  /*
   * ============================================================
   * FILTER BATTERIES
   * ============================================================
   */

  const filteredBatteries = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return batteries.filter((battery) => {
      const matchesSearch =
        battery.id.toLowerCase().includes(search) ||
        battery.slotId.toLowerCase().includes(search) ||
        (
          battery.currentRental?.renter.name || ''
        )
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        statusFilter === 'all' ||
        battery.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [batteries, searchTerm, statusFilter]);

  /*
   * ============================================================
   * BATTERIES REQUIRING ATTENTION
   * ============================================================
   */

  const attentionBatteries = batteries.filter((battery) => {
    return (
      battery.status === 'maintenance' ||
      (
        battery.status !== 'withdrawn' &&
        battery.soc <= 20
      )
    );
  });

  /*
   * ============================================================
   * ADD BATTERY
   * ============================================================
   */

  const handleAddBattery = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!addForm.batteryUid.trim()) {
      setError('Battery ID is required.');
      return;
    }

    if (!addForm.boothUid.trim()) {
      setError('Booth ID is required.');
      return;
    }

    if (!addForm.slotIdentifier.trim()) {
      setError('Slot identifier is required.');
      return;
    }

    setAddingBattery(true);
    setError(null);
    setSuccessMessage(null);

    try {
      /*
       * Register the battery with the backend so it
       * becomes part of the borrowable rental pool.
       */
      const createdBattery = await createRentalBattery({
        batteryUid: addForm.batteryUid.trim(),
        boothUid: addForm.boothUid.trim(),
        slotIdentifier: addForm.slotIdentifier.trim(),
        notes: addForm.notes.trim() || undefined,
      });

      const newBattery: RentalBattery = {
        id: createdBattery.batteryUid,

        soc: createdBattery.chargeLevel,

        slotId:
          `${createdBattery.boothUid} / ${createdBattery.slotIdentifier}`,

        status:
          createdBattery.chargeLevel < 30
            ? 'charging'
            : 'available',

        lastUpdated: 'Just now',
      };

      setBatteries((previous) => {
        const alreadyExists = previous.some(
          (battery) =>
            battery.id.toLowerCase() ===
            newBattery.id.toLowerCase()
        );

        if (alreadyExists) {
          setError(
            `Battery ${newBattery.id} already exists.`
          );

          return previous;
        }

        return [newBattery, ...previous];
      });

      setAddForm({
        batteryUid: '',
        batteryType: 'E-Bike',
        boothUid: '',
        slotIdentifier: '',
        notes: '',
      });

      setShowAddModal(false);

      setSuccessMessage(
        `Battery ${newBattery.id} placed in ${newBattery.slotId}.`
      );
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

      setError(message);
    } finally {
      setAddingBattery(false);
    }
  };

  /*
   * ============================================================
   * OPEN WITHDRAW MODAL
   * ============================================================
   */

  const openWithdrawModal = (
    battery: RentalBattery
  ) => {
    /*
     * A battery being used by a rider cannot be withdrawn.
     */
    if (battery.status === 'issued') {
      setError(
        'This battery cannot be withdrawn because it is currently issued to a rider.'
      );

      return;
    }

    if (battery.status === 'withdrawn') {
      setError(
        'This battery has already been withdrawn.'
      );

      return;
    }

    setWithdrawBattery(battery);

    setWithdrawReason('');

    setWithdrawNotes('');

    setShowWithdrawModal(true);
  };

  /*
   * ============================================================
   * WITHDRAW BATTERY
   * ============================================================
   */

  const handleWithdrawBattery = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!withdrawBattery) {
      return;
    }

    if (!withdrawReason.trim()) {
      setError('Please provide a withdrawal reason.');
      return;
    }

    setWithdrawingBattery(true);
    setError(null);

    try {
      /*
       * Record the withdrawal with the backend so the
       * battery leaves the borrowable rental pool.
       */
      await withdrawRentalBattery(
        withdrawBattery.id,
        {
          reason: withdrawReason.trim(),
          notes: withdrawNotes.trim(),
        }
      );

      setBatteries((previous) =>
        previous.map((battery) =>
          battery.id === withdrawBattery.id
            ? {
              ...battery,
              status: 'withdrawn',
              lastUpdated: 'Just now',
            }
            : battery
        )
      );

      setShowWithdrawModal(false);

      setWithdrawBattery(null);

      setWithdrawReason('');

      setWithdrawNotes('');
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
        'Failed to withdraw rental battery.';

      setError(message);
    } finally {
      setWithdrawingBattery(false);
    }
  };

  /*
   * ============================================================
   * SELECTED BATTERY
   * ============================================================
   */

  if (selectedBattery) {
    return (
      <RentalBatteryDetails
        battery={selectedBattery}
        onBack={() => setSelectedBattery(null)}
      />
    );
  }

  /*
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (
    <div className="min-h-full bg-gray-950">

      <div className="mx-auto max-w-7xl space-y-6">

        {/* =====================================================
            PAGE HEADER
        ====================================================== */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              Manage rental batteries, monitor battery status,
              add new batteries, and withdraw batteries from
              the rental fleet.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            {/* ADD BATTERY */}

            <button
              type="button"
              onClick={() => {
                setError(null);
                setSuccessMessage(null);
                setShowAddModal(true);
                loadBoothOptions();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />

              Add Rental Battery
            </button>

            {/* REFRESH */}

            <button
              type="button"
              onClick={loadFleet}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm font-semibold text-gray-200 transition hover:border-gray-600 hover:bg-gray-800 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''
                  }`}
              />

              Refresh
            </button>


          </div>
        </div>

        {/* =====================================================
            LOADING
        ====================================================== */}

        {loading && !error && (
          <div className="flex items-center justify-center rounded-2xl border border-gray-800 bg-gray-900 py-16">

            <div className="flex flex-col items-center gap-3">

              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />

              <p className="text-sm text-gray-500">
                Loading rental fleet...
              </p>

            </div>

          </div>
        )}

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-500/30 bg-red-500/5 p-5">

            <div className="flex items-center gap-3">

              <XCircle className="h-6 w-6 text-red-400" />

              <div>

                <p className="text-sm font-semibold text-red-300">
                  Rental Management Error
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

        {/* =====================================================
            SUCCESS
        ====================================================== */}

        {successMessage && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">

            <div className="flex items-center gap-3">

              <CheckCircle2 className="h-6 w-6 text-emerald-400" />

              <div>

                <p className="text-sm font-semibold text-emerald-300">
                  Rental Battery Added
                </p>

                <p className="text-sm text-gray-500">
                  {successMessage}
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

          </div>
        )}

        {/* =====================================================
            BATTERY SUMMARY
        ====================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">

          {/* Total */}

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">

            <div className="flex items-center justify-between">

              <p className="text-sm text-gray-500">
                Total Batteries
              </p>

              <BatteryFull className="h-5 w-5 text-gray-500" />

            </div>

            <p className="mt-3 text-3xl font-bold text-white">
              {totalBatteryCount}
            </p>

            <p className="mt-1 text-xs text-gray-600">
              Rental fleet
            </p>

          </div>

          {/* Available */}

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">

            <div className="flex items-center justify-between">

              <p className="text-sm text-gray-500">
                Available
              </p>

              <CheckCircle2 className="h-5 w-5 text-emerald-400" />

            </div>

            <p className="mt-3 text-3xl font-bold text-emerald-400">
              {availableCount}
            </p>

            <p className="mt-1 text-xs text-gray-600">
              Ready for rental
            </p>

          </div>

          {/* Issued */}

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">

            <div className="flex items-center justify-between">

              <p className="text-sm text-gray-500">
                Issued
              </p>

              <UserRound className="h-5 w-5 text-indigo-400" />

            </div>

            <p className="mt-3 text-3xl font-bold text-indigo-400">
              {issuedCount}
            </p>

            <p className="mt-1 text-xs text-gray-600">
              Currently with riders
            </p>

          </div>

          {/* Charging */}

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">

            <div className="flex items-center justify-between">

              <p className="text-sm text-gray-500">
                Charging
              </p>

              <BatteryCharging className="h-5 w-5 text-yellow-400" />

            </div>

            <p className="mt-3 text-3xl font-bold text-yellow-400">
              {chargingCount}
            </p>

            <p className="mt-1 text-xs text-gray-600">
              Being recharged
            </p>

          </div>

          {/* Maintenance */}

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">

            <div className="flex items-center justify-between">

              <p className="text-sm text-gray-500">
                Maintenance
              </p>

              <Wrench className="h-5 w-5 text-orange-400" />

            </div>

            <p className="mt-3 text-3xl font-bold text-orange-400">
              {maintenanceCount}
            </p>

            <p className="mt-1 text-xs text-gray-600">
              Require attention
            </p>

          </div>

          {/* Withdrawn */}

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">

            <div className="flex items-center justify-between">

              <p className="text-sm text-gray-500">
                Withdrawn
              </p>

              <XCircle className="h-5 w-5 text-red-400" />

            </div>

            <p className="mt-3 text-3xl font-bold text-red-400">
              {withdrawnCount}
            </p>

            <p className="mt-1 text-xs text-gray-600">
              Removed from rental
            </p>

          </div>

        </div>

        {/* =====================================================
            ATTENTION REQUIRED
        ====================================================== */}

        {attentionBatteries.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-orange-500/20 bg-gray-900">

            <div className="border-b border-gray-800 p-5">

              <div className="flex items-start gap-3">

                <div className="rounded-xl bg-orange-500/10 p-2">
                  <AlertTriangle className="h-5 w-5 text-orange-400" />
                </div>

                <div>

                  <h2 className="font-semibold text-white">
                    Attention Required
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Rental batteries that may require administrator attention.
                  </p>

                </div>

              </div>

            </div>

            <div className="divide-y divide-gray-800">

              {attentionBatteries.map((battery) => (
                <div
                  key={battery.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >

                  <div className="flex items-center gap-3">

                    <div className="rounded-xl bg-orange-500/10 p-2">
                      <BatteryMedium className="h-5 w-5 text-orange-400" />
                    </div>

                    <div>

                      <p className="font-semibold text-white">
                        {battery.id}
                      </p>

                      <p className="text-sm text-gray-500">
                        {battery.status === 'maintenance'
                          ? 'Maintenance required'
                          : `Low battery level: ${battery.soc}%`}
                      </p>

                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedBattery(battery)}
                    className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold text-gray-300 transition hover:bg-gray-800"
                  >
                    View Battery
                  </button>

                </div>
              ))}

            </div>

          </div>
        )}

        {/* =====================================================
            BATTERY FLEET
        ====================================================== */}

        <div>

          <div className="mb-4">

            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
              Battery Fleet
            </p>

            <div className="mt-1 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">

              <div>

                <h2 className="text-xl font-bold text-white">
                  Rental Batteries
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Monitor, add, and withdraw rental batteries.
                </p>

              </div>

              <p className="text-sm text-gray-500">

                Showing{' '}

                <span className="font-semibold text-gray-300">
                  {filteredBatteries.length}
                </span>

                {' '}of{' '}

                <span className="font-semibold text-gray-300">
                  {batteries.length}
                </span>

              </p>

            </div>

          </div>

          {/* Search and filters */}

          <div className="mb-5 flex flex-col gap-3 md:flex-row">

            <div className="relative flex-1">

              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search battery ID, slot or rider..."
                className="w-full rounded-xl border border-gray-800 bg-gray-900 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-gray-600 focus:border-indigo-500"
              />

            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                  | 'all'
                  | RentalBattery['status']
                  | 'withdrawn'
                )
              }
              className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-gray-300 outline-none focus:border-indigo-500"
            >

              <option value="all">
                All Statuses
              </option>

              <option value="available">
                Available
              </option>

              <option value="issued">
                Issued
              </option>

              <option value="charging">
                Charging
              </option>

              <option value="maintenance">
                Maintenance
              </option>

              <option value="withdrawn">
                Withdrawn
              </option>

            </select>

          </div>

          {/* Battery cards */}

          {filteredBatteries.length > 0 ? (

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

              {filteredBatteries.map((battery) => (
                <div
                  key={battery.id}
                  className="relative"
                >

                  <RentalBatteryCard
                    battery={battery}
                    onViewDetails={() =>
                      setSelectedBattery(battery)
                    }
                  />

                  {/* WITHDRAW BUTTON */}

                  {battery.status !== 'issued' &&
                    battery.status !== 'withdrawn' && (
                      <button
                        type="button"
                        onClick={() =>
                          openWithdrawModal(battery)
                        }
                        className="mt-3 w-full rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
                      >
                        Withdraw Battery
                      </button>
                    )}

                  {battery.status === 'withdrawn' && (
                    <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-center text-sm font-semibold text-red-400">
                      Withdrawn from Rental
                    </div>
                  )}

                </div>
              ))}

            </div>

          ) : (

            <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900 p-10 text-center">

              <BatteryFull className="mx-auto h-10 w-10 text-gray-700" />

              <h3 className="mt-4 font-semibold text-white">
                No batteries found
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Try changing your search or status filter.
              </p>

            </div>

          )}

        </div>

      </div>

      {/* =======================================================
          ADD BATTERY MODAL
      ======================================================== */}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl">

            {/* Header */}

            <div className="flex items-center justify-between border-b border-gray-800 p-5">

              <div>

                <h2 className="text-lg font-bold text-white">
                  Add Rental Battery
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Register a new battery into the rental fleet.
                </p>

              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* Form */}

            <form
              onSubmit={handleAddBattery}
              className="space-y-5 p-5"
            >

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                {/* Battery ID */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Battery ID / UID
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
                    placeholder="e.g. RENT-BAT-004"
                    className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-indigo-500"
                  />

                </div>

                {/* Battery Type */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Battery Type
                  </label>

                  <select
                    value={addForm.batteryType}
                    onChange={(event) =>
                      setAddForm({
                        ...addForm,
                        batteryType: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                  >

                    <option value="E-Bike">
                      E-Bike
                    </option>

                    <option value="Scooter">
                      Scooter
                    </option>

                    <option value="Car Module">
                      Car Module
                    </option>

                  </select>

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
                        {booth.name} ({booth.boothUid})
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

                    {selectedBoothSlots.map((slot) => {
                      const isOccupied =
                        slot.battery?.isOccupied === true;

                      return (
                        <option
                          key={slot.slotIdentifier}
                          value={slot.slotIdentifier}
                          disabled={isOccupied}
                        >
                          {slot.slotIdentifier}
                          {' — '}
                          {isOccupied ? 'occupied' : slot.status}
                        </option>
                      );
                    })}

                  </select>

                  {addForm.boothUid &&
                    selectedBoothSlots.length === 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      No slots found for this booth.
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
                  onClick={() => setShowAddModal(false)}
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

          </div>

        </div>
      )}

      {/* =======================================================
          WITHDRAW BATTERY MODAL
      ======================================================== */}

      {showWithdrawModal && withdrawBattery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl">

            {/* Header */}

            <div className="flex items-center justify-between border-b border-gray-800 p-5">

              <div>

                <h2 className="text-lg font-bold text-white">
                  Withdraw Battery
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Remove this battery from the rental fleet.
                </p>

              </div>

              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            <form
              onSubmit={handleWithdrawBattery}
              className="space-y-5 p-5"
            >

              {/* Battery */}

              <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">

                <p className="text-xs uppercase tracking-wider text-gray-600">
                  Battery
                </p>

                <p className="mt-1 text-lg font-bold text-white">
                  {withdrawBattery.id}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {withdrawBattery.slotId}
                </p>

              </div>

              {/* Reason */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Withdrawal Reason
                </label>

                <select
                  value={withdrawReason}
                  onChange={(event) =>
                    setWithdrawReason(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-red-500"
                >

                  <option value="">
                    Select a reason
                  </option>

                  <option value="Damaged">
                    Damaged
                  </option>

                  <option value="Faulty">
                    Faulty
                  </option>

                  <option value="Lost">
                    Lost
                  </option>

                  <option value="Battery degradation">
                    Battery degradation
                  </option>

                  <option value="End of life">
                    End of life
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

              </div>

              {/* Notes */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Additional Notes
                </label>

                <textarea
                  value={withdrawNotes}
                  onChange={(event) =>
                    setWithdrawNotes(event.target.value)
                  }
                  rows={4}
                  placeholder="Explain why this battery is being withdrawn..."
                  className="w-full resize-none rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-red-500"
                />

              </div>

              {/* Warning */}

              <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">

                <div className="flex gap-3">

                  <AlertTriangle className="h-5 w-5 shrink-0 text-orange-400" />

                  <p className="text-sm text-gray-400">
                    This battery will be marked as
                    <span className="font-semibold text-red-400">
                      {' '}WITHDRAWN
                    </span>
                    {' '}and will no longer be available for rental.
                  </p>

                </div>

              </div>

              {/* Buttons */}

              <div className="flex justify-end gap-3 border-t border-gray-800 pt-5">

                <button
                  type="button"
                  onClick={() =>
                    setShowWithdrawModal(false)
                  }
                  className="rounded-xl border border-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={withdrawingBattery}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                >

                  {withdrawingBattery && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  Withdraw Battery

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};

export default RentalManagement;