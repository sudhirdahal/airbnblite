const mongoose = require('mongoose');

/**
 * ============================================================================
 * 🏠 LISTING SCHEMA (The Discovery Unit)
 * ============================================================================
 * 
 * MASTERCLASS NOTES:
 * The Listing schema is the most complex data structure in the application. 
 * It acts as a multi-dimensional metadata store that powers the Search Engine, 
 * the Mapbox Spatial UI, and the dynamic Pricing logic.
 * 
 * Evolution Timeline:
 * - Phase 1: Primitive object (Title, single image URL, price).
 * - Phase 5: Spatial Geometry integration (`coordinates`).
 * - Phase 10: Relational binding (`adminId`).
 * - Phase 13: Array-based image management (Cinematic Galleries).
 */

/* ============================================================================
 * 👻 HISTORICAL GHOST: PHASE 1 (The Flat Listing)
 * ============================================================================
 * const listingSchema = new mongoose.Schema({
 *   title: { type: String, required: true },
 *   location: { type: String, required: true },
 *   rate: { type: Number, required: true },
 *   image: { type: String } // Single image only!
 * });
 * 
 * THE FLAW: This schema lacked depth. We couldn't display a property on a map 
 * (no coordinates), we couldn't build a gallery (only one image), and we 
 * couldn't trace the property back to its owner (no adminId).
 * ============================================================================ */

const listingSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String, // The short "teaser" text for discovery cards
    required: true 
  },
  fullDescription: { 
    type: String // The deep-dive text for the property detail page
  },
  location: { 
    type: String, 
    required: true 
  },
  
  /**
   * 💰 PRICING ENGINE
   * The base mathematical unit for all dynamic checkout calculations.
   */
  rate: { 
    type: Number, 
    required: true,
    min: 0 // Data Integrity: Prevent negative prices
  },
  childRate: { type: Number },
  infantRate: { type: Number },

  /**
   * 🔍 DISCOVERY & FILTERING METADATA
   * Category powers the top navigation bar.
   * Amenities powers the strict `$all` array-intersection queries.
   */
  category: { 
    type: String, 
    default: 'pools' 
  },
  amenities: [{ 
    type: String 
  }],

  /**
   * 📸 MEDIA ASSETS (Phase 13)
   * Array of AWS S3 URLs. Required for the 5-Photo Cinematic Grid UI.
   */
  images: [{ 
    type: String 
  }],

  /**
   * 🛏️ CAPACITY METADATA
   * Powers the 'Guests' and 'Rooms' filters in the SearchBar.
   */
  maxGuests: { type: Number, default: 2, min: 1 },
  bedrooms: { type: Number, default: 1, min: 1 },
  beds: { type: Number, default: 1, min: 1 },

  /**
   * 🗺️ SPATIAL DATA (Phase 5)
   * Required for rendering Mapbox markers and performing geographical queries.
   */
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },

  /**
   * 🔗 RELATIONAL BINDING (Phase 10)
   * Ties the property explicitly to the User (Host) who created it.
   * Critical for Authorization checks before applying edits or deletes.
   */
  adminId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  /**
   * ⭐ REPUTATION METRICS (Phase 19)
   * These are NOT manually edited by hosts. They are dynamically recalculated
   * and synchronized by the `reviewController.js` whenever a review is added/deleted.
   */
  rating: { type: Number, default: 4.5 },
  reviewsCount: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Listing', listingSchema);
