import React from 'react';
import {
  Battery,
  BatteryCharging,
  CheckCircle2,
  Clock,
  MapPin,
  MoreVertical,
  Zap,
} from 'lucide-react';

import type { RentalBattery } from './types';

interface RentalBatteryCardProps {
  battery: RentalBattery;
  onViewDetails?: (battery: RentalBattery) => void;
}

const RentalBatteryCard: React.FC<RentalBatteryCardProps> = ({
  battery,
  onViewDetails,
}) => {
  const getStatusConfig = () => {
    switch (battery.status) {
      case 'available':
        return {
          label: 'Available',
          className: 'bg-green-100 text-green-700',
          icon: CheckCircle2,
        };

      case 'issued':
        return {
          label: 'Issued',
          className: 'bg-blue-100 text-blue-700',
          icon: Battery,
        };

      case 'charging':
        return {
          label: 'Charging',
          className: 'bg-yellow-100 text-yellow-700',
          icon: BatteryCharging,
        };

      case 'maintenance':
        return {
          label: 'Maintenance',
          className: 'bg-red-100 text-red-700',
          icon: Clock,
        };

      default:
        return {
          label: 'Unknown',
          className: 'bg-gray-100 text-gray-700',
          icon: Battery,
        };
    }
  };

  const status = getStatusConfig();
  const StatusIcon = status.icon;

  const getSocColor = () => {
    if (battery.soc >= 70) {
      return 'text-green-600';
    }

    if (battery.soc >= 40) {
      return 'text-yellow-600';
    }

    return 'text-red-600';
  };

  const getProgressColor = () => {
    if (battery.soc >= 70) {
      return 'bg-green-500';
    }

    if (battery.soc >= 40) {
      return 'bg-yellow-500';
    }

    return 'bg-red-500';
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
            <Battery className="h-6 w-6 text-gray-700" />
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">
              {battery.id}
            </h3>

            <p className="text-sm text-gray-500">
              Rental Battery
            </p>
          </div>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          aria-label="Battery options"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      {/* Status */}
      <div className="mt-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
        >
          <StatusIcon className="h-3.5 w-3.5" />
          {status.label}
        </span>
      </div>

      {/* Battery Level */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Battery Level
          </span>

          <span className={`text-lg font-bold ${getSocColor()}`}>
            {battery.soc}%
          </span>
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all ${getProgressColor()}`}
            style={{
              width: `${Math.max(
                0,
                Math.min(100, battery.soc)
              )}%`,
            }}
          />
        </div>
      </div>

      {/* Battery Information */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-gray-50 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5" />
            Slot
          </div>

          <p className="mt-1 font-medium text-gray-900">
            {battery.slotId}
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3.5 w-3.5" />
            Updated
          </div>

          <p className="mt-1 font-medium text-gray-900">
            {battery.lastUpdated}
          </p>
        </div>
      </div>

      {/* Energy Indicator */}
      <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
        <Zap className="h-4 w-4 text-yellow-500" />
        <span>
          {battery.soc >= 70
            ? 'Ready for rental'
            : battery.soc >= 40
              ? 'Partially charged'
              : 'Low battery'}
        </span>
      </div>

      {/* Details Button */}
      {onViewDetails && (
        <button
          type="button"
          onClick={() => onViewDetails(battery)}
          className="mt-5 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          View Details
        </button>
      )}
    </div>
  );
};

export default RentalBatteryCard;