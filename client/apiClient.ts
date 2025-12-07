import axios from 'axios';
import { auth } from '../firebase';

/**
 * A single, configured axios instance for all API calls.
 */
const apiClient = axios.create({ 
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://ridercmsv1-194585815067.europe-west1.run.app/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Axios request interceptor.
 * This function runs before every request and automatically attaches the
 * Firebase auth token if the user is logged in.
 */
apiClient.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * NOTE: The previous response interceptor that handled 401/403 errors
 * has been removed. The `AuthContext` now handles logout logic when fetching
 * a user profile fails, which is a more robust pattern for token-based auth.
 */

export default apiClient;