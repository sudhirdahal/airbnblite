const mongoose = require('mongoose');

// Define the Review Schema
// This schema captures user reviews and ratings for a specific listing.
// It links a user to a listing with a rating and a comment.
const reviewSchema = new mongoose.Schema({
  // Reference to the Listing that this review is for.
  listingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Listing', 
    required: true 
  },
  // Reference to the User who submitted this review.
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // Rating given by the user (typically 1 to 5 stars).
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  // Textual comment provided by the user (now optional).
  comment: { 
    type: String, 
    required: false 
  },
  // Timestamp for when the review was created.
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Export the Review model, making it available for Mongoose operations.
module.exports = mongoose.model('Review', reviewSchema);
