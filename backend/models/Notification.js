const mongoose = require('mongoose');

/**
 * ============================================================================
 * NOTIFICATION SCHEMA (The Global Alert Hub)
 * ============================================================================
 * A universal model designed to store system-level alerts.
 * Supports multiple event types: 'booking', 'review', and 'message'.
 * 
 * Logic: Decouples the event trigger from the UI alert, allowing the 
 * Navbar bell to poll or receive pushes for any relevant user activity.
 */
const notificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  /**
   * TYPE IDENTIFIER
   * booking: New reservation or cancellation.
   * review: A guest has left feedback.
   * message: Direct chat interaction.
   */
  type: { 
    type: String, 
    enum: ['booking', 'review', 'message'], 
    required: true 
  },
  
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String }, // Dynamic deep-link (e.g., /bookings)
  
  isRead: { 
    type: Boolean, 
    default: false 
  },
  
  createdAt: { type: Date, default: Date.now }
});

/* --- HISTORICAL STAGE 1: NOTIFICATION-LESS ---
 * In Phase 1-4, the app lacked a persistent notification system.
 * Alerts were only handled in-memory via Sockets.
 */

module.exports = mongoose.model('Notification', notificationSchema);
