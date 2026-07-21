"use client";


import { useState } from "react";

import { usePayment }
  from "@/hooks/usePayment";

import PaymentStatus
  from "./PaymentStatus";


interface Props {
  userId: string;
  amount: number;
}



export default function ManualWithdrawPage({
  userId,
  amount
}: Props) {


  const [phone, setPhone]
    = useState("");


  const {
    initiatePayment,
    status
  } = usePayment();



  async function submit() {


    await initiatePayment({

      userId,

      phoneNumber: phone,

      amount

    });


  }



  return (

    <div className="
bg-white
rounded-lg
p-6
">


      <h2 className="text-xl font-bold">
        Manual Withdraw
      </h2>



      <input

        value={phone}

        onChange={
          e => setPhone(e.target.value)
        }

        placeholder="
Enter user's phone number
"

        className="
border
p-3
rounded
w-full
mt-4
"

      />



      <button

        onClick={submit}

        className="
bg-green-600
text-white
px-5
py-3
rounded
mt-4
"

      >

        Send Payment Prompt

      </button>



      <PaymentStatus
        status={status}
      />


    </div>

  )

}