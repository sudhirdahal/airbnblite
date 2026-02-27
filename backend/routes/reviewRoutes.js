const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const auth = require('../middleware/auth');

/**
 * ============================================================================
 * REVIEW ROUTES (The Reputation Controller)
 * ============================================================================
 * This router manages the lifecycle of guest feedback.
 * It has evolved from a simple log to a data-integrity layer that 
 * triggers property rating recalculations upon every save.
 */

// --- PUBLIC ACCESS: SOCIAL PROOF ---
router.get('/:listingId', reviewController.getListingReviews);

// --- PROTECTED ACCESS: FEEDBACK SUBMISSION ---
/**
 * Logic: POST handles both 'Create' and 'Update' (Upsert pattern).
 * This ensures a guest can only leave ONE review per property.
 */
router.post('/', auth, reviewController.createReview);

/**
 * PROTECTED ACTION: Delete Review
 * Security: Only the author of the review can delete it. 
 * Logic: Triggers a listing average recalculation after deletion.
 */
router.delete('/:id', auth, reviewController.deleteReview);

/* --- HISTORICAL STAGE 1: ANONYMOUS REVIEWS ---
 * router.post('/', (req, res) => { ... });
 * // Problem: Spammers could destroy a listing's rating in seconds!
 */

module.exports = router;
