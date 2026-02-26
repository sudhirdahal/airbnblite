const Review = require('../models/Review');
const Listing = require('../models/Listing');

const updateListingRating = async (listingId) => {
  const reviews = await Review.find({ listingId });
  const listing = await Listing.findById(listingId);
  if (reviews.length === 0) {
    listing.reviewsCount = 0;
    listing.rating = 4.5;
  } else {
    listing.reviewsCount = reviews.length;
    const totalRating = reviews.reduce((acc, item) => item.rating + acc, 0);
    listing.rating = Number((totalRating / reviews.length).toFixed(1));
  }
  await listing.save();
};

// @desc Create or Update a review/rating (Including Images)
exports.createReview = async (req, res) => {
  const { listingId, rating, comment, images } = req.body; // --- UPDATED: images added ---
  try {
    let review = await Review.findOne({ listingId, userId: req.user.id });
    if (review) {
      if (rating !== undefined) review.rating = rating;
      if (comment !== undefined) review.comment = comment;
      if (images !== undefined) review.images = images; // Save new photo set
      await review.save();
    } else {
      review = new Review({ listingId, userId: req.user.id, rating: rating || 5, comment: comment || '', images: images || [] });
      await review.save();
    }
    await updateListingRating(listingId);
    res.status(201).json(review);
  } catch (err) { res.status(500).send('Server Error'); }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (review.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Unauthorized' });
    const listingId = review.listingId;
    await Review.deleteOne({ _id: req.params.id });
    await updateListingRating(listingId);
    res.json({ message: 'Review removed' });
  } catch (err) { res.status(500).send('Server Error'); }
};

exports.getListingReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ listingId: req.params.listingId }).populate('userId', ['name', 'avatar']).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) { res.status(500).send('Server Error'); }
};
