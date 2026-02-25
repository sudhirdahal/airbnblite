const express = require('express');
const router = express.Router(); // Create a new router instance.
const authMiddleware = require('../middleware/auth'); // Middleware to ensure the user is authenticated.

// --- INLINED MOCK PAYMENT CONTROLLER (Workaround for Module Resolution Issue) ---
const processMockPayment = async (req, res) => {
  const { cardNumber, cardName, expiry, cvv, totalAmount } = req.body;

  // 1. Format Validation (Digits, length, etc.)
  if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19 || !/^\d+$/.test(cardNumber)) {
    return res.status(400).json({ message: 'Invalid card number format or length.' });
  }
  if (!cardName || cardName.trim().length < 3) {
    return res.status(400).json({ message: 'Cardholder name is too short.' });
  }
  
  // 2. Expiry Format Check (MM/YY)
  const expiryRegex = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
  if (!expiry || !expiryRegex.test(expiry)) {
    return res.status(400).json({ message: 'Invalid expiry date format (MM/YY).' });
  }

  // 3. LOGIC FIX: Real Date Validation (Check if card is expired)
  const [expMonth, expYear] = expiry.split('/').map(Number);
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // getMonth() is 0-indexed
  const currentYear = Number(now.getFullYear().toString().slice(-2)); // Get last two digits (e.g., 26)

  if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
    return res.status(400).json({ message: 'The provided credit card is expired.' });
  }

  // 4. Other basic checks
  if (!cvv || cvv.length < 3 || cvv.length > 4 || !/^\d+$/.test(cvv)) {
    return res.status(400).json({ message: 'Invalid CVV format or length.' });
  }
  if (totalAmount <= 0) {
    return res.status(400).json({ message: 'Total amount must be greater than zero.' });
  }

  // 5. Payment Simulation (90% success rate)
  const isSuccess = Math.random() > 0.1; 

  if (isSuccess) {
    return res.status(200).json({ message: 'Mock payment processed successfully.', success: true });
  } else {
    return res.status(400).json({ message: 'Mock payment declined by gateway.', success: false });
  }
};

router.post('/process-mock', authMiddleware, processMockPayment);

module.exports = router;
