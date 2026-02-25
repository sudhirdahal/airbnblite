import { io } from "socket.io-client";

// --- DEPLOYMENT READY: Dynamic Socket URL ---
// Use VITE_SOCKET_URL environment variable if present, otherwise default to localhost.
const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

// Create and export a single Socket.IO client instance.
const socket = io(SOCKET_SERVER_URL, {
  transports: ["websocket"]
});

socket.on("connect", () => {
  console.log("Connected to Socket.IO server.");
});

socket.on("disconnect", () => {
  console.log("Disconnected from Socket.IO server.");
});

socket.on("connect_error", (err) => {
  console.error("Socket.IO connection error:", err.message);
});

export default socket;
