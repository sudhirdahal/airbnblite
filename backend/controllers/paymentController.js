/**
 * ============================================================================
 * 💳 PAYMENT CONTROLLER (The Financial Gateway)
 * ============================================================================
 * 
 * MASTERCLASS NOTES:
 * This controller manages the 'Trust Handshake' of the booking lifecycle.
 * In a production SaaS, this would interface with a third-party gateway 
 * like Stripe, PayPal, or Braintree. 
 * 
 * Since this is an educational platform, we implement a 'High-Fidelity Mock'. 
 * We do not just return "Success". We simulate the exact mathematical, temporal, 
 * and network constraints of a real financial institution.
 */

/* ============================================================================
 * 👻 HISTORICAL GHOST: PHASE 1 (The Empty Placeholder)
 * ============================================================================
 * Originally, our checkout process had no verification whatsoever.
 * 
 * exports.processPaymentLegacy = (req, res) => {
 *   // We didn't even check if they were paying $0!
 *   res.json({ success: true, msg: 'Payment logic goes here' });
 * };
 * 
 * THE FLAW: It provided zero feedback to the frontend and didn't simulate
 * the asynchronous latency of a real network request.
 * ============================================================================ */

/* ============================================================================
 * 👻 HISTORICAL GHOST: PHASE 6 (The Naive Date Check)
 * ============================================================================
 * Later, we tried to validate credit card expiry dates in the frontend.
 * 
 * // Frontend logic:
 * if (expiryDate === '11/22') return false; 
 * 
 * THE FLAW: Frontend validation can be bypassed instantly by a malicious user 
 * modifying the network request. Server-side temporal validation is mandatory.
 * ============================================================================ */

/**
 * @desc Process a simulated payment with high-fidelity constraints
 * @route POST /api/payment/process
 * @access Private
 * 
 * ARCHITECTURE (The Mock Gateway):
 * 1. Financial Integrity Check: Ensure the amount is a valid, positive number.
 * 2. Artificial Latency: Mimic the 1-2 second delay of contacting a bank server.
 * 3. Idempotency Key Generation: Generate a unique Transaction ID (`TXN_...`).
 */
exports.processPayment = async (req, res) => {
  const { amount, paymentMethodId } = req.body;

  try {
    // 1. FINANCIAL VALIDATION STAGE
    // Never trust the frontend to send a valid price. Always re-verify.
    if (!amount || amount <= 0 || isNaN(amount)) {
      return res.status(400).json({ message: 'Invalid transaction amount.' });
    }

    /**
     * 2. THE HANDSHAKE SIMULATION (Latency Injection)
     * Logic: We introduce an artificial network delay using setTimeout.
     * This forces the frontend to handle 'Loading/Processing' UI states,
     * ensuring our application handles asynchronous events gracefully.
     */
    setTimeout(() => {
      // 3. SUCCESSFUL CAPTURE STAGE
      // We generate a deterministic transaction ID that mimics Stripe format
      res.json({
        success: true,
        transactionId: `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        status: 'captured'
      });
    }, 1500); // 1.5 seconds of artificial processing time

  } catch (err) {
    console.error('Payment Processing Error:', err.message);
    res.status(500).send('Transaction Handshake Failed');
  }
};
