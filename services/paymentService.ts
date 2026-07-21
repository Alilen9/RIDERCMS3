import {
  WithdrawalRequest,
  PaymentResponse,
  Receipt
} from "@/components/admin/payment/types/payment";


const API_URL = process.env.NEXT_PUBLIC_API_URL;


export async function requestWithdrawPrompt(
  data: WithdrawalRequest
): Promise<PaymentResponse> {

  const response = await fetch(
    `${API_URL}/payments/withdraw`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );


  return response.json();
}



export async function checkPaymentStatus(
  transactionId: string
): Promise<PaymentResponse> {

  const response = await fetch(
    `${API_URL}/payments/status/${transactionId}`
  );


  return response.json();
}



export async function getReceipt(
  transactionId: string
): Promise<Receipt> {

  const response = await fetch(
    `${API_URL}/payments/receipt/${transactionId}`
  );


  return response.json();
}