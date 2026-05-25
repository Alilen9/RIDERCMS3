import axios from 'axios';
import { auth } from '../firebase';
import * as requestCache from '../utils/requestCache';

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
 * Attaches Firebase auth token, and handles in-memory caching + ETag/304.
 */
apiClient.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.method?.toLowerCase() === 'get') {
      const cached = requestCache.get(config.method, config.url);
      if (cached) {
        config.adapter = () => Promise.resolve({
          data: cached.data,
          status: 200,
          statusText: 'OK',
          headers: { 'x-cache': 'HIT' },
          config,
          request: {},
        });
        return config;
      }

      const entry = requestCache.getEntry(config.method, config.url);
      if (entry?.etag) {
        config.headers['If-None-Match'] = entry.etag;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Axios response interceptor.
 * Caches successful GET responses and handles 304 Not Modified.
 */
apiClient.interceptors.response.use(
  (response) => {
    if (response.config.method?.toLowerCase() === 'get' && response.status === 200) {
      const etag = response.headers['etag'];
      requestCache.set(
        response.config.method,
        response.config.url,
        response.data,
        typeof etag === 'string' ? etag : undefined
      );
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 304 && error.response.config.method?.toLowerCase() === 'get') {
      const config = error.response.config;
      const entry = requestCache.getEntry(config.method, config.url);
      if (entry) {
        requestCache.set(config.method, config.url, entry.data, entry.etag);
        return Promise.resolve({
          data: entry.data,
          status: 200,
          statusText: 'OK',
          headers: error.response.headers,
          config,
          request: error.response.request,
        });
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;