const mongoose = require('mongoose');

/**
 * Notification Schema: Centralized Alert System.
 * Stores alerts for Bookings, Messages, and Reviews.
 */
const notificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['booking', 'message', 'review', 'system'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String }, // Path to navigate to (e.g., /bookings)
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
