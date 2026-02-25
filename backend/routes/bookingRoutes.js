const express = require('express');
const router = express.Router();
const { 
  createBooking, getMyBookings, getAdminBookings, getTakenDates 
} = require('../controllers/bookingController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

// Public route to check availability
router.get('/listing/:listingId/taken', getTakenDates);

// Protected routes
router.use(authMiddleware);
router.post('/', createBooking);
router.get('/mybookings', getMyBookings);
router.get('/admin', roleMiddleware('admin'), getAdminBookings);

module.exports = router;
