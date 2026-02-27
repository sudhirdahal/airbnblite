const Listing = require('../models/Listing'); 
const Booking = require('../models/Booking'); 

/**
 * ============================================================================
 * 🔍 LISTING CONTROLLER (The Discovery Engine)
 * ============================================================================
 * 
 * MASTERCLASS NOTES:
 * This controller manages the "Search and Discovery" lifecycle. Building a search 
 * engine is fundamentally different from basic CRUD operations. It requires complex
 * query shaping and multi-collection logic to ensure users only see properties 
 * that actually meet their specific constraints (like dates and amenities).
 * 
 * Evolution Timeline:
 * - Phase 1: Basic `Listing.find()` (No filters).
 * - Phase 5: Multi-dimensional filtering (Location, Price, Guests).
 * - Phase 10: The Exclusion Query ($nin) for Date Availability.
 * - Phase 16: Strict Amenity Matching ($all).
 * - Phase 27: Flexible Location Normalization.
 */

/**
 * @desc Get unique locations and amenities for auto-suggest
 * @route GET /api/listings/metadata
 * 
 * Logic: Instead of hardcoding locations in the frontend, we ask MongoDB 
 * to return an array of unique values directly from the active dataset.
 */
exports.getDiscoveryMetadata = async (req, res) => {
  try {
    const locations = await Listing.distinct('location');
    const amenities = await Listing.distinct('amenities');
    res.json({ locations, amenities });
  } catch (err) { res.status(500).send('Metadata Retrieval Failure'); }
};

/* ============================================================================
 * 👻 HISTORICAL GHOST: PHASE 1 (The Naive Search)
 * ============================================================================
 * Our original search was just a text match on the location:
 * 
 * exports.getListingsLegacy = async (req, res) => {
 *   const { location } = req.query;
 *   const listings = await Listing.find({ location: { $regex: location } });
 *   res.json(listings); 
 * };
 * 
 * THE FLAW: It returned properties that were already booked! Users would 
 * fall in love with a property, go to checkout, and *then* find out it wasn't 
 * available. This is terrible UX. We needed "Availability-Aware" search.
 * ============================================================================ */

/**
 * @desc Get all listings with multi-dimensional filtering & sorting
 * @route GET /api/listings
 * 
 * ARCHITECTURE (The Query Builder Pattern):
 * We dynamically construct a MongoDB query object based on the presence 
 * of specific URL query parameters.
 */
exports.getListings = async (req, res) => {
  try {
    const { 
      location, category, adminId, minPrice, maxPrice, 
      guests, checkInDate, checkOutDate, amenities, sort 
    } = req.query; 
    
    // console.log('Discovery Engine: Incoming Params:', req.query);

    let query = {}; 

    // 1. Basic String & ID Matches
    if (location) {
      // Logic: Split by comma and search for the first part (e.g., 'London')
      // to make the search more resilient to formatting differences (Phase 27).
      const cityOnly = location.split(',')[0].trim();
      query.location = { $regex: cityOnly, $options: 'i' }; 
    }
    if (category) query.category = category;
    if (adminId) query.adminId = adminId;

    // 2. Numeric Range Queries ($gte = Greater Than or Equal)
    if (minPrice || maxPrice) {
      query.rate = {};
      if (minPrice) query.rate.$gte = Number(minPrice);
      if (maxPrice) query.rate.$lte = Number(maxPrice);
    }
    
    // Only apply guest filter if it's greater than 1 (Phase 27 Baseline fix)
    if (guests && Number(guests) > 1) {
      query.maxGuests = { $gte: Number(guests) };
    }

    // 3. Array Intersection ($all)
    // If a user selects "WiFi" and "Pool", the property MUST have both.
    if (amenities && amenities.trim() !== '') {
      const amenityList = amenities.split(',').map(a => a.trim());
      query.amenities = { $all: amenityList }; 
    }

    // console.log('Discovery Engine: Final Query Object:', JSON.stringify(query));

    // --- 4. THE EXCLUSION QUERY (Phase 10: Availability-Aware Search) ---
    // If dates are provided, we must hide properties that are already booked.
    // We cannot query the `Listing` collection for this; we must query the `Booking`
    // collection to find conflicts, extract those Listing IDs, and EXCLUDE them.
    if (checkInDate && checkOutDate) {
      const start = new Date(checkInDate);
      const end = new Date(checkOutDate);
      
      // Step A: Find all overlapping confirmed bookings
      const conflicts = await Booking.find({
        status: 'confirmed',
        $and: [{ checkIn: { $lt: end } }, { checkOut: { $gt: start } }]
      }).select('listingId');
      
      // Step B: Extract the forbidden IDs
      const unavailableListingIds = conflicts.map(b => b.listingId);
      
      // Step C: Add a "Not In" ($nin) operator to our main query
      query._id = { $nin: unavailableListingIds };
    }

    // 5. Dynamic Sorting Engine
    let sortOptions = { createdAt: -1 }; // Default: Newest first
    if (sort === 'price-asc') sortOptions = { rate: 1 };
    if (sort === 'price-desc') sortOptions = { rate: -1 };
    if (sort === 'rating') sortOptions = { rating: -1 };

    // 6. Execute the final shaped query
    const listings = await Listing.find(query).sort(sortOptions);
    res.json(listings); 
  } catch (err) {
    console.error('Discovery Engine Error:', err.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc Fetch a single property by ID
 * @route GET /api/listings/:id
 */
exports.getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json(listing);
  } catch (err) {
    // Defensive Check: If the ID string is malformed, Mongoose throws a CastError.
    if (err.kind === 'ObjectId') return res.status(404).json({ message: 'Context Lost' });
    res.status(500).send('Server Error');
  }
};

/**
 * @desc Create a new property listing
 * @route POST /api/listings
 * Security: Requires 'admin' role middleware.
 */
exports.createListing = async (req, res) => {
  const { title, description, fullDescription, location, rate, images, amenities, host, coordinates, category, maxGuests, bedrooms, beds } = req.body;
  try {
    // We explicitly extract the user ID from the verified JWT (req.user) 
    // rather than trusting a user ID sent in the request body.
    const newListing = new Listing({ 
      title, description, fullDescription, location, rate, images, amenities, host, coordinates, category, maxGuests, bedrooms, beds, 
      adminId: req.user.id 
    });
    const listing = await newListing.save();
    res.status(201).json(listing);
  } catch (err) { res.status(500).send('Listing Persistence Failure'); }
};

/**
 * @desc Update an existing listing
 * @route PUT /api/listings/:id
 */
exports.updateListing = async (req, res) => {
  const { title, description, fullDescription, location, rate, images, amenities, coordinates, category, maxGuests, bedrooms, beds } = req.body;
  try {
    let listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    
    // AUTHORIZATION GATE: Ensure the requester actually owns this property
    if (listing.adminId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Unauthorized update attempt' });
    }
    
    // Merge updates cleanly
    Object.assign(listing, { title, description, fullDescription, location, rate, images, amenities, coordinates, category, maxGuests, bedrooms, beds });
    await listing.save();
    res.json(listing);
  } catch (err) { res.status(500).send('Update Sync Failure'); }
};

/**
 * @desc Permanently delete a listing
 * @route DELETE /api/listings/:id
 */
exports.deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    
    // AUTHORIZATION GATE
    if (listing.adminId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Unauthorized removal attempt' });
    }
    
    await Listing.deleteOne({ _id: req.params.id });
    res.json({ message: 'Listing removed.' });
  } catch (err) { res.status(500).send('Server Error'); }
};
