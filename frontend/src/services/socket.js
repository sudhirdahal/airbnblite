import { io } from 'socket.io-client';

/**
 * ============================================================================
 * SOCKET SERVICE (The Production Tunnel)
 * ============================================================================
 * FIXED: Explicitly set to the HTTPS Render URL to ensure real-time 
 * features work on the deployed site.
 */
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://airbnblite-backend.onrender.com';

const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;
