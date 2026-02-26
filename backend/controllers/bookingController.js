const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { sendBookingConfirmationEmail, sendCancellationEmail } = require('../services/emailService');

/**
 * @desc Get all confirmed booking date ranges for a specific listing.
 * @route GET /api/bookings/listing/:listingId/taken
 * @access Public
 * 
 * ARCHITECTURE NOTE:
 * This endpoint was introduced in Stage 3 of our booking evolution. 
 * Instead of waiting for a user to submit a booking and then failing at the database level,
 * the frontend `react-calendar` calls this endpoint on load. It fetches all `checkIn` 
 * and `checkOut` dates and visually disables those tiles in the UI.
 */
exports.getTakenDates = async (req, res) => {
  try {
    // Only return bookings that are actually confirmed (ignore cancelled ones)
    const bookings = await Booking.find({ 
      listingId: req.params.listingId, 
      status: 'confirmed' 
    }).select('checkIn checkOut'); // Select only the necessary fields to keep the payload tiny
    res.json(bookings);
  } catch (err) { res.status(500).send('Server Error'); }
};

/**
 * @desc Create a new booking
 * @route POST /api/bookings
 * @access Private (Registered users)
 * 
 * EVOLUTION OF THIS CONTROLLER:
 * 
 * /* --- HISTORICAL CODE (STAGE 1: NAIVE BOOKING) ---
 * // In the beginning, we didn't check for conflicts at all.
 * exports.createBooking = async (req, res) => {
 *   const { listingId, checkIn, checkOut, totalPrice } = req.body;
 *   const booking = new Booking({ listingId, userId: req.user.id, checkIn, checkOut, totalPrice });
 *   await booking.save();
 *   res.status(201).json(booking);
 * };
 * ---------------------------------------------------- */
exports.createBooking = async (req, res) => {
  const { listingId, checkIn, checkOut, totalPrice } = req.body;
  try {
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    // Convert strings to Date objects for accurate mathematical comparison
    const newCheckIn = new Date(checkIn);
    const newCheckOut = new Date(checkOut);

    /**
     * STAGE 2: THE SERVER SHIELD (Current Logic)
     * This query checks if the requested dates overlap with ANY existing confirmed booking.
     * The logic (New_Start < Existing_End) AND (New_End > Existing_Start) catches:
     * 1. Partial overlaps at the beginning.
     * 2. Partial overlaps at the end.
     * 3. Total encapsulation (new booking is entirely inside an old one).
     */
    const overlappingBooking = await Booking.findOne({
      listingId: listingId,
      status: 'confirmed',
      $and: [
        { checkIn: { $lt: newCheckOut } },
        { checkOut: { $gt: newCheckIn } }
      ]
    });

    // If an overlap is found, reject the request immediately.
    if (overlappingBooking) return res.status(400).json({ message: 'These dates are already reserved.' });

    // Ensure the user exists before proceeding
    const user = await User.findById(req.user.id);
    
    // Create and persist the booking
    const booking = new Booking({ 
      listingId, 
      userId: req.user.id, 
      checkIn: newCheckIn, 
      checkOut: newCheckOut, 
      totalPrice 
    });
    await booking.save();

    // Trigger the automated email pipeline
    sendBookingConfirmationEmail(user.email, user.name, {
      listingTitle: listing.title,
      location: listing.location,
      checkIn, checkOut, totalPrice
    });

    res.status(201).json(booking);
  } catch (err) { res.status(500).send('Server Error'); }
};

/**
 * @desc CANCEL A BOOKING
 * @route PUT /api/bookings/:id/cancel
 * @access Private (Guest or Host)
 * 
 * SECURITY NOTE:
 * We must verify that the user attempting to cancel is either the person who made 
 * the booking (the guest) OR the person who owns the property (the host).
 */
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('listingId').populate('userId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Convert ObjectIds to strings for safe comparison against the JWT payload (req.user.id)
    const isGuest = booking.userId._id.toString() === req.user.id;
    const isHost = booking.listingId.adminId.toString() === req.user.id;

    if (!isGuest && !isHost) {
      return res.status(401).json({ message: 'Unauthorized to cancel this booking' });
    }

    // Soft delete: We change the status rather than deleting the record, preserving history
    booking.status = 'cancelled';
    await booking.save();

    // Notify the guest via email that their booking was cancelled
    sendCancellationEmail(booking.userId.email, booking.userId.name, {
      listingTitle: booking.listingId.title,
      checkIn: booking.checkIn.toLocaleDateString(),
      checkOut: booking.checkOut.toLocaleDateString()
    });

    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc Get current user's bookings (Trips)
 * @route GET /api/bookings/mybookings
 * @access Private
 */
exports.getMyBookings = async (req, res) => {
  try {
    // Populate the listing data so the frontend can display thumbnails and titles
    const bookings = await Booking.find({ userId: req.user.id }).populate('listingId', ['title', 'images', 'location']);
    res.json(bookings);
  } catch (err) { res.status(500).send('Server Error'); }
};

/**
 * @desc Get bookings for an admin's listings (Dashboard)
 * @route GET /api/bookings/admin
 * @access Private (Admin)
 * 
 * LOGIC NOTE:
 * Because bookings are tied to listings, not directly to admins, we first have to 
 * find all listings owned by this admin, extract their IDs, and then query the 
 * Booking collection for any reservations matching those listing IDs.
 */
exports.getAdminBookings = async (req, res) => {
  try {
    // 1. Find all properties owned by this admin
    const listings = await Listing.find({ adminId: req.user.id }).select('_id');
    const listingIds = listings.map(l => l._id);
    
    // 2. Find all bookings that reference any of those property IDs
    // We populate 'images' to ensure the dashboard can render thumbnails
    const bookings = await Booking.find({ listingId: { $in: listingIds } })
      .populate('listingId', ['title', 'images']) 
      .populate('userId', ['name', 'email']);
      
    res.json(bookings);
  } catch (err) { res.status(500).send('Server Error'); }
};
