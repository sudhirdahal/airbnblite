const Review = require('../models/Review');
const Listing = require('../models/Listing');
const { createNotification } = require('./notificationController');

/**
 * ============================================================================
 * DATA INTEGRITY UTILITY: updateListingRating
 * ============================================================================
 * In early versions, property ratings were static. 
 * Now, every time a review is added OR deleted, this function runs to 
 * mathematically recalculate the 'averageRating' and 'reviewsCount' 
 * on the Listing document, ensuring the UI is always accurate.
 */
const updateListingRating = async (listingId) => {
  const reviews = await Review.find({ listingId });
  const listing = await Listing.findById(listingId);
  
  if (reviews.length === 0) {
    listing.reviewsCount = 0;
    listing.rating = 4.5; // Reset to base default
  } else {
    listing.reviewsCount = reviews.length;
    const totalRating = reviews.reduce((acc, item) => item.rating + acc, 0);
    // Round to 1 decimal place (e.g., 4.8)
    listing.rating = Number((totalRating / reviews.length).toFixed(1));
  }
  await listing.save();
};

/**
 * @desc Create or Update a review/rating (Upsert)
 * @route POST /api/reviews
 */
exports.createReview = async (req, res) => {
  const { listingId, rating, comment, images } = req.body;
  try {
    let review = await Review.findOne({ listingId, userId: req.user.id });
    
    if (review) {
      // UPDATE STAGE: Modify existing review
      if (rating !== undefined) review.rating = rating;
      if (comment !== undefined) review.comment = comment;
      if (images !== undefined) review.images = images;
      await review.save();
    } else {
      // CREATE STAGE: New feedback
      review = new Review({ 
        listingId, userId: req.user.id, 
        rating: rating || 5, 
        comment: comment || '', 
        images: images || [] 
      });
      await review.save();
      
      // Notify host of the new feedback
      const listing = await Listing.findById(listingId);
      await createNotification({
        recipient: listing.adminId, type: 'review', title: 'New Review!',
        message: `A guest left a ${rating}-star review for ${listing.title}.`,
        link: `/listing/${listingId}`
      });
    }
    
    // Auto-sync listing stats
    await updateListingRating(listingId);
    res.status(201).json(review);
  } catch (err) { res.status(500).send('Server Error'); }
};

/* --- HISTORICAL CODE: PRIMITIVE REVIEW (No Recalculation) ---
 * exports.createReviewLegacy = async (req, res) => {
 *   const review = new Review(req.body);
 *   await review.save();
 *   res.json(review); // Listing rating stayed the same! (Flawed)
 * };
 */

/**
 * @desc Delete a review
 * @access Private (Owner only)
 */
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    
    // Authorization Check
    if (review.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const listingId = review.listingId;
    await Review.deleteOne({ _id: req.params.id });
    
    // Critical: Recalculate listing average after deletion
    await updateListingRating(listingId);

    res.json({ message: 'Review removed successfully.' });
  } catch (err) { res.status(500).send('Server Error'); }
};

/**
 * @desc Get all reviews for a listing
 */
exports.getListingReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ listingId: req.params.listingId })
      .populate('userId', ['name', 'avatar'])
      .sort({ createdAt: -1 }); // Newest first
    res.json(reviews);
  } catch (err) { res.status(500).send('Server Error'); }
};
