/**
 * ============================================================================
 * ROLE MIDDLEWARE (The Permission Shield)
 * ============================================================================
 * A higher-order function designed to enforce RBAC (Role-Based Access Control).
 * 
 * Usage: roleCheck('admin')
 * Logic: Compares the role claims in the decoded JWT (from auth.js) 
 * against the required role for the specific route.
 */
const roleCheck = (role) => {
  return (req, res, next) => {
    // We assume 'auth.js' has already executed and populated 'req.user'
    if (req.user.role !== role) {
      return res.status(403).json({ 
        msg: `Access Denied: Required role '${role}' not found.` 
      });
    }
    next();
  };
};

/* --- HISTORICAL STAGE 1: ROLE-LESS ---
 * In Phase 1, all routes were Public or required simple Login.
 * Admins didn't exist yet!
 */

module.exports = roleCheck;
