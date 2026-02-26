const Listing = require('../models/Listing'); 
const Booking = require('../models/Booking'); // --- NEW: Import Booking for conflict checks ---

/**
 * @desc Get all listings with advanced filtering.
 * UPDATED: Includes logic to filter by Availability (Dates) and Capacity (Guests).
 */
exports.getListings = async (req, res) => {
  try {
    const { location, category, adminId, minPrice, maxPrice, guests, checkInDate, checkOutDate } = req.query; 
    let query = {}; 
    
    // 1. Basic Filters (Location, Category, Admin)
    if (location) query.location = { $regex: location, $options: 'i' };
    if (category) query.category = category;
    if (adminId) query.adminId = adminId;

    // 2. Price Range Filters
    if (minPrice || maxPrice) {
      query.rate = {};
      if (minPrice) query.rate.$gte = Number(minPrice);
      if (maxPrice) query.rate.$lte = Number(maxPrice);
    }

    // 3. Capacity Filter (Guests)
    if (guests) {
      query.maxGuests = { $gte: Number(guests) };
    }

    // --- NEW: ADVANCED AVAILABILITY FILTER ---
    // If the user provided a search range, find all listings that ARE booked during that time.
    if (checkInDate && checkOutDate) {
      const start = new Date(checkInDate);
      const end = new Date(checkOutDate);

      // Find bookings that overlap with the searched range
      const conflictingBookings = await Booking.find({
        status: 'confirmed',
        $and: [
          { checkIn: { $lt: end } },
          { checkOut: { $gt: start } }
        ]
      }).select('listingId');

      // Extract unique Listing IDs that are NOT available
      const unavailableListingIds = conflictingBookings.map(b => b.listingId);

      // Exclude these IDs from the final listing query
      query._id = { $nin: unavailableListingIds };
    }

    // Execute query
    const listings = await Listing.find(query);
    res.json(listings); 
  } catch (err) {
    console.error('Error in getListings:', err.message);
    res.status(500).send('Server Error');
  }
};

// ... (getListingById, createListing, updateListing, deleteListing remain unchanged with their extensive comments)
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

exports.createListing = async (req, res) => {
  const { title, description, fullDescription, location, rate, images, amenities, host, coordinates, category, maxGuests, bedrooms, beds } = req.body;
  try {
    const newListing = new Listing({ title, description, fullDescription, location, rate, images, amenities, host, coordinates, category, maxGuests, bedrooms, beds, adminId: req.user.id });
    const listing = await newListing.save();
    res.status(201).json(listing);
  } catch (err) {
    res.status(500).send('Server Error: ' + err.message); 
  }
};

exports.updateListing = async (req, res) => {
  const { title, description, fullDescription, location, rate, images, amenities, host, coordinates, category, maxGuests, bedrooms, beds } = req.body;
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
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.adminId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
    await Listing.deleteOne({ _id: req.params.id });
    res.json({ message: 'Listing removed' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};
