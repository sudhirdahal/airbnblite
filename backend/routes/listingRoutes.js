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

/**
 * ============================================================================
 * THE CLOUD STORAGE MIGRATION (LOCAL DISK -> AWS S3)
 * ============================================================================
 * Early in development, we used 'multer.diskStorage' to save images directly 
 * to the 'backend/uploads' folder. However, cloud platforms like Render and AWS EC2 
 * use "Ephemeral File Systems." This means every time the server restarts, 
 * the local disk is wiped, and all user images are lost.
 * 
 * To make this a production-ready SaaS, we migrated to Amazon S3.
 * The code below streams the incoming file from the user's browser directly 
 * to our S3 bucket, bypassing our server's hard drive entirely.
 */

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
    // Note: We used to use `acl: 'public-read'` here, but modern AWS buckets 
    // disable ACLs by default. Instead, we applied a Bucket Policy in the AWS Console.
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      // Create a unique identifier to prevent naming collisions
      cb(null, `listings/${Date.now().toString()}-${file.originalname}`);
    },
  }),
});

/**
 * --- HISTORICAL CODE: LOCAL DISK STORAGE ---
 * Preserved for educational purposes. If you want to run this entirely offline
 * without AWS credentials, comment out the S3 upload block above, and uncomment
 * this block below. (You will also need to change req.file.location to req.file.filename
 * in the /upload route below).
 * 
 * const storage = multer.diskStorage({
 *   destination: (req, file, cb) => {
 *     cb(null, 'uploads/'); // Requires an 'uploads' folder to exist
 *   },
 *   filename: (req, file, cb) => {
 *     cb(null, Date.now() + '-' + file.originalname);
 *   }
 * });
 * const upload = multer({ storage: storage });
 */

// --- PUBLIC ROUTES ---
router.get('/', getListings);
router.get('/:id', getListingById);

// --- PROTECTED ADMIN ROUTES ---
// The following routes require a valid JWT (authMiddleware) AND the 'admin' role.
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

/**
 * @desc Upload a single property image
 * @returns {Object} JSON containing the public S3 URL (imageUrl)
 */
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  
  // S3 returns the public URL in `req.file.location`
  // If using local disk storage, you would construct the URL manually:
  // res.json({ imageUrl: `http://localhost:5001/uploads/${req.file.filename}` });
  res.json({ imageUrl: req.file.location });
});

router.post('/', createListing);
router.put('/:id', updateListing);
router.delete('/:id', deleteListing);

module.exports = router;
