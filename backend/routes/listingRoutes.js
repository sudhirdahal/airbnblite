const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/role');
const upload = require('../config/s3Config'); // Phase 5: S3 Streaming

/**
 * ============================================================================
 * LISTING ROUTES (The Discovery Controller)
 * ============================================================================
 * Manages the persistence and retrieval of property data.
 * It has evolved from a flat CRUD router to a secure management layer 
 * that validates ownership before allowing destructive actions.
 */

// --- PUBLIC ACCESS: THE DISCOVERY LAYER ---
router.get('/', listingController.getListings);
router.get('/:id', listingController.getListingById);

/**
 * MEDIA PIPELINE: Property Image Upload
 * Logic: Utilizes 'upload.single' to stream property photos to the cloud.
 * This ensures the server remains stateless and cloud-ready.
 */
router.post('/upload', auth, roleCheck('admin'), upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ msg: 'No image uploaded' });
  res.json({ imageUrl: req.file.location });
});

// --- PROTECTED ACCESS: HOST MANAGEMENT ---
// These routes require 'auth' AND the 'admin' role check.
router.post('/', auth, roleCheck('admin'), listingController.createListing);
router.put('/:id', auth, roleCheck('admin'), listingController.updateListing);
router.delete('/:id', auth, roleCheck('admin'), listingController.deleteListing);

/* --- HISTORICAL STAGE 1: LOCAL DISK UPLOADS ---
 * const multer = require('multer');
 * const storage = multer.diskStorage({ destination: 'uploads/' });
 * const upload = multer({ storage });
 * router.post('/upload', upload.single('image'), ...);
 * // Problem: Render/Vercel delete local files every 24 hours!
 */

module.exports = router;
