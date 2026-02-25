const express = require('express');
const router = express.Router(); // Create a new router instance.
const { 
  register,          // Controller for user registration
  login,             // Controller for user login
  forgotPassword,    // Controller for initiating password reset
  resetPassword,     // Controller for completing password reset
  getProfile,        // Controller for fetching user profile
  updateProfile,     // Controller for updating user profile
  verifyEmail,       // Controller for email verification via link
  toggleWishlist,    // Controller for adding/removing items from wishlist
  getWishlist,       // Controller for fetching user's wishlist
  logoutAll          // Controller for invalidating all user sessions
} = require('../controllers/authController');
const authMiddleware = require('../middleware/auth'); // Middleware to protect private routes.

// Public Routes: No authentication required for these.

// @route POST /api/auth/register
// Registers a new user account.
router.post('/register', register);

// @route GET /api/auth/verify/:token
// Verifies a user's email address using a unique token.
router.get('/verify/:token', verifyEmail);

// @route POST /api/auth/login
// Authenticates a user and issues a JWT.
router.post('/login', login);

// @route POST /api/auth/forgotpassword
// Initiates the password reset process by sending a code to the user's email.
router.post('/forgotpassword', forgotPassword);

// @route POST /api/auth/resetpassword
// Resets the user's password using a verification code.
router.post('/resetpassword', resetPassword);


// Private Routes: These routes require a valid JWT for access.
// The 'authMiddleware' will execute first to verify the token.

// @route GET /api/auth/profile
// Fetches the authenticated user's profile information.
router.get('/profile', authMiddleware, getProfile);

// @route PUT /api/auth/profile
// Updates the authenticated user's profile details.
router.put('/profile', authMiddleware, updateProfile);

// @route GET /api/auth/wishlist
// Fetches the authenticated user's saved wishlist items.
router.get('/wishlist', authMiddleware, getWishlist);

// @route POST /api/auth/wishlist/:id
// Toggles a specific listing in the authenticated user's wishlist (add or remove).
router.post('/wishlist/:id', authMiddleware, toggleWishlist);

// @route POST /api/auth/logout-all
// Invalidates all active sessions for the authenticated user, forcing re-login on all devices.
router.post('/logout-all', authMiddleware, logoutAll);

module.exports = router; // Export the router to be used in the main application file.
