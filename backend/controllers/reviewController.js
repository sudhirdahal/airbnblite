const Review = require('../models/Review');
const Listing = require('../models/Listing');

// @desc Create or Update a review/rating (Upsert)
// @route POST /api/reviews
// @access Private
exports.createReview = async (req, res) => {
  const { listingId, rating, comment } = req.body;

  try {
    // 1. Check if user already has a review for this listing
    let review = await Review.findOne({ listingId, userId: req.user.id });

    if (review) {
      // UPDATE existing review
      if (rating !== undefined) review.rating = rating;
      if (comment !== undefined) review.comment = comment;
      await review.save();
    } else {
      // CREATE new review
      review = new Review({
        listingId,
        userId: req.user.id,
        rating: rating || 5, // Default to 5 if only comment is provided
        comment: comment || ''
      });
      await review.save();
    }

    // 2. Recalculate listing's average rating and count
    const reviews = await Review.find({ listingId });
    const listing = await Listing.findById(listingId);
    
    listing.reviewsCount = reviews.length;
    // Calculate average, ensuring it's a number
    const totalRating = reviews.reduce((acc, item) => item.rating + acc, 0);
    listing.rating = Number((totalRating / reviews.length).toFixed(1));
    
    await listing.save();

    res.status(201).json(review);
  } catch (err) {
    console.error('Error in upsertReview:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc Get reviews for a listing
exports.getListingReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ listingId: req.params.listingId })
      .populate('userId', ['name'])
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error('Error in getListingReviews:', err.message);
    res.status(500).send('Server Error');
  }
};
