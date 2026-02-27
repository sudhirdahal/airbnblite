import axios from 'axios';

/**
 * ============================================================================
 * 🌐 API SERVICE (The Production Connector)
 * ============================================================================
 * 
 * MASTERCLASS NOTES:
 * In a professional React application, you NEVER use raw `fetch()` calls 
 * scattered throughout your components. If the API URL changes, or if you need 
 * to attach an authorization token to every request, updating 50 `fetch` calls 
 * is a maintenance nightmare.
 * 
 * Instead, we use the "Singleton Pattern" with Axios to create a central 
 * configuration node for all external communication.
 * 
 * Evolution Timeline:
 * - Phase 1: Hardcoded `localhost:5001`. (Broke immediately upon deployment).
 * - Phase 9: Environment Variable Injection (`VITE_API_URL`).
 * - Phase 16: Interceptor Architecture (Automatic JWT Injection).
 */

/* ============================================================================
 * 👻 HISTORICAL GHOST: PHASE 1 (The Hardcoded Disaster)
 * ============================================================================
 * const API = axios.create({ baseURL: 'http://localhost:5001/api' });
 * 
 * THE FLAW: When we deployed the frontend to Vercel, it still tried to talk to 
 * 'localhost' on the user's phone, completely breaking the app. We had to implement 
 * "Infrastructure Manifests" (Environment Variables) to fix this.
 * ============================================================================ */

const API = axios.create({
  // Infrastructure Manifest (Phase 9):
  // Vite looks for the .env file locally. If it doesn't exist (like on Vercel),
  // it falls back to the hardcoded Render production URL.
  baseURL: import.meta.env.VITE_API_URL || 'https://airbnblite-backend.onrender.com/api',
});

/**
 * 🛡️ AUTHENTICATION INTERCEPTOR (Phase 16)
 * 
 * Logic: An interceptor is "middleware for the frontend." 
 * Before any Axios request leaves the browser, this function runs. It checks
 * LocalStorage for a JWT. If one exists, it silently attaches it to the 
 * `x-auth-token` header. 
 * 
 * Why? This completely decouples authentication from the UI components. 
 * Components just say `API.get('/profile')`, and the Interceptor handles the security handshake.
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
