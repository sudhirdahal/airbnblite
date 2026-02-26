const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { sendBookingConfirmationEmail, sendCancellationEmail } = require('../services/emailService');
const { createNotification } = require('./notificationController');

exports.getTakenDates = async (req, res) => {
  try {
    const bookings = await Booking.find({ listingId: req.params.listingId, status: 'confirmed' }).select('checkIn checkOut');
    res.json(bookings);
  } catch (err) { res.status(500).send('Server Error'); }
};

exports.createBooking = async (req, res) => {
  const { listingId, checkIn, checkOut, totalPrice } = req.body;
  const io = req.app.get('socketio'); // Get the global socket instance

  try {
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const newCheckIn = new Date(checkIn);
    const newCheckOut = new Date(checkOut);

    const overlappingBooking = await Booking.findOne({
      listingId: listingId, status: 'confirmed',
      $and: [{ checkIn: { $lt: newCheckOut } }, { checkOut: { $gt: newCheckIn } }]
    });

    if (overlappingBooking) return res.status(400).json({ message: 'Reserved.' });

    const user = await User.findById(req.user.id);
    const booking = new Booking({ listingId, userId: req.user.id, checkIn: newCheckIn, checkOut: newCheckOut, totalPrice });
    await booking.save();

    sendBookingConfirmationEmail(user.email, user.name, { listingTitle: listing.title, location: listing.location, checkIn, checkOut, totalPrice });

    // --- SCALABILITY FIX: EMIT TO PRIVATE ROOMS ---
    const guestNotif = await createNotification({
      recipient: req.user.id, type: 'booking', title: 'Booking Confirmed!', message: `Your stay at ${listing.title} is all set.`, link: '/bookings'
    });
    const hostNotif = await createNotification({
      recipient: listing.adminId, type: 'booking', title: 'New Reservation', message: `${user.name} booked ${listing.title}.`, link: '/admin'
    });

    // Instant Push
    io.to(req.user.id.toString()).emit('new_notification', guestNotif);
    io.to(listing.adminId.toString()).emit('new_notification', hostNotif);

    res.status(201).json(booking);
  } catch (err) { res.status(500).send('Server Error'); }
};

exports.cancelBooking = async (req, res) => {
  const io = req.app.get('socketio');
  try {
    const booking = await Booking.findById(req.params.id).populate('listingId').populate('userId');
    if (!booking) return res.status(404).json({ message: 'Not found' });

    const isGuest = booking.userId._id.toString() === req.user.id;
    const isHost = booking.listingId.adminId.toString() === req.user.id;
    if (!isGuest && !isHost) return res.status(401).json({ message: 'Unauthorized' });

    booking.status = 'cancelled';
    await booking.save();

    sendCancellationEmail(booking.userId.email, booking.userId.name, { listingTitle: booking.listingId.title, checkIn: booking.checkIn.toLocaleDateString(), checkOut: booking.checkOut.toLocaleDateString() });

    const recipientId = isGuest ? booking.listingId.adminId : booking.userId._id;
    const notif = await createNotification({
      recipient: recipientId, type: 'booking', title: 'Stay Cancelled', message: `The reservation for ${booking.listingId.title} has been cancelled.`, link: isGuest ? '/admin' : '/bookings'
    });

    // Instant Push
    io.to(recipientId.toString()).emit('new_notification', notif);

    res.json({ message: 'Cancelled' });
  } catch (err) { res.status(500).send('Server Error'); }
};

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
