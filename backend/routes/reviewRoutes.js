const express = require('express');
const router = express.Router();
const { createReview, getListingReviews, deleteReview } = require('../controllers/reviewController');
const authMiddleware = require('../middleware/auth');

router.get('/:listingId', getListingReviews);
router.post('/', authMiddleware, createReview);
router.delete('/:id', authMiddleware, deleteReview); // --- NEW: Delete Route ---

module.exports = router;
