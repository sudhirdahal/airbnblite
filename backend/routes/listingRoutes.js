const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/role');
const upload = require('../config/s3Config');

/**
 * ============================================================================
 * LISTING ROUTES (The Discovery Controller)
 * ============================================================================
 */

// --- PUBLIC ACCESS: THE DISCOVERY LAYER ---
router.get('/', listingController.getListings);
router.get('/metadata', listingController.getDiscoveryMetadata); // --- NEW ---
router.get('/:id', listingController.getListingById);

router.post('/upload', auth, roleCheck('admin'), upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ msg: 'No image uploaded' });
  res.json({ imageUrl: req.file.location });
});

// --- PROTECTED ACCESS: HOST MANAGEMENT ---
router.post('/', auth, roleCheck('admin'), listingController.createListing);
router.put('/:id', auth, roleCheck('admin'), listingController.updateListing);
router.delete('/:id', auth, roleCheck('admin'), listingController.deleteListing);

module.exports = router;
