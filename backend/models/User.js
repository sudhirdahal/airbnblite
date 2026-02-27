const mongoose = require('mongoose');

/**
 * ============================================================================
 * 👤 USER SCHEMA (The Identity Authority)
 * ============================================================================
 * 
 * MASTERCLASS NOTES:
 * The User schema is the foundational pillar of application security. It dictates 
 * what data is stored, how it is formatted, and how users relate to other 
 * entities (like their Wishlist properties).
 * 
 * Evolution Timeline:
 * - Phase 1: Primitive Auth (Just email/password).
 * - Phase 2: Role-Based Access Control (RBAC) enabling 'Admins/Hosts'.
 * - Phase 5: Token Versioning (Global Revocation Engine).
 * - Phase 12: Defensive Array Initialization (Wishlist).
 */

/* ============================================================================
 * 👻 HISTORICAL GHOST: PHASE 1 (The Primitive User)
 * ============================================================================
 * Our first schema was incredibly basic and lacked security features:
 * 
 * const userSchema = new mongoose.Schema({
 *   name: { type: String, required: true },
 *   email: { type: String, required: true, unique: true },
 *   password: { type: String, required: true }
 * });
 * 
 * THE FLAW: There was no way to distinguish a standard user from a property 
 * owner. Furthermore, there was no way to enforce email verification or 
 * globally revoke compromised sessions.
 * ============================================================================ */

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true // Data Integrity: Automatically removes leading/trailing spaces
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true, // Data Integrity: Ensures 'User@Test.com' matches 'user@test.com'
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  
  /**
   * 🛡️ ROLE-BASED ACCESS CONTROL (Phase 2)
   * Defines authorization boundaries. Middleware checks this field before
   * allowing access to restricted routes (like creating a listing).
   */
  role: { 
    type: String, 
    enum: ['registered', 'admin'], 
    default: 'registered' 
  },

  /**
   * 🔒 NUCLEAR SECURITY: Token Versioning (Phase 5)
   * The integer that powers "Global Logout". It acts as the ultimate truth 
   * against which all incoming stateless JWTs are validated.
   */
  tokenVersion: { 
    type: Number, 
    default: 0 
  },

  // --- IDENTITY VERIFICATION WORKFLOW ---
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  
  // --- PASSWORD RECOVERY WORKFLOW ---
  resetPasswordToken: String,
  resetPasswordExpires: Date, // Enforces strict Time-To-Live (TTL)

  /**
   * ❤️ RELATIONAL DATA: The Wishlist (Phase 12)
   * This array stores ObjectIds that reference the `Listing` collection.
   * By using Mongoose `populate()`, we can instantly turn this list of strings
   * into a fully hydrated array of property objects for the UI.
   */
  wishlist: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Listing' 
  }],

  /**
   * 🖼️ MEDIA ASSETS: Avatar (Phase 7)
   * Stores the permanent AWS S3 URL for the user's profile picture.
   */
  avatar: { type: String },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
