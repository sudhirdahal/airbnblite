import { io } from 'socket.io-client';

/**
 * ============================================================================
 * SOCKET SERVICE (The Real-Time Connector)
 * ============================================================================
 * This module manages the persistent WebSocket tunnel between the 
 * frontend and the backend server. 
 * 
 * Logic: Enables the 'Push' architecture that allows the server to 
 * notify the user of messages and alerts without the need for polling.
 */

// --- DYNAMIC PRODUCTION ROUTING ---
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true, // Maintain high-fidelity connection on mobile network swaps
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

/* --- HISTORICAL STAGE 1: LOCAL-ONLY SOCKET ---
 * const socket = io('http://localhost:5001');
 * // Problem: Chat broke the second we deployed to Render/Vercel!
 */

export default socket;
