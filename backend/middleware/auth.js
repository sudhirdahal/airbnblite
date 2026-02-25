const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import User model to check token version

// Middleware function to protect routes that require authentication.
// It verifies the JWT sent by the client and ensures the user's session is valid.
module.exports = async function(req, res, next) {
  // 1. Get token from header
  // Expects a header like: "Authorization: Bearer <token>"
  const authHeader = req.header('Authorization');
  
  // Check if Authorization header exists
  if (!authHeader) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Extract the token part from "Bearer <token>"
  const token = authHeader.split(' ')[1];

  // Check if token actually exists after splitting
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // 2. Verify token
    // Decodes the token using the secret key and extracts the payload.
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_123');
    
    // 3. Fetch user and check token version for multi-device logout
    // This is crucial for session invalidation (e.g., after password reset or global logout).
    const user = await User.findById(decoded.id);
    
    // If user not found OR the token's version does not match the stored version,
    // the token is considered invalid/expired/revoked.
    // This effectively logs out the user from all sessions if tokenVersion is incremented.
    if (!user || user.tokenVersion !== decoded.version) {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }

    // 4. Attach decoded user payload to the request object
    // This makes user data (like ID and role) available to subsequent middleware and route handlers.
    req.user = decoded; 
    next(); // Proceed to the next middleware/route handler
  } catch (err) {
    // If token verification fails (e.g., token is expired or malformed)
    res.status(401).json({ message: 'Token is not valid' });
  }
};
