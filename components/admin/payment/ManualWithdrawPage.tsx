import React, { useState, useEffect } from "react";
import { usePayment } from "@/hooks/usePayment";
import { getSlotWithdrawalInfo } from "@/services/adminService";
import toast from "react-hot-toast";


interface ManualWithdrawPageProps {
  onWaiting?: () => void;
  boothUid?: string;
  slotIdentifier?: string;
}


const ManualWithdrawPage: React.FC<ManualWithdrawPageProps> = ({
  onWaiting,
  boothUid,
  slotIdentifier,
}) => {

  const { initiatePayment, loading } = usePayment();


  const [userId, setUserId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [prefillLoading, setPrefillLoading] = useState(false);

  useEffect(() => {
    if (!boothUid || !slotIdentifier) return;

    const fetchInfo = async () => {
      setPrefillLoading(true);
      try {
        const info = await getSlotWithdrawalInfo(boothUid, slotIdentifier);
        setUserId(info.userId);
        setPhoneNumber(info.userPhone);
        setAmount(String(info.calculatedAmount));
      } catch (err) {
        toast.error("Failed to load slot data. You can fill in the fields manually.");
      } finally {
        setPrefillLoading(false);
      }
    };

    fetchInfo();
  }, [boothUid, slotIdentifier]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();


    if (!userId || !phoneNumber || !amount) {
      toast.error("Please fill in all fields.");
      return;
    }


    const loadingToast = toast.loading(
      "Sending M-Pesa prompt..."
    );


    try {

      await initiatePayment({
        userId,
        phoneNumber,
        amount: Number(amount),
      });


      toast.dismiss(loadingToast);


      toast.success(
        "M-Pesa prompt sent successfully."
      );


      // Open waiting screen inside dashboard
      onWaiting?.();


    } catch (error) {

      toast.dismiss(loadingToast);


      toast.error(
        "Unable to send payment prompt."
      );

    }

  };


  return (
    <div className="animate-fade-in">

      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">


        <h2 className="text-xl font-bold mb-4">
          Manual Withdrawal
        </h2>


        <p className="text-gray-400 text-sm mb-6">
          Send an M-Pesa STK push to a user's phone.
        </p>

        {prefillLoading && (
          <div className="flex items-center gap-2 text-sm text-cyan-400 mb-4">
            <span className="animate-spin h-4 w-4 border-2 border-cyan-400 border-t-transparent rounded-full" />
            Loading slot data...
          </div>
        )}



        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-w-lg"
        >


          <div>

            <label className="block text-sm font-medium text-gray-300 mb-1">
              User ID (Firebase UID)
            </label>


            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Firebase UID"
              required
              disabled={!!(boothUid && slotIdentifier)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
            />

          </div>




          <div>

            <label className="block text-sm font-medium text-gray-300 mb-1">
              Phone Number
            </label>


            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="0712345678"
              required
              disabled={!!(boothUid && slotIdentifier)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
            />

          </div>




          <div>

            <label className="block text-sm font-medium text-gray-300 mb-1">
              Amount (KES)
            </label>


            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="150"
              min="1"
              required
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2"
            />

          </div>




          <button
            type="submit"
            disabled={
              loading ||
              !userId ||
              !phoneNumber ||
              !amount
            }
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold disabled:opacity-50"
          >

            {loading ? (

              <div className="flex items-center gap-2">

                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />

                Sending...

              </div>

            ) : (

              "Send Payment Prompt"

            )}

          </button>


        </form>


      </div>


    </div>
  );
};


export default ManualWithdrawPage;