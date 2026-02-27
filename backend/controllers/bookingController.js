const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { sendBookingConfirmationEmail, sendCancellationEmail } = require('../services/emailService');
const { createNotification } = require('./notificationController');

/**
 * ============================================================================
 * BOOKING CONTROLLER (The Transaction Engine)
 * ============================================================================
 * Evolution:
 * 1. Stage 1: Naive DB save (Phase 1).
 * 2. Stage 2: Mathematical conflict detection (Phase 3).
 * 3. Stage 3: Automated email and system-alert integration (Current).
 */

/**
 * @desc Get all confirmed dates for a property
 * Logic: Used to disable occupied days in the frontend calendar.
 */
exports.getTakenDates = async (req, res) => {
  try {
    const bookings = await Booking.find({ listingId: req.params.listingId, status: 'confirmed' }).select('checkIn checkOut');
    res.json(bookings);
  } catch (err) { res.status(500).send('Server Error'); }
};

/**
 * @desc Create a new booking
 * @route POST /api/bookings
 * 
 * Logic:
 * 1. Conflict Prevention: Uses MongoDB $and/$lt/$gt operators to ensure no overlapping stays.
 * 2. Handshake: Finalizes transaction and notifies both parties via Email and Bell.
 */
exports.createBooking = async (req, res) => {
  const { listingId, checkIn, checkOut, totalPrice } = req.body;
  const io = req.app.get('socketio');

  try {
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ message: 'Listing Context Lost' });

    // --- MATHEMATICAL CONFLICT SHIELD ---
    const newCheckIn = new Date(checkIn);
    const newCheckOut = new Date(checkOut);

    const overlappingBooking = await Booking.findOne({
      listingId: listingId, status: 'confirmed',
      $and: [{ checkIn: { $lt: newCheckOut } }, { checkOut: { $gt: newCheckIn } }]
    });

    if (overlappingBooking) {
      return res.status(400).json({ message: 'Conflict Detected: Dates already reserved.' });
    }

    const user = await User.findById(req.user.id);
    const booking = new Booking({ listingId, userId: req.user.id, checkIn: newCheckIn, checkOut: newCheckOut, totalPrice });
    await booking.save();

    // --- TRANSACTIONAL EMAIL NOTIFICATION ---
    sendBookingConfirmationEmail(user.email, user.name, { 
      listingTitle: listing.title, location: listing.location, checkIn, checkOut, totalPrice 
    });

    // --- HIGH-FIDELITY SYSTEM ALERTS (Phase 15) ---
    // 1. Notify Traveler
    const guestNotif = await createNotification({
      recipient: req.user.id, type: 'booking', title: 'Stay Confirmed!',
      message: `Your adventure at ${listing.title} is all set.`, link: '/bookings'
    });
    // 2. Notify Host (Bell Alert)
    const hostNotif = await createNotification({
      recipient: listing.adminId, type: 'booking', title: 'New Reservation',
      message: `${user.name} has booked ${listing.title}.`, link: '/admin'
    });

    // INSTANT PUSH: Emit to private user rooms for zero-lag Navbar update
    io.to(req.user.id.toString()).emit('new_notification', guestNotif);
    io.to(listing.adminId.toString()).emit('new_notification', hostNotif);

    res.status(201).json(booking);
  } catch (err) { res.status(500).send('Server Error'); }
};

/* --- HISTORICAL STAGE 1: BLIND SAVE ---
 * exports.createBookingLegacy = async (req, res) => {
 *   const booking = new Booking(req.body);
 *   await booking.save(); // Problem: Allowed double-bookings!
 *   res.json(booking);
 * };
 */

/**
 * @desc Cancel a booking
 * Security: Validates requester is either the guest OR the host.
 */
exports.cancelBooking = async (req, res) => {
  const io = req.app.get('socketio');
  try {
    const booking = await Booking.findById(req.params.id).populate('listingId').populate('userId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isGuest = booking.userId._id.toString() === req.user.id;
    const isHost = booking.listingId.adminId.toString() === req.user.id;
    if (!isGuest && !isHost) return res.status(401).json({ message: 'Unauthorized' });

    booking.status = 'cancelled';
    await booking.save();

    // Notify other party of cancellation
    sendCancellationEmail(booking.userId.email, booking.userId.name, { 
      listingTitle: booking.listingId.title, checkIn: booking.checkIn.toLocaleDateString(), checkOut: booking.checkOut.toLocaleDateString() 
    });

    const recipientId = isGuest ? booking.listingId.adminId : booking.userId._id;
    const notif = await createNotification({
      recipient: recipientId, type: 'booking', title: 'Reservation Voided',
      message: `The stay for ${booking.listingId.title} has been cancelled.`,
      link: isGuest ? '/admin' : '/bookings'
    });

    io.to(recipientId.toString()).emit('new_notification', notif);
    res.json({ message: 'Successfully voided reservation.' });
  } catch (err) { res.status(500).send('Server Error'); }
};

// Standard data fetchers with JSDoc
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id }).populate('listingId', ['title', 'images', 'location']);
    res.json(bookings);
  } catch (err) { res.status(500).send('Server Error'); }
};

exports.getAdminBookings = async (req, res) => {
  try {
    const listings = await Listing.find({ adminId: req.user.id }).select('_id');
    const listingIds = listings.map(l => l._id);
    const bookings = await Booking.find({ listingId: { $in: listingIds } }).populate('listingId', ['title', 'images']).populate('userId', ['name', 'email']);
    res.json(bookings);
  } catch (err) { res.status(500).send('Server Error'); }
};
