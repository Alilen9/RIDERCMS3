import apiClient from '../client/apiClient';
import { User } from '../types';

/**
 * Type for the data required to register a new user.
 * Based on POST /api/auth/register in Endpoints.md
 */
interface RegistrationData {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
  recaptchaToken: string;
}

/**
 * Type for the successful login API response payload.
 * Based on POST /api/auth/sessionLogin in Endpoints.md
 */
interface LoginResponse {
  status: string;
  message: string;
  user: User; // Assuming the API returns a user object matching the User type
}

/**
 * Registers a new user.
 * @param data - The user's registration details.
 * @returns A promise that resolves on successful registration.
 */
export const register = async (data: RegistrationData): Promise<void> => {
  try {
    await apiClient.post('/auth/register', data);
  } catch (error) {
    throw error; // Re-throw to be handled by the calling component
  }
};

/**
 * Logs a user in by creating a session cookie via the backend.
 * @param idToken - The Firebase ID token obtained from the client-side auth.
 * @returns A promise that resolves with the user's profile data.
 */
export const sessionLogin = async (idToken: string, recaptchaToken: string): Promise<User> => {
  try {
    const response = await apiClient.post<LoginResponse>('/auth/sessionLogin', { idToken, recaptchaToken });
    return response.data.user;
  } catch (error) {
    throw error; // Re-throw to be handled by the calling component
  }
};

/**
 * Verifies a user's phone number after OTP confirmation.
 * @param idToken - The Firebase ID token from phone OTP verification.
 * @returns A promise that resolves on successful verification.
 */
export const verifyPhone = async (idToken: string): Promise<void> => {
  try {
    await apiClient.post('/auth/verify-phone', { idToken });
  } catch (error) {
    throw error; // Re-throw to be handled by the calling component
  }
};