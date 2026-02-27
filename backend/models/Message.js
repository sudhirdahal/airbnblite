const mongoose = require('mongoose');

/**
 * ============================================================================
 * MESSAGE SCHEMA (The Chat Atomic Unit)
 * ============================================================================
 * This model persists individual bidirectional communications.
 * It has evolved from a flat text log to a synchronized notification unit.
 * 
 * Logic: Every message is tied to a 'Listing' context, allowing the 
 * Inbox to perform unique thread aggregation.
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
  
  /**
   * SYNC LOGIC: isRead
   * Initially absent. Added in Phase 5 to power the global unread 
   * notification badges in the Navbar.
   */
  isRead: {
    type: Boolean,
    default: false
  },
  
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

/* --- HISTORICAL STAGE 1: PRIMITIVE MESSAGE ---
 * const messageSchema = new mongoose.Schema({
 *   sender: { type: String, required: true },
 *   content: { type: String, required: true }
 * });
 */

module.exports = mongoose.model('Message', messageSchema);
