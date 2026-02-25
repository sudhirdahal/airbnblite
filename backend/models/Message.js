const mongoose = require('mongoose');

// Define the Message Schema
// This schema will store individual chat messages.
const messageSchema = new mongoose.Schema({
  // Reference to the User who sent the message.
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Reference to the Listing this message is related to (e.g., chat about a specific property).
  // This makes the chat context-specific.
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  // The actual text content of the message.
  content: {
    type: String,
    required: true,
    trim: true // Remove whitespace from both ends of a string.
  },
  // Timestamp for when the message was sent.
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Export the Message model, making it available for Mongoose operations.
module.exports = mongoose.model('Message', messageSchema);
