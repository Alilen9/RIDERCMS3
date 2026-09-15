import apiClient from '../client/apiClient';
import { Booth, UserRole } from '../types';

/**
 * =========================================================
 * USERS
 * =========================================================
 */

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  role: string;
  disabled: boolean;
  creationTime: string;
  lastSignInTime: string;
}

export interface ListUsersResponse {
  users: AdminUser[];
  nextPageToken?: string;
}

export type UserAccountStatus = 'active' | 'disabled';

/**
 * =========================================================
 * BOOTH STATUS
 * =========================================================
 */

export interface AdminBoothStatus {
  boothUid: string;
  name: string;
  location: string;
  status: string;
  lastHeartbeatAt: string;

  slots: {
    slotIdentifier: string;

    status:
    | 'booting'
    | 'available'
    | 'occupied'
    | 'disabled'
    | 'error';

    doorStatus:
    | 'locked'
    | 'unlocked'
    | 'ajar'
    | 'unknown';

    userName: string | null;

    battery: {
      isOccupied: boolean;
      chargeLevel: number;
      voltage?: number;
      temperature?: number;
    } | null;

    telemetry?: {
      batteryInserted: boolean;
      doorClosed: boolean;
      doorLocked: boolean;
      plugConnected: boolean;
      relayOn: boolean;
      soc: number;
      temperatureC: number;
      voltage: number;
      timestamp: number;
    };
  }[];
}

/**
 * =========================================================
 * TRANSACTIONS
 * =========================================================
 */

export interface AdminTransaction {
  txId: string;
  type: string;
  status: string;
  date: string;
  paymentId: string;
  userName: string;
  userEmail: string;
  boothUid: string | null;
  slotIdentifier: string | null;
  batteryUid: string | null;
}

export interface ListTransactionsResponse {
  transactions: AdminTransaction[];
  total: number;
}

/**
 * =========================================================
 * APPLICATION SETTINGS
 * =========================================================
 */

export interface AppSettings {
  /**
   * Standard charging / swap pricing.
   */
  pricing?: {
    cost_per_charge_percent: number;
    base_swap_fee: number;
    cost_per_kwh: number;
    overtime_penalty_per_min: number;
  };

  /**
   * =======================================================
   * RENTAL SETTINGS
   * =======================================================
   *
   * Controls rental battery allocation, pricing,
   * verification and rental behaviour.
   */
  rental?: {
    /**
     * Allocate the available rental battery
     * with the highest SOC first.
     *
     * Example:
     * R-1091 = 94%
     * R-1082 = 87%
     * R-1105 = 82%
     *
     * R-1091 will be selected first.
     */
    allocate_highest_soc_first: boolean;

    /**
     * Minimum SOC required before a battery
     * can be allocated for rental.
     *
     * Example:
     * 50 means batteries below 50% cannot
     * be assigned to a rider.
     */
    minimum_soc_percent: number;

    /**
     * Maximum number of rental batteries
     * one user can have at the same time.
     */
    max_rental_batteries_per_user: number;

    /**
     * Maximum/recommended rental duration
     * in minutes before overtime rules apply.
     */
    rental_time_limit_minutes: number;

    /**
     * Rental energy charge in KES per kWh.
     */
    rental_energy_rate_per_kwh: number;

    /**
     * Rental time charge in KES per minute.
     */
    rental_time_rate_per_minute: number;

    /**
     * Require the rider to scan the assigned
     * rental battery before it can be issued.
     */
    require_rental_scan_before_issue: boolean;

    /**
     * Require the rider to scan the rental
     * battery when returning it.
     */
    require_return_scan: boolean;

    /**
     * Automatically put a returned rental
     * battery into charging status.
     */
    auto_charge_returned_battery: boolean;

    /**
     * Allow a rider to use a rental battery
     * while their own battery is charging.
     */
    allow_rental_while_own_battery_charging: boolean;
  };

  /**
   * User access control.
   */
  access_control?: {
    allow_open_registration: boolean;
  };
}

/**
 * =========================================================
 * BOOTHS
 * =========================================================
 */

export interface CreateBoothData {
  name: string;
  locationAddress: string;
  latitude?: number;
  longitude?: number;
  initialSlots: number;
}

export interface UpdateBoothData {
  name?: string;
  locationAddress?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CreateBoothResponse {
  message: string;
  boothUid: string;
}

/**
 * Creates a new booth.
 */
export const createBooth = async (
  boothData: CreateBoothData
): Promise<CreateBoothResponse> => {
  const response = await apiClient.post<CreateBoothResponse>(
    '/admin/booths',
    boothData
  );

  return response.data;
};

export interface ListBoothsResponse {
  booths: Booth[];
  total: number;
};

/**
 * Fetches all booths.
 */
export const getBooths = async (): Promise<ListBoothsResponse> => {
  const response = await apiClient.get<ListBoothsResponse>(
    '/admin/booths'
  );

  return response.data;
};

/**
 * Updates a booth.
 */
export const updateBooth = async (
  boothUid: string,
  boothData: UpdateBoothData
): Promise<Booth> => {
  const response = await apiClient.patch<{
    message: string;
    booth: Booth;
  }>(
    `/admin/booths/${boothUid}`,
    boothData
  );

  return response.data.booth;
};

/**
 * Deletes a booth.
 */
export const deleteBooth = async (
  boothUid: string
): Promise<void> => {
  await apiClient.delete(
    `/admin/booths/${boothUid}`
  );
};

/**
 * =========================================================
 * BOOTH SLOTS
 * =========================================================
 */

/**
 * Deletes a booth slot.
 */
export const deleteBoothSlot = async (
  boothUid: string,
  slotIdentifier: string
): Promise<void> => {
  try {
    await apiClient.delete(
      `/admin/booths/${boothUid}/slots/${slotIdentifier}`
    );
  } catch (error) {
    console.error(
      `Failed to delete slot ${slotIdentifier} from booth ${boothUid}:`,
      error
    );

    throw error;
  }
};

/**
 * Updates the status of a booth slot.
 */
export const updateSlotStatus = async (
  boothUid: string,
  slotIdentifier: string,
  status: 'available' | 'disabled'
): Promise<{
  message: string;
  slot: any;
}> => {
  const response = await apiClient.post(
    `/admin/booths/${boothUid}/slots/${slotIdentifier}/status`,
    {
      status,
    }
  );

  return response.data;
};

export interface SlotCommand {
  [key: string]: any;
}

/**
 * Sends a command to a booth slot.
 */
export const sendSlotCommand = async (
  boothUid: string,
  slotIdentifier: string,
  command: SlotCommand
): Promise<void> => {
  await apiClient.post(
    `/admin/booths/${boothUid}/slots/${slotIdentifier}/command`,
    command
  );
};

/**
 * =========================================================
 * USERS
 * =========================================================
 */

/**
 * Fetches paginated users.
 */
export const getUsers = async (
  pageToken?: string
): Promise<ListUsersResponse> => {
  try {
    const response =
      await apiClient.get<ListUsersResponse>(
        '/admin/users',
        {
          params: {
            pageToken,
            pageSize: 50,
          },
        }
      );

    return response.data;
  } catch (error) {
    console.error(
      'Failed to fetch users:',
      error
    );

    throw error;
  }
};

/**
 * Sets user role.
 */
export const setRole = async (
  userId: string,
  newRole: UserRole
): Promise<void> => {
  try {
    await apiClient.put(
      `/admin/users/${userId}/role`,
      {
        role: newRole,
      }
    );
  } catch (error) {
    console.error(
      `Failed to set role for user ${userId}:`,
      error
    );

    throw error;
  }
};

/**
 * Sets user account status.
 */
export const setUserStatus = async (
  payload: {
    uid: string;
    status: string;
  }
): Promise<void> => {
  try {
    await apiClient.post(
      '/admin/users/set-status',
      payload
    );
  } catch (error) {
    console.error(
      `Failed to set status for user ${payload.uid}:`,
      error
    );

    throw error;
  }
};

/**
 * Deletes a user.
 */
export const deleteUser = async (
  userId: string
): Promise<void> => {
  try {
    await apiClient.delete(
      `/admin/users/${userId}`
    );
  } catch (error) {
    console.error(
      `Failed to delete user ${userId}:`,
      error
    );

    throw error;
  }
};

/**
 * =========================================================
 * BOOTH STATUS
 * =========================================================
 */

export const getBoothStatus =
  async (): Promise<AdminBoothStatus[]> => {
    try {
      const response =
        await apiClient.get<AdminBoothStatus[]>(
          '/admin/booths/status',
          {
            params: {
              _: new Date().getTime(),
            },
          }
        );

      return response.data;
    } catch (error) {
      console.error(
        'Failed to fetch booths status:',
        error
      );

      throw error;
    }
  };

/**
 * =========================================================
 * TRANSACTIONS
 * =========================================================
 */

export const getTransactions = async (
  limit: number,
  offset: number,
  filters?: {
    searchTerm?: string;
    status?: string;
  }
): Promise<ListTransactionsResponse> => {
  try {
    const response =
      await apiClient.get<ListTransactionsResponse>(
        '/admin/transactions',
        {
          params: {
            limit,
            offset,
            ...filters,
          },
        }
      );

    return response.data;
  } catch (error) {
    console.error(
      'Failed to fetch transactions:',
      error
    );

    throw error;
  }
};

/**
 * =========================================================
 * SETTINGS
 * =========================================================
 */

/**
 * Fetches application settings.
 */
export const getSettings =
  async (): Promise<AppSettings> => {
    try {
      const response =
        await apiClient.get<AppSettings>(
          '/admin/settings'
        );

      return response.data;
    } catch (error) {
      console.error(
        'Failed to fetch settings:',
        error
      );

      throw error;
    }
  };

/**
 * Updates application settings.
 */
export const updateSettings = async (
  settings: Partial<AppSettings>
): Promise<void> => {
  try {
    await apiClient.post(
      '/admin/settings',
      settings
    );
  } catch (error) {
    console.error(
      'Failed to update settings:',
      error
    );

    throw error;
  }
};

/**
 * =========================================================
 * SLOT DETAILS
 * =========================================================
 */

export interface SlotDetails {
  slotIdentifier: string;
  isCharging: boolean;
  chargeLevel: number;
  status: string;
  userName: string | null;
}

/**
 * Fetches detailed slot information.
 */
export const getSlotDetails = async (
  boothUid: string,
  slotIdentifier: string
): Promise<SlotDetails> => {
  try {
    const response =
      await apiClient.get<SlotDetails>(
        `/booths/${boothUid}/slots/${slotIdentifier}`
      );

    return response.data;
  } catch (error) {
    console.error(
      `Failed to fetch slot details for ${boothUid}/${slotIdentifier}:`,
      error
    );

    throw error;
  }
};

export interface SlotWithdrawalInfo {
  userId: string;
  userName: string;
  userPhone: string;
  calculatedAmount: number;
  socAtDeposit: number;
  socCurrent: number;
  chargeDurationMinutes: number;
}

/**
 * Fetches withdrawal information.
 */
export const getSlotWithdrawalInfo = async (
  boothUid: string,
  slotIdentifier: string
): Promise<SlotWithdrawalInfo> => {
  try {
    const response =
      await apiClient.get<SlotWithdrawalInfo>(
        `/booths/${boothUid}/slots/${slotIdentifier}/withdrawal-info`
      );

    return response.data;
  } catch (error) {
    console.error(
      `Failed to fetch withdrawal info for ${boothUid}/${slotIdentifier}:`,
      error
    );

    throw error;
  }
};

/**
 * =========================================================
 * SIMULATION TOOLS
 * =========================================================
 */

/**
 * Simulates hardware confirmation of a battery deposit.
 */
export const simulateConfirmDeposit = async (
  data: {
    boothUid: string;
    slotIdentifier: string;
    chargeLevel: number;
  }
): Promise<void> => {
  await apiClient.post(
    '/admin/simulate/confirm-deposit',
    data
  );
};

/**
 * Simulates a successful M-Pesa payment.
 */
export const simulateConfirmPayment = async (
  data: {
    checkoutRequestId: string;
  }
): Promise<void> => {
  await apiClient.post(
    '/admin/simulate/confirm-payment',
    data
  );
};

/**
 * Resets booth slots.
 */
export const resetBoothSlots = async (
  boothUid: string,
  slotIdentifier?: string
): Promise<void> => {
  await apiClient.post(
    `/admin/booths/${boothUid}/reset-slots`,
    slotIdentifier
      ? {
        slotIdentifier,
      }
      : {}
  );
};

/**
 * =========================================================
 * OPERATORS
 * =========================================================
 */

export interface InviteOperatorData {
  email: string;
  name: string;
}

/**
 * Invites an operator.
 */
export const inviteOperator = async (
  inviteData: InviteOperatorData
): Promise<AdminUser> => {
  try {
    const response =
      await apiClient.post<{
        user: AdminUser;
      }>(
        '/admin/invite-operator',
        inviteData
      );

    return response.data.user;
  } catch (error) {
    console.error(
      'Failed to invite operator:',
      error
    );

    throw error;
  }
};

/**
 * =========================================================
 * DASHBOARD
 * =========================================================
 */

export interface DashboardSummary {
  totalRevenue: number;
  activeStations: number;
  totalSwaps: number;
  activeSessions: number;
  totalUsers: number;

  swapVolumeTrend: {
    name: string;
    val: number;
  }[];

  batteryUsage: {
    name: string;
    value: number;
  }[];
}

/**
 * Fetches dashboard summary.
 */
export const getDashboardSummary =
  async (): Promise<DashboardSummary> => {
    try {
      const response =
        await apiClient.get<DashboardSummary>(
          '/admin/dashboard-summary'
        );

      return response.data;
    } catch (error) {
      console.error(
        'Failed to fetch dashboard summary:',
        error
      );

      throw error;
    }
  };

/**
 * =========================================================
 * SESSIONS
 * =========================================================
 */

export interface AdminSession {
  id: number;

  sessionType:
  | 'deposit'
  | 'withdrawal';

  status:
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled';

  amount: number | null;

  createdAt: string;

  userEmail: string | null;

  userPhoneNumber: string | null;

  boothUid: string | null;

  slotIdentifier: string | null;

  batteryUid: string | null;
}

export interface ListSessionsResponse {
  sessions: AdminSession[];
  total: number;
}

export interface SessionFilters {
  searchTerm?: string;
  status?: string;
  sessionType?: string;
  boothUid?: string;
  slotIdentifier?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
}

/**
 * Fetches sessions.
 */
export const getSessions = async (
  limit: number,
  offset: number,
  filters?: SessionFilters
): Promise<ListSessionsResponse> => {
  try {
    const response =
      await apiClient.get<ListSessionsResponse>(
        '/admin/sessions',
        {
          params: {
            limit,
            offset,
            ...filters,
          },
        }
      );

    return response.data;
  } catch (error) {
    console.error(
      'Failed to fetch sessions:',
      error
    );

    throw error;
  }
};

/**
 * Deletes a session.
 */
export const deleteSession = async (
  sessionId: number
): Promise<void> => {
  try {
    await apiClient.delete(
      `/admin/sessions/${sessionId}`
    );
  } catch (error) {
    console.error(
      `Failed to delete session ${sessionId}:`,
      error
    );

    throw error;
  }
};

/**
 * =========================================================
 * PAYMENTS
 * =========================================================
 */

export interface AdminPayment {
  id: number;
  callbackType: string;
  payload: any;
  notes: string;
  createdAt: string;
  amount: number | null;
  userName: string | null;
  userEmail: string | null;
}

export interface ListPaymentsResponse {
  payments: AdminPayment[];
  total: number;
  totalSuccessfulAmount: number;
}

export interface PaymentFilters {
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  status?: 'success' | 'failure' | '';
  boothUid?: string;
  sortBy?: 'amount' | 'date';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Fetches payments.
 */
export const getPayments = async (
  limit: number,
  offset: number,
  filters?: PaymentFilters
): Promise<ListPaymentsResponse> => {
  try {
    const response =
      await apiClient.get<ListPaymentsResponse>(
        '/admin/payments',
        {
          params: {
            limit,
            offset,
            ...filters,
          },
        }
      );

    return response.data;
  } catch (error) {
    console.error(
      'Failed to fetch payments:',
      error
    );

    throw error;
  }
};

/**
 * =========================================================
 * RENTAL FLEET
 * =========================================================
 */

export interface RentalFleetIssued {
  batteryUid: string;

  state:
  | 'ISSUED'
  | 'RETURNED';

  sessionId: number;

  rentedAt: string;

  sourceBoothUid: string;

  sourceSlotIdentifier: string;

  user: {
    name: string;
    phone: string;
    email: string;
  };
}

export interface RentalFleetInSlot {
  batteryUid: string;

  state: 'IN_SLOT';

  boothUid: string;

  slotIdentifier: string;

  chargeLevel: number | null;

  slotStatus: string;
}

export interface RentalFleetResponse {
  total: number;

  issued: RentalFleetIssued[];

  inSlots: RentalFleetInSlot[];
}

/**
 * Fetches rental fleet.
 */
export const getRentalFleet =
  async (): Promise<RentalFleetResponse> => {
    try {
      const response =
        await apiClient.get<RentalFleetResponse>(
          '/admin/rentals/fleet'
        );

      return response.data;
    } catch (error) {
      console.error(
        'Failed to fetch rental fleet:',
        error
      );

      throw error;
    }
  };

/**
 * =========================================================
 * RENTAL BATTERY SORTING
 * =========================================================
 */

/**
 * Sort rental batteries by SOC.
 *
 * Highest SOC comes first.
 *
 * Example:
 *
 * R-1091 -> 94%
 * R-1082 -> 87%
 * R-1105 -> 82%
 */
export const sortRentalBatteriesBySoc = (
  batteries: RentalFleetInSlot[]
): RentalFleetInSlot[] => {
  return [...batteries].sort(
    (a, b) =>
      (b.chargeLevel ?? 0) -
      (a.chargeLevel ?? 0)
  );
};

/**
 * =========================================================
 * RENTAL SESSIONS
 * =========================================================
 */

export interface RentalSession {
  id: string;
  riderName: string;
  phone?: string;
  rentalBatteryId: string;
  ownBatteryId?: string;
  durationMinutes?: number;
  amount?: number;
  totalAmount?: number;
  status?: string;
  startTime?: string;
}

export interface RentalSessionsResponse {
  sessions: RentalSession[];
  total: number;
}

/**
 * Fetches rental battery sessions.
 */
export const getRentalSessions =
  async (): Promise<RentalSessionsResponse> => {
    try {
      const response =
        await apiClient.get<RentalSessionsResponse>(
          '/admin/rentals/sessions'
        );

      return response.data;
    } catch (error) {
      console.error(
        'Failed to fetch rental sessions:',
        error
      );

      throw error;
    }
  };

/**
 * =========================================================
 * RENTAL BATTERY ADMIN ACTIONS
 * =========================================================
 */

export interface CreateRentalBatteryData {
  batteryUid: string;
  chargeLevel: number;
  boothUid: string;
  slotIdentifier: string;
  notes?: string;
}

export interface CreateRentalBatteryResponse {
  batteryUid: string;
  chargeLevel: number;
  boothUid: string;
  slotIdentifier: string;
  notes?: string | null;
}

/**
 * Adds a battery to the rental pool.
 */
export const createRentalBattery =
  async (
    data: CreateRentalBatteryData
  ): Promise<CreateRentalBatteryResponse> => {
    try {
      const response =
        await apiClient.post<CreateRentalBatteryResponse>(
          '/admin/rentals',
          data
        );

      return response.data;
    } catch (error) {
      console.error(
        'Failed to create rental battery:',
        error
      );

      throw error;
    }
  };

export interface WithdrawRentalBatteryData {
  reason: string;
  notes?: string;
}

export interface WithdrawRentalBatteryResponse {
  batteryUid: string;
  withdrawn: boolean;
  reason: string;
  notes?: string | null;
}

/**
 * Withdraws a battery from the rental pool.
 */
export const withdrawRentalBattery =
  async (
    batteryUid: string,
    data: WithdrawRentalBatteryData
  ): Promise<WithdrawRentalBatteryResponse> => {
    try {
      const response =
        await apiClient.post<WithdrawRentalBatteryResponse>(
          `/admin/rentals/${encodeURIComponent(
            batteryUid
          )}/withdraw`,
          data
        );

      return response.data;
    } catch (error) {
      console.error(
        'Failed to withdraw rental battery:',
        error
      );

      throw error;
    }
  };