import axios from 'axios';

/**
 * Standardized Axios HTTP client instance.
 * Authentication is transmitted via secure HTTP-only cookies with withCredentials: true.
 * Sensitive JWT tokens are not stored in JavaScript localStorage.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response Interceptor: Catch 401 Unauthorized responses to clear stale state
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hackbuddy_token');
      localStorage.removeItem('hackbuddy_user');
      window.dispatchEvent(
        new CustomEvent('hackbuddy:unauthorized', {
          detail: { message: error.response?.data?.message || 'Session expired' },
        }),
      );
    }
    return Promise.reject(error);
  },
);

export default api;
