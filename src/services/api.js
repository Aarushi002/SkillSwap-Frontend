import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Store reference will be set by the app
let store;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Function to set store reference
export const setStore = (storeInstance) => {
  store = storeInstance;
};

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (store) {
        // Dispatch logout action through Redux
        const { logout } = require('../store/slices/authSlice');
        store.dispatch(logout());
      } else {
        // Fallback - this should rarely happen
        console.warn('Store not available, redirecting manually');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
