const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { sendBookingConfirmationEmail } = require('../services/emailService');

/**
 * @desc Get all confirmed booking date ranges for a specific listing.
 * This is used by the frontend calendar to "gray out" dates that are already taken.
 * @route GET /api/bookings/listing/:listingId/taken
 */
exports.getTakenDates = async (req, res) => {
  try {
    const bookings = await Booking.find({ 
      listingId: req.params.listingId,
      status: 'confirmed'
    }).select('checkIn checkOut');
    
    res.json(bookings);
  } catch (err) {
    console.error('Error fetching taken dates:', err.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc Create a new booking with strict overlap prevention.
 * @route POST /api/bookings
 */
exports.createBooking = async (req, res) => {
  const { listingId, checkIn, checkOut, totalPrice } = req.body;
  try {
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const newCheckIn = new Date(checkIn);
    const newCheckOut = new Date(checkOut);

    const overlappingBooking = await Booking.findOne({
      listingId: listingId,
      status: 'confirmed',
      $and: [
        { checkIn: { $lt: newCheckOut } },
        { checkOut: { $gt: newCheckIn } }
      ]
    });

    if (overlappingBooking) {
      return res.status(400).json({ message: 'These dates were just taken. Please refresh and try again.' });
    }

    const user = await User.findById(req.user.id);
    const booking = new Booking({ 
      listingId, 
      userId: req.user.id, 
      checkIn: newCheckIn, 
      checkOut: newCheckOut, 
      totalPrice 
    });
    
    await booking.save();

    sendBookingConfirmationEmail(user.email, user.name, {
      listingTitle: listing.title,
      location: listing.location,
      checkIn, checkOut, totalPrice
    });

    res.status(201).json(booking);
  } catch (err) {
    console.error('Error creating booking:', err.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc Get current user's bookings.
 */
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id }).populate('listingId', ['title', 'images', 'location']);
    res.json(bookings);
  } catch (err) {
    console.error('Error in getMyBookings:', err.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc Get bookings for an admin's listings.
 * UPDATED: Now populates 'images' so the dashboard can show thumbnails.
 */
exports.getAdminBookings = async (req, res) => {
  try {
    const listings = await Listing.find({ adminId: req.user.id }).select('_id');
    const listingIds = listings.map(l => l._id);
    
    const bookings = await Booking.find({ listingId: { $in: listingIds } })
      .populate('listingId', ['title', 'images']) // --- FIXED: Added 'images' ---
      .populate('userId', ['name', 'email']);
      
    res.json(bookings);
  } catch (err) {
    console.error('Error in getAdminBookings:', err.message);
    res.status(500).send('Server Error');
  }
};
