const Listing = require('../models/Listing'); // Import the Listing Mongoose model

// @desc Get all listings
// @route GET /api/listings
// @access Public
// Allows filtering by location, category, adminId, minPrice, maxPrice, and guests via query parameters.
exports.getListings = async (req, res) => {
  try {
    // Extract all potential filter query parameters.
    const { location, category, adminId, minPrice, maxPrice, guests } = req.query; 
    let query = {}; // Initialize an empty query object for MongoDB.
    
    // Filter by location: Case-insensitive regex match.
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Filter by category: Exact match.
    if (category) {
      query.category = category;
    }

    // Filter by adminId: Exact match (for admin dashboard's specific listings).
    if (adminId) {
      query.adminId = adminId;
    }

    // Filter by minimum price: Apply $gte (greater than or equal to).
    if (minPrice) {
      query.rate = { ...query.rate, $gte: Number(minPrice) };
    }

    // Filter by maximum price: Apply $lte (less than or equal to).
    if (maxPrice) {
      query.rate = { ...query.rate, $lte: Number(maxPrice) };
    }

    // Filter by guests: Assuming listing can host at least 'guests' number of people.
    // For simplicity, we don't have a 'capacity' field in listing yet, so this will be a placeholder.
    // In a real app, 'guests' would query against a 'maxGuests' field in the Listing model.
    // For now, we'll just log it for future integration or assume it's implied by listing type.
    if (guests) {
      // For this example, if 'guests' is provided, we might add a filter like:
      // query.maxGuests = { $gte: Number(guests) };
      // Since maxGuests is not in our current Listing model, we'll omit this DB query for now
      // and focus on price and location/category.
      // However, we will pass 'guests' through the frontend to simulate its usage.
    }

    // Find listings based on the constructed query.
    const listings = await Listing.find(query);
    res.json(listings); // Respond with the found listings.
  } catch (err) {
    console.error('Error in getListings:', err.message); // Log the error.
    res.status(500).send('Server Error'); // Send a generic server error response.
  }
};

// @desc Get single listing by ID
// @route GET /api/listings/:id
// @access Public
exports.getListingById = async (req, res) => {
  try {
    // Find a listing by its ID from the URL parameters.
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      // If no listing is found, return a 404 Not Found error.
      return res.status(404).json({ message: 'Listing not found' });
    }
    res.json(listing); // Respond with the found listing.
  } catch (err) {
    console.error('Error in getListingById:', err.message); // Log the error.
    // If the ID format is invalid (e.g., not a valid MongoDB ObjectId).
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Listing not found (Invalid ID format)' });
    }
    res.status(500).send('Server Error'); // Send a generic server error response.
  }
};

// @desc Create a listing
// @route POST /api/listings
// @access Private (Admin only)
exports.createListing = async (req, res) => {
  // Destructure all expected fields from the request body.
  const { 
    title, description, fullDescription, location, 
    rate, images, amenities, host, coordinates, category
  } = req.body;

  try {
    // Create a new Listing document using the request body data.
    const newListing = new Listing({
      title,
      description,
      fullDescription,
      location,
      rate,
      images,
      amenities,
      host,
      coordinates, // Ensure coordinates are included
      category,    // Ensure category is included
      adminId: req.user.id // Admin ID is taken from the authenticated user's token.
    });

    const listing = await newListing.save(); // Save the new listing to the database.
    res.status(201).json(listing); // Respond with the created listing and 201 Created status.
  } catch (err) {
    console.error('Error creating listing:', err); // Log the full error object for detailed debugging.
    // Send a more specific error message to the frontend for better feedback.
    res.status(500).send('Server Error: ' + err.message); 
  }
};

// @desc Update a listing
// @route PUT /api/listings/:id
// @access Private (Admin only)
exports.updateListing = async (req, res) => {
  // Destructure all expected fields from the request body.
  const { 
    title, description, fullDescription, location, 
    rate, images, amenities, host, coordinates, category
  } = req.body;

  try {
    // Find the listing by ID.
    let listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Security check: Ensure the authenticated admin is the owner of the listing.
    if (listing.adminId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized to update this listing' });
    }

    // Update fields with new values from req.body, or keep existing if not provided.
    listing.title = title || listing.title;
    listing.description = description || listing.description;
    listing.fullDescription = fullDescription || listing.fullDescription;
    listing.location = location || listing.location;
    listing.rate = rate || listing.rate;
    listing.images = images || listing.images;
    listing.amenities = amenities || listing.amenities;
    listing.host = host || listing.host;
    listing.coordinates = coordinates || listing.coordinates; // Update coordinates.
    listing.category = category || listing.category;       // Update category.

    await listing.save(); // Save the updated listing.
    res.json(listing); // Respond with the updated listing.
  } catch (err) {
    console.error('Error updating listing:', err.message); // Log the error.
    res.status(500).send('Server Error'); // Send a generic server error response.
  }
};

// @desc Delete a listing
// @route DELETE /api/listings/:id
// @access Private (Admin only)
exports.deleteListing = async (req, res) => {
  try {
    // Find the listing by ID.
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Security check: Ensure the authenticated admin is the owner of the listing.
    if (listing.adminId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized to delete this listing' });
    }

    await listing.remove(); // Remove the listing from the database.
    res.json({ message: 'Listing removed successfully' }); // Respond with success message.
  } catch (err) {
    console.error('Error deleting listing:', err.message); // Log the error.
    res.status(500).send('Server Error'); // Send a generic server error response.
  }
};
