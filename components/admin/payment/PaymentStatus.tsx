"use client";


interface Props {
  status:
  "IDLE" |
  "PENDING" |
  "SUCCESS" |
  "FAILED";
}


export default function PaymentStatus({
  status
}: Props) {


  if (status === "PENDING") {

    return (

      <div className="p-6 text-center">

        <div className="
animate-spin
rounded-full
h-12
w-12
border-b-2
border-blue-600
mx-auto
">
        </div>


        <p className="mt-4">
          Waiting for user to enter PIN...
        </p>


      </div>

    )

  }



  if (status === "SUCCESS") {

    return (

      <div className="p-6 text-center">

        <h2 className="text-green-600 text-xl">
          Payment Successful ✓
        </h2>

      </div>

    )

  }


  if (status === "FAILED") {

    return (

      <div className="p-6 text-center">

        <h2 className="text-red-600">
          Payment Failed
        </h2>

      </div>

    )

  }


  return null;

}