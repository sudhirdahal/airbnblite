const express = require('express');
const router = express.Router(); // Create a new router instance.
const { createReview, getListingReviews } = require('../controllers/reviewController'); // Import review controllers.
const authMiddleware = require('../middleware/auth');   // Middleware to protect private routes.

// @route GET /api/reviews/:listingId
// @desc Get all reviews for a specific listing.
// @access Public (anyone can view reviews for a listing).
router.get('/:listingId', getListingReviews);

// @route POST /api/reviews
// @desc Create a new review for a listing by the authenticated user.
// @access Private (Registered users only) - Enforced by 'authMiddleware'.
router.post('/', authMiddleware, createReview);

module.exports = router; // Export the router to be used in the main application file.
