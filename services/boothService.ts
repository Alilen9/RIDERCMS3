import apiClient from '../client/apiClient';
import { Slot, ActiveBatteryEntry } from '../types';

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
  boothUid: string;
  slotIdentifier: string;
  chargeLevel: number;
  lastChargeLevel: number;
  sessionId: number;
  sessionStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'failed';
  telemetry: {
    batteryInserted: boolean;
    devicePresent: boolean;
    doorClosed: boolean;
    doorLocked: boolean;
    plugConnected: boolean;
    relayOn: boolean;
    relayStateForCalibration: string;
    soc: number;
    temperature: number;
    temperatureC: number;
    timestamp: number;
    restVoltage: number;
    voltage: number;
    voltageRaw: number;
    uptimeSec: number;
    status: string;
    qr: string;
  } | null;
}

/**
 * Response from initiating a deposit.
 * POST /api/booths/initiate-deposit
 */
export interface InitiateDepositResponse {
  slot: Slot;
  sessionId: number;
}

/**
 * The shape of the pricing rules object.
 */
interface PricingRules {
  cost_per_kwh: number;
  base_swap_fee: number;
  cost_per_charge_percent: number;
  overtime_penalty_per_min: number;
  overtime_penalty_per_minute: number;
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
  soc: number;
  initialCharge: number;
  socAtInitiation: number;
  currentBoothSoc: number;
  baseSwapFee: number;
  costPerChargePercent: number;
  depositCompletedAt: string;
  pricingRules: PricingRules;
}

/**
 * Response from stopping charging.
 * POST /api/booths/stop-charging
 */
export interface StopChargingResponse {
  message: string;
  boothUid: string;
  slotIdentifier: string;
  socAtStopRequest: number | null;
  relayAlreadyOff: boolean;
  recommendedWaitSeconds: number;
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
export const initiateDeposit = async (boothId: string): Promise<InitiateDepositResponse> => {
  try {
    const response = await apiClient.post<InitiateDepositResponse>('/booths/initiate-deposit', { boothUid: boothId });
    return response.data;
  } catch (error) {
    console.error('Failed to initiate deposit session:', error);
    throw error;
  }
};

/**
 * Allows a logged-in user to check the status of their currently deposited battery.
 * @returns A promise that resolves with the battery's status and location.
 */
export const getMyBatteryStatuses = async (): Promise<MyBatteryStatusResponse[]> => {
  try {
    const response = await apiClient.get<MyBatteryStatusResponse[]>('/booths/my-battery-status');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Initiates the withdrawal process, triggering an M-Pesa STK push for payment.
 * @returns A promise that resolves with the checkout request details.
 */
export const initiateWithdrawal = async (sessionId: number): Promise<InitiateWithdrawalResponse> => {
  try {
    const response = await apiClient.post<InitiateWithdrawalResponse>('/booths/initiate-withdrawal', { sessionId });
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
 * Allows the app to stop charging first, then wait before creating a withdrawal session.
 * POST /api/booths/stop-charging
 */
export const stopCharging = async (sessionId: number): Promise<StopChargingResponse> => {
  try {
    const response = await apiClient.post<StopChargingResponse>('/booths/stop-charging', { sessionId });
    return response.data;
  } catch (error) {
    console.error('Failed to stop charging:', error);
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
 * Triggers the release of a battery after physical QR scan verification.
 * @param boothUid - The UID of the booth being scanned.
 */
export const releaseBattery = async (boothUid: string, sessionId: number): Promise<{ message: string; slotIdentifier: string }> => {
  try {
    const response = await apiClient.post<{ message: string; slotIdentifier: string }>('/booths/release-battery', { boothUid, sessionId });
    return response.data;
  } catch (error) {
    console.error('Failed to release battery:', error);
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
    await apiClient.post('/booths/cancel-session');
  } catch (error) {
    console.error('Failed to cancel active session:', error);
    throw error;
  }
};

export const cancelActiveSessionById = async (sessionId: number): Promise<void> => {
  try {
    await apiClient.post('/booths/cancel-session', { sessionId });
  } catch (error) {
    console.error('Failed to cancel session:', error);
    throw error;
  }
};
