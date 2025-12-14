import apiClient from '../client/apiClient';
import { Slot } from '../types';

/**
 * The shape of a public booth object for the map/list view.
 * GET /api/booths
 */
export interface PublicBooth {
  booth_uid: string;
  name: string;
  location_address: string;
  latitude: number;
  longitude: number;
  availableSlots: number;
  status: string;
}

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
  sessionStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'failed';
  telemetry: {
    batteryInserted: boolean;
    doorClosed: boolean;
    doorLocked: boolean;
    plugConnected: boolean;
    relayOn: boolean;
    soc: number;
    temperature: number;
    temperatureC: number;
    timestamp: number;
    voltage: number;
  } | null;
}

/**
 * Response from initiating a withdrawal, which triggers an STK push.
 * POST /api/booths/initiate-withdrawal
 * This is now a two-step process. This is the first step.
 */
export interface InitiateWithdrawalResponse {
  sessionId: number;
  amount: number;
  durationMinutes: number;
  energyDelivered: number;
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
 * Fetches a list of all public, online booths.
 * @returns A promise that resolves with an array of public booths.
 */
export const getBooths = async (): Promise<PublicBooth[]> => {
  try {
    const response = await apiClient.get<PublicBooth[]>('/booths');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch public booths:', error);
    throw error;
  }
};

/**
 * Initiates a battery deposit session for the logged-in user at a specific booth.
 * @param boothId - The unique identifier of the booth (e.g., from a QR code).
 */
export const initiateDeposit = async (boothId: string): Promise<Slot> => {
  try {
    const response = await apiClient.post<{ slot: Slot }>('/booths/initiate-deposit', { boothUid: boothId });
    console.log("deposit Response: ", response);
    return response.data.slot;
  } catch (error) {
    console.error('Failed to initiate deposit session:', error);
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
 * Fetches details of a user's pending withdrawal session, if one exists.
 * @returns A promise that resolves with the session details or null if none is found.
 */
export const getPendingWithdrawal = async (): Promise<InitiateWithdrawalResponse | null> => {
  try {
    const response = await apiClient.get<InitiateWithdrawalResponse>('/booths/sessions/pending-withdrawal');
    // A 204 No Content status will result in empty data.
    return response.data || null;
  } catch (error) {
    console.error('Failed to fetch pending withdrawal session:', error);
    throw error;
  }
};

/**
 * Triggers the M-Pesa STK push for a pre-calculated withdrawal session.
 * @param sessionId The ID of the session to pay for.
 * @returns A promise that resolves with the checkout request ID.
 */
export const payForWithdrawal = async (sessionId: number): Promise<{ checkoutRequestId: string }> => {
  try {
    const response = await apiClient.post<{ checkoutRequestId: string }>(`/booths/sessions/${sessionId}/pay`);
    return response.data;
  } catch (error) {
    console.error(`Failed to trigger payment for session ${sessionId}:`, error);
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

/**
 * Sends a request to cancel the user's currently active session (e.g., a pending deposit).
 * The backend should identify the user via their auth token and cancel any non-terminal session.
 */
export const cancelActiveSession = async (): Promise<void> => {
  try {
    // This endpoint matches the backend implementation: POST /api/booths/cancel-session
    await apiClient.post('/booths/cancel-session');
  } catch (error) {
    console.error('Failed to cancel active session:', error);
    throw error;
  }
};
