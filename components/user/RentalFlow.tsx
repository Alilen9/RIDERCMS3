import React, { useState } from 'react';

import RentalEligibility from './rental/RentalEligibility';
import ChooseRentalBattery, {
  RentalBatteryOption,
} from './rental/ChooseRentalBattery';
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

type RentalStep =
  | 'eligibility'
  | 'choose_battery'
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

const RentalFlow: React.FC<RentalFlowProps> = ({
  ownBatterySoc,
  ownBatteryId,
  slotIdentifier,
  onClose,
}) => {
  const [step, setStep] =
    useState<RentalStep>('eligibility');

  const [selectedBattery, setSelectedBattery] =
    useState<RentalBatteryOption | null>(null);

  const [rentalStartSoc, setRentalStartSoc] =
    useState(0);

  const [rentalCurrentSoc, setRentalCurrentSoc] =
    useState(0);

  const [rentalStartTime, setRentalStartTime] =
    useState<Date | null>(null);

  /*
   * TEMPORARY MOCK BATTERIES
   */
  const availableBatteries: RentalBatteryOption[] = [
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

  /*
   * BILL
   *
   * Replace these with backend values.
   */
  const ownCharging = 120;
  const rentalEnergy = 75;
  const rentalTime = 60;

  const total =
    ownCharging +
    rentalEnergy +
    rentalTime;

  /*
   * SELECT RENTAL BATTERY
   */
  const handleBatterySelect = (
    battery: RentalBatteryOption
  ) => {
    setSelectedBattery(battery);

    setRentalStartSoc(battery.soc);
    setRentalCurrentSoc(battery.soc);

    setStep('issue_battery');
  };

  /*
   * ISSUE RENTAL BATTERY
   */
  const handleUnlockRentalBattery = () => {
    setRentalStartTime(new Date());

    setStep('active');
  };

  /*
   * START RETURN
   */
  const handleStartReturn = () => {
    setRentalCurrentSoc(
      Math.max(0, rentalStartSoc - 25)
    );

    setStep('return');
  };

  /*
   * VERIFY RETURN
   */
  const handleVerifyReturn = () => {
    setStep('verify_return');
  };

  /*
   * RETURN VERIFIED
   */
  const handleReturnVerified = () => {
    setStep('charging_complete');
  };

  /*
   * CHARGING COMPLETE
   */
  const handleChargingComplete = () => {
    setStep('bill');
  };

  /*
   * GO TO PAYMENT
   */
  const handlePayment = () => {
    setStep('payment');
  };

  /*
   * PAYMENT SUCCESS
   */
  const handlePaymentSuccess = () => {
    setStep('payment_confirmed');
  };

  /*
   * IMPORTANT:
   *
   * Replace this with your actual M-Pesa
   * backend service.
   *
   * The function MUST wait until the
   * backend confirms payment.
   */
  const handleMpesaPayment = async (): Promise<boolean> => {
    try {
      /*
       * TODO:
       *
       * Call your backend here.
       *
       * Example:
       *
       * const response = await startMpesaPayment({
       *   amount: total,
       *   ...
       * });
       *
       * Then poll backend until:
       *
       * SUCCESS
       * or
       * FAILED
       */

      console.log(
        'Starting M-Pesa payment:',
        total
      );

      /*
       * TEMPORARY MOCK
       *
       * Remove this when backend is connected.
       */
      await new Promise((resolve) =>
        setTimeout(resolve, 5000)
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
   * UNLOCK OWN BATTERY
   */
  const handleUnlockOwnBattery = () => {
    setStep('unlock_own');
  };

  /*
   * BATTERY COLLECTED
   */
  const handleBatteryCollected = () => {
    setStep('collected');
  };

  /*
   * SESSION CLOSED
   */
  const handleSessionClosed = () => {
    setStep('closed');
  };

  switch (step) {

    /*
     * 1. ELIGIBILITY
     */
    case 'eligibility':
      return (
        <RentalEligibility
          onContinue={() =>
            setStep('choose_battery')
          }
          onBack={onClose}
        />
      );

    /*
     * 2. CHOOSE BATTERY
     */
    case 'choose_battery':
      return (
        <ChooseRentalBattery
          batteries={availableBatteries}
          onSelect={handleBatterySelect}
          onBack={() =>
            setStep('eligibility')
          }
        />
      );

    /*
     * 3. ISSUE BATTERY
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
          onBack={() =>
            setStep('choose_battery')
          }
        />
      );

    /*
     * 4. ACTIVE RENTAL
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
     * 5. RETURN
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
     * 6. VERIFY RETURN
     */
    case 'verify_return':

      if (!selectedBattery) {
        return null;
      }

      return (
        <VerifyRentalReturn
          batteryId={selectedBattery.id}
          onVerified={handleReturnVerified}
          onRetry={() =>
            setStep('return')
          }
        />
      );

    /*
     * 7. CHARGING COMPLETE
     */
    case 'charging_complete':
      return (
        <OwnBatteryChargingComplete
          batterySoc={100}
          onContinue={handleChargingComplete}
        />
      );

    /*
     * 8. BILL
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
     * 9. PAYMENT
     *
     * THIS IS WHERE THE PAY BUTTON IS.
     */
    case 'payment':
      return (
        <RentalPayment
          amount={total}
          onPay={handleMpesaPayment}
          onSuccess={handlePaymentSuccess}
          onBack={() =>
            setStep('bill')
          }
        />
      );

    /*
     * 10. PAYMENT CONFIRMED
     */
    case 'payment_confirmed':
      return (
        <RentalPaymentConfirmed
          amount={total}
          onContinue={handleUnlockOwnBattery}
        />
      );

    /*
     * 11. UNLOCK OWN BATTERY
     */
    case 'unlock_own':
      return (
        <UnlockOwnBattery
          slotIdentifier={slotIdentifier}
          onUnlock={handleBatteryCollected}
        />
      );

    /*
     * 12. BATTERY COLLECTED
     */
    case 'collected':
      return (
        <RentalBatteryCollected
          batteryId={ownBatteryId}
          onContinue={handleSessionClosed}
        />
      );

    /*
     * 13. CLOSED
     */
    case 'closed':
      return (
        <RentalSessionClosed
          onDone={onClose}
        />
      );

    default:
      return null;
  }
};

export default RentalFlow;