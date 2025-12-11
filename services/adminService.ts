
import apiClient from '../client/apiClient';
import { Booth, UserRole } from '../types';

/**
 * The shape of a user object as returned by the GET /api/admin/users endpoint.
 */
export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  disabled: boolean;
  creationTime: string;
  lastSignInTime: string;
}

export interface ListUsersResponse {
  users: AdminUser[];
  nextPageToken?: string;
}

/**
 * The possible account statuses for a user.
 */
export type UserAccountStatus = 'active' | 'disabled';

/**
 * The shape of a booth status object as returned by GET /api/admin/booths/status.
 */
export interface AdminBoothStatus {
  boothUid: string;
  location: string;
  status: string;
  lastHeartbeatAt: string;
  slots: {
    slotIdentifier: string;
    status: string;
    doorStatus: 'locked' | 'unlocked' | 'ajar' | 'unknown';
    relayState: 'on' | 'off';
    battery: {
      batteryUid: string;
      chargeLevel: number;
      ownerEmail: string | null;
    } | null;
  }[];
}

/**
 * The shape of a transaction object as returned by GET /api/admin/transactions.
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
 * The shape of the application settings object.
 */
export interface AppSettings {
  pricing?: {
    base_swap_fee: number;
    cost_per_kwh: number;
    overtime_penalty_per_min: number;
  };
  access_control?: {
    allow_open_registration: boolean;
  };
}

/**
 * The data required to create a new booth.
 */
export interface CreateBoothData {
  name: string;
  locationAddress: string;
}

/**
 * The response from creating a new booth.
 */
export interface CreateBoothResponse {
  message: string;
  boothUid: string;
}

/**
 * Creates a new booth in the system.
 * @param boothData The data for the new booth.
 * @returns A promise that resolves with the creation response.
 */
export const createBooth = async (boothData: CreateBoothData): Promise<CreateBoothResponse> => {
  const response = await apiClient.post<CreateBoothResponse>('/admin/booths', boothData);
  return response.data;
};

/**
 * The response from fetching a list of booths.
 */
export interface ListBoothsResponse {
  booths: Booth[];
  total: number;
}

/**
 * Fetches a list of all booths from the admin endpoint.
 * @returns A promise that resolves with the list of booths.
 */
export const getBooths = async (): Promise<ListBoothsResponse> => {
  const response = await apiClient.get<ListBoothsResponse>('/admin/booths');
  return response.data;
};

/**
 * Updates an existing booth's details.
 * @param boothUid The UID of the booth to update.
 * @param boothData The data to update.
 * @returns A promise that resolves when the update is complete.
 */
export const updateBooth = async (boothUid: string, boothData: Partial<CreateBoothData>): Promise<Booth> => {
  const response = await apiClient.patch<{ message: string, booth: Booth }>(`/admin/booths/${boothUid}`, boothData);
  return response.data.booth;
};

/**
 * Deletes a booth from the system.
 * @param boothUid The UID of the booth to delete.
 * @returns A promise that resolves when the deletion is complete.
 */
export const deleteBooth = async (boothUid: string): Promise<void> => {
  await apiClient.delete(`/admin/booths/${boothUid}`);
};

/**
 * The shape of a command to be sent to a slot.
 * Keys are command names, values are their parameters (often just `true`).
 */
export interface SlotCommand {
  [key: string]: any;
}

/**
 * Sends a command to a specific booth slot.
 * @param boothUid The UID of the target booth.
 * @param slotIdentifier The identifier of the target slot.
 * @param command The command object to send.
 */
export const sendSlotCommand = async (boothUid: string, slotIdentifier: string, command: SlotCommand): Promise<void> => {
  await apiClient.post(`/admin/booths/${boothUid}/slots/${slotIdentifier}/command`, command);
};

/**
 * Fetches a paginated list of all users from the admin endpoint.
 * @param pageToken - The token for fetching the next page of results.
 * @returns A promise that resolves with the list of users and a potential next page token.
 */
export const getUsers = async (pageToken?: string): Promise<ListUsersResponse> => {
  try {
    const response = await apiClient.get<ListUsersResponse>('/admin/users', {
      params: { pageToken, pageSize: 50 },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};

/**
 * Fetches the comprehensive status of all booths from the admin endpoint.
 * @returns A promise that resolves with an array of booth statuses.
 */
export const getBoothStatus = async (): Promise<AdminBoothStatus[]> => {
  try {
    const response = await apiClient.get<AdminBoothStatus[]>('/admin/booths/status');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch booths status:', error);
    throw error;
  }
};


// You can continue to add other admin service functions here, for example:
/*
export const getProblemReports = async (status?: string): Promise<any[]> => {
  const response = await apiClient.get('/admin/problem-reports', { params: { status } });
  return response.data;
};
*/
/**
 * Sets the role for a specific user.
 * @param userId The UID of the user to modify.
 * @param newRole The new role to assign.
 */
export const setRole = async (userId: string, newRole: UserRole): Promise<void> => {
  try {
    await apiClient.put(`/admin/users/${userId}/role`, { role: newRole });
  } catch (error) {
    console.error(`Failed to set role for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Sets the account status (enabled/disabled) for a specific user.
 * @param userId The UID of the user to modify.
 * @param status The new status to set.
 */
export const setUserStatus = async (userId: string, status: UserAccountStatus): Promise<void> => {
  try {
    await apiClient.put(`/admin/users/${userId}/status`, { disabled: status === 'disabled' });
  } catch (error) {
    console.error(`Failed to set status for user ${userId}:`, error);
    throw error;
  }
};

// You can continue to add other admin service functions here, for example:
/*
export const getProblemReports = async (status?: string): Promise<any[]> => {
  const response = await apiClient.get('/admin/problem-reports', { params: { status } });
  return response.data;
};
*/
/**
 * Deletes a user from the system.
 * @param userId The UID of the user to delete.
 */
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    await apiClient.delete(`/admin/users/${userId}`);
  } catch (error) {
    console.error(`Failed to delete user ${userId}:`, error);
    throw error;
  }
};

/**
 * Fetches a paginated list of all transactions from the admin endpoint.
 * @param limit The number of transactions to fetch.
 * @param offset The number of transactions to skip.
 * @param filters Optional search and filter criteria.
 */
export const getTransactions = async (
  limit: number,
  offset: number,
  filters?: { searchTerm?: string; status?: string }
): Promise<ListTransactionsResponse> => {
  try {
    const response = await apiClient.get<ListTransactionsResponse>('/admin/transactions', {
      params: {
        limit,
        offset,
        ...filters,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    throw error;
  }
};

/**
 * Fetches all application settings from the admin endpoint.
 */
export const getSettings = async (): Promise<AppSettings> => {
  try {
    const response = await apiClient.get<AppSettings>('/admin/settings');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    throw error;
  }
};


/**
 * Updates one or more application settings.
 * @param settings The settings object to update.
 */
export const updateSettings = async (settings: Partial<AppSettings>): Promise<void> => {
  try {
    await apiClient.post('/admin/settings', settings);
  } catch (error) {
    console.error('Failed to update settings:', error);
    throw error;
  }
};

/**
 * (Dev Tool) Simulates a hardware confirmation of a battery deposit.
 * @param data The simulation data.
 */
export const simulateConfirmDeposit = async (data: {
  boothUid: string;
  slotIdentifier: string;
  chargeLevel: number;
}): Promise<void> => {
  await apiClient.post('/admin/simulate/confirm-deposit', data);
};

/**
 * (Dev Tool) Simulates a successful M-Pesa payment for a withdrawal.
 * @param data The simulation data.
 */
export const simulateConfirmPayment = async (data: {
  checkoutRequestId: string;
}): Promise<void> => {
  await apiClient.post('/admin/simulate/confirm-payment', data);
};

/**
 * Resets all slots in a given booth to their default 'available' state.
 * @param boothUid The UID of the booth to reset.
 * @param slotIdentifier Optional. The specific slot to reset. If omitted, all slots are reset.
 * @returns A promise that resolves when the reset is complete.
 */
export const resetBoothSlots = async (boothUid: string, slotIdentifier?: string): Promise<void> => {
  await apiClient.post(`/admin/booths/${boothUid}/reset-slots`, slotIdentifier ? { slotIdentifier } : {});
};

/**
 * The shape of the dashboard summary data.
 */
export interface DashboardSummary {
  totalRevenue: number;
  activeStations: number;
  totalSwaps: number;
  activeSessions: number;
  totalUsers: number;
  swapVolumeTrend: { name: string; val: number }[];
  batteryUsage: { name: string; value: number }[];
}

/**
 * Fetches the aggregated summary data for the admin dashboard.
 * @returns A promise that resolves with the dashboard summary data.
 */
export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  try {
    const response = await apiClient.get<DashboardSummary>('/admin/dashboard-summary');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch dashboard summary:', error);
    throw error;
  }
};