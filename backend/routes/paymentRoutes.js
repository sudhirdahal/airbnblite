const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

/**
 * ============================================================================
 * PAYMENT ROUTES (The Financial Connector)
 * ============================================================================
 * This router acts as the bridge between the checkout UI and the 
 * financial logic. It is designed to be 'Plug-and-Play' with Stripe or PayPal.
 * 
 * Logic: All transactions require an authenticated session context.
 */

// --- PROTECTED ACCESS: TRANSACTION AUTHORIZATION ---
/**
 * Logic: Simulates a secure payment capture.
 * Handshake: Frontend sends amount -> Backend validates and returns TXN ID.
 */
router.post('/process', auth, paymentController.processPayment);

/* --- HISTORICAL STAGE 1: TRANSACTION-LESS ---
 * In Phase 1, booking didn't involve a payment step.
 * Records were just saved directly to the database.
 */

module.exports = router;
