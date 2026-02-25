const mongoose = require('mongoose');

/**
 * User Schema: Defines the structure for user accounts in MongoDB.
 * Includes fields for authentication, role management, security (token versioning),
 * and personalized user features (wishlist).
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
  role: { 
    type: String, 
    enum: ['registered', 'admin'],
    default: 'registered'
  },
  // Email verification status
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  verificationToken: String,
  
  // Password reset fields
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  /**
   * WISHLIST FIELD
   * Stores an array of Listing ObjectIds. 
   * The 'ref' property allows Mongoose to "populate" these IDs 
   * into full property documents when requested by the API.
   */
  wishlist: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Listing' 
  }],

  /**
   * SECURITY: TOKEN VERSIONING
   * Used for global session invalidation. Every JWT issued contains this version.
   * If this number is incremented, all previously issued tokens become invalid.
   */
  tokenVersion: { 
    type: Number, 
    default: 0 
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('User', userSchema);
