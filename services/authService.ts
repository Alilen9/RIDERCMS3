import apiClient from '../client/apiClient';
import { User } from '../types';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

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

/**
 * Fetches the current user's profile from the backend.
 * The API client interceptor is responsible for attaching the auth token.
 * @returns A promise that resolves with the user's profile data if logged in.
 */
export const getUserProfile = async (): Promise<User> => {
  try {
    // This endpoint path can be whatever you want, e.g., '/users/me'
    const response = await apiClient.get<User>('/auth/profile');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  // Simply sign the user out of the Firebase client SDK.
  await signOut(auth);
};