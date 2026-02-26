const Review = require('../models/Review');
const Listing = require('../models/Listing');

/**
 * Utility: Recalculates and saves listing average rating.
 */
const updateListingRating = async (listingId) => {
  const reviews = await Review.find({ listingId });
  const listing = await Listing.findById(listingId);
  
  if (reviews.length === 0) {
    listing.reviewsCount = 0;
    listing.rating = 4.5; // Reset to default
  } else {
    listing.reviewsCount = reviews.length;
    const totalRating = reviews.reduce((acc, item) => item.rating + acc, 0);
    listing.rating = Number((totalRating / reviews.length).toFixed(1));
  }
  await listing.save();
};

// @desc Create or Update a review/rating (Upsert)
exports.createReview = async (req, res) => {
  const { listingId, rating, comment } = req.body;
  try {
    let review = await Review.findOne({ listingId, userId: req.user.id });
    if (review) {
      if (rating !== undefined) review.rating = rating;
      if (comment !== undefined) review.comment = comment;
      await review.save();
    } else {
      review = new Review({ listingId, userId: req.user.id, rating: rating || 5, comment: comment || '' });
      await review.save();
    }
    await updateListingRating(listingId);
    res.status(201).json(review);
  } catch (err) { res.status(500).send('Server Error'); }
};

/**
 * @desc DELETE A REVIEW
 * Security: Only the author can delete.
 */
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    // Security check
    if (review.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Unauthorized to delete this review' });
    }

    const listingId = review.listingId;
    await Review.deleteOne({ _id: req.params.id });
    
    // Recalculate average after deletion
    await updateListingRating(listingId);

    res.json({ message: 'Review removed' });
  } catch (err) { res.status(500).send('Server Error'); }
};

// @desc Get reviews for a listing
exports.getListingReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ listingId: req.params.listingId }).populate('userId', ['name']).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) { res.status(500).send('Server Error'); }
};
