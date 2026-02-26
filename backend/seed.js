const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Listing = require('./models/Listing');
const bcrypt = require('bcryptjs');

dotenv.config();

/**
 * Seeding Script: Populates the DB with high-fidelity listings.
 * UPDATED: Now includes maxGuests, bedrooms, and beds for advanced filtering support.
 */
const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data to prevent duplicates
    await User.deleteMany();
    await Listing.deleteMany();

    // Create a master admin account
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      isVerified: true
    });

    const listings = [
      {
        title: 'Cozy Cottage in the Woods',
        location: 'Aspen, Colorado',
        coordinates: { lat: 39.1911, lng: -106.8175 },
        category: 'cabins',
        description: 'A peaceful retreat surrounded by nature.',
        fullDescription: 'Experience the ultimate mountain getaway in this charming cedar cottage...',
        rate: 150,
        maxGuests: 4,
        bedrooms: 2,
        beds: 3,
        rating: 4.9,
        reviewsCount: 128,
        images: [
          'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1449156001437-3a1f93977c71?auto=format&fit=crop&w=1200&q=80'
        ],
        host: { name: 'Alex Johnson', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80' },
        amenities: ['Fireplace', 'WiFi', 'Kitchen'],
        adminId: admin._id
      },
      {
        title: 'Luxury Villa by the Beach',
        location: 'Malibu, California',
        coordinates: { lat: 34.0259, lng: -118.7798 },
        category: 'pools',
        description: 'Relax and enjoy the sound of the ocean.',
        fullDescription: 'Paradise awaits at this stunning beachfront villa...',
        rate: 550,
        maxGuests: 10,
        bedrooms: 5,
        beds: 6,
        rating: 5.0,
        reviewsCount: 42,
        images: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80'
        ],
        host: { name: 'Michael Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
        amenities: ['Infinity Pool', 'Beach Access'],
        adminId: admin._id
      },
      {
        title: 'Modern Apartment in the City',
        location: 'New York, New York',
        coordinates: { lat: 40.7128, lng: -74.0060 },
        category: 'iconic',
        description: 'Stylish and convenient living in Manhattan.',
        fullDescription: 'This sleek loft is located in the vibrant heart of Manhattan...',
        rate: 220,
        maxGuests: 2,
        bedrooms: 1,
        beds: 1,
        rating: 4.8,
        reviewsCount: 95,
        images: [
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'
        ],
        host: { name: 'Sarah Lee', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
        amenities: ['City View', 'Gym Access'],
        adminId: admin._id
      }
    ];

    await Listing.insertMany(listings);
    console.log('Seeding complete with capacity metadata!');
    mongoose.connection.close();
  } catch (err) {
    console.error('Error seeding:', err);
    process.exit(1);
  }
};

seedData();
