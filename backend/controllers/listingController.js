const Listing = require('../models/Listing'); 
const Booking = require('../models/Booking'); 

/**
 * @desc Get all listings with advanced filtering and sorting.
 * @route GET /api/listings
 * @access Public
 * 
 * ============================================================================
 * SEARCH ENGINE EVOLUTION
 * ============================================================================
 */
exports.getListings = async (req, res) => {
  try {
    const { 
      location, category, adminId, minPrice, maxPrice, 
      guests, checkInDate, checkOutDate, amenities, sort 
    } = req.query; 
    
    let query = {}; 
    
    /* --- STAGE 1: PRIMITIVE SEARCH (Phase 1) ---
     * Initially, we only supported location regex.
     * if (location) query.location = { $regex: location, $options: 'i' };
     */

    // CURRENT LOGIC (Phase 5+): Multi-dimensional Search
    if (location) query.location = { $regex: location, $options: 'i' };
    if (category) query.category = category;
    if (adminId) query.adminId = adminId;

    // Price Engineering
    if (minPrice || maxPrice) {
      query.rate = {};
      if (minPrice) query.rate.$gte = Number(minPrice);
      if (maxPrice) query.rate.$lte = Number(maxPrice);
    }

    // Capacity Logic: Ensure listing can fit the requested guests
    if (guests) {
      query.maxGuests = { $gte: Number(guests) };
    }

    // High-Precision Amenity Filtering using MongoDB $all
    if (amenities) {
      const amenityList = amenities.split(',').map(a => a.trim());
      query.amenities = { $all: amenityList };
    }

    /**
     * CROSS-COLLECTION AVAILABILITY SHIELD
     * This is the app's most advanced query. It finds properties that are 
     * already booked during the requested dates and EXCLUDES them from 
     * the result set using the '$nin' (Not In) operator.
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

    // Dynamic Server-Side Sorting
    let sortOptions = { createdAt: -1 }; 
    if (sort === 'price-asc') sortOptions = { rate: 1 };
    if (sort === 'price-desc') sortOptions = { rate: -1 };
    if (sort === 'rating') sortOptions = { rating: -1 };

    const listings = await Listing.find(query).sort(sortOptions);
    res.json(listings); 
  } catch (err) {
    console.error('getListings Error:', err.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc Get single listing by ID
 * @route GET /api/listings/:id
 */
exports.getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json(listing);
  } catch (err) {
    if (err.kind === 'ObjectId') return res.status(404).json({ message: 'Listing not found' });
    res.status(500).send('Server Error');
  }
};

/**
 * @desc Create a listing
 * @access Private (Admin)
 */
exports.createListing = async (req, res) => {
  const { title, description, fullDescription, location, rate, images, amenities, host, coordinates, category, maxGuests, bedrooms, beds } = req.body;
  try {
    const newListing = new Listing({ 
      title, description, fullDescription, location, rate, images, amenities, host, coordinates, category, maxGuests, bedrooms, beds, 
      adminId: req.user.id 
    });
    const listing = await newListing.save();
    res.status(201).json(listing);
  } catch (err) { res.status(500).send('Server Error: ' + err.message); }
};

/**
 * @desc Update a listing
 * SECURITY: Only the owner (adminId) can update.
 */
exports.updateListing = async (req, res) => {
  const { title, description, fullDescription, location, rate, images, amenities, coordinates, category, maxGuests, bedrooms, beds } = req.body;
  try {
    let listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.adminId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    listing.title = title || listing.title;
    listing.description = description || listing.description;
    listing.fullDescription = fullDescription || listing.fullDescription;
    listing.location = location || listing.location;
    listing.rate = rate || listing.rate;
    listing.images = images || listing.images;
    listing.amenities = amenities || listing.amenities;
    listing.coordinates = coordinates || listing.coordinates;
    listing.category = category || listing.category;
    listing.maxGuests = maxGuests || listing.maxGuests;
    listing.bedrooms = bedrooms || listing.bedrooms;
    listing.beds = beds || listing.beds;

    await listing.save();
    res.json(listing);
  } catch (err) { res.status(500).send('Server Error'); }
};

/**
 * @desc Delete a listing
 */
exports.deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.adminId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
    await Listing.deleteOne({ _id: req.params.id });
    res.json({ message: 'Listing removed successfully.' });
  } catch (err) { res.status(500).send('Server Error'); }
};
