const Notification = require('../models/Notification');

/**
 * ============================================================================
 * NOTIFICATION CONTROLLER (The Global Alert Manager)
 * ============================================================================
 * This controller manages the lifecycle of system-level alerts.
 * Unlike other controllers, it features an internal 'createNotification'
 * utility that is invoked directly by other controllers (Booking, Review).
 */

/**
 * INTERNAL UTILITY: createNotification
 * Used by Booking and Review controllers to persist new alerts.
 * Logic: Decouples alert generation from the HTTP request cycle.
 */
exports.createNotification = async ({ recipient, type, title, message, link }) => {
  try {
    const notification = new Notification({ recipient, type, title, message, link });
    await notification.save();
    return notification;
  } catch (err) {
    console.error('Internal Notification Error:', err.message);
  }
};

/**
 * @desc Get all notifications for current user
 * @route GET /api/auth/notifications
 * @access Private
 */
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20); // Maintain high-fidelity performance
    res.json(notifications);
  } catch (err) { res.status(500).send('Server Error'); }
};

/**
 * @desc Mark all notifications as read
 * @route PUT /api/auth/notifications/read
 * @access Private
 */
exports.markAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (err) { res.status(500).send('Server Error'); }
};

/* --- HISTORICAL STAGE 1: NOTIFICATION-LESS ---
 * Initially, the app had no persistent notification system.
 * Alerts were only handled in-memory via Socket.IO.
 */
