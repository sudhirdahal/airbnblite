const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/role');

/**
 * ============================================================================
 * BOOKING ROUTES (The Transaction Authority)
 * ============================================================================
 * Manages the lifecycle of a reservation.
 * Logic: Segregates traveler actions (My Bookings) from host actions 
 * (Admin Bookings) through strict RBAC (Role-Based Access Control).
 */

// --- PUBLIC ACCESS: CONFLICT PREVENTION ---
router.get('/listing/:listingId/taken', bookingController.getTakenDates);

// --- PROTECTED ACCESS: TRAVELER ACTIONS ---
router.post('/', auth, bookingController.createBooking);
router.get('/mybookings', auth, bookingController.getMyBookings);

/**
 * LIFECYCLE ACTION: Cancellation
 * Logic: Accessible by either the traveler OR the host.
 * Authorization is handled inside the controller via ownership check.
 */
router.put('/:id/cancel', auth, bookingController.cancelBooking);

// --- PROTECTED ACCESS: HOST ACTIONS ---
router.get('/admin', auth, roleCheck('admin'), bookingController.getAdminBookings);

/* --- HISTORICAL STAGE 1: OPEN BOOKINGS ---
 * router.post('/', (req, res) => { ... });
 * // Problem: Anyone could book anything without logging in!
 */

module.exports = router;
