import React, { useMemo, useState } from 'react';

import IssueRentalBattery from './rental/IssueRentalBattery';
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

interface RentalFlowProps {
  ownBatterySoc: number;
  ownBatteryId: string;
  slotIdentifier: string;
  onClose: () => void;
}

interface RentalBatteryOption {
  id: string;
  soc: number;
  status: 'available' | 'unavailable';
}

type RentalStep =
  | 'assigning'
  | 'no_battery'
  | 'issue_battery'
  | 'active'
  | 'return'
  | 'verify_return'
  | 'charging_complete'
  | 'bill'
  | 'payment'
  | 'payment_confirmed'
  | 'unlock_own'
  | 'collected'
  | 'closed';

/*
 * TEMPORARY RENTAL BATTERY DATA
 *
 * Later replace this with data from your backend.
 */
const RENTAL_BATTERIES: RentalBatteryOption[] = [
  {
    id: 'R-1082',
    soc: 87,
    status: 'available',
  },
  {
    id: 'R-1091',
    soc: 94,
    status: 'available',
  },
  {
    id: 'R-1105',
    soc: 78,
    status: 'available',
  },
];

const RentalFlow: React.FC<RentalFlowProps> = ({
  ownBatterySoc,
  ownBatteryId,
  slotIdentifier,
  onClose,
}) => {
  /*
   * ---------------------------------------------------------
   * AUTOMATIC RENTAL BATTERY ASSIGNMENT
   * ---------------------------------------------------------
   *
   * Select the available rental battery with the
   * highest state of charge.
   */
  const assignedBattery = useMemo(() => {
    const availableBatteries = RENTAL_BATTERIES.filter(
      (battery) => battery.status === 'available'
    );

    if (availableBatteries.length === 0) {
      return null;
    }

    return [...availableBatteries].sort(
      (a, b) => b.soc - a.soc
    )[0];
  }, []);

  /*
   * ---------------------------------------------------------
   * CURRENT STEP
   * ---------------------------------------------------------
   *
   * If a battery is available:
   *     issue_battery
   *
   * Otherwise:
   *     no_battery
   */
  const [step, setStep] = useState<RentalStep>(
    assignedBattery ? 'issue_battery' : 'no_battery'
  );

  /*
   * ---------------------------------------------------------
   * SELECTED RENTAL BATTERY
   * ---------------------------------------------------------
   */
  const [selectedBattery, setSelectedBattery] =
    useState<RentalBatteryOption | null>(assignedBattery);

  /*
   * ---------------------------------------------------------
   * RENTAL BATTERY STATE
   * ---------------------------------------------------------
   */
  const [rentalStartSoc, setRentalStartSoc] =
    useState<number>(assignedBattery?.soc ?? 0);

  const [rentalCurrentSoc, setRentalCurrentSoc] =
    useState<number>(assignedBattery?.soc ?? 0);

  const [rentalStartTime, setRentalStartTime] =
    useState<Date | null>(null);

  /*
   * ---------------------------------------------------------
   * FIRST QR SCAN
   * ---------------------------------------------------------
   *
   * false = rental battery has NOT been scanned
   * true  = rental battery QR has been verified
   *
   * The rental battery cannot be unlocked unless this
   * becomes true.
   */
  const [rentalBatteryScanned, setRentalBatteryScanned] =
    useState(false);

  /*
   * ---------------------------------------------------------
   * SECOND QR SCAN
   * ---------------------------------------------------------
   *
   * false = returned battery has NOT been scanned
   * true  = returned battery QR has been verified
   *
   * The return cannot be accepted unless this becomes true.
   */
  const [returnedBatteryScanned, setReturnedBatteryScanned] =
    useState(false);

  /*
   * ---------------------------------------------------------
   * BILLING
   * ---------------------------------------------------------
   *
   * Temporary values.
   *
   * Replace these later with values calculated by
   * your backend.
   */
  const ownCharging = 120;
  const rentalEnergy = 75;
  const rentalTime = 60;

  const total =
    ownCharging +
    rentalEnergy +
    rentalTime;

  /*
   * ---------------------------------------------------------
   * RETRY RENTAL BATTERY ASSIGNMENT
   * ---------------------------------------------------------
   */
  const tryAssignRentalBattery = () => {
    const availableBatteries =
      RENTAL_BATTERIES.filter(
        (battery) => battery.status === 'available'
      );

    if (availableBatteries.length === 0) {
      setSelectedBattery(null);
      setStep('no_battery');
      return;
    }

    /*
     * Select battery with highest SoC.
     */
    const bestBattery = [...availableBatteries].sort(
      (a, b) => b.soc - a.soc
    )[0];

    /*
     * Reset scan state when assigning a new battery.
     */
    setRentalBatteryScanned(false);
    setReturnedBatteryScanned(false);

    setSelectedBattery(bestBattery);
    setRentalStartSoc(bestBattery.soc);
    setRentalCurrentSoc(bestBattery.soc);
    setRentalStartTime(null);

    setStep('issue_battery');
  };

  /*
   * ---------------------------------------------------------
   * RENTAL BATTERY QR VERIFIED
   * ---------------------------------------------------------
   *
   * This function is called by IssueRentalBattery ONLY
   * after the QR code has been successfully scanned.
   */
  const handleRentalBatteryVerified = () => {
    if (!selectedBattery) {
      return;
    }

    /*
     * Mark first scan as completed.
     */
    setRentalBatteryScanned(true);
  };

  /*
   * ---------------------------------------------------------
   * UNLOCK RENTAL BATTERY
   * ---------------------------------------------------------
   *
   * IMPORTANT:
   *
   * The rental battery cannot be unlocked unless the first
   * QR scan was successful.
   */
  const handleUnlockRentalBattery = () => {
    if (!selectedBattery) {
      return;
    }

    if (!rentalBatteryScanned) {
      console.error(
        'Cannot unlock rental battery: QR scan not completed.'
      );

      return;
    }

    /*
     * Start rental timer only after the battery is unlocked.
     */
    setRentalStartTime(new Date());

    /*
     * Start active rental session.
     */
    setStep('active');
  };

  /*
   * ---------------------------------------------------------
   * RIDER WANTS TO RETURN RENTAL BATTERY
   * ---------------------------------------------------------
   */
  const handleStartReturn = () => {
    if (!selectedBattery) {
      return;
    }

    /*
     * Reset the second scan.
     *
     * This is important because the rider must scan the
     * battery again during return.
     */
    setReturnedBatteryScanned(false);

    /*
     * TEMPORARY:
     *
     * Simulate 25% battery usage.
     *
     * Later replace this with the actual SoC received
     * from the battery/backend.
     */
    const currentSoc = Math.max(
      0,
      rentalStartSoc - 25
    );

    setRentalCurrentSoc(currentSoc);

    /*
     * Move to return screen.
     */
    setStep('return');
  };

  /*
   * ---------------------------------------------------------
   * GO TO RETURN QR SCANNER
   * ---------------------------------------------------------
   *
   * The rider reaches this screen after physically
   * returning the rental battery.
   */
  const handleVerifyReturn = () => {
    if (!selectedBattery) {
      return;
    }

    /*
     * Always require a fresh return scan.
     */
    setReturnedBatteryScanned(false);

    setStep('verify_return');
  };

  /*
   * ---------------------------------------------------------
   * RETURNED BATTERY QR VERIFIED
   * ---------------------------------------------------------
   *
   * This function is called ONLY after the second QR scan
   * matches the assigned rental battery.
   */
  const handleReturnBatteryVerified = () => {
    if (!selectedBattery) {
      return;
    }

    /*
     * Mark second scan as completed.
     */
    setReturnedBatteryScanned(true);
  };

  /*
   * ---------------------------------------------------------
   * ACCEPT VERIFIED RETURN
   * ---------------------------------------------------------
   *
   * The flow cannot continue unless the second QR scan
   * was completed successfully.
   */
  const handleReturnVerified = () => {
    if (!selectedBattery) {
      return;
    }

    if (!returnedBatteryScanned) {
      console.error(
        'Cannot accept return: returned battery QR scan not completed.'
      );

      return;
    }

    /*
     * Return is now officially accepted.
     */
    setStep('charging_complete');
  };

  /*
   * ---------------------------------------------------------
   * OWN BATTERY CHARGING COMPLETED
   * ---------------------------------------------------------
   */
  const handleChargingComplete = () => {
    setStep('bill');
  };

  /*
   * ---------------------------------------------------------
   * USER CLICKS PAY
   * ---------------------------------------------------------
   */
  const handlePayment = () => {
    setStep('payment');
  };

  /*
   * ---------------------------------------------------------
   * PAYMENT SUCCEEDED
   * ---------------------------------------------------------
   */
  const handlePaymentSuccess = () => {
    setStep('payment_confirmed');
  };

  /*
   * ---------------------------------------------------------
   * M-PESA PAYMENT
   * ---------------------------------------------------------
   *
   * TEMPORARY:
   *
   * Simulates a 5-second payment request.
   *
   * Replace this later with your real M-Pesa API.
   */
  const handleMpesaPayment = async (): Promise<boolean> => {
    try {
      console.log(
        'Starting M-Pesa payment:',
        total
      );

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 5000);
      });

      console.log(
        'M-Pesa payment successful'
      );

      return true;
    } catch (error) {
      console.error(
        'M-Pesa payment failed:',
        error
      );

      return false;
    }
  };

  /*
   * ---------------------------------------------------------
   * UNLOCK OWN BATTERY
   * ---------------------------------------------------------
   */
  const handleUnlockOwnBattery = () => {
    setStep('unlock_own');
  };

  /*
   * ---------------------------------------------------------
   * OWN BATTERY COLLECTED
   * ---------------------------------------------------------
   */
  const handleBatteryCollected = () => {
    setStep('collected');
  };

  /*
   * ---------------------------------------------------------
   * SESSION CLOSED
   * ---------------------------------------------------------
   */
  const handleSessionClosed = () => {
    setStep('closed');
  };

  /*
   * ---------------------------------------------------------
   * RENDER CURRENT STEP
   * ---------------------------------------------------------
   */
  switch (step) {

    /*
     * =======================================================
     * NO RENTAL BATTERY AVAILABLE
     * =======================================================
     */
    case 'no_battery':
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: '#f8fafc',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '500px',
              background: '#ffffff',
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center',
              boxShadow:
                '0 10px 30px rgba(0,0,0,0.08)',
            }}
          >
            <div
              style={{
                fontSize: '48px',
                marginBottom: '16px',
              }}
            >
              🔋
            </div>

            <h2
              style={{
                margin: '0 0 12px',
                fontSize: '24px',
                fontWeight: 700,
                color: '#111827',
              }}
            >
              No Rental Batteries Available
            </h2>

            <p
              style={{
                margin: '0 0 24px',
                color: '#6b7280',
                lineHeight: 1.6,
              }}
            >
              There are currently no rental batteries
              available at this station. Please try
              again later.
            </p>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
              }}
            >
              <button
                type="button"
                onClick={tryAssignRentalBattery}
                style={{
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 20px',
                  background: '#16a34a',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  border: '1px solid #d1d5db',
                  borderRadius: '10px',
                  padding: '12px 20px',
                  background: '#ffffff',
                  color: '#374151',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      );

    /*
     * =======================================================
     * ISSUE RENTAL BATTERY
     * =======================================================
     *
     * First QR scan happens inside IssueRentalBattery.
     */
    case 'issue_battery':
      if (!selectedBattery) {
        return null;
      }

      return (
        <IssueRentalBattery
          batteryId={selectedBattery.id}
          soc={selectedBattery.soc}
          onUnlock={handleUnlockRentalBattery}
          onBack={onClose}
        />
      );

    /*
     * =======================================================
     * ACTIVE RENTAL SESSION
     * =======================================================
     */
    case 'active':
      if (
        !selectedBattery ||
        !rentalStartTime
      ) {
        return null;
      }

      return (
        <RentalSessionActive
          ownBatterySoc={ownBatterySoc}
          rentalBatteryId={selectedBattery.id}
          rentalBatterySoc={rentalCurrentSoc}
          rentalStartSoc={rentalStartSoc}
          startTime={rentalStartTime}
          onReturn={handleStartReturn}
        />
      );

    /*
     * =======================================================
     * RETURN RENTAL BATTERY
     * =======================================================
     */
    case 'return':
      if (!selectedBattery) {
        return null;
      }

      return (
        <ReturnRentalBattery
          batteryId={selectedBattery.id}
          onContinue={handleVerifyReturn}
        />
      );

    /*
     * =======================================================
     * VERIFY RETURN
     * =======================================================
     *
     * Second QR scan happens here.
     */
    case 'verify_return':
      if (!selectedBattery) {
        return null;
      }

      return (
        <VerifyRentalReturn
          batteryId={selectedBattery.id}
          onVerified={handleReturnBatteryVerified}
          onRetry={() => setStep('return')}
        />
      );

    /*
     * =======================================================
     * CHARGING COMPLETE
     * =======================================================
     *
     * This step can only be reached after the second
     * battery scan has succeeded.
     */
    case 'charging_complete':
      if (!returnedBatteryScanned) {
        return null;
      }

      return (
        <OwnBatteryChargingComplete
          batterySoc={100}
          onContinue={handleChargingComplete}
        />
      );

    /*
     * =======================================================
     * CONSOLIDATED BILL
     * =======================================================
     */
    case 'bill':
      return (
        <ConsolidatedRentalBill
          ownCharging={ownCharging}
          rentalEnergy={rentalEnergy}
          rentalTime={rentalTime}
          onPay={handlePayment}
        />
      );

    /*
     * =======================================================
     * PAYMENT
     * =======================================================
     */
    case 'payment':
      return (
        <RentalPayment
          amount={total}
          onPay={handleMpesaPayment}
          onSuccess={handlePaymentSuccess}
          onBack={() => setStep('bill')}
        />
      );

    /*
     * =======================================================
     * PAYMENT CONFIRMED
     * =======================================================
     */
    case 'payment_confirmed':
      return (
        <RentalPaymentConfirmed
          amount={total}
          onContinue={handleUnlockOwnBattery}
        />
      );

    /*
     * =======================================================
     * UNLOCK OWN BATTERY
     * =======================================================
     */
    case 'unlock_own':
      return (
        <UnlockOwnBattery
          slotIdentifier={slotIdentifier}
          onUnlock={handleBatteryCollected}
        />
      );

    /*
     * =======================================================
     * OWN BATTERY COLLECTED
     * =======================================================
     */
    case 'collected':
      return (
        <RentalBatteryCollected
          batteryId={ownBatteryId}
          onContinue={handleSessionClosed}
        />
      );

    /*
     * =======================================================
     * SESSION CLOSED
     * =======================================================
     */
    case 'closed':
      return (
        <RentalSessionClosed
          onDone={onClose}
        />
      );

    /*
     * =======================================================
     * ASSIGNING
     * =======================================================
     *
     * This step is currently not displayed because assignment
     * is automatic.
     */
    case 'assigning':
    default:
      return null;
  }
};

export default RentalFlow;