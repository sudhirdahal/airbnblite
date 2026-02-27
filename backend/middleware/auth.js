const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * ============================================================================
 * AUTH MIDDLEWARE (The Identity Handshake)
 * ============================================================================
 * Logic: Extracts the JWT from the 'x-auth-token' header, verifies its
 * signature using the system secret, and decodes the user payload.
 * 
 * SECURITY EVOLUTION (Phase 5+): 
 * Includes a 'Token Version' check to ensure the session hasn't been 
 * revoked by a 'Global Logout' action.
 */
module.exports = async (req, res, next) => {
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No security token found. Authorization denied.' });
  }

  try {
    // 1. SIGNATURE VERIFICATION
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_123');
    
    // 2. TOKEN VERSION SHIELD
    // We check if the version in the token matches the version in the DB.
    const user = await User.findById(decoded.id).select('tokenVersion');
    if (!user || user.tokenVersion !== decoded.version) {
      return res.status(401).json({ msg: 'Session expired. Please re-authenticate.' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Invalid security token.' });
  }
};

/* --- HISTORICAL STAGE 1: PRIMITIVE AUTH ---
 * module.exports = (req, res, next) => {
 *   const token = req.header('x-auth-token');
 *   const decoded = jwt.verify(token, 'secret');
 *   req.user = decoded;
 *   next();
 * };
 * // Problem: No way to logout other devices!
 */
