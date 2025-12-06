import axios, { AxiosError } from 'axios';

/**
 * A single, configured axios instance for all API calls.
 * It includes a base URL and sets `withCredentials` to true to ensure
 * that session cookies are sent with every request.
 */
const apiClient = axios.create({ 
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api', 
  headers: {
    'Content-Type': 'application/json',
  },
  // This is crucial for sending the httpOnly session cookie to the backend
  withCredentials: true,
});

/**
 * Axios response interceptor for global error handling.
 */
apiClient.interceptors.response.use(
  // If the response is successful (status 2xx), just return it.
  (response) => response,

  // If the response has an error, handle it here.
  (error: AxiosError) => {
    // You can add custom logic for different error statuses.
    if (error.response) {
      const { status, data } = error.response;
      console.error(`API Error: Status ${status}`, data);

      switch (status) {
        case 401:
          // Unauthorized: The user's session is likely invalid or expired.
          // Redirecting to the login page is a common way to handle this.
          // We use `window.location.href` to force a full page reload, which clears any component state.
          alert('Your session has expired. Please log in again.');
          window.location.href = '/'; // Assuming your login page is at the root
          break;
        case 403:
          // Forbidden: The user is authenticated but not authorized to perform this action.
          alert('You do not have permission to perform this action.');
          break;
      }
    }
    // Re-throw the error to allow individual .catch() blocks in components to handle it too.
    return Promise.reject(error);
  }
);

export default apiClient;