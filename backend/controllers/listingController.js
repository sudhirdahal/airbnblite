const Listing = require('../models/Listing'); 
const Booking = require('../models/Booking'); 

/**
 * @desc Get all listings with advanced filtering and sorting.
 */
exports.getListings = async (req, res) => {
  try {
    const { 
      location, category, adminId, minPrice, maxPrice, 
      guests, checkInDate, checkOutDate, amenities,
      sort // --- NEW: sort param ---
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

    if (guests) query.maxGuests = { $gte: Number(guests) };

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
      query._id = { $nin: conflicts.map(b => b.listingId) };
    }

    // --- NEW: DYNAMIC SORTING LOGIC ---
    let sortOptions = { createdAt: -1 }; // Default: Newest first
    if (sort === 'price-asc') sortOptions = { rate: 1 };
    if (sort === 'price-desc') sortOptions = { rate: -1 };
    if (sort === 'rating') sortOptions = { rating: -1 };

    const listings = await Listing.find(query).sort(sortOptions);
    res.json(listings); 
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// (Other controllers remain same)
exports.getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json(listing);
  } catch (err) { res.status(500).send('Server Error'); }
};

exports.createListing = async (req, res) => {
  const { title, description, fullDescription, location, rate, images, amenities, host, coordinates, category, maxGuests, bedrooms, beds } = req.body;
  try {
    const newListing = new Listing({ title, description, fullDescription, location, rate, images, amenities, host, coordinates, category, maxGuests, bedrooms, beds, adminId: req.user.id });
    const listing = await newListing.save();
    res.status(201).json(listing);
  } catch (err) { res.status(500).send('Server Error: ' + err.message); }
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
  } catch (err) { res.status(500).send('Server Error'); }
};

exports.deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.adminId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
    await Listing.deleteOne({ _id: req.params.id });
    res.json({ message: 'Listing removed' });
  } catch (err) { res.status(500).send('Server Error'); }
};
