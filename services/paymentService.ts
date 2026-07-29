import apiClient from '../client/apiClient';

export interface ManualWithdrawRequest {
  userId: string;
  phoneNumber: string;
  amount: number;
  boothUid?: string;
  slotIdentifier?: string;
}

export interface ManualWithdrawResponse {
  success: boolean;
  message: string;
  sessionId: number;
  transactionId: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  status: string;
  sessionId: number;
}

export async function manualWithdraw(data: ManualWithdrawRequest): Promise<ManualWithdrawResponse> {
  const response = await apiClient.post<ManualWithdrawResponse>('/admin/payments/manual-withdraw', data);
  return response.data;
}

export async function getManualWithdrawStatus(sessionId: number): Promise<PaymentStatusResponse> {
  const response = await apiClient.get<PaymentStatusResponse>(`/admin/payments/status/${sessionId}`);
  return response.data;
}
