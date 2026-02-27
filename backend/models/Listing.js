const mongoose = require('mongoose');

/**
 * ============================================================================
 * LISTING SCHEMA (The Discovery Unit)
 * ============================================================================
 * The core data model for the property discovery engine.
 * It has evolved from a simple title/price object into a multi-dimensional 
 * metadata store supporting spatial search, capacity logic, and categorization.
 */
const listingSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  fullDescription: { 
    type: String 
  },
  location: { 
    type: String, 
    required: true 
  },
  
  /**
   * PRICING ENGINE
   * rate: The base nightly cost.
   * Phase 5+ added guest-specific rates for children and infants.
   */
  rate: { 
    type: Number, 
    required: true 
  },
  childRate: { type: Number },
  infantRate: { type: Number },

  /**
   * DISCOVERY & FILTERING
   * category: Used by the CategoryBar for thematic discovery.
   * amenities: Array of strings used for the strict $all search query.
   */
  category: { 
    type: String, 
    default: 'pools' 
  },
  amenities: [{ 
    type: String 
  }],

  /**
   * MEDIA ASSETS
   * Array of AWS S3 image URLs. 
   * Phase 1-3 used local strings; Phase 4+ migrated to distributed storage.
   */
  images: [{ 
    type: String 
  }],

  /**
   * CAPACITY METADATA
   * Powers the 'Guests' filter in the SearchBar.
   */
  maxGuests: { type: Number, default: 2 },
  bedrooms: { type: Number, default: 1 },
  beds: { type: Number, default: 1 },

  /**
   * SPATIAL DATA
   * Powers the Mapbox discovery map.
   */
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },

  /**
   * RELATIONS
   * adminId: Link to the User who owns this property (The Host).
   */
  adminId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  /**
   * REPUTATION METRICS
   * Dynamically recalculated by the reviewController.js.
   */
  rating: { type: Number, default: 4.5 },
  reviewsCount: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

/* --- HISTORICAL STAGE 1: PRIMITIVE LISTING ---
 * const listingSchema = new mongoose.Schema({
 *   title: { type: String, required: true },
 *   location: { type: String, required: true },
 *   rate: { type: Number, required: true },
 *   image: { type: String } // Single image only!
 * });
 */

module.exports = mongoose.model('Listing', listingSchema);
