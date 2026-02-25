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
    // --- FIXED: Removed 'acl: public-read' because modern buckets disable ACLs ---
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, `listings/${Date.now().toString()}-${file.originalname}`);
    },
  }),
});

// Public routes
router.get('/', getListings);
router.get('/:id', getListingById);

// Protected Admin routes
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({ imageUrl: req.file.location });
});

router.post('/', createListing);
router.put('/:id', updateListing);
router.delete('/:id', deleteListing);

module.exports = router;
