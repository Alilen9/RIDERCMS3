"use client";

import { Receipt } from "./types/payment";





interface Props {
  receipt: Receipt;
  close: () => void;
}



export default function ReceiptModal({
  receipt,
  close
}: Props) {


  return (

    <div className="
fixed inset-0
bg-black/50
flex
items-center
justify-center
">


      <div className="
bg-white
rounded-lg
p-6
w-96
">


        <h2 className="text-xl font-bold">
          Payment Receipt
        </h2>


        <p>
          Transaction:
          {receipt.transactionId}
        </p>


        <p>
          Phone:
          {receipt.phoneNumber}
        </p>


        <p>
          Amount:
          KES {receipt.amount}
        </p>


        <p>
          Status:
          {receipt.status}
        </p>


        <button
          onClick={close}
          className="
mt-4
bg-blue-600
text-white
px-4
py-2
rounded
"
        >
          Close
        </button>


      </div>


    </div>

  )

}