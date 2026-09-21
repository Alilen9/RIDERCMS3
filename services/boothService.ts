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
 * Response from GET /api/booths/rentals/status.
 * Carries the rider-facing rental rules so the client honours the same gates
 * as the server.
 */
export interface RentalFeatureStatus {
  enabled: boolean;
  /** Repurposed setting: require scanning the BOOTH QR before issuing a rental. */
  requireBoothScanBeforeIssue: boolean;
  /** Require scanning the rental battery again when returning it. */
  requireReturnScan: boolean;
  allowRentalWhileOwnBatteryCharging: boolean;
  maxRentalBatteriesPerUser: number;
  minimumSocPercent: number;
}

/**
 * Checks whether the rental battery feature is enabled for riders.
 * @returns A promise that resolves with the current rental feature status.
 */
export const getRentalFeatureStatus = async (): Promise<RentalFeatureStatus> => {
  try {
    const response = await apiClient.get<RentalFeatureStatus>('/booths/rentals/status');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch rental feature status:', error);
    throw error;
  }
};

/**
 * A single borrowable rental battery option.
 * `slotIdentifier`/`slotId` identify the exact slot to open during issuance,
 * so the rider never has to scan the battery (it is locked inside the slot).
 */
export interface RentalBatteryOption {
  id: string;
  soc: number;
  status?: string;
  batteryId: number;
  slotId: number;
  slotIdentifier: string;
}

/**
 * The raw response from GET /api/booths/rentals/available.
 */
export interface AvailableRentalBatteriesResponse {
  boothUid: string;
  rentals: {
    slotId: number;
    slotIdentifier: string;
    batteryId: number;
    batteryUid: string;
    chargeLevel: number;
  }[];
  hasPendingRental: boolean;
  rentalLimit: number;
  activeRentalCount: number;
}

/**
 * Lists borrowable (unowned) rental-pool batteries at a specific booth.
 * @param boothUid The UID of the booth to check.
 * @returns A promise that resolves with the available rental batteries.
 */
export const getAvailableRentalBatteries = async (
  boothUid: string
): Promise<RentalBatteryOption[]> => {
  const response =
    await apiClient.get<AvailableRentalBatteriesResponse>(
      '/booths/rentals/available',
      { params: { boothUid } }
    );

  return (response.data.rentals || []).map(
    (rental) => ({
      id: rental.batteryUid,
      soc: rental.chargeLevel,
      batteryId: rental.batteryId,
      slotId: rental.slotId,
      slotIdentifier: rental.slotIdentifier,
    })
  );
};

/**
 * Response from POST /api/booths/rentals/issue.
 * The rental battery is dispensed by opening `ownDeposit`'s slot for the
 * rider's own battery and the pool slot named in the request.
 */
export interface IssueRentalResponse {
  message: string;
  sessionId: number;
  batteryUid: string;
  chargeLevel: number;
  status: 'pending' | 'in_progress';
  ownDeposit: {
    depositId: number;
    boothUid: string;
    slotIdentifier: string;
    ownSlotId: number;
  };
}

/**
 * Issues (starts) a rental session for the given pool slot. The backend
 * validates the rider has an unredeemed deposit and then opens the slot — no
 * battery scan is required or possible.
 * @param boothUid - Booth hosting the rental-pool slot.
 * @param slotIdentifier - The exact occupied slot to open (from `/rentals/available`).
 */
export const issueRental = async (
  boothUid: string,
  slotIdentifier: string
): Promise<IssueRentalResponse> => {
  try {
    const response = await apiClient.post<IssueRentalResponse>('/booths/rentals/issue', {
      boothUid,
      slotIdentifier,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to issue rental:', error);
    throw error;
  }
};

/**
 * The current rider's active rental, if any.
 * GET /api/booths/rentals/active (204 → null)
 */
export interface ActiveRentalResponse {
  sessionId: number;
  status: 'pending' | 'in_progress';
  issuedAt: string;
  startedAt: string | null;
  issueSoc: number | null;
  amount: number | null;
  checkoutRequestId: string | null;
  rentalBattery: { batteryUid: string };
  sourceSlot: { boothUid: string; slotIdentifier: string };
  /** True once a return slot has been RESERVED (not necessarily returned). */
  returned: boolean;
  /** True once the rented battery is physically back in its return slot. */
  returnCompleted: boolean;
  returnSoc: number | null;
  returnSlot: { boothUid: string; slotIdentifier: string } | null;
  ownDeposit: {
    depositId: number;
    boothUid: string;
    slotIdentifier: string;
    initialSoc: number | null;
    currentSoc: number | null;
  };
}

/**
 * Fetches the rider's active (pending/in_progress) rental.
 * @returns The active rental, or `null` when there is none (204).
 */
export const getActiveRental = async (): Promise<ActiveRentalResponse | null> => {
  try {
    const response = await apiClient.get<ActiveRentalResponse>('/booths/rentals/active');
    return response.data || null;
  } catch (error) {
    console.error('Failed to fetch active rental:', error);
    throw error;
  }
};

/**
 * Response from POST /api/booths/rentals/:sessionId/return.
 */
export interface ReturnRentalResponse {
  message: string;
  returnSlot: { boothUid: string; slotIdentifier: string };
  batteryUid: string;
  sourceBoothUid: string;
  sourceSlotIdentifier: string;
  simulated: boolean;
}

/**
 * Reserves an empty slot at a booth and opens it for the rental battery to be
 * placed into.
 * @param sessionId - The active rental session id.
 * @param boothUid - The booth the rider is returning the battery to.
 */
export const returnRental = async (
  sessionId: number,
  boothUid: string
): Promise<ReturnRentalResponse> => {
  try {
    const response = await apiClient.post<ReturnRentalResponse>(
      `/booths/rentals/${sessionId}/return`,
      { boothUid }
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to return rental ${sessionId}:`, error);
    throw error;
  }
};

/**
 * The consolidated rental bill breakdown.
 * GET /api/booths/rentals/:sessionId/bill
 */
export interface RentalBillResponse {
  sessionId: number;
  amount: number;
  consolidation: {
    ownCharging: number;
    rentalEnergy: number;
    rentalTime: number;
    durationMinutes: number;
    energyGone: number;
    ownGained: number;
  };
}

/**
 * Fetches the read-only consolidated bill for a returned rental.
 * @param sessionId - The rental session id.
 */
export const getRentalBill = async (sessionId: number): Promise<RentalBillResponse> => {
  try {
    const response = await apiClient.get<RentalBillResponse>(`/booths/rentals/${sessionId}/bill`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch rental bill for ${sessionId}:`, error);
    throw error;
  }
};

/**
 * Response from POST /api/booths/rentals/:sessionId/pay.
 */
export interface PayRentalResponse {
  message: string;
  amount: number;
  consolidation: RentalBillResponse['consolidation'];
  checkoutRequestId: string;
  /** Present only in developer auto-approval mode. */
  paymentStatus?: 'paid';
}

/**
 * Initiates the consolidated bill payment (STK push, or auto-approved in dev).
 * @param sessionId - The rental session id.
 */
export const payRental = async (sessionId: number): Promise<PayRentalResponse> => {
  try {
    const response = await apiClient.post<PayRentalResponse>(`/booths/rentals/${sessionId}/pay`);
    return response.data;
  } catch (error) {
    console.error(`Failed to trigger rental payment for ${sessionId}:`, error);
    throw error;
  }
};

/**
 * Rental payment status.
 * GET /api/booths/rentals/status/:checkoutRequestId
 */
export interface RentalPaymentStatusResponse {
  paymentStatus: 'paid' | 'pending' | 'failed' | string;
  reason?: string;
}

/**
 * Polls the rental payment status for a checkout request.
 * @param checkoutRequestId - The id returned by `payRental`.
 */
export const getRentalPaymentStatus = async (
  checkoutRequestId: string
): Promise<RentalPaymentStatusResponse> => {
  try {
    const response = await apiClient.get<RentalPaymentStatusResponse>(
      `/booths/rentals/status/${checkoutRequestId}`,
      { params: { _: new Date().getTime() } }
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch rental payment status for ${checkoutRequestId}:`, error);
    throw error;
  }
};

/**
 * Response from POST /api/booths/rentals/:sessionId/unlock-own.
 */
export interface UnlockOwnRentalResponse {
  message: string;
  ownSlot: { boothUid: string; slotIdentifier: string };
}

/**
 * Opens the slot holding the rider's own (now charged) battery after the
 * consolidated bill is paid.
 * @param sessionId - The completed rental session id.
 */
export const unlockOwnRentalBattery = async (
  sessionId: number
): Promise<UnlockOwnRentalResponse> => {
  try {
    const response = await apiClient.post<UnlockOwnRentalResponse>(
      `/booths/rentals/${sessionId}/unlock-own`
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to unlock own battery for rental ${sessionId}:`, error);
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
 * Lifecycle status of a single deposit session.
 * GET /api/booths/deposit-sessions/:sessionId/status
 *
 * Unlike `my-battery-status` (which only surfaces completed deposits), this
 * exposes terminal states so the app can stop waiting when the booth
 * auto-cancels a deposit.
 */
export interface DepositSessionStatusResponse {
  sessionId: number;
  sessionType: string;
  sessionStatus:
    | 'pending'
    | 'opening'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'failed'
    | 'redeemed'
    | 'manual';
  slotIdentifier: string | null;
  boothUid: string | null;
}

/**
 * Fetches the lifecycle status of one of the user's own deposit sessions.
 * Returns `null` when the session is unknown to this user (404).
 * @param sessionId - The deposit session id returned by `initiateDeposit`.
 */
export const getDepositSessionStatus = async (
  sessionId: number
): Promise<DepositSessionStatusResponse | null> => {
  try {
    const response = await apiClient.get<DepositSessionStatusResponse>(
      `/booths/deposit-sessions/${sessionId}/status`
    );
    return response.data;
  } catch (error) {
    if ((error as { response?: { status?: number } })?.response?.status === 404) {
      return null;
    }
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
    const response = await apiClient.get<WithdrawalStatusResponse>(`/booths/withdrawal-status/${checkoutRequestId}`, {
      params: { _: new Date().getTime() },
    });
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
