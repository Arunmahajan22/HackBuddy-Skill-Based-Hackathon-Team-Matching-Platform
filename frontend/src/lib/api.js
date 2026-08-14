import axios from 'axios';

/**
 * Standardized Axios HTTP client instance.
 * Supports cross-origin HTTP-only cookies (withCredentials: true)
 * and fallback Authorization Bearer header.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token from localStorage if present (hybrid auth)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hackbuddy_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Catch 401 Unauthorized responses to clear stale state
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hackbuddy_token');
      localStorage.removeItem('hackbuddy_user');
      window.dispatchEvent(new CustomEvent('hackbuddy:unauthorized', {
        detail: { message: error.response?.data?.message || 'Session expired' },
      }));
    }
    return Promise.reject(error);
  },
);

export default api;
