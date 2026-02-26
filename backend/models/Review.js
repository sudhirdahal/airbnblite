const mongoose = require('mongoose');

/**
 * Review Schema: Stores user ratings and textual feedback.
 * UPDATED: Added 'images' array to support visual reviews (Photos of the stay).
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
  // --- NEW: Visual Review Support ---
  images: [{ 
    type: String // Stores S3 URLs
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Review', reviewSchema);
