import axios from 'axios';

/**
 * ============================================================================
 * API SERVICE (The HTTP Connector)
 * ============================================================================
 * Initially, this was a collection of raw fetch() calls. 
 * It has evolved into a centralized Axios instance that handles:
 * 1. Automatic Base URL routing (Production vs. Local).
 * 2. High-fidelity Token Injection via Interceptors.
 */
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
});

/* --- HISTORICAL STAGE 1: MANUAL HEADERS ---
 * const res = await axios.get(url, {
 *   headers: { 'x-auth-token': localStorage.getItem('token') }
 * });
 * // Problem: Too much boilerplate! We forgot the token half the time.
 */

/**
 * AUTHENTICATION INTERCEPTOR
 * Logic: Every single outbound request automatically checks the 
 * browser's local storage for a valid JWT and injects it into the 
 * 'x-auth-token' header if found.
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
