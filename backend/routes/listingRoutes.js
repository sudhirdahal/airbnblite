const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client } = require('@aws-sdk/client-s3'); // --- NEW: AWS SDK ---
const multerS3 = require('multer-s3');             // --- NEW: Multer S3 ---
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

// --- 2. MULTER-S3 STORAGE ENGINE ---
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: 'public-read', // Makes uploaded files publicly accessible
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      // Create a unique filename using timestamp
      cb(null, `listings/${Date.now().toString()}-${file.originalname}`);
    },
  }),
});

/* --- OLD CODE: LOCAL DISK STORAGE (Preserved) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },
  filename: (req, file, cb) => { cb(null, Date.now() + '-' + file.originalname); }
});
const upload = multer({ storage: storage });
*/

// Public routes
router.get('/', getListings);
router.get('/:id', getListingById);

// Protected Admin routes
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// Route for uploading a single image to S3
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  
  // Return the public S3 URL instead of a local path
  res.json({ imageUrl: req.file.location });
});

router.post('/', createListing);
router.put('/:id', updateListing);
router.delete('/:id', deleteListing);

module.exports = router;
