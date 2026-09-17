import React, { useEffect, useState } from "react";
import { sendSlotCommand } from "@/services/adminService";
import toast from "react-hot-toast";


interface PaymentWaitingPageProps {
  onBack?: () => void;
  onSuccess?: () => void;
  boothUid?: string;
  slotIdentifier?: string;
  paymentStatus?: 'IDLE' | 'PENDING' | 'SUCCESS' | 'FAILED';
  timedOut?: boolean;
  onCheckAgain?: () => Promise<void>;
}


const PaymentWaitingPage: React.FC<PaymentWaitingPageProps> = ({
  onBack,
  onSuccess,
  boothUid,
  slotIdentifier,
  paymentStatus = 'PENDING',
  timedOut = false,
  onCheckAgain,
}) => {

  const [slotOpened, setSlotOpened] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (paymentStatus === "FAILED") {
      toast.error("Payment failed.");
      onBack?.();
    }
  }, [paymentStatus, onBack]);

  const handleCheckAgain = async () => {
    if (!onCheckAgain) return;
    setChecking(true);
    try {
      await onCheckAgain();
    } finally {
      setChecking(false);
    }
  };

  const handleWithdrawNow = async () => {
    if (!boothUid || !slotIdentifier || slotOpened) return;
    setUnlocking(true);
    try {
      await sendSlotCommand(boothUid, slotIdentifier, { forceUnlock: true });
      setSlotOpened(true);
      toast.success("Slot unlocked successfully.");
      setTimeout(() => onSuccess?.(), 1500);
    } catch {
      toast.error("Failed to unlock slot. You can unlock it manually from the booth detail view.");
      onSuccess?.();
    }
  };

  const handleWithdrawLater = () => {
    onSuccess?.();
  };


  return (
    <div className="animate-fade-in">
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-8 text-center">
        {paymentStatus !== "SUCCESS" ? (
          <div
            className="
              animate-spin
              rounded-full
              h-28
              w-28
              border-8
              border-emerald-500
              border-t-transparent
              mx-auto
            "
          />
        ) : (
          <div
            className="
              h-28
              w-28
              rounded-full
              bg-emerald-600
              flex
              items-center
              justify-center
              text-white
              text-5xl
              mx-auto
            "
          >
            ✓
          </div>
        )}

        <h1 className="text-2xl font-bold text-white mt-8">
          {paymentStatus === "SUCCESS"
            ? "Payment Successful"
            : "Processing Payment"}
        </h1>

        {paymentStatus !== "SUCCESS" && (
          <p className="text-gray-400 mt-4">
            {timedOut
              ? "Still waiting for a payment confirmation from M-Pesa."
              : "Waiting for customer to enter MPESA PIN..."}
          </p>
        )}

        {paymentStatus !== "SUCCESS" && timedOut && (
          <div className="mt-6 p-4 bg-amber-900/40 border border-amber-600 rounded-lg max-w-md mx-auto">
            <p className="text-amber-300 text-sm mb-3">
              This is taking longer than expected. The payment may already have
              gone through but Safaricom's confirmation could be delayed. Check
              again before canceling.
            </p>
            <button
              onClick={handleCheckAgain}
              disabled={checking}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-2 mx-auto"
            >
              {checking ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Checking...
                </>
              ) : (
                "Check Status Again"
              )}
            </button>
          </div>
        )}

        {paymentStatus === "SUCCESS" && !slotOpened && (
          <div className="mt-8 space-y-3">
            <p className="text-gray-400 text-sm">Release the battery now or do it later from the booth view.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleWithdrawNow}
                disabled={unlocking}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-2"
              >
                {unlocking ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Unlocking...
                  </>
                ) : (
                  "Withdraw Now"
                )}
              </button>
              <button
                onClick={handleWithdrawLater}
                disabled={unlocking}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold"
              >
                Withdraw Later
              </button>
            </div>
          </div>
        )}

        {paymentStatus === "SUCCESS" && slotOpened && (
          <div className="mt-8">
            <p className="text-emerald-400 font-semibold">Slot unlocked. Battery ready for collection.</p>
          </div>
        )}

        {paymentStatus !== "SUCCESS" && (
          <button
            onClick={onBack}
            className="mt-6 px-5 py-2 bg-gray-700 rounded-lg text-white"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentWaitingPage;
