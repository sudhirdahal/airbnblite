const mongoose = require('mongoose');

/**
 * ============================================================================
 * USER SCHEMA (The Identity Authority)
 * ============================================================================
 * This model manages the authentication and personalization state.
 * It has evolved from a basic Login/Signup object into a high-fidelity 
 * traveler identity hub.
 */
const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  
  /**
   * RBAC (Role-Based Access Control)
   * registered: Standard traveler (Guest)
   * admin: Property owner (Host)
   */
  role: { 
    type: String, 
    enum: ['registered', 'admin'], 
    default: 'registered' 
  },

  /**
   * SECURITY: Token Versioning
   * This field is the key to 'Global Logout'. Every time a user logs out 
   * of all devices or resets their password, this number increments. 
   * The JWT contains this version; if they don't match, the session is killed.
   */
  tokenVersion: { 
    type: Number, 
    default: 0 
  },

  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  /**
   * COLLECTIONS: Wishlist
   * Stores references to Listing IDs. This powers the Discovery Grid's
   * heart icon state.
   */
  wishlist: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Listing' 
  }],

  /**
   * MEDIA: Avatar
   * Initially null. Phase 5 migrated this to store AWS S3 URLs.
   */
  avatar: { type: String },
  
  createdAt: { type: Date, default: Date.now }
});

/* --- HISTORICAL STAGE 1: PRIMITIVE USER ---
 * const userSchema = new mongoose.Schema({
 *   name: { type: String, required: true },
 *   email: { type: String, required: true, unique: true },
 *   password: { type: String, required: true }
 * });
 */

module.exports = mongoose.model('User', userSchema);
