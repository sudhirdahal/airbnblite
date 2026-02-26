const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { sendBookingConfirmationEmail, sendCancellationEmail } = require('../services/emailService');

// @desc Get all confirmed booking date ranges
exports.getTakenDates = async (req, res) => {
  try {
    const bookings = await Booking.find({ listingId: req.params.listingId, status: 'confirmed' }).select('checkIn checkOut');
    res.json(bookings);
  } catch (err) { res.status(500).send('Server Error'); }
};

// @desc Create a new booking
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

    if (overlappingBooking) return res.status(400).json({ message: 'These dates are already reserved.' });

    const user = await User.findById(req.user.id);
    const booking = new Booking({ listingId, userId: req.user.id, checkIn: newCheckIn, checkOut: newCheckOut, totalPrice });
    await booking.save();

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
 * Security Logic: Only the guest (owner) or the host can cancel.
 */
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('listingId').populate('userId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isGuest = booking.userId._id.toString() === req.user.id;
    const isHost = booking.listingId.adminId.toString() === req.user.id;

    if (!isGuest && !isHost) {
      return res.status(401).json({ message: 'Unauthorized to cancel this booking' });
    }

    // Update status
    booking.status = 'cancelled';
    await booking.save();

    // Notify the guest via email
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

// @desc Get current user's bookings
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id }).populate('listingId', ['title', 'images', 'location']);
    res.json(bookings);
  } catch (err) { res.status(500).send('Server Error'); }
};

// @desc Get bookings for an admin's listings
exports.getAdminBookings = async (req, res) => {
  try {
    const listings = await Listing.find({ adminId: req.user.id }).select('_id');
    const listingIds = listings.map(l => l._id);
    const bookings = await Booking.find({ listingId: { $in: listingIds } }).populate('listingId', ['title', 'images']).populate('userId', ['name', 'email']);
    res.json(bookings);
  } catch (err) { res.status(500).send('Server Error'); }
};
