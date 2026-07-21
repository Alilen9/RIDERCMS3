import { useEffect } from "react";
import toast from "react-hot-toast";

useEffect(() => {
  switch (status) {
    case "PENDING":
      toast.loading(
        "Waiting for the user to enter their M-Pesa PIN...",
        {
          id: "payment-status",
        }
      );
      break;

    case "SUCCESS":
      toast.success("Payment completed successfully.", {
        id: "payment-status",
      });
      break;

    case "FAILED":
      toast.error("Payment failed or was cancelled.", {
        id: "payment-status",
      });
      break;

    default:
      toast.dismiss("payment-status");
  }
}, [status]);