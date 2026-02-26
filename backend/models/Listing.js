const mongoose = require('mongoose');

/**
 * Listing Schema: Advanced Property Model.
 * UPDATED: Multi-guest type pricing (Adults, Children, Infants).
 */
const listingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  fullDescription: { type: String, required: true },
  location: { type: String, required: true },
  
  // --- UPDATED: Detailed Pricing Structure ---
  rate: { type: Number, required: true }, // Base Adult rate
  childRate: { type: Number, default: 0 }, // Optional child surcharge/discount
  infantRate: { type: Number, default: 0 }, // Usually free or flat fee
  
  images: [{ type: String }],
  amenities: [{ type: String }],
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

module.exports = mongoose.model('Listing', listingSchema);
