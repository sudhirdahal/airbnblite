const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const dotenv = require('dotenv');

dotenv.config();

/**
 * ============================================================================
 * S3 CONFIGURATION (The Distributed Media Layer)
 * ============================================================================
 * This module orchestrates the connection to Amazon Web Services (AWS).
 * It enables the application to remain 'Stateless', meaning the server can 
 * be destroyed and rebuilt without losing user avatars or property photos.
 * 
 * Logic: Bypasses the local filesystem entirely and streams multi-part 
 * form data directly to the S3 bucket.
 */

// --- AWS CLIENT AUTHENTICATION ---
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

/* --- HISTORICAL STAGE 1: LOCAL DISK STORAGE ---
 * const storage = multer.diskStorage({
 *   destination: function (req, file, cb) { cb(null, 'uploads/') },
 *   filename: function (req, file, cb) { cb(null, Date.now() + file.originalname) }
 * });
 * const upload = multer({ storage: storage });
 * // Problem: Render/Vercel wipe the 'uploads/' folder on every deploy!
 */

/**
 * PRODUCTION PIPELINE: Direct-to-Cloud Stream
 * Logic: Generates unique keys based on timestamps to prevent name collisions.
 */
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      // Dynamic pathing for organized bucket structure
      cb(null, `uploads/${Date.now()}-${file.originalname}`);
    }
  })
});

module.exports = upload;
