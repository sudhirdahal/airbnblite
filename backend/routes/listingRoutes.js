const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
const { 
  getListings, getListingById, createListing, updateListing, deleteListing 
} = require('../controllers/listingController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

// --- 1. AWS S3 CLIENT CONFIGURATION ---
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * OPTION A: AWS S3 STORAGE (Currently Active)
 * Best for production because cloud hosts have temporary file systems.
 */
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, `listings/${Date.now().toString()}-${file.originalname}`);
    },
  }),
});

/**
 * OPTION B: LOCAL DISK STORAGE (Commented Out)
 * Useful for offline development or when you don't want to use AWS credits.
 * To use this: 
 * 1. Comment out Option A above.
 * 2. Uncomment the code below.
 * 3. Change the POST /upload response to use req.file.path (and format it).
 */
/*
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ensure this folder exists in your backend root
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });
*/

// Public routes
router.get('/', getListings);
router.get('/:id', getListingById);

// Protected Admin routes
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// Route for uploading a single image
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  
  // For S3: use req.file.location
  // For Local: you would use `http://localhost:5001/uploads/${req.file.filename}`
  res.json({ imageUrl: req.file.location });
});

router.post('/', createListing);
router.put('/:id', updateListing);
router.delete('/:id', deleteListing);

module.exports = router;
