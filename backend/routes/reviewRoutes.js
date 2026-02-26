const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
const { createReview, getListingReviews, deleteReview } = require('../controllers/reviewController');
const authMiddleware = require('../middleware/auth');

// --- S3 CONFIG FOR REVIEWS ---
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    key: (req, file, cb) => {
      cb(null, `reviews/${Date.now().toString()}-${file.originalname}`);
    },
  }),
});

// Routes
router.get('/:listingId', getListingReviews);
router.post('/', authMiddleware, createReview);
router.delete('/:id', authMiddleware, deleteReview);

// --- NEW: Review Photo Upload Endpoint ---
router.post('/upload', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({ imageUrl: req.file.location });
});

module.exports = router;
