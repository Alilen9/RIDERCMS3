import RentalFlow, {
  AssignedRental,
} from '@/components/user/RentalFlow';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import * as boothService from '../../services/boothService';

/**
 * Route state passed by `UserDashboard.openRental` when the rider taps
 * "Rent a Battery": the pre-assigned pool battery and the booth that hosts it.
 */
interface RentalLocationState {
  boothUid?: string;
  boothName?: string;
  assignedRental?: AssignedRental;
}

const RentalPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = (location.state || {}) as RentalLocationState;

  const [bootstrapping, setBootstrapping] = useState(true);
  const [config, setConfig] =
    useState<boothService.RentalFeatureStatus | null>(null);
  const [activeRental, setActiveRental] =
    useState<boothService.ActiveRentalResponse | null>(null);
  const [boothName, setBoothName] = useState(
    routeState.boothName || ''
  );
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const status = await boothService.getRentalFeatureStatus();

        if (cancelled) return;

        if (!status.enabled) {
          navigate('/dashboard', { replace: true });
          return;
        }

        setConfig(status);

        // Resume an in-flight rental if one exists (e.g. after a refresh).
        const current = await boothService.getActiveRental();

        if (!cancelled) setActiveRental(current);

        // Resolve the booth's display name when it was not passed via route
        // state (e.g. after a hard refresh mid-rental).
        if (!routeState.boothName && current) {
          const uid =
            routeState.boothUid ||
            current.sourceSlot.boothUid ||
            current.ownDeposit.boothUid ||
            '';

          if (uid) {
            try {
              const publicBooths = await boothService.getBooths();
              const match = publicBooths.find(
                (b) => b.booth_uid === uid
              );
              if (!cancelled && match) {
                setBoothName(match.name);
              }
            } catch {
              // Name is cosmetic — fall back to the UID.
            }
          }
        }
      } catch {
        if (!cancelled) {
          setError(
            'Unable to load the rental service. Please try again.'
          );
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [navigate, routeState.boothName, routeState.boothUid]);

  if (bootstrapping) {
    return (
      <div className="flex min-h-full items-center justify-center px-4 py-16">
        <div className="text-center">
          <Loader2
            size={36}
            className="mx-auto animate-spin text-indigo-400"
          />
          <p className="mt-4 text-gray-400">
            Preparing your rental…
          </p>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="flex min-h-full items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-gray-900 p-8 text-center">
          <h2 className="text-2xl font-bold text-white">
            Rental unavailable
          </h2>
          <p className="mt-2 text-gray-400">
            {error ||
              'The rental service is temporarily unavailable.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mt-6 w-full rounded-2xl bg-gray-800 py-3 font-semibold text-gray-300 transition hover:bg-gray-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Nothing to do: no in-flight rental and no freshly assigned battery.
  if (!activeRental && !routeState.assignedRental) {
    return (
      <div className="flex min-h-full items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-gray-800 bg-gray-900 p-8 text-center">
          <h2 className="text-2xl font-bold text-white">
            No rental in progress
          </h2>
          <p className="mt-2 text-gray-400">
            Start a rental from your dashboard and we'll open a
            battery slot for you.
          </p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mt-6 w-full rounded-2xl bg-indigo-600 py-4 font-semibold text-white transition hover:bg-indigo-500"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const boothUid =
    routeState.boothUid ||
    activeRental?.sourceSlot.boothUid ||
    activeRental?.ownDeposit.boothUid ||
    '';

  return (
    <RentalFlow
      config={config}
      boothUid={boothUid}
      boothName={boothName || routeState.boothName || ''}
      assignedRental={routeState.assignedRental ?? null}
      initialActiveRental={activeRental}
      onClose={() => navigate('/dashboard')}
    />
  );
};

export default RentalPage;
