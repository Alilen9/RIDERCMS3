"use client";

import { useState } from "react";

import {
  requestWithdrawPrompt,
  checkPaymentStatus
} from "@/services/paymentService";

import {
  PaymentStatus,
  WithdrawalRequest
} from "@/components/admin/payment/types/payment";


export function usePayment() {

  const [status, setStatus]
    = useState<PaymentStatus>("IDLE");


  const [transactionId, setTransactionId]
    = useState<string>("");


  const [loading, setLoading]
    = useState(false);



  async function initiatePayment(
    data: WithdrawalRequest
  ) {

    setLoading(true);
    setStatus("PENDING");


    const response =
      await requestWithdrawPrompt(data);


    if (response.transactionId) {

      setTransactionId(
        response.transactionId
      );

    }


    setLoading(false);

  }



  async function refreshStatus() {

    if (!transactionId) return;


    const response =
      await checkPaymentStatus(
        transactionId
      );


    if (response.success) {

      setStatus("SUCCESS");

    }

  }


  return {
    initiatePayment,
    refreshStatus,
    status,
    loading,
    transactionId
  };

}