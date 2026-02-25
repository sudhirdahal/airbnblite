const mongoose = require('mongoose');

// Define the Listing Schema
// This schema describes the structure for individual property listings.
// It includes details about the property, its location, pricing, images,
// and who administrates it.
const listingSchema = new mongoose.Schema({
  // Main title of the listing (e.g., "Cozy Cottage in the Woods").
  title: { 
    type: String, 
    required: true 
  },
  // Short summary description of the listing.
  description: { 
    type: String, 
    required: true 
  },
  // Detailed description of the listing, displayed on the detail page.
  fullDescription: { 
    type: String 
  },
  // Geographical location (e.g., "Aspen, Colorado").
  location: { 
    type: String, 
    required: true 
  },
  // Geographical coordinates for map display.
  coordinates: {
    lat: { type: Number, required: true }, // Latitude
    lng: { type: Number, required: true }  // Longitude
  },
  // The category this listing belongs to (e.g., 'cabins', 'pools', 'beach').
  // Used for filtering on the homepage.
  category: { 
    type: String, 
    required: true 
  },
  // Nightly rate of the property.
  rate: { 
    type: Number, 
    required: true 
  },
  // Average rating from user reviews.
  rating: { 
    type: Number, 
    default: 4.5 
  },
  // Total number of reviews received.
  reviewsCount: { 
    type: Number, 
    default: 0 
  },
  // Array of image URLs for the listing.
  images: [{ 
    type: String 
  }], 
  // Array of amenities offered (e.g., "WiFi", "Kitchen", "Pool").
  amenities: [{ 
    type: String 
  }],
  // Information about the host of the property.
  host: {
    name: { type: String, required: true },
    avatar: { type: String },
    bio: { type: String }
  },
  // Reference to the User who created/administers this listing.
  // This helps ensure only the owning admin can edit/delete their listings.
  adminId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // Timestamp for when the listing was created.
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Export the Listing model, making it available for Mongoose operations.
module.exports = mongoose.model('Listing', listingSchema);
