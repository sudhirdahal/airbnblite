const mongoose = require('mongoose');

/**
 * ============================================================================
 * BOOKING SCHEMA (The Transaction Ledger)
 * ============================================================================
 * Manages the lifecycle of a property reservation.
 * Logic: Links a traveler (User) to a property (Listing) for a specific
 * date range, with a finalized price calculation.
 */
const bookingSchema = new mongoose.Schema({
  listingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Listing', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // RESERVATION DATES
  checkIn: { 
    type: Date, 
    required: true 
  },
  checkOut: { 
    type: Date, 
    required: true 
  },

  // FINANCIAL DATA
  totalPrice: { 
    type: Number, 
    required: true 
  },
  
  /**
   * STATUS LIFE-CYCLE
   * pending: Initial request stage.
   * confirmed: Payment successful / Handshake complete.
   * cancelled: Refunded or voided by guest/host.
   */
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled'], 
    default: 'confirmed' 
  },
  
  createdAt: { type: Date, default: Date.now }
});

/* --- HISTORICAL STAGE 1: BLIND BOOKING ---
 * const bookingSchema = new mongoose.Schema({
 *   listingId: { type: String, required: true },
 *   checkIn: { type: String, required: true },
 *   checkOut: { type: String, required: true }
 * });
 */

module.exports = mongoose.model('Booking', bookingSchema);
