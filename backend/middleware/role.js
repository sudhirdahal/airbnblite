// Middleware function to enforce role-based access control.
// It ensures that only users with a specific role can access certain routes.
// Usage: `roleMiddleware('admin')` will only allow 'admin' users.
module.exports = function(requiredRole) {
  return (req, res, next) => {
    // Check if the user (obtained from JWT in authMiddleware) has the required role.
    if (req.user.role !== requiredRole) {
      // If not, send a 403 Forbidden response.
      return res.status(403).json({ message: `Access denied. ${requiredRole} only.` });
    }
    next(); // If role matches, proceed to the next middleware/route handler.
  };
};
