const mongoose = require('mongoose');

/**
 * ============================================================================
 * REVIEW SCHEMA (The Reputation Ledger)
 * ============================================================================
 * Stores guest feedback and ratings for specific listings.
 * 
 * Logic: Every new review triggers a mathematical recalculation of the 
 * parent Listing's 'averageRating' and 'reviewsCount' fields.
 */
const reviewSchema = new mongoose.Schema({
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
  
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  
  comment: { 
    type: String, 
    required: false 
  },
  
  /**
   * MEDIA: Review Photos
   * Phase 10: S3-powered guest image array support.
   */
  images: [{ 
    type: String 
  }],
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

/* --- HISTORICAL STAGE 1: PRIMITIVE REVIEW ---
 * const reviewSchema = new mongoose.Schema({
 *   listingId: { type: String, required: true },
 *   rating: { type: Number, required: true },
 *   comment: { type: String }
 * });
 */

module.exports = mongoose.model('Review', reviewSchema);
