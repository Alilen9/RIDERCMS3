import apiClient from '@/client/apiClient';
import { User, UserRole, Station, SlotStatus, BatteryType } from '../types';

/**
 * Type for the status of a user's account, as managed by admin.
 * Based on POST /api/admin/users/set-status in Endpoints.md
 */
export type UserAccountStatus = 'active' | 'inactive' | 'suspended';

/**
 * Interface for the detailed booth status returned by the admin endpoint.
 * This mirrors the example response for GET /api/admin/booths/status.
 */
export interface AdminBoothStatus {
  boothUid: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance'; // Example statuses
  slots: {
    slotIdentifier: string;
    status: SlotStatus;
    battery?: {
      batteryUid: string;
      chargeLevel: number;
      ownerEmail?: string;
    };
  }[];
}

/**
 * Interface for a paginated list of users.
 * Based on GET /api/admin/users in Endpoints.md
 */
export interface PaginatedUsersResponse {
  users: User[];
  nextPageToken?: string; // For pagination
  totalCount?: number; // Optional total count
}

/**
 * Assigns a specific role to a user.
 * @param uid - The Firebase UID of the user.
 * @param newRole - The new role to assign ('admin', 'customer', 'driver').
 * @returns A promise that resolves on successful role assignment.
 */
export const setRole = async (uid: string, newRole: UserRole): Promise<void> => {
  try {
    await apiClient.post('/admin/users/set-role', { uid, newRole });
  } catch (error) {
    throw error;
  }
};

/**
 * Retrieves a paginated list of all users.
 * @param pageSize - The number of users to fetch per page (optional, default: 100).
 * @param pageToken - The token to fetch the next page of results (optional).
 * @returns A promise that resolves with a paginated list of users.
 */
export const getUsers = async (
  pageSize?: number,
  pageToken?: string
): Promise<PaginatedUsersResponse> => {
  try {
    const response = await apiClient.get<PaginatedUsersResponse>('/admin/users', {
      params: { pageSize, pageToken },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Activates or deactivates a user's account.
 * @param uid - The Firebase UID of the user.
 * @param status - The new status for the user's account ('active', 'inactive', 'suspended').
 * @returns A promise that resolves on successful status update.
 */
export const setUserStatus = async (uid: string, status: UserAccountStatus): Promise<void> => {
  try {
    await apiClient.post('/admin/users/set-status', { uid, status });
  } catch (error) {
    throw error;
  }
};

/**
 * Retrieves a comprehensive, real-time status of all booths.
 * @returns A promise that resolves with a structured list of all booths and their contents.
 */
export const getBoothStatus = async (): Promise<AdminBoothStatus[]> => {
  try {
    const response = await apiClient.get<AdminBoothStatus[]>('/admin/booths/status');
    return response.data;
  } catch (error) {
    throw error;
  }
};