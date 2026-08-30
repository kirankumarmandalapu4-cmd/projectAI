import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Use an explicit IPv4 loopback fallback so local development does not depend
// on how the browser resolves `localhost` (IPv4 vs IPv6).
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export const clearAuthStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  // Keep in-memory auth state aligned with storage so protected routes react
  // immediately to an expired session, including native fetch requests.
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token expiry handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        clearAuthStorage();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
