const mongoose = require('mongoose');

/**
 * Message Schema: Stores real-time chat data.
 * UPDATED: Added 'isRead' to support unread notifications.
 */
const messageSchema = new mongoose.Schema({
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  listingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Listing', 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  // --- NEW: Read Status ---
  isRead: {
    type: Boolean,
    default: false
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Message', messageSchema);
