const mongoose = require('mongoose');

/**
 * Listing Schema: Defines the structure for property rentals.
 * UPDATED: Added capacity fields (maxGuests, bedrooms, beds) for advanced search.
 */
const listingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  fullDescription: { type: String, required: true },
  location: { type: String, required: true },
  rate: { type: Number, required: true },
  images: [{ type: String }],
  amenities: [{ type: String }],
  
  // --- NEW: Capacity Fields ---
  maxGuests: { type: Number, default: 2 },
  bedrooms: { type: Number, default: 1 },
  beds: { type: Number, default: 1 },
  
  category: { type: String, required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  host: {
    name: { type: String, required: true },
    avatar: { type: String }
  },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, default: 4.5 },
  reviewsCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

/* OLD CODE (Preserved):
const listingSchema = new mongoose.Schema({
  title, description, fullDescription, location, rate, images, amenities, category, coordinates, host, adminId, rating, reviewsCount, createdAt
});
*/

module.exports = mongoose.model('Listing', listingSchema);
