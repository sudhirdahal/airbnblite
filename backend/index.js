const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const connectDB = require('./config/db'); // --- NEW: Modular DB Import ---

dotenv.config();

// Identity & Feature Routes
const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const { handleChatMessage, handleJoinRoom } = require('./controllers/chatController');

/**
 * ============================================================================
 * SERVER ARCHITECTURE (V9 - MODULAR ENFORCEMENT)
 * ============================================================================
 */
const app = express();
const server = http.createServer(app);

// Initialize Database Connection
connectDB();

// --- PRODUCTION CORS POLICY ---
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://airbnblite.vercel.app',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) return callback(new Error('CORS Policy Denied'), false);
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/**
 * ============================================================================
 * EVENT-DRIVEN NOTIFICATION HUB
 * ============================================================================
 */
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"] }
});

app.set('socketio', io);

io.on('connection', (socket) => {
  socket.on('join room', (listingId) => handleJoinRoom(io, socket, listingId));
  socket.on('identify', (userId) => {
    if (userId) socket.join(userId);
  });
  socket.on('chat message', (msg) => handleChatMessage(io, socket, msg));
  
  // Presence Handlers (Typing Indicators)
  socket.on('typing', (data) => socket.to(data.listingId).emit('typing', data));
  socket.on('stop_typing', (data) => socket.to(data.listingId).emit('stop_typing', data));
});

// Modular Route Groups
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payment', paymentRoutes);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`AirnbLite Backend Operational on port ${PORT}`));
