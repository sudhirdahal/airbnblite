const Review = require('../models/Review');
const Listing = require('../models/Listing');
const { createNotification } = require('./notificationController');

/**
 * ============================================================================
 * DATA INTEGRITY UTILITY: updateListingRating
 * ============================================================================
 * Evolution:
 * Initially, property ratings were static fields. Now, every time a review 
 * is added or deleted, this utility executes a mathematical aggregation
 * to recalculate the 'averageRating' and 'reviewsCount' on the Listing.
 * 
 * Strategy: Ensures the Search Grid and Detail pages always show 100% 
 * accurate reputation data.
 */
const updateListingRating = async (listingId) => {
  const reviews = await Review.find({ listingId });
  const listing = await Listing.findById(listingId);
  
  if (reviews.length === 0) {
    listing.reviewsCount = 0;
    listing.rating = 4.5; // Default baseline for new properties
  } else {
    listing.reviewsCount = reviews.length;
    const totalRating = reviews.reduce((acc, item) => item.rating + acc, 0);
    // Fixed precision to 1 decimal place (e.g., 4.8)
    listing.rating = Number((totalRating / reviews.length).toFixed(1));
  }
  await listing.save();
};

/**
 * @desc Create or Update a review (Upsert pattern)
 * @route POST /api/reviews
 * 
 * Logic:
 * 1. Checks if the guest has already reviewed this stay.
 * 2. If yes, updates the existing feedback.
 * 3. If no, creates a new record and triggers a 'New Review' Bell Alert for the Host.
 */
exports.createReview = async (req, res) => {
  const { listingId, rating, comment, images } = req.body;
  const io = req.app.get('socketio');

  try {
    let review = await Review.findOne({ listingId, userId: req.user.id });
    const listing = await Listing.findById(listingId);
    
    if (review) {
      // --- STAGE 2: UPDATE EXISTING ---
      if (rating !== undefined) review.rating = rating;
      if (comment !== undefined) review.comment = comment;
      if (images !== undefined) review.images = images;
      await review.save();
    } else {
      // --- STAGE 1: NEW FEEDBACK ---
      review = new Review({ 
        listingId, userId: req.user.id, 
        rating: rating || 5, comment: comment || '', images: images || [] 
      });
      await review.save();
      
      // HIGH-FIDELITY ALERT: Notify Host via Bell
      const notif = await createNotification({
        recipient: listing.adminId, type: 'review', title: 'New Guest Review!',
        message: `A traveler left a ${rating}-star review for ${listing.title}.`,
        link: `/listing/${listingId}`
      });

      // INSTANT PUSH: Sync Host Navbar badge
      if (io) io.to(listing.adminId.toString()).emit('new_notification', notif);
    }
    
    // CRITICAL: Force listing reputation sync
    await updateListingRating(listingId);
    res.status(201).json(review);
  } catch (err) { res.status(500).send('Server Error'); }
};

/* --- HISTORICAL STAGE 1: STATIC REVIEWS ---
 * exports.createReviewLegacy = async (req, res) => {
 *   const review = new Review(req.body);
 *   await review.save(); 
 *   // Problem: Listing rating never changed! (Stale data)
 * };
 */

/**
 * @desc Delete a review
 * Security: Validates requester is the original author.
 */
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    
    if (review.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Unauthorized removal attempt.' });
    }

    const listingId = review.listingId;
    await Review.deleteOne({ _id: req.params.id });
    
    // Recalculate listing stats after deletion to maintain integrity
    await updateListingRating(listingId);

    res.json({ message: 'Feedback removed successfully.' });
  } catch (err) { res.status(500).send('Server Error'); }
};

/**
 * @desc Fetch all reviews for a listing
 */
exports.getListingReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ listingId: req.params.listingId })
      .populate('userId', ['name', 'avatar'])
      .sort({ createdAt: -1 }); // High-fidelity sorting: Newest first
    res.json(reviews);
  } catch (err) { res.status(500).send('Server Error'); }
};
