const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
const { 
  register, login, getProfile, updateProfile, verifyEmail, 
  forgotPassword, resetPassword, logoutAll, getWishlist, toggleWishlist 
} = require('../controllers/authController');
const { getInbox, markAsRead, getMessageHistory } = require('../controllers/chatController'); // --- NEW ---
const authMiddleware = require('../middleware/auth');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY },
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    key: (req, file, cb) => { cb(null, `avatars/${Date.now().toString()}-${file.originalname}`); },
  }),
});

// Auth Routes
router.post('/register', register);
router.post('/login', login);
router.get('/verify/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.use(authMiddleware);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/logout-all', logoutAll);
router.get('/wishlist', getWishlist);
router.post('/wishlist/:id', toggleWishlist);

// --- NEW: MESSAGING ROUTES ---
router.get('/inbox', getInbox);
router.get('/chat-history/:listingId', getMessageHistory);
router.put('/chat-read/:listingId', markAsRead);
router.post('/avatar', upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({ avatarUrl: req.file.location });
});

module.exports = router;
