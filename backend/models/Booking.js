const mongoose = require('mongoose');

// Define the Booking Schema
// This schema represents a single reservation made by a user for a specific listing.
// It tracks who booked what, for how long, and the status of the booking.
const bookingSchema = new mongoose.Schema({
  // Reference to the Listing that was booked.
  // Populates details of the listing when fetched.
  listingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Listing', 
    required: true 
  },
  // Reference to the User who made the booking.
  // Populates user details when fetched.
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // Check-in date for the booking.
  checkIn: { 
    type: Date, 
    required: true 
  },
  // Check-out date for the booking.
  checkOut: { 
    type: Date, 
    required: true 
  },
  // Total price charged for the booking.
  totalPrice: { 
    type: Number, 
    required: true 
  },
  // Current status of the booking.
  // e.g., 'pending' (if payment gateway was integrated), 'confirmed', 'cancelled'.
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled'], 
    default: 'confirmed' 
  },
  // Timestamp for when the booking was created.
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Export the Booking model, making it available for Mongoose operations.
module.exports = mongoose.model('Booking', bookingSchema);
