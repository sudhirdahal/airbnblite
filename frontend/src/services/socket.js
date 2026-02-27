import { io } from 'socket.io-client';

/**
 * ============================================================================
 * ⚡ SOCKET SERVICE (The Real-Time Tunnel)
 * ============================================================================
 * 
 * MASTERCLASS NOTES:
 * Just like the API service, our Socket connection must be a Singleton.
 * If we called `io()` inside a component, React would create a new WebSocket 
 * connection every time the component re-rendered, quickly crashing our 
 * backend with thousands of phantom connections.
 * 
 * By defining it here, outside the React tree, we ensure the app only opens 
 * ONE permanent tunnel to the server.
 */

/* ============================================================================
 * 👻 HISTORICAL GHOST: PHASE 9 (The Mixed Content Crash)
 * ============================================================================
 * const socket = io('http://airbnblite-backend.onrender.com');
 * 
 * THE FLAW: Vercel forces HTTPS (secure). If a secure frontend tries to open 
 * an insecure HTTP socket tunnel, the browser blocks it completely 
 * ("Mixed Content Error"). We had to enforce HTTPS fallback.
 * ============================================================================ */

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://airbnblite-backend.onrender.com';

const socket = io(SOCKET_URL, {
  // RESILIENCE PATTERNS (Phase 25)
  // These settings ensure that if a user goes on a train (loses connection),
  // the socket will automatically try to rebuild the tunnel up to 5 times.
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;
