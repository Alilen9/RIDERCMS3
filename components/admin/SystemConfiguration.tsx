import React, { useState, useEffect } from 'react';
import * as adminService from '../../services/adminService';
import { toast } from 'react-hot-toast';

const SystemConfig: React.FC = () => {
  const [settings, setSettings] =
    useState<adminService.AppSettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);

        const data = await adminService.getSettings();

        setSettings(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load system configuration.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  /* =========================================================
     UPDATE NUMBER / TEXT SETTINGS
  ========================================================= */

  const handleInputChange = (
    category: keyof adminService.AppSettings,
    key: string,
    value: string | number
  ) => {
    setSettings((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        [category]: {
          ...(prev[category] as Record<string, unknown> | undefined),
          [key]: value,
        },
      };
    });
  };

  /* =========================================================
     UPDATE BOOLEAN SETTINGS
  ========================================================= */

  const handleToggleChange = (
    category: keyof adminService.AppSettings,
    key: string,
    value: boolean
  ) => {
    setSettings((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        [category]: {
          ...(prev[category] as Record<string, unknown> | undefined),
          [key]: value,
        },
      };
    });
  };

  /* =========================================================
     SAVE
  ========================================================= */

  const handleSaveChanges = async () => {
    if (!settings) return;

    try {
      setSaving(true);

      await adminService.updateSettings(settings);

      toast.success('Settings updated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     TOGGLE COMPONENT
  ========================================================= */

  const Toggle = ({
    enabled,
    onChange,
    color = 'blue',
  }: {
    enabled: boolean;
    onChange: () => void;
    color?: 'blue' | 'emerald' | 'purple';
  }) => {
    const colorClass =
      color === 'emerald'
        ? 'bg-emerald-600'
        : color === 'purple'
          ? 'bg-purple-600'
          : 'bg-blue-600';

    return (
      <button
        type="button"
        onClick={onChange}
        className={`flex-shrink-0 w-12 h-6 rounded-full relative cursor-pointer transition-colors ${enabled ? colorClass : 'bg-gray-600'
          }`}
      >
        <div
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : ''
            }`}
        />
      </button>
    );
  };

  /* =========================================================
     SKELETON
  ========================================================= */

  const renderSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <div className="h-6 bg-gray-700 rounded w-1/4 mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-10 bg-gray-700 rounded" />
          <div className="h-10 bg-gray-700 rounded" />
          <div className="h-10 bg-gray-700 rounded" />
          <div className="h-10 bg-gray-700 rounded" />
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="h-10 bg-gray-700 rounded" />
      </div>

      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="h-10 bg-gray-700 rounded" />
      </div>
    </div>
  );

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return renderSkeleton();
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return (
      <div className="text-center p-8 text-red-400">
        {error}
      </div>
    );
  }

  /* =========================================================
     DEFAULT RENTAL VALUES
  ========================================================= */

  const rental = settings?.rental;

  const highestSocFirst =
    rental?.allocate_highest_soc_first ?? true;

  const minimumSoc =
    rental?.minimum_soc_percent ?? 50;

  const maxRentalBatteries =
    rental?.max_rental_batteries_per_user ?? 1;

  const rentalTimeLimit =
    rental?.rental_time_limit_minutes ?? 60;

  const rentalEnergyRate =
    rental?.rental_energy_rate_per_kwh ?? 50;

  const rentalTimeRate =
    rental?.rental_time_rate_per_minute ?? 10;

  const requireRentalScan =
    rental?.require_rental_scan_before_issue ?? true;

  const requireReturnScan =
    rental?.require_return_scan ?? true;

  const autoChargeReturned =
    rental?.auto_charge_returned_battery ?? true;

  const allowRentalWhileCharging =
    rental?.allow_rental_while_own_battery_charging ?? true;

  return (
    <div className="animate-fade-in max-w-5xl">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">

        <div>
          <h2 className="text-2xl font-bold text-white">
            System Configuration
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Manage pricing, rental operations and access control.
          </p>
        </div>

        <button
          onClick={handleSaveChanges}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold text-sm"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

      </div>

      <div className="space-y-6">

        {/* ===================================================
            PRICING CONFIGURATION
        ==================================================== */}

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">

          <h3 className="text-lg font-bold mb-1 text-emerald-400">
            Pricing Rules
          </h3>

          <p className="text-sm text-gray-500 mb-5">
            Configure the standard battery swap and charging prices.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Base Swap Fee */}

            <div>
              <label className="block text-xs uppercase text-gray-500 mb-1">
                Base Swap Fee (KES)
              </label>

              <input
                type="number"
                min="0"
                value={
                  settings?.pricing?.base_swap_fee ?? ''
                }
                onChange={(e) =>
                  handleInputChange(
                    'pricing',
                    'base_swap_fee',
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Cost Per KWH */}

            <div>
              <label className="block text-xs uppercase text-gray-500 mb-1">
                Cost Per KWH (KES)
              </label>

              <input
                type="number"
                min="0"
                value={
                  settings?.pricing?.cost_per_kwh ?? ''
                }
                onChange={(e) =>
                  handleInputChange(
                    'pricing',
                    'cost_per_kwh',
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Cost Per Charge */}

            <div>
              <label className="block text-xs uppercase text-gray-500 mb-1">
                Cost Per Charge (%)
              </label>

              <input
                type="number"
                min="0"
                value={
                  settings?.pricing?.cost_per_charge_percent ?? ''
                }
                onChange={(e) =>
                  handleInputChange(
                    'pricing',
                    'cost_per_charge_percent',
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Overtime */}

            <div>
              <label className="block text-xs uppercase text-gray-500 mb-1">
                Overtime Penalty (KES/min)
              </label>

              <input
                type="number"
                min="0"
                value={
                  settings?.pricing?.overtime_penalty_per_min ?? ''
                }
                onChange={(e) =>
                  handleInputChange(
                    'pricing',
                    'overtime_penalty_per_min',
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
              />
            </div>

          </div>
        </div>


        {/* ===================================================
            RENTAL SETTINGS
        ==================================================== */}

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">

          <div className="mb-6">

            <h3 className="text-lg font-bold text-blue-400">
              Rental Settings
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Configure how rental batteries are selected,
              issued, charged and returned.
            </p>

          </div>


          {/* =================================================
              RENTAL PRICING
          ================================================== */}

          <div className="mb-8">

            <h4 className="text-sm font-bold uppercase tracking-wide text-gray-300 mb-4">
              Rental Pricing
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Energy Rate */}

              <div>

                <label className="block text-xs uppercase text-gray-500 mb-1">
                  Rental Energy Rate (KES/kWh)
                </label>

                <input
                  type="number"
                  min="0"
                  value={rentalEnergyRate}
                  onChange={(e) =>
                    handleInputChange(
                      'rental',
                      'rental_energy_rate_per_kwh',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                />

                <p className="text-xs text-gray-600 mt-1">
                  Amount charged for energy consumed from the rental battery.
                </p>

              </div>


              {/* Time Rate */}

              <div>

                <label className="block text-xs uppercase text-gray-500 mb-1">
                  Rental Time Rate (KES/min)
                </label>

                <input
                  type="number"
                  min="0"
                  value={rentalTimeRate}
                  onChange={(e) =>
                    handleInputChange(
                      'rental',
                      'rental_time_rate_per_minute',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                />

                <p className="text-xs text-gray-600 mt-1">
                  Amount charged per minute while using the rental battery.
                </p>

              </div>

            </div>

          </div>


          {/* =================================================
              BATTERY ALLOCATION
          ================================================== */}

          <div className="border-t border-gray-700 pt-6 mb-8">

            <h4 className="text-sm font-bold uppercase tracking-wide text-gray-300 mb-4">
              Battery Allocation
            </h4>


            {/* Highest SOC */}

            <div className="flex items-center justify-between gap-6">

              <div>

                <p className="font-bold text-white">
                  Allocate Highest SOC Battery First
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  Automatically give the rider the available rental
                  battery with the highest State of Charge.
                </p>

              </div>

              <Toggle
                enabled={highestSocFirst}
                onChange={() =>
                  handleToggleChange(
                    'rental',
                    'allocate_highest_soc_first',
                    !highestSocFirst
                  )
                }
              />

            </div>


            {/* SOC Requirement */}

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">

              <div>

                <label className="block text-xs uppercase text-gray-500 mb-1">
                  Minimum Rental Battery SOC (%)
                </label>

                <input
                  type="number"
                  min="0"
                  max="100"
                  value={minimumSoc}
                  onChange={(e) =>
                    handleInputChange(
                      'rental',
                      'minimum_soc_percent',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                />

                <p className="text-xs text-gray-600 mt-1">
                  Batteries below this SOC will not be offered for rental.
                </p>

              </div>


              {/* Max batteries */}

              <div>

                <label className="block text-xs uppercase text-gray-500 mb-1">
                  Maximum Rental Batteries Per User
                </label>

                <input
                  type="number"
                  min="1"
                  value={maxRentalBatteries}
                  onChange={(e) =>
                    handleInputChange(
                      'rental',
                      'max_rental_batteries_per_user',
                      parseInt(e.target.value, 10) || 1
                    )
                  }
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                />

              </div>

            </div>


            {/* Allocation information */}

            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mt-5">

              <p className="text-sm text-gray-300">

                <span className="font-bold text-blue-400">
                  Current allocation rule:
                </span>{' '}

                {highestSocFirst
                  ? 'The available rental battery with the highest SOC will be allocated first.'
                  : 'The system will use the existing rental allocation order.'}

              </p>

              <div className="mt-3 text-xs text-gray-500 space-y-1">

                <p>Example available fleet:</p>

                <p>R-1082 → 87% SOC</p>

                <p>R-1091 → 94% SOC</p>

                <p>R-1105 → 82% SOC</p>

                {highestSocFirst && (
                  <p className="text-green-400 font-semibold mt-2">
                    R-1091 (94%) will be allocated first.
                  </p>
                )}

              </div>

            </div>

          </div>


          {/* =================================================
              RENTAL TIME
          ================================================== */}

          <div className="border-t border-gray-700 pt-6 mb-8">

            <h4 className="text-sm font-bold uppercase tracking-wide text-gray-300 mb-4">
              Rental Duration
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div>

                <label className="block text-xs uppercase text-gray-500 mb-1">
                  Rental Time Limit (minutes)
                </label>

                <input
                  type="number"
                  min="1"
                  value={rentalTimeLimit}
                  onChange={(e) =>
                    handleInputChange(
                      'rental',
                      'rental_time_limit_minutes',
                      parseInt(e.target.value, 10) || 1
                    )
                  }
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                />

                <p className="text-xs text-gray-600 mt-1">
                  Maximum recommended rental duration before overtime charges apply.
                </p>

              </div>

            </div>

          </div>


          {/* =================================================
              RENTAL SECURITY
          ================================================== */}

          <div className="border-t border-gray-700 pt-6 mb-8">

            <h4 className="text-sm font-bold uppercase tracking-wide text-gray-300 mb-4">
              Rental Security & Verification
            </h4>

            <div className="space-y-5">


              {/* Scan before issue */}

              <div className="flex items-center justify-between gap-6">

                <div>

                  <p className="font-bold text-white">
                    Require Rental Battery QR Scan
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    Rider must scan the assigned rental battery before it
                    can be unlocked.
                  </p>

                </div>

                <Toggle
                  enabled={requireRentalScan}
                  onChange={() =>
                    handleToggleChange(
                      'rental',
                      'require_rental_scan_before_issue',
                      !requireRentalScan
                    )
                  }
                />

              </div>


              {/* Return scan */}

              <div className="flex items-center justify-between gap-6">

                <div>

                  <p className="font-bold text-white">
                    Require QR Scan On Return
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    Rider must scan the rental battery again when returning it.
                  </p>

                </div>

                <Toggle
                  enabled={requireReturnScan}
                  onChange={() =>
                    handleToggleChange(
                      'rental',
                      'require_return_scan',
                      !requireReturnScan
                    )
                  }
                />

              </div>


              {/* Auto charge */}

              <div className="flex items-center justify-between gap-6">

                <div>

                  <p className="font-bold text-white">
                    Automatically Charge Returned Battery
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    After a rental battery is returned, automatically place
                    it into charging status.
                  </p>

                </div>

                <Toggle
                  enabled={autoChargeReturned}
                  onChange={() =>
                    handleToggleChange(
                      'rental',
                      'auto_charge_returned_battery',
                      !autoChargeReturned
                    )
                  }
                />

              </div>


              {/* Own battery charging */}

              <div className="flex items-center justify-between gap-6">

                <div>

                  <p className="font-bold text-white">
                    Allow Rental While Own Battery Is Charging
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    Allows a rider to use a rental battery while their own
                    battery remains in the charging slot.
                  </p>

                </div>

                <Toggle
                  enabled={allowRentalWhileCharging}
                  onChange={() =>
                    handleToggleChange(
                      'rental',
                      'allow_rental_while_own_battery_charging',
                      !allowRentalWhileCharging
                    )
                  }
                />

              </div>

            </div>

          </div>


          {/* =================================================
              RENTAL FLOW SUMMARY
          ================================================== */}

          <div className="border-t border-gray-700 pt-6">

            <h4 className="text-sm font-bold uppercase tracking-wide text-gray-300 mb-4">
              Rental Flow
            </h4>

            <div className="bg-gray-900 border border-gray-700 rounded-lg p-5">

              <div className="space-y-3 text-sm">

                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                    1
                  </span>

                  <span className="text-gray-300">
                    Rider requests a rental battery.
                  </span>
                </div>


                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                    2
                  </span>

                  <span className="text-gray-300">
                    System checks available batteries above{' '}
                    <span className="text-blue-400 font-semibold">
                      {minimumSoc}% SOC
                    </span>.
                  </span>
                </div>


                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                    3
                  </span>

                  <span className="text-gray-300">
                    {highestSocFirst
                      ? 'Highest SOC battery is automatically selected.'
                      : 'Existing allocation order is used.'}
                  </span>
                </div>


                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                    4
                  </span>

                  <span className="text-gray-300">
                    {requireRentalScan
                      ? 'Rider scans the rental battery QR code.'
                      : 'Rental QR verification is optional.'}
                  </span>
                </div>


                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                    5
                  </span>

                  <span className="text-gray-300">
                    Rider uses the rental battery.
                  </span>
                </div>


                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                    6
                  </span>

                  <span className="text-gray-300">
                    {requireReturnScan
                      ? 'Rider scans the rental battery when returning it.'
                      : 'Return QR verification is optional.'}
                  </span>
                </div>


                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                    7
                  </span>

                  <span className="text-gray-300">
                    {autoChargeReturned
                      ? 'Returned battery is automatically placed into charging.'
                      : 'Returned battery remains available for the next configured action.'}
                  </span>
                </div>

              </div>

            </div>

          </div>

        </div>


        {/* ===================================================
            ACCESS CONTROL
        ==================================================== */}

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">

          <h3 className="text-lg font-bold mb-1 text-purple-400">
            Access Control
          </h3>

          <p className="text-sm text-gray-500 mb-5">
            Control who can register and access the system.
          </p>

          <div className="flex items-center justify-between gap-6">

            <div>

              <p className="font-bold text-white">
                Allow Open Registration
              </p>

              <p className="text-sm text-gray-500 mt-1">
                If disabled, only admins can create new user accounts.
              </p>

            </div>

            <Toggle
              enabled={
                settings?.access_control
                  ?.allow_open_registration ?? false
              }
              color="purple"
              onChange={() =>
                handleToggleChange(
                  'access_control',
                  'allow_open_registration',
                  !settings?.access_control
                    ?.allow_open_registration
                )
              }
            />

          </div>

        </div>

      </div>
    </div>
  );
};

export default SystemConfig;