const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { sendBookingConfirmationEmail, sendCancellationEmail } = require('../services/emailService');
const { createNotification } = require('./notificationController');

/**
 * ============================================================================
 * 🛡️ BOOKING CONTROLLER (The Transaction Engine)
 * ============================================================================
 * 
 * MASTERCLASS NOTES:
 * The booking controller is the most critical logic engine in a SaaS platform.
 * If UI breaks, users refresh. If data integrity breaks here, you lose money 
 * and user trust. This file demonstrates the evolution from "Trusting the Client"
 * to "Defensive Server Architecture."
 * 
 * Evolution Timeline:
 * - Phase 1: Naive DB save (Blindly accepting dates).
 * - Phase 3: Mathematical conflict detection ($and / $lt / $gt).
 * - Phase 8: Contextual Population (Hydrating relational data).
 * - Phase 15: Automated email and real-time push system alerts.
 */


/* ============================================================================
 * 👻 HISTORICAL GHOST: PHASE 1 (The Blind Save)
 * ============================================================================
 * In the early days of development, our booking route looked like this:
 * 
 * exports.createBookingLegacy = async (req, res) => {
 *   try {
 *     // DANGER: We trusted whatever dates the frontend sent us!
 *     const booking = new Booking(req.body);
 *     await booking.save(); 
 *     res.json(booking);
 *   } catch (err) { res.status(500).send('Error'); }
 * };
 * 
 * THE FLAW: 
 * If User A and User B clicked "Book" at the exact same millisecond, 
 * or if a malicious user bypassed the frontend calendar, we would save two 
 * overlapping bookings for the same property. We needed a "Server Shield."
 * ============================================================================ */

/**
 * @desc Create a new reservation with strict conflict prevention
 * @route POST /api/bookings
 * 
 * ARCHITECTURE:
 * 1. Pre-Flight Check: Verify the property still exists.
 * 2. The Mathematical Shield: Query the database for overlapping stays.
 * 3. The Transaction: Save the booking.
 * 4. The Handshake: Fire asynchronous emails and real-time socket alerts.
 */
exports.createBooking = async (req, res) => {
  const { listingId, checkIn, checkOut, totalPrice, paymentDetails } = req.body;
  const io = req.app.get('socketio'); // Access the global socket instance

  try {
    // --- 🛡️ THE FINANCIAL INTEGRITY GUARD (Phase 36) ---
    // Although this is a mock gateway, we enforce realistic data quality to 
    // maintain the integrity of our transaction history and prevent "Garbage Data."
    if (!paymentDetails) return res.status(400).json({ message: 'Payment Context Missing' });

    const { cardName, cardNumber, expiry, cvv, address, city, region, postalCode, country } = paymentDetails;

    // 1. Identity Validation (The Name Check)
    const nameParts = cardName.trim().split(/\s+/);
    if (nameParts.length < 2) return res.status(400).json({ message: 'Full name required (First and Last).' });
    if (!/^[A-Za-z\s\.]+$/.test(cardName)) return res.status(400).json({ message: 'Name contains invalid characters.' });
    if (nameParts[0].length < 2) return res.status(400).json({ message: 'First name is too short.' });
    if (nameParts[nameParts.length - 1].length < 2) return res.status(400).json({ message: 'Last name is too short.' });

    // 2. Card Integrity
    const cleanCard = cardNumber.replace(/\s/g, '');
    if (!/^\d{16}$/.test(cleanCard)) return res.status(400).json({ message: 'Invalid Card Number: 16 digits required.' });

    // 3. Temporal Validity (The Expiry Check)
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return res.status(400).json({ message: 'Invalid Expiry Format: MM/YY required.' });
    const [expMonth, expYear] = expiry.split('/').map(Number);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = Number(now.getFullYear().toString().slice(-2));
    
    if (expMonth < 1 || expMonth > 12) return res.status(400).json({ message: 'Invalid Month in expiry.' });
    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      return res.status(400).json({ message: 'The provided card has expired.' });
    }
    if (expYear > currentYear + 10) return res.status(400).json({ message: 'Absurd Expiry: Max 10 years in the future.' });

    // 4. Security Code Integrity
    if (!/^\d{3,4}$/.test(cvv)) return res.status(400).json({ message: 'Invalid CVV.' });

    // 5. International Sanity Check (The Address Shield)
    if (address.length < 5) return res.status(400).json({ message: 'Street Address appears incomplete.' });
    if (city.length < 2) return res.status(400).json({ message: 'City name is too short.' });
    if (region.length < 2) return res.status(400).json({ message: 'State/Province is too short.' });

    // --- 🛡️ THE GEOGRAPHIC SHIELD (Phase 37) ---
    // CROSS-REFERENCE VALIDATION: Prevent logically inconsistent data (e.g. Toronto in BC)
    const geoValidator = {
      'United States': {
        'California': ['Los Angeles', 'San Francisco', 'San Diego'],
        'New York': ['New York City', 'Buffalo', 'Albany'],
        'Texas': ['Houston', 'Austin', 'Dallas'],
        'Florida': ['Miami', 'Orlando', 'Tampa']
      },
      'Canada': {
        'Ontario': ['Toronto', 'Ottawa', 'Mississauga'],
        'British Columbia': ['Vancouver', 'Victoria', 'Kelowna'],
        'Quebec': ['Montreal', 'Quebec City', 'Laval'],
        'Alberta': ['Calgary', 'Edmonton', 'Banff']
      },
      'United Kingdom': {
        'Greater London': ['London', 'Westminster', 'Croydon'],
        'West Midlands': ['Birmingham', 'Coventry', 'Wolverhampton'],
        'Greater Manchester': ['Manchester', 'Salford', 'Bolton']
      },
      'Australia': {
        'New South Wales': ['Sydney', 'Newcastle', 'Wollongong'],
        'Victoria': ['Melbourne', 'Geelong', 'Ballarat'],
        'Queensland': ['Brisbane', 'Gold Coast', 'Cairns']
      }
    };

    const validCountry = geoValidator[country];
    if (validCountry) {
      const validRegionCities = validCountry[region];
      if (validRegionCities && !validRegionCities.includes(city)) {
        return res.status(400).json({ message: 'Geographic Disynchronization: Selected city does not exist in this region.' });
      }
    }

    if (country === 'United States' && !/^\d{5}$/.test(postalCode)) {
      return res.status(400).json({ message: 'Invalid US Zip Code (5 digits).' });
    }
    if (country === 'Canada' && !/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(postalCode.replace(/\s/g, ''))) {
      return res.status(400).json({ message: 'Invalid Canadian Postal Code (A1A 1A1).' });
    }
    if (postalCode.length < 3) return res.status(400).json({ message: 'Postal Code is too short.' });

    // PRE-FLIGHT: Ensure we aren't booking a deleted property
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ message: 'Listing Context Lost' });

    // --- 🛡️ THE MATHEMATICAL CONFLICT SHIELD (Phase 3) ---
    // Logic: Two date ranges (A and B) overlap IF AND ONLY IF:
    // (Start of A is BEFORE End of B) AND (End of A is AFTER Start of B)
    const newCheckIn = new Date(checkIn);
    const newCheckOut = new Date(checkOut);

    const overlappingBooking = await Booking.findOne({
      listingId: listingId, 
      status: 'confirmed',
      // Using MongoDB operators to perform date math at the database level
      $and: [
        { checkIn: { $lt: newCheckOut } }, 
        { checkOut: { $gt: newCheckIn } }
      ]
    });

    if (overlappingBooking) {
      // We block the transaction and send a 400 Bad Request
      return res.status(400).json({ message: 'Conflict Detected: Dates already reserved.' });
    }

    // --- 🛡️ THE MAINTENANCE SHIELD (Phase 41) ---
    // Logic: Ensure requested dates don't overlap with host-enforced downtime.
    const isMaintenanceOverlap = listing.unavailableDates?.some(period => {
      const start = new Date(period.start);
      const end = new Date(period.end);
      return (newCheckIn < end && newCheckOut > start);
    });

    if (isMaintenanceOverlap) {
      return res.status(400).json({ message: 'Property Out of Service: Selected dates are during a maintenance period.' });
    }

    // --- 💾 THE TRANSACTION ---
    const user = await User.findById(req.user.id);
    const booking = new Booking({ 
      listingId, 
      userId: req.user.id, 
      checkIn: newCheckIn, 
      checkOut: newCheckOut, 
      totalPrice,
      guests: guests || { adults: 1, children: 0, infants: 0 } // Persisting the breakdown (Phase 38)
    });
    await booking.save();

    // --- ✉️ THE HANDSHAKE (Asynchronous Notifications) ---
    // 1. Transactional Email
    sendBookingConfirmationEmail(user.email, user.name, { 
      listingTitle: listing.title, location: listing.location, checkIn, checkOut, totalPrice 
    });

    // 2. High-Fidelity System Alerts (Phase 15)
    // Create persistent DB records for the notifications
    const guestNotif = await createNotification({
      recipient: req.user.id, type: 'booking', title: 'Stay Confirmed!',
      message: `Your adventure at ${listing.title} is all set.`, link: '/bookings'
    });
    
    const hostNotif = await createNotification({
      recipient: listing.adminId, type: 'booking', title: 'New Reservation',
      message: `${user.name} has booked ${listing.title}.`, link: '/admin'
    });

    // 3. INSTANT PUSH: Emit to private user rooms for zero-lag UI updates
    // This allows the Navbar badge to increment without a page refresh!
    io.to(req.user.id.toString()).emit('new_notification', guestNotif);
    io.to(listing.adminId.toString()).emit('new_notification', hostNotif);

    // 4. Final Success Response
    res.status(201).json(booking);
  } catch (err) { res.status(500).send('Server Error'); }
};

/**
 * @desc Get all confirmed dates for a specific property
 * @route GET /api/bookings/dates/:listingId
 * 
 * MASTERCLASS NOTE (Defensive UI):
 * Instead of waiting for the user to submit a form to tell them the dates 
 * are taken, we supply this endpoint so the frontend React Calendar can 
 * proactively "grey out" unavailable dates before they even try to click.
 */
exports.getTakenDates = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.listingId).select('unavailableDates');
    const bookings = await Booking.find({ 
      listingId: req.params.listingId, 
      status: 'confirmed' 
    }).select('checkIn checkOut');

    // CONVERGENCE (Phase 41): Merge actual bookings with host-defined downtime
    const maintenanceDates = (listing?.unavailableDates || []).map(d => ({
      checkIn: d.start,
      checkOut: d.end,
      isMaintenance: true 
    }));

    res.json([...bookings, ...maintenanceDates]);
  } catch (err) { res.status(500).send('Server Error'); }
};

/* ============================================================================
 * 👻 HISTORICAL GHOST: PHASE 5 (The Insecure Cancellation)
 * ============================================================================
 * Initially, anyone who knew the Booking ID could cancel it!
 * 
 * exports.cancelBookingLegacy = async (req, res) => {
 *   await Booking.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
 *   res.json({ msg: 'Cancelled' });
 * };
 * 
 * THE FLAW: Zero Authorization checks.
 * THE FIX: Implemented explicit ownership checks in Phase 8.
 * ============================================================================ */

/**
 * @desc Cancel a booking securely
 * @route PUT /api/bookings/:id/cancel
 * 
 * SECURITY: Validates the requester is either the guest OR the property host.
 */
exports.cancelBooking = async (req, res) => {
  const io = req.app.get('socketio');
  try {
    // HYDRATION: We need user and listing data to check ownership and send emails
    const booking = await Booking.findById(req.params.id).populate('listingId').populate('userId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // AUTHORIZATION GATE
    const isGuest = booking.userId._id.toString() === req.user.id;
    const isHost = booking.listingId.adminId.toString() === req.user.id;
    if (!isGuest && !isHost) return res.status(401).json({ message: 'Unauthorized Access' });

    booking.status = 'cancelled';
    await booking.save();

    // Symmetrical Notification: Tell the *other* party what happened
    sendCancellationEmail(booking.userId.email, booking.userId.name, { 
      listingTitle: booking.listingId.title, checkIn: booking.checkIn.toLocaleDateString(), checkOut: booking.checkOut.toLocaleDateString() 
    });

    const recipientId = isGuest ? booking.listingId.adminId : booking.userId._id;
    const notif = await createNotification({
      recipient: recipientId, type: 'booking', title: 'Reservation Voided',
      message: `The stay for ${booking.listingId.title} has been cancelled.`,
      link: isGuest ? '/admin' : '/bookings'
    });

    // Real-time Push
    io.to(recipientId.toString()).emit('new_notification', notif);
    
    res.json({ message: 'Successfully voided reservation.' });
  } catch (err) { res.status(500).send('Server Error'); }
};

/**
 * @desc Fetch bookings for the logged-in Guest
 * @route GET /api/bookings
 */
exports.getMyBookings = async (req, res) => {
  try {
    // Mongoose Populate allows us to fetch relational data (like SQL JOINs)
    const bookings = await Booking.find({ userId: req.user.id })
      .populate('listingId', ['title', 'images', 'location']);
    res.json(bookings);
  } catch (err) { res.status(500).send('Server Error'); }
};

/**
 * @desc Fetch all bookings for properties owned by the logged-in Host
 * @route GET /api/bookings/admin
 * 
 * DATA AGGREGATION PATTERN:
 * Because a Host doesn't "own" bookings directly (they own properties), 
 * we must first find all their properties, extract the IDs, and then 
 * find all bookings that belong to that array of IDs.
 */
exports.getAdminBookings = async (req, res) => {
  try {
    // Step 1: Find all properties owned by the Host
    const listings = await Listing.find({ adminId: req.user.id }).select('_id');
    const listingIds = listings.map(l => l._id);
    
    // Step 2: Find all bookings matching those properties
    // We use the MongoDB $in operator to match against an array of IDs
    const bookings = await Booking.find({ listingId: { $in: listingIds } })
      .populate('listingId', ['title', 'images'])
      .populate('userId', ['name', 'email']); // Hydrate Guest details for the Dashboard

    res.json(bookings);
  } catch (err) { 
    console.error(`Admin Sync Failure: ${err.message}`);
    res.status(500).send('Server Error'); 
  }
};
