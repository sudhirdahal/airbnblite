const mongoose = require('mongoose');

/**
 * ============================================================================
 * 📅 BOOKING SCHEMA (The Transaction Ledger)
 * ============================================================================
 * 
 * MASTERCLASS NOTES:
 * The Booking Schema acts as the irrefutable ledger of truth for the platform.
 * It permanently links a Traveler (User), a Property (Listing), Time (Dates), 
 * and Money (Price) into a single, cohesive entity.
 * 
 * Evolution Timeline:
 * - Phase 1: Blind Date Storage (Strings instead of Date objects).
 * - Phase 3: Temporal Integrity (Enforcing strict Date formatting).
 * - Phase 6: Financial Locking (Storing the final price).
 */

/* ============================================================================
 * 👻 HISTORICAL GHOST: PHASE 1 (The Blind Booking)
 * ============================================================================
 * const bookingSchema = new mongoose.Schema({
 *   listingId: { type: String, required: true }, // Not a relational reference!
 *   checkIn: { type: String, required: true },   // Text string, not a Date!
 *   checkOut: { type: String, required: true }
 * });
 * 
 * THE FLAW: Because `checkIn` was a String (e.g., "Jan 5th"), MongoDB could not 
 * perform mathematical operations ($lt, $gt) to detect overlapping stays. 
 * Because `listingId` was just a string, we couldn't `populate()` the property details.
 * ============================================================================ */

const bookingSchema = new mongoose.Schema({
  /**
   * 🔗 RELATIONAL INTEGRITY
   * We use strict ObjectIds. This allows us to use `.populate('listingId')` 
   * to instantly fetch the property's Title and Image for the 'Trips' page,
   * without needing to run separate database queries.
   */
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
  
  /**
   * ⏳ TEMPORAL INTEGRITY (Phase 3)
   * Storing as pure JS Dates allows the backend to perform the 
   * Mathematical Conflict Shield operations seamlessly.
   */
  checkIn: { 
    type: Date, 
    required: true 
  },
  checkOut: { 
    type: Date, 
    required: true 
  },

  /**
   * 💰 FINANCIAL LOCKING (Phase 6)
   * Why store the price here when the Listing has a `rate`?
   * Because if the Host increases their rate *tomorrow*, it shouldn't change
   * the price of a booking made *today*. The ledger must be immutable.
   */
  totalPrice: { 
    type: Number, 
    required: true,
    min: 0
  },
  
  /**
   * 👥 GUEST BREAKDOWN (Phase 38)
   * Tracks the composition of the traveling party.
   */
  guests: {
    adults: { type: Number, default: 1, min: 1 },
    children: { type: Number, default: 0, min: 0 },
    infants: { type: Number, default: 0, min: 0 }
  },

  /**
   * 🚥 STATUS LIFE-CYCLE
   * pending: Initial request stage (Pre-Payment).
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

module.exports = mongoose.model('Booking', bookingSchema);
