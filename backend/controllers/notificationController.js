const Notification = require('../models/Notification');

/**
 * Utility: Creates and optionally broadcasts a notification.
 */
exports.createNotification = async (data) => {
  try {
    const notification = new Notification(data);
    await notification.save();
    return notification;
  } catch (err) {
    console.error('Notification Error:', err);
  }
};

/**
 * @desc Get all notifications for current user
 */
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

/**
 * @desc Mark all as read
 */
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};
