import React, { useEffect, useState } from "react";
import { sendSlotCommand } from "@/services/adminService";
import toast from "react-hot-toast";


interface PaymentWaitingPageProps {
  onBack?: () => void;
  boothUid?: string;
  slotIdentifier?: string;
  paymentStatus: 'IDLE' | 'PENDING' | 'SUCCESS' | 'FAILED';
}


const PaymentWaitingPage: React.FC<PaymentWaitingPageProps> = ({
  onBack,
  boothUid,
  slotIdentifier,
  paymentStatus,
}) => {

  const [slotOpened, setSlotOpened] = useState(false);


  // Payment status
  useEffect(() => {


    if (paymentStatus === "SUCCESS") {

      toast.success(
        "Payment completed successfully."
      );

      if (boothUid && slotIdentifier && !slotOpened) {
        setSlotOpened(true);
        sendSlotCommand(boothUid, slotIdentifier, { forceUnlock: true })
          .then(() => {
            toast.success("Slot unlocked successfully.");
          })
          .catch(() => {
            toast.error("Payment successful but failed to unlock slot. You can unlock it manually from the booth detail view.");
          });
      }

      const timer = setTimeout(() => {

        onBack?.();

      }, 2000);



      return () => clearTimeout(timer);

    }



    if (paymentStatus === "FAILED") {

      toast.error(
        "Payment failed."
      );


      onBack?.();

    }


  }, [paymentStatus, onBack, boothUid, slotIdentifier, slotOpened]);





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

            Waiting for customer to enter MPESA PIN...

          </p>

        )}





        <button
          onClick={onBack}
          className="mt-6 px-5 py-2 bg-gray-700 rounded-lg text-white"
        >
          Back
        </button>


      </div>

    </div>

  );

};


export default PaymentWaitingPage;
