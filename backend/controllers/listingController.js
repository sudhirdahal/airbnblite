const Listing = require('../models/Listing'); 
const Booking = require('../models/Booking'); 

/**
 * ============================================================================
 * LISTING CONTROLLER (The Discovery Engine)
 * ============================================================================
 */

/**
 * @desc Get unique locations and amenities for auto-suggest
 * @route GET /api/listings/metadata
 */
exports.getDiscoveryMetadata = async (req, res) => {
  try {
    const locations = await Listing.distinct('location');
    const amenities = await Listing.distinct('amenities');
    res.json({ locations, amenities });
  } catch (err) {
    res.status(500).send('Metadata Retrieval Failure');
  }
};

/**
 * @desc Get all listings with multi-dimensional filtering.
 */
exports.getListings = async (req, res) => {
  try {
    const { 
      location, category, adminId, minPrice, maxPrice, 
      guests, checkInDate, checkOutDate, amenities, sort 
    } = req.query; 
    
    let query = {}; 

    if (location) query.location = { $regex: location, $options: 'i' };
    if (category) query.category = category;
    if (adminId) query.adminId = adminId;

    if (minPrice || maxPrice) {
      query.rate = {};
      if (minPrice) query.rate.$gte = Number(minPrice);
      if (maxPrice) query.rate.$lte = Number(maxPrice);
    }

    if (guests && Number(guests) > 0) {
      query.maxGuests = { $gte: Number(guests) };
    }

    if (amenities) {
      const amenityList = amenities.split(',').map(a => a.trim());
      query.amenities = { $all: amenityList };
    }

    if (checkInDate && checkOutDate) {
      const start = new Date(checkInDate);
      const end = new Date(checkOutDate);
      const conflicts = await Booking.find({
        status: 'confirmed',
        $and: [{ checkIn: { $lt: end } }, { checkOut: { $gt: start } }]
      }).select('listingId');
      const unavailableListingIds = conflicts.map(b => b.listingId);
      query._id = { $nin: unavailableListingIds };
    }

    let sortOptions = { createdAt: -1 }; 
    if (sort === 'price-asc') sortOptions = { rate: 1 };
    if (sort === 'price-desc') sortOptions = { rate: -1 };
    if (sort === 'rating') sortOptions = { rating: -1 };

    const listings = await Listing.find(query).sort(sortOptions);
    res.json(listings); 
  } catch (err) {
    console.error('Discovery Engine Error:', err.message);
    res.status(500).send('Server Error');
  }
};

exports.getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json(listing);
  } catch (err) {
    if (err.kind === 'ObjectId') return res.status(404).json({ message: 'Context Lost' });
    res.status(500).send('Server Error');
  }
};

exports.createListing = async (req, res) => {
  const { title, description, fullDescription, location, rate, images, amenities, host, coordinates, category, maxGuests, bedrooms, beds } = req.body;
  try {
    const newListing = new Listing({ 
      title, description, fullDescription, location, rate, images, amenities, host, coordinates, category, maxGuests, bedrooms, beds, 
      adminId: req.user.id 
    });
    const listing = await newListing.save();
    res.status(201).json(listing);
  } catch (err) { res.status(500).send('Listing Persistence Failure'); }
};

exports.updateListing = async (req, res) => {
  const { title, description, fullDescription, location, rate, images, amenities, coordinates, category, maxGuests, bedrooms, beds } = req.body;
  try {
    let listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.adminId.toString() !== req.user.id) return res.status(401).json({ message: 'Unauthorized update attempt' });
    Object.assign(listing, { title, description, fullDescription, location, rate, images, amenities, coordinates, category, maxGuests, bedrooms, beds });
    await listing.save();
    res.json(listing);
  } catch (err) { res.status(500).send('Update Sync Failure'); }
};

exports.deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.adminId.toString() !== req.user.id) return res.status(401).json({ message: 'Unauthorized removal attempt' });
    await Listing.deleteOne({ _id: req.params.id });
    res.json({ message: 'Listing removed.' });
  } catch (err) { res.status(500).send('Server Error'); }
};
