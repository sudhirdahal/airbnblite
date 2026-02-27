import axios from 'axios';

/**
 * ============================================================================
 * API SERVICE (The Production Connector)
 * ============================================================================
 * FIXED: Explicit fallback to the live Render backend URL to prevent 
 * 'Mixed Content' (HTTP vs HTTPS) crashes on the deployed site.
 */
const API = axios.create({
  // Use Vercel's env variable, or fallback to your specific production backend
  baseURL: import.meta.env.VITE_API_URL || 'https://airbnblite-backend.onrender.com/api',
});

/**
 * AUTHENTICATION INTERCEPTOR
 * Injects the JWT into every outbound request.
 */
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;
