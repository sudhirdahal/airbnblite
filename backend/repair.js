const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Listing = require('./models/Listing');

dotenv.config();

/**
 * ============================================================================
 * 🛠️ DATA REPAIR UTILITY (The Schema Evolution Engine)
 * ============================================================================
 * 
 * MASTERCLASS NOTES:
 * In a production SaaS, the database schema is rarely static. As the product 
 * grows (e.g., adding a 'Guest Count' filter in Phase 10), legacy data 
 * created in earlier phases becomes "incomplete."
 * 
 * This script demonstrates the 'Data Integrity Patch' pattern. Instead of 
 * deleting old data, we run an administrative script to 'backfill' missing 
 * fields with sensible defaults.
 */

const repairData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Repair Engine: Connected to MongoDB Atlas.');

    /* ============================================================================
     * 👻 HISTORICAL GHOST: THE 'NULL' DISASTER
     * ============================================================================
     * Initially, we tried to fix this in the frontend:
     * const guests = listing.maxGuests || 2; 
     * 
     * THE FLAW: While the UI looked okay, the SEARCH ENGINE failed. 
     * When we queried { maxGuests: { $gte: 2 } }, MongoDB skipped every 
     * document that didn't have the field at all. 
     * THE FIX: A server-side backfill to ensure every document is searchable.
     * ============================================================================ */

    // 1. QUERY: Identify every listing that is missing capacity metadata
    const filter = { 
      $or: [
        { maxGuests: { $exists: false } },
        { maxGuests: null },
        { bedrooms: { $exists: false } },
        { beds: { $exists: false } }
      ]
    };

    // 2. ATOMIC UPDATE: Apply the baseline Phase 27 standards
    const update = {
      $set: { 
        maxGuests: 2, 
        bedrooms: 1, 
        beds: 1 
      }
    };

    const result = await Listing.updateMany(filter, update);
    
    console.log(`Repair Engine: Successfully patched ${result.modifiedCount} legacy properties.`);
    console.log(`Repair Engine: Database Integrity Restored.`);

    process.exit(0);
  } catch (err) {
    console.error('Repair Engine Critical Failure:', err);
    process.exit(1);
  }
};

repairData();
