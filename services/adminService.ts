import apiClient from '../client/apiClient';
import { UserRole } from '../types';

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
  slots: {
    slotIdentifier: string;
    status: string;
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