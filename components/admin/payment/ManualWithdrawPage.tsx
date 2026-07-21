import React, { useState } from "react";
import { usePayment } from "@/hooks/usePayment";
import toast from "react-hot-toast";


interface ManualWithdrawPageProps {
  onWaiting?: () => void;
}


const ManualWithdrawPage: React.FC<ManualWithdrawPageProps> = ({
  onWaiting,
}) => {

  const { initiatePayment, loading } = usePayment();


  const [userId, setUserId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");


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
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2"
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
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2"
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