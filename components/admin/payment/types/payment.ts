export type PaymentStatus =
  | "IDLE"
  | "PENDING"
  | "SUCCESS"
  | "FAILED";


export interface WithdrawalRequest {
  userId: string;
  phoneNumber: string;
  amount: number;
}


export interface PaymentResponse {
  success: boolean;
  message: string;
  transactionId?: string;
}


export interface Receipt {
  transactionId: string;
  userId: string;
  phoneNumber: string;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
}