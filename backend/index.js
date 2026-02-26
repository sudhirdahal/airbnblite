const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const { handleChatMessage, handleJoinRoom } = require('./controllers/chatController');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://airbnblite.vercel.app',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) return callback(new Error('CORS Error'), false);
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

/**
 * ============================================================================
 * SCALABILITY FIX: REAL-TIME NOTIFICATION ENGINE (SOCKET.IO)
 * ============================================================================
 * In Phase 5, we used 'Polling' (checking the server every 15s). 
 * This was inefficient. We've now moved to 'Push' architecture.
 */
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"] }
});

// We attach 'io' to the 'app' object so we can access it inside our Controllers
app.set('socketio', io);

io.on('connection', (socket) => {
  // Join listing-specific rooms for group chat
  socket.on('join room', (listingId) => handleJoinRoom(io, socket, listingId));
  
  // --- NEW: Private User Room ---
  // When a user logs in, the frontend sends their userId.
  // They join a private room named after their ID.
  socket.on('identify', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their private alert room.`);
  });

  socket.on('chat message', (msg) => handleChatMessage(io, socket, msg));
  socket.on('disconnect', () => {});
});

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payment', paymentRoutes);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
