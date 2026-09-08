import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  BatteryFull,
  BatteryMedium,
  CheckCircle2,
  Clock3,
  DollarSign,
  Loader2,
  RefreshCw,
  Search,
  Settings,
  UserRound,
  Wrench,
  XCircle,
} from 'lucide-react';

import RentalBatteryCard from './RentalBatteryCard';
import RentalBatteryDetails from './RentalBatteryDetails';
import { getRentalFleet } from '../../../services/adminService';

import type {
  RentalBattery,
  RentalSession,
  CurrentRental,
} from './types';

const RentalManagement: React.FC = () => {
  const [selectedBattery, setSelectedBattery] =
    useState<RentalBattery | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  const [statusFilter, setStatusFilter] = useState<
    'all' | RentalBattery['status']
  >('all');

  const [batteries, setBatteries] = useState<RentalBattery[]>([]);
  const [sessions, setSessions] = useState<RentalSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /*
   * Format an ISO timestamp into a short human-readable "updated" label.
   */
  const formatUpdated = useCallback((value?: string) => {
    if (!value) return 'N/A';
    const then = new Date(value).getTime();
    const diffMs = Date.now() - then;
    if (diffMs < 0) return 'just now';
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }, []);

  /*
   * Build the fleet view from GET /admin/rentals/fleet.
   */
  const loadFleet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fleet = await getRentalFleet();

      const fleetBatteries: RentalBattery[] = [];
      const fleetSessions: RentalSession[] = [];

      /*
       * Batteries currently out with a user.
       */
      for (const issued of fleet.issued) {
        const currentRental: CurrentRental = {
          sessionId: String(issued.sessionId),
          renter: {
            id: issued.user.email || issued.user.phone || '',
            name: issued.user.name || issued.user.email || 'Rider',
            phone: issued.user.phone || '',
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
          slotId: `${issued.sourceBoothUid} / ${issued.sourceSlotIdentifier}`,
          status: 'issued',
          lastUpdated: formatUpdated(issued.rentedAt),
          currentRental,
        });

        fleetSessions.push({
          id: String(issued.sessionId),
          riderName: issued.user.name || issued.user.email || 'Rider',
          ownBatteryId: '',
          rentalBatteryId: issued.batteryUid,
          startSoc: 0,
          currentSoc: 0,
          durationMinutes: 0,
          amount: 0,
          status: issued.state === 'RETURNED'
            ? 'completed'
            : 'active',
        });
      }

      /*
       * Batteries sitting in a booth slot (rental pool).
       */
      for (const inSlot of fleet.inSlots) {
        fleetBatteries.push({
          id: inSlot.batteryUid,
          soc: inSlot.chargeLevel ?? 0,
          slotId: `${inSlot.boothUid} / ${inSlot.slotIdentifier}`,
          status: inSlot.chargeLevel !== null && inSlot.chargeLevel < 30
            ? 'charging'
            : 'available',
          lastUpdated: 'Now',
        });
      }

      setBatteries(fleetBatteries);
      setSessions(fleetSessions);
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to load the rental fleet.'
      );
      setBatteries([]);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [formatUpdated]);

  useEffect(() => {
    loadFleet();
  }, [loadFleet]);

  /*
   * ------------------------------------------------------------------
   * SUMMARY STATISTICS
   * ------------------------------------------------------------------
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

  const activeSessionCount = sessions.filter(
    (session) => session.status === 'active'
  ).length;

  const totalRevenue = sessions.reduce(
    (total, session) => total + session.amount,
    0
  );

  /*
   * In production this should come from the backend.
   * For now, the mock sessions represent today's revenue.
   */
  const todaysRevenue = totalRevenue;

  /*
   * ------------------------------------------------------------------
   * FILTERED BATTERIES
   * ------------------------------------------------------------------
   */

  const filteredBatteries = useMemo(() => {
    return batteries.filter((battery) => {
      const matchesSearch =
        battery.id
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        battery.slotId
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        battery.currentRental?.renter.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        battery.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  /*
   * ------------------------------------------------------------------
   * ATTENTION REQUIRED
   * ------------------------------------------------------------------
   */

  const attentionBatteries = batteries.filter((battery) => {
    return (
      battery.status === 'maintenance' ||
      battery.soc <= 20
    );
  });

  /*
   * ------------------------------------------------------------------
   * STATUS LABEL
   * ------------------------------------------------------------------
   */

  const getStatusLabel = (status: RentalBattery['status']) => {
    switch (status) {
      case 'available':
        return 'Available';

      case 'issued':
        return 'Issued';

      case 'charging':
        return 'Charging';

      case 'maintenance':
        return 'Maintenance';

      default:
        return status;
    }
  };

  /*
   * ------------------------------------------------------------------
   * IF A BATTERY IS SELECTED
   * ------------------------------------------------------------------
   */

  if (selectedBattery) {
    return (
      <RentalBatteryDetails
        battery={selectedBattery}
        onBack={() => setSelectedBattery(null)}
      />
    );
  }

  return (
    <div className="min-h-full bg-gray-950 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* =========================================================
            PAGE HEADER
        ========================================================== */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-400">
              Administration
            </p>

            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
              Rental Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              Monitor rental batteries, active riders, battery usage,
              returns and rental revenue.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            <button
              type="button"
              onClick={loadFleet}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm font-semibold text-gray-200 transition hover:border-gray-600 hover:bg-gray-800 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm font-semibold text-gray-200 transition hover:border-gray-600 hover:bg-gray-800"
            >
              <Settings className="h-4 w-4" />
              Rental Settings
            </button>

          </div>
        </div>

        {/* Loading / Error state */}
        {loading && !error && (
          <div className="flex items-center justify-center rounded-2xl border border-gray-800 bg-gray-900 py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              <p className="text-sm text-gray-500">Loading rental fleet...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
            <div className="flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-400" />
              <div>
                <p className="text-sm font-semibold text-red-300">
                  Could not load the rental fleet
                </p>
                <p className="text-sm text-gray-500">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={loadFleet}
              className="rounded-lg border border-red-500/40 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/10"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

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

        </div>

        {/* =========================================================
            BUSINESS / REVENUE OVERVIEW
        ========================================================== */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          {/* Active sessions */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Active Rental Sessions
                </p>

                <p className="mt-2 text-3xl font-bold text-white">
                  {activeSessionCount}
                </p>
              </div>

              <div className="rounded-xl bg-indigo-500/10 p-3">
                <Activity className="h-6 w-6 text-indigo-400" />
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-600">
              Riders currently using rental batteries
            </p>

          </div>

          {/* Today's revenue */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Today's Rental Revenue
                </p>

                <p className="mt-2 text-3xl font-bold text-emerald-400">
                  KES {todaysRevenue.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-500/10 p-3">
                <DollarSign className="h-6 w-6 text-emerald-400" />
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-600">
              Revenue from rental sessions today
            </p>

          </div>

          {/* Total revenue */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Rental Revenue
                </p>

                <p className="mt-2 text-3xl font-bold text-emerald-400">
                  KES {totalRevenue.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-500/10 p-3">
                <DollarSign className="h-6 w-6 text-emerald-400" />
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-600">
              Total recorded rental revenue
            </p>

          </div>

        </div>

        {/* =========================================================
            ATTENTION REQUIRED
        ========================================================== */}

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

        {/* =========================================================
            BATTERY FLEET
        ========================================================== */}

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
                  Monitor the status and usage of every rental battery.
                </p>
              </div>

              <p className="text-sm text-gray-500">
                Showing{' '}
                <span className="font-semibold text-gray-300">
                  {filteredBatteries.length}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-gray-300">
                  {batteries.length}
                </span>
              </p>

            </div>

          </div>

          {/* Search + filters */}
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
                  event.target.value as 'all' | RentalBattery['status']
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
            </select>

          </div>

          {/* Battery cards */}
          {filteredBatteries.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

              {filteredBatteries.map((battery) => (
                <RentalBatteryCard
                  key={battery.id}
                  battery={battery}
                  onViewDetails={() =>
                    setSelectedBattery(battery)
                  }
                />
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

        {/* =========================================================
            ACTIVE RENTAL SESSIONS
        ========================================================== */}

        <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">

          <div className="border-b border-gray-800 p-5">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-indigo-400">
                  Live Sessions
                </p>

                <h2 className="mt-1 text-xl font-bold text-white">
                  Rental Sessions
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Monitor riders currently using rental batteries.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">

                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

                {activeSessionCount} Active

              </div>

            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1050px]">

              <thead className="bg-gray-950">

                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">

                  <th className="px-5 py-4">
                    Session
                  </th>

                  <th className="px-5 py-4">
                    Rider
                  </th>

                  <th className="px-5 py-4">
                    Own Battery
                  </th>

                  <th className="px-5 py-4">
                    Rental Battery
                  </th>

                  <th className="px-5 py-4">
                    SoC
                  </th>

                  <th className="px-5 py-4">
                    Duration
                  </th>

                  <th className="px-5 py-4">
                    Amount
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-800">

                {sessions.length > 0 ? (
                  sessions.map((session) => (
                    <tr
                      key={session.id}
                      className="transition hover:bg-gray-800/40"
                    >

                      <td className="px-5 py-4 font-semibold text-white">
                        {session.id}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">

                          <div className="rounded-lg bg-gray-800 p-2">
                            <UserRound className="h-4 w-4 text-gray-400" />
                          </div>

                          <span className="text-gray-300">
                            {session.riderName}
                          </span>

                        </div>
                      </td>

                      <td className="px-5 py-4 text-gray-400">
                        {session.ownBatteryId}
                      </td>

                      <td className="px-5 py-4">

                        <span className="font-semibold text-gray-300">
                          {session.rentalBatteryId}
                        </span>

                      </td>

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-2">

                          <span className="text-gray-300">
                            {session.startSoc}%
                          </span>

                          <span className="text-gray-600">
                            →
                          </span>

                          <span className="font-semibold text-indigo-400">
                            {session.currentSoc}%
                          </span>

                        </div>

                      </td>

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-2 text-gray-300">

                          <Clock3 className="h-4 w-4 text-gray-600" />

                          {session.durationMinutes} min

                        </div>

                      </td>

                      <td className="px-5 py-4 font-semibold text-emerald-400">
                        KES {session.amount.toLocaleString()}
                      </td>

                      <td className="px-5 py-4">

                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold capitalize text-emerald-400">

                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                          {session.status}

                        </span>

                      </td>

                      <td className="px-5 py-4">

                        <button
                          type="button"
                          onClick={() => {
                            const battery = batteries.find(
                              (item) =>
                                item.id === session.rentalBatteryId
                            );

                            if (battery) {
                              setSelectedBattery(battery);
                            }
                          }}
                          className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold text-gray-300 transition hover:border-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-400"
                        >
                          View
                        </button>

                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>

                    <td
                      colSpan={9}
                      className="px-5 py-12 text-center"
                    >
                      <Activity className="mx-auto h-8 w-8 text-gray-700" />

                      <p className="mt-3 font-semibold text-gray-400">
                        No rental sessions
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        There are currently no rental sessions to display.
                      </p>

                    </td>

                  </tr>
                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* =========================================================
            CURRENT RENTAL BREAKDOWN
        ========================================================== */}

        {sessions.length > 0 && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">

              <div className="flex items-center gap-3">

                <div className="rounded-xl bg-indigo-500/10 p-3">
                  <BatteryCharging className="h-5 w-5 text-indigo-400" />
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Rental Energy
                  </p>

                  <p className="mt-1 text-xl font-bold text-white">
                    KES 240
                  </p>
                </div>

              </div>

              <p className="mt-3 text-xs text-gray-600">
                Energy consumed by the rental battery.
              </p>

            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">

              <div className="flex items-center gap-3">

                <div className="rounded-xl bg-yellow-500/10 p-3">
                  <Clock3 className="h-5 w-5 text-yellow-400" />
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Rental Time
                  </p>

                  <p className="mt-1 text-xl font-bold text-white">
                    KES 100
                  </p>
                </div>

              </div>

              <p className="mt-3 text-xs text-gray-600">
                Time-based rental charge for the active session.
              </p>

            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-gray-900 p-5">

              <div className="flex items-center gap-3">

                <div className="rounded-xl bg-emerald-500/10 p-3">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Current Rental Total
                  </p>

                  <p className="mt-1 text-xl font-bold text-emerald-400">
                    KES 340
                  </p>
                </div>

              </div>

              <p className="mt-3 text-xs text-gray-600">
                Energy plus time charges for the active rental.
              </p>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default RentalManagement;