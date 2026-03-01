const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const chatController = require('../controllers/chatController');
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');
const upload = require('../config/s3Config'); // Phase 5: S3 Integration

/**
 * ============================================================================
 * AUTHENTICATION ROUTES (The Identity Gatekeeper)
 * ============================================================================
 * This router manages the lifecycle of a user session.
 * It has evolved from a simple open router to a strictly guarded system 
 * featuring Token Versioning and Email Verification triggers.
 */

// --- PUBLIC ACCESS: IDENTITY PROVISIONING ---
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify/:token', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// --- PROTECTED ACCESS: IDENTITY MANAGEMENT ---
// These routes require a valid JWT via the 'auth' middleware.
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);
router.post('/logout-all', auth, authController.logoutAll);

/**
 * MEDIA PIPELINE: Avatar Upload
 * Initially used local Multer diskStorage. 
 * Phase 5 migrated to 'upload.single', which streams files directly to AWS S3.
 */
router.post('/avatar', auth, upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
  res.json({ avatarUrl: req.file.location });
});

// --- PROTECTED ACCESS: WISHLIST & COLLECTIONS ---
router.post('/wishlist/:id', auth, authController.toggleWishlist);
router.get('/wishlist', auth, authController.getWishlist);

// --- PROTECTED ACCESS: REAL-TIME HUB ---
router.get('/inbox', auth, chatController.getInbox);
router.put('/chat-read/:listingId/:guestId', auth, chatController.markAsRead);
router.get('/chat-history/:listingId/:guestId', auth, chatController.getMessageHistory);

// --- PROTECTED ACCESS: SYSTEM ALERTS ---
router.get('/notifications', auth, notificationController.getNotifications);
router.put('/notifications/read', auth, notificationController.markAsRead);

/* --- HISTORICAL STAGE 1: PRIMITIVE ROUTES ---
 * router.post('/login', (req, res) => { ... });
 * router.get('/profile', (req, res) => { ... });
 * // Problem: No authentication middleware was used yet!
 */

module.exports = router;
