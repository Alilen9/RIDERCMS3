import apiClient from '../client/apiClient';

//================================================================
// Types & Interfaces based on Endpoints.md
//================================================================

/**
 * Response from checking the logged-in user's deposited battery status.
 * GET /api/booths/my-battery-status
 */
export interface MyBatteryStatusResponse {
  batteryUid: string;
  chargeLevel: number;
  boothUid: string;
  slotIdentifier: string;
}

/**
 * Response from initiating a withdrawal, which triggers an STK push.
 * POST /api/booths/initiate-withdrawal
 */
export interface InitiateWithdrawalResponse {
  message: string;
  checkoutRequestId: string;
  amount: number;
}

/**
 * Response from polling the withdrawal payment status.
 * GET /api/booths/withdrawal-status/:checkoutRequestId
 */
export interface WithdrawalStatusResponse {
  paymentStatus: 'paid' | 'pending' | 'failed'; // Added 'failed' for completeness
}

/**
 * Represents a single transaction in a user's history.
 * Based on GET /api/booths/history
 */
export interface UserTransaction {
  id: string;
  type: 'DEPOSIT' | 'SWAP' | 'SUBSCRIPTION';
  amount: number;
  date: string; // ISO date string
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';
  // Add other relevant fields from your backend response
}

//================================================================
// Service Functions for Client-Side (User App)
//================================================================

/**
 * Initiates a battery deposit session for the logged-in user at a specific booth.
 * @param boothId - The unique identifier of the booth (e.g., from a QR code).
 */
export const initiateDeposit = async (boothId: string): Promise<void> => {
  try {
    await apiClient.post('/booths/initiate-deposit', { boothId });
  } catch (error) {
    // The global interceptor will handle 401/403 errors.
    // We re-throw so the component can handle other errors (e.g., show a specific message).
    throw error;
  }
};

/**
 * Allows a logged-in user to check the status of their currently deposited battery.
 * @returns A promise that resolves with the battery's status and location.
 */
export const getMyBatteryStatus = async (): Promise<MyBatteryStatusResponse> => {
  try {
    const response = await apiClient.get<MyBatteryStatusResponse>('/booths/my-battery-status');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Initiates the withdrawal process, triggering an M-Pesa STK push for payment.
 * @returns A promise that resolves with the checkout request details.
 */
export const initiateWithdrawal = async (): Promise<InitiateWithdrawalResponse> => {
  try {
    const response = await apiClient.post<InitiateWithdrawalResponse>('/booths/initiate-withdrawal');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Polls for the status of a withdrawal payment.
 * @param checkoutRequestId - The ID received from `initiateWithdrawal`.
 * @returns A promise that resolves with the current payment status.
 */
export const getWithdrawalStatus = async (checkoutRequestId: string): Promise<WithdrawalStatusResponse> => {
  try {
    const response = await apiClient.get<WithdrawalStatusResponse>(`/booths/withdrawal-status/${checkoutRequestId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Triggers the booth hardware to open a slot for battery collection after payment is confirmed.
 * @param checkoutRequestId - The ID of the completed transaction.
 */
export const openForCollection = async (checkoutRequestId: string): Promise<void> => {
  try {
    await apiClient.post('/booths/open-for-collection', { checkoutRequestId });
  } catch (error) {
    throw error;
  }
};

/**
 * Retrieves the deposit and withdrawal history for the logged-in user.
 * @returns A promise that resolves with an array of user transactions.
 */
export const getHistory = async (): Promise<UserTransaction[]> => {
  try {
    const response = await apiClient.get<UserTransaction[]>('/booths/history');
    return response.data;
  } catch (error) {
    throw error;
  }
};