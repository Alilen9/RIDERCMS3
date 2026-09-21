import React, { useCallback, useEffect, useState } from 'react';
import { Battery, Loader2, MapPin, ShieldCheck } from 'lucide-react';

import * as boothService from '../../services/boothService';

import QrScanner from './QrScanner';
import RentalSessionActive from './rental/RentalSessionActive';
import ReturnRentalBattery from './rental/ReturnRentalBattery';
import VerifyRentalReturn from './rental/VerifyRentalReturn';
import OwnBatteryChargingComplete from './rental/OwnBatteryChargingComplete';
import ConsolidatedRentalBill from './rental/ConsolidatedRentalBill';
import RentalPayment from './rental/RentalPayment';
import RentalPaymentConfirmed from './rental/RentalPaymentConfirmed';
import UnlockOwnBattery from './rental/UnlockOwnBattery';
import RentalBatteryCollected from './rental/RentalBatteryCollected';
import RentalSessionClosed from './rental/RentalSessionClosed';

/**
 * The rental battery the dashboard assigned to this rider. The battery is
 * already inside `slotIdentifier`, so issuance just opens that slot — the rider
 * never scans the battery.
 */
export interface AssignedRental {
  id: string;
  soc: number;
  batteryId: number;
  slotId: number;
  slotIdentifier: string;
}

interface RentalFlowProps {
  config: boothService.RentalFeatureStatus;
  boothUid: string;
  boothName: string;
  assignedRental: AssignedRental | null;
  initialActiveRental: boothService.ActiveRentalResponse | null;
  onClose: () => void;
}

type RentalStep =
  | 'booth_scan'
  | 'issuing'
  | 'collecting'
  | 'active'
  | 'return'
  | 'verify_return'
  | 'waiting_return'
  | 'charging_complete'
  | 'bill'
  | 'payment'
  | 'payment_confirmed'
  | 'unlock_own'
  | 'collected'
  | 'closed'
  | 'error';

/**
 * Extracts a human-readable message from an API/axios error.
 * @param err - The thrown error.
 * @returns A message suitable for display.
 */
function extractError(err: unknown): string {
  const e = err as {
    response?: { data?: { message?: string; error?: string } };
    message?: string;
  };
  return (
    e?.response?.data?.message ||
    e?.response?.data?.error ||
    e?.message ||
    'Something went wrong. Please try again.'
  );
}

/**
 * A simple full-screen progress/awaiting indicator used while the station and
 * backend are working (opening slots, confirming collection/return).
 */
const ProgressScreen: React.FC<{
  title: string;
  subtitle: string;
  detail?: string;
}> = ({ title, subtitle, detail }) => (
  <div className="min-h-full flex items-center justify-center px-4 py-10">
    <div className="w-full max-w-md rounded-3xl border border-gray-800 bg-gray-900 p-8 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/10">
        <Loader2 size={30} className="animate-spin text-indigo-400" />
      </div>

      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="mt-2 text-gray-400">{subtitle}</p>

      {detail && (
        <div className="mt-5 rounded-2xl border border-gray-800 bg-gray-950/60 p-4">
          <p className="text-sm font-semibold text-indigo-300">{detail}</p>
        </div>
      )}
    </div>
  </div>
);

/**
 * Confirms the rider is physically at the expected booth before issuing a
 * rental. Only shown when the repurposed "booth QR scan" setting is enabled.
 */
const BoothScanScreen: React.FC<{
  expectedBoothUid: string;
  boothName: string;
  slotIdentifier?: string;
  onVerified: (boothUid: string) => void;
  onBack: () => void;
}> = ({ expectedBoothUid, boothName, slotIdentifier, onVerified, onBack }) => {
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);

  const displayName =
    boothName.trim() || expectedBoothUid;

  const handleScanSuccess = useCallback(
    (decodedText: string) => {
      const scanned = decodedText.trim();

      if (
        scanned.toLowerCase() ===
        expectedBoothUid.trim().toLowerCase()
      ) {
        onVerified(scanned);
      } else {
        setError(
          `Wrong booth scanned. Expected ${displayName}, but scanned ${scanned}.`
        );
      }
    },
    [expectedBoothUid, displayName, onVerified]
  );

  return (
    <div className="min-h-full px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-sm font-medium text-gray-400 transition hover:text-white"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-700 bg-gray-800">
            ←
          </span>
          Back
        </button>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/10">
            <MapPin size={36} className="text-indigo-400" />
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
            Confirm Station
          </p>

          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Scan the booth QR
          </h1>

          <p className="mx-auto mt-3 max-w-md text-gray-400">
            Scan the QR code on booth{' '}
            <strong className="text-white">{displayName}</strong>{' '}
            to confirm you are at the station.
          </p>

          {slotIdentifier && (
            <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm">
              <span className="text-indigo-300">Your slot:</span>
              <span className="font-semibold text-white">
                {slotIdentifier}
              </span>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-3xl border border-gray-800 bg-gray-900 p-6 sm:p-8">
          {scanning ? (
            <div className="overflow-hidden rounded-2xl border border-gray-700 bg-black">
              <div className="aspect-square w-full">
                <QrScanner
                  onScanSuccess={handleScanSuccess}
                  onScanFailure={(message) => setError(message)}
                />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setError('');
                setScanning(true);
              }}
              className="w-full rounded-2xl bg-indigo-600 py-4 font-semibold text-white transition hover:bg-indigo-500"
            >
              📷 Scan Booth QR
            </button>
          )}

          {scanning && (
            <button
              type="button"
              onClick={() => setScanning(false)}
              className="mt-4 w-full rounded-2xl bg-gray-800 py-3 font-semibold text-gray-300 transition hover:bg-gray-700"
            >
              Stop Scanner
            </button>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
              <p className="text-sm text-red-400">⚠️ {error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RentalFlow: React.FC<RentalFlowProps> = ({
  config,
  boothUid,
  boothName,
  assignedRental,
  initialActiveRental,
  onClose,
}) => {
  const [step, setStep] = useState<RentalStep>(() => {
    if (initialActiveRental) {
      if (initialActiveRental.status === 'pending') return 'collecting';
      if (initialActiveRental.returned) return 'waiting_return';
      return 'active';
    }
    if (assignedRental) {
      return config.requireBoothScanBeforeIssue ? 'booth_scan' : 'issuing';
    }
    return 'error';
  });

  const [sessionId, setSessionId] = useState<number | null>(
    initialActiveRental?.sessionId ?? null
  );

  const [active, setActive] =
    useState<boothService.ActiveRentalResponse | null>(
      initialActiveRental
    );

  const [assigned, setAssigned] = useState<AssignedRental | null>(
    assignedRental
  );

  const [bill, setBill] =
    useState<boothService.RentalBillResponse | null>(null);

  const [returnSlot, setReturnSlot] = useState<{
    boothUid: string;
    slotIdentifier: string;
  } | null>(null);

  const [error, setError] = useState('');
  const [returnError, setReturnError] = useState('');
  const [issueBusy, setIssueBusy] = useState(false);
  const [returnBusy, setReturnBusy] = useState(false);

  const rentalBatteryId =
    assigned?.id || active?.rentalBattery.batteryUid || 'Rental battery';

  /*
   * ============================================================
   * ISSUE RENTAL (opens the assigned pool slot)
   * ============================================================
   */
  useEffect(() => {
    if (step !== 'issuing' || sessionId != null) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      if (!assigned) {
        setError('No rental battery was assigned. Please try again.');
        setStep('error');
        return;
      }

      setIssueBusy(true);
      setError('');

      try {
        const result = await boothService.issueRental(
          boothUid,
          assigned.slotIdentifier
        );

        if (cancelled) return;

        setSessionId(result.sessionId);

        if (result.status === 'in_progress') {
          const current = await boothService.getActiveRental();
          if (cancelled) return;
          setActive(current);
          setStep('active');
        } else {
          setStep('collecting');
        }
      } catch (err) {
        if (cancelled) return;
        setError(extractError(err));
        setStep('error');
      } finally {
        if (!cancelled) setIssueBusy(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [step, sessionId, assigned, boothUid]);

  /*
   * ============================================================
   * WAIT FOR PHYSICAL COLLECTION (pending -> in_progress)
   * ============================================================
   */
  useEffect(() => {
    if (step !== 'collecting') {
      return;
    }

    let cancelled = false;

    const tick = async () => {
      try {
        const current = await boothService.getActiveRental();
        if (cancelled || !current) return;

        setActive(current);

        if (current.status === 'in_progress') {
          setStep('active');
        }
      } catch {
        // Keep waiting; the next tick retries.
      }
    };

    void tick();
    const intervalId = setInterval(tick, 1500);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [step]);

  /*
   * ============================================================
   * ACTIVE SESSION: refresh own-battery SOC periodically
   * ============================================================
   */
  useEffect(() => {
    if (step !== 'active') {
      return;
    }

    let cancelled = false;

    const tick = async () => {
      try {
        const current = await boothService.getActiveRental();
        if (!cancelled && current) {
          setActive(current);
        }
      } catch {
        // Ignore transient polling errors.
      }
    };

    const intervalId = setInterval(tick, 5000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [step]);

  /*
   * ============================================================
   * WAIT FOR PHYSICAL RETURN (returnCompleted)
   * ============================================================
   */
  useEffect(() => {
    if (step !== 'waiting_return') {
      return;
    }

    let cancelled = false;

    const tick = async () => {
      try {
        const current = await boothService.getActiveRental();
        if (cancelled || !current) return;

        setActive(current);

        if (current.returnCompleted) {
          setStep('charging_complete');
        }
      } catch {
        // Keep waiting; the next tick retries.
      }
    };

    void tick();
    const intervalId = setInterval(tick, 1500);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [step]);

  /*
   * ============================================================
   * BILL
   * ============================================================
   */
  useEffect(() => {
    if (step !== 'bill' || bill || sessionId == null) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const result = await boothService.getRentalBill(sessionId);
        if (!cancelled) setBill(result);
      } catch (err) {
        if (!cancelled) {
          setError(extractError(err));
          setStep('error');
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [step, bill, sessionId]);

  /*
   * ============================================================
   * RETURN REQUEST (reserve + open a return slot)
   * ============================================================
   */
  const handleRequestReturn = async () => {
    if (sessionId == null) return;

    setReturnBusy(true);
    setReturnError('');

    try {
      const result = await boothService.returnRental(
        sessionId,
        boothUid
      );

      setReturnSlot(result.returnSlot);

      const current = await boothService.getActiveRental();
      if (current) setActive(current);

      setStep(
        config.requireReturnScan
          ? 'verify_return'
          : 'waiting_return'
      );
    } catch (err) {
      setReturnError(extractError(err));
    } finally {
      setReturnBusy(false);
    }
  };

  /*
   * ============================================================
   * PAYMENT (STK push + poll)
   * ============================================================
   */
  const handlePay = async (): Promise<boolean> => {
    if (sessionId == null) return false;

    try {
      const result = await boothService.payRental(sessionId);

      if (result.paymentStatus === 'paid') {
        return true;
      }

      const checkoutId = result.checkoutRequestId;
      const deadline = Date.now() + 90000;

      while (Date.now() < deadline) {
        await new Promise((resolve) =>
          setTimeout(resolve, 2500)
        );

        try {
          const status =
            await boothService.getRentalPaymentStatus(
              checkoutId
            );

          if (status.paymentStatus === 'paid') return true;
          if (status.paymentStatus === 'failed') return false;
        } catch {
          // Keep polling until the deadline.
        }
      }

      return false;
    } catch {
      return false;
    }
  };

  /*
   * ============================================================
   * UNLOCK OWN BATTERY
   * ============================================================
   */
  const handleUnlockOwn = async () => {
    if (sessionId == null) return;

    try {
      const result =
        await boothService.unlockOwnRentalBattery(sessionId);

      setReturnSlot(result.ownSlot);
      setStep('collected');
    } catch (err) {
      setError(extractError(err));
    }
  };

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */
  switch (step) {
    case 'booth_scan':
      return (
        <BoothScanScreen
          expectedBoothUid={boothUid}
          boothName={boothName}
          slotIdentifier={assigned?.slotIdentifier}
          onVerified={() => setStep('issuing')}
          onBack={onClose}
        />
      );

    case 'issuing':
      return (
        <ProgressScreen
          title="Opening your slot"
          subtitle="Issuing your rental battery…"
          detail={
            assigned
              ? `Slot ${assigned.slotIdentifier} · ${assigned.id} (${assigned.soc}%)`
              : undefined
          }
        />
      );

    case 'collecting':
      return (
        <ProgressScreen
          title="Collect your battery"
          subtitle="The slot is open. Take the battery out and close the door."
          detail={
            assigned
              ? `Slot ${assigned.slotIdentifier} · ${assigned.id} (${assigned.soc}%)`
              : active?.rentalBattery.batteryUid
                ? `Battery ${active.rentalBattery.batteryUid}`
                : undefined
          }
        />
      );

    case 'active':
      return (
        <RentalSessionActive
          ownBatterySoc={active?.ownDeposit.currentSoc ?? 0}
          rentalBatteryId={rentalBatteryId}
          startTime={
            new Date(
              active?.startedAt ||
                active?.issuedAt ||
                Date.now()
            )
          }
          onReturn={() => setStep('return')}
        />
      );

    case 'return':
      return (
        <ReturnRentalBattery
          batteryId={rentalBatteryId}
          boothName={boothName}
          boothUid={boothUid}
          onContinue={() => setStep('waiting_return')}
          onRequestReturn={handleRequestReturn}
          requestLoading={returnBusy}
          requestError={returnError}
        />
      );

    case 'verify_return':
      return (
        <VerifyRentalReturn
          batteryId={rentalBatteryId}
          boothName={boothName}
          boothUid={
            returnSlot?.boothUid ||
            active?.returnSlot?.boothUid ||
            boothUid
          }
          slotIdentifier={
            returnSlot?.slotIdentifier ||
            active?.returnSlot?.slotIdentifier ||
            undefined
          }
          onVerified={() => setStep('waiting_return')}
          onRetry={() => setStep('return')}
        />
      );

    case 'waiting_return':
      return (
        <ProgressScreen
          title="Returning battery"
          subtitle="Insert the battery, connect the plug and close the cabinet."
          detail={
            returnSlot
              ? `Slot ${returnSlot.slotIdentifier} at ${boothName.trim() || returnSlot.boothUid}`
              : active?.returnSlot
                ? `Slot ${active.returnSlot.slotIdentifier} at ${boothName.trim() || active.returnSlot.boothUid}`
                : undefined
          }
        />
      );

    case 'charging_complete':
      return (
        <OwnBatteryChargingComplete
          batterySoc={active?.ownDeposit.currentSoc ?? 100}
          onContinue={() => setStep('bill')}
        />
      );

    case 'bill':
      if (!bill) {
        return (
          <ProgressScreen
            title="Calculating your bill"
            subtitle="Adding up charging, energy and time…"
          />
        );
      }

      return (
        <ConsolidatedRentalBill
          ownCharging={bill.consolidation.ownCharging}
          rentalEnergy={bill.consolidation.rentalEnergy}
          rentalTime={bill.consolidation.rentalTime}
          onPay={() => setStep('payment')}
        />
      );

    case 'payment':
      return (
        <RentalPayment
          amount={bill?.amount ?? 0}
          onPay={handlePay}
          onSuccess={() => setStep('payment_confirmed')}
          onBack={() => setStep('bill')}
        />
      );

    case 'payment_confirmed':
      return (
        <RentalPaymentConfirmed
          amount={bill?.amount ?? 0}
          onContinue={() => setStep('unlock_own')}
        />
      );

    case 'unlock_own':
      return (
        <UnlockOwnBattery
          slotIdentifier={
            active?.ownDeposit.slotIdentifier ||
            returnSlot?.slotIdentifier ||
            ''
          }
          onUnlock={handleUnlockOwn}
        />
      );

    case 'collected':
      return (
        <RentalBatteryCollected
          batteryId={
            active?.ownDeposit.slotIdentifier ||
            'Your battery'
          }
          onContinue={() => setStep('closed')}
        />
      );

    case 'closed':
      return <RentalSessionClosed onDone={onClose} />;

    case 'error':
    default:
      return (
        <div className="min-h-full flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-gray-900 p-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400">
              <Battery size={30} />
            </div>

            <h2 className="text-2xl font-bold text-white">
              Rental could not continue
            </h2>

            <p className="mt-2 text-gray-400">
              {error || 'Something went wrong. Please try again.'}
            </p>

            <div className="mt-6 flex flex-col gap-3">
              {assigned && (
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep(
                      config.requireBoothScanBeforeIssue
                        ? 'booth_scan'
                        : 'issuing'
                    );
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 font-semibold text-white transition hover:bg-indigo-500"
                >
                  <ShieldCheck size={20} />
                  Try Again
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl bg-gray-800 py-3 font-semibold text-gray-300 transition hover:bg-gray-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
  }
};

export default RentalFlow;
