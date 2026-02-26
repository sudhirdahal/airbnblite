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
    if (allowedOrigins.indexOf(origin) === -1) return callback(new Error('CORS Policy: Access Denied'), false);
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

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"] }
});

app.set('socketio', io);

io.on('connection', (socket) => {
  // JOIN: Listing-specific chat rooms
  socket.on('join room', (listingId) => handleJoinRoom(io, socket, listingId));
  
  // IDENTIFY: Private User Notification Room
  socket.on('identify', (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`Socket [${socket.id}] identified as User [${userId}]`);
    }
  });

  // MESSAGE: Chat handling
  socket.on('chat message', (msg) => handleChatMessage(io, socket, msg));

  // --- NEW: SERVER-SIDE TYPING BROADCASTERS ---
  socket.on('typing', (data) => {
    // Broadcast 'typing' to everyone in the room EXCEPT the sender
    socket.to(data.listingId).emit('typing', data);
  });

  socket.on('stop_typing', (data) => {
    socket.to(data.listingId).emit('stop_typing', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected from Socket.');
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payment', paymentRoutes);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Backend operational on port ${PORT}`));
