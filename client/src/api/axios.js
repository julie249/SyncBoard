import axios from 'axios';

// Ensure baseURL handles custom domains with or without trailing /api
const rawBaseURL = import.meta.env.VITE_API_URL || '/api';
const cleanBase = rawBaseURL.replace(/\/$/, '');
const baseURL = cleanBase.endsWith('/api') || cleanBase === '/api'
  ? cleanBase
  : `${cleanBase}/api`;

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('syncboard_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Do not redirect if it's the login or register request itself
      const url = error.config?.url || '';
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        localStorage.removeItem('syncboard_token');
        localStorage.removeItem('syncboard_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
