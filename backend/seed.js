const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const Listing = require('./models/Listing');
const User = require('./models/User');

dotenv.config();

/**
 * ============================================================================
 * SEED ENGINE (The Data Hydration Tool)
 * ============================================================================
 * This script is designed to establish a 'Golden State' for development.
 * It clears existing records and injects a set of high-fidelity 
 * properties and accounts to ensure the UI looks professional on first boot.
 * 
 * Strategy: Preserves a 'Master Admin' account for developer access.
 */

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Seed Engine: Connected to MongoDB.');

    // 1. DATA PURGE: Start from a clean slate
    await Listing.deleteMany();
    await User.deleteMany();
    console.log('Seed Engine: Database Purge Complete.');

    // 2. IDENTITY PROVISIONING: Create the Master Admin (Host)
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    
    const adminUser = new User({
      name: 'Professional Host',
      email: 'admin@test.com',
      password: adminPassword,
      role: 'admin',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?fit=crop&w=150&h=150'
    });
    const savedAdmin = await adminUser.save();
    console.log('Seed Engine: Master Identity Created.');

    // 3. PROPERTY HYDRATION: Inject High-Fidelity Listings
    const listings = [
      {
        title: 'Glass Penthouse Overlook',
        description: 'Luxury high-rise with floor-to-ceiling glass and private pool.',
        fullDescription: 'Experience the pinnacle of urban luxury. This 4,000 sq ft penthouse features a private heated pool overlooking the skyline, integrated smart home technology, and a chef\'s kitchen.',
        location: 'Manhattan, New York',
        rate: 850,
        category: 'pools',
        images: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
          'https://images.unsplash.com/photo-1484154218962-a197022b5858'
        ],
        amenities: ['WiFi', 'Kitchen', 'Pool', 'AC', 'Security'],
        coordinates: { lat: 40.7580, lng: -73.9855 },
        maxGuests: 6,
        bedrooms: 3,
        beds: 4,
        adminId: savedAdmin._id
      },
      {
        title: 'Secluded Arctic Cabin',
        description: 'Glass-roofed sanctuary under the Northern Lights.',
        fullDescription: 'A masterpiece of architectural isolation. Sleep under the Aurora Borealis in our custom glass-domed cabin. Fully climate-controlled with traditional sauna and direct access to husky sledding.',
        location: 'Tromsø, Norway',
        rate: 420,
        category: 'arctic',
        images: [
          'https://images.unsplash.com/photo-1516466723877-e4ec1d736c8a',
          'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1'
        ],
        amenities: ['WiFi', 'AC', 'Parking', 'Gym'],
        coordinates: { lat: 69.6492, lng: 18.9553 },
        maxGuests: 2,
        bedrooms: 1,
        beds: 1,
        adminId: savedAdmin._id
      }
    ];

    await Listing.insertMany(listings);
    console.log('Seed Engine: Property Hydration Complete.');

    process.exit();
  } catch (err) {
    console.error('Seed Engine Failure:', err);
    process.exit(1);
  }
};

/* --- HISTORICAL STAGE 1: PRIMITIVE SEED ---
 * const seed = async () => {
 *   const l = new Listing({ title: 'House', price: 100 });
 *   await l.save();
 * };
 * // Problem: No accounts were created, and data was low-res.
 */

seedData();
