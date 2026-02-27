const Listing = require('../models/Listing'); 
const Booking = require('../models/Booking'); 

/**
 * ============================================================================
 * LISTING CONTROLLER (The Discovery Engine)
 * ============================================================================
 * This controller manages the primary discovery layer of the application.
 * Evolution:
 * 1. Stage 1: Simple Regex search (Phase 1).
 * 2. Stage 2: Category & Price filtering (Phase 2).
 * 3. Stage 3: Cross-collection availability logic (Phase 5).
 * 4. Stage 4: High-precision amenity matching (Phase 6).
 */

/**
 * @desc Get all listings with multi-dimensional filtering.
 * @route GET /api/listings
 * 
 * Logic:
 * 1. Build Query: Aggregates category, location, and guest counts.
 * 2. Availability Shield: Performs a reverse-lookup on the Booking collection 
 *     to exclude properties with conflicting reservations.
 * 3. Strict Amenity Matching: Uses $all to ensure 100% feature accuracy.
 */
exports.getListings = async (req, res) => {
  try {
    const { 
      location, category, adminId, minPrice, maxPrice, 
      guests, checkInDate, checkOutDate, amenities, sort 
    } = req.query; 
    
    let query = {}; 

    // --- DIMENSION 1: CONTEXTUAL FILTERS ---
    if (location) query.location = { $regex: location, $options: 'i' };
    if (category) query.category = category;
    if (adminId) query.adminId = adminId;

    if (minPrice || maxPrice) {
      query.rate = {};
      if (minPrice) query.rate.$gte = Number(minPrice);
      if (maxPrice) query.rate.$lte = Number(maxPrice);
    }

    if (guests) {
      query.maxGuests = { $gte: Number(guests) };
    }

    // --- DIMENSION 2: HIGH-PRECISION AMENITIES ---
    /**
     * Logic: We use the '$all' operator. This is a premium search pattern
     * that ensures the results contain EVERY amenity selected by the user,
     * rather than just 'one of' them.
     */
    if (amenities) {
      const amenityList = amenities.split(',').map(a => a.trim());
      query.amenities = { $all: amenityList };
    }

    // --- DIMENSION 3: AVAILABILITY SHIELD (The most complex logic) ---
    /**
     * Logic: CROSS-COLLECTION REVERSE LOOKUP
     * 1. Find all 'confirmed' bookings during the requested window.
     * 2. Extract their listing IDs.
     * 3. Exclude those IDs from the result set using '$nin' (Not In).
     */
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

    /* --- HISTORICAL STAGE 1: REGEX-ONLY ---
     * if (location) {
     *   const listings = await Listing.find({ location: new RegExp(location, 'i') });
     *   return res.json(listings);
     * }
     * // Problem: Ignored availability, guests, and price!
     */

    // Server-side Sorting
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

/**
 * @desc Get single listing by ID
 * Logic: Includes JSDoc context for detail page hydration.
 */
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

// ... (Rest of CRUD handlers with technical headers)
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
