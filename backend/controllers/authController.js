const User = require('../models/User'); 
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const crypto = require('crypto'); 
const { 
  sendVerificationEmail, 
  sendWelcomeEmail, 
  sendResetPasswordEmail 
} = require('../services/emailService'); 

/**
 * Utility to generate JWT tokens.
 * Includes user ID, role, and token version for robust session management.
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,               
      role: user.role,             
      version: user.tokenVersion   
    },
    process.env.JWT_SECRET || 'secret_key_123', 
    { expiresIn: '1d' }           
  );
};

// @desc Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error('Error in getProfile:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc Update user profile
exports.updateProfile = async (req, res) => {
  const { name, email } = req.body;
  try {
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name || user.name;
    user.email = email || user.email;

    await user.save();
    // Return fresh user data including wishlist for frontend sync
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role, tokenVersion: user.tokenVersion, wishlist: user.wishlist });
  } catch (err) {
    console.error('Error in updateProfile:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc Verify email and enable auto-login
exports.verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user) return res.status(400).json({ message: 'Invalid or expired link.' });

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    sendWelcomeEmail(user.email, user.name);
    const token = generateToken(user);

    res.json({ 
      message: 'Email verified successfully!',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, tokenVersion: user.tokenVersion, wishlist: user.wishlist }
    });
  } catch (err) {
    console.error('Error in verifyEmail:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc Process login and issue token
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid Credentials' });
    if (!user.isVerified) return res.status(401).json({ message: 'Please verify your email before logging in.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, tokenVersion: user.tokenVersion, wishlist: user.wishlist }
    });
  } catch (err) {
    console.error('Error in login:', err.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc TOGGLE WISHLIST ITEM
 * Adds or removes a property ID from the user's saved list.
 * Includes defensive check for legacy accounts missing the wishlist array.
 */
exports.toggleWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const listingId = req.params.id;
    
    // Safety check: Ensure the array exists
    if (!user.wishlist) user.wishlist = [];

    // Find if listing is already in the list
    const index = user.wishlist.indexOf(listingId);
    if (index === -1) {
      user.wishlist.push(listingId); // ADD
    } else {
      user.wishlist.splice(index, 1); // REMOVE
    }
    
    await user.save();
    res.json(user.wishlist); // Return updated list of IDs
  } catch (err) {
    console.error('Error in toggleWishlist:', err.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc GET WISHLIST ITEMS
 * Retrieves the full property documents for all items in the user's wishlist.
 */
exports.getWishlist = async (req, res) => {
  try {
    // We 'populate' the wishlist to turn IDs into full Listing objects
    const user = await User.findById(req.user.id).populate('wishlist');
    res.json(user.wishlist || []);
  } catch (err) {
    console.error('Error in getWishlist:', err.message);
    res.status(500).send('Server Error');
  }
};

// ... (forgotPassword, resetPassword, logoutAll remain same with existing logic)
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();
    sendResetPasswordEmail(user.email, user.name, resetToken);
    res.json({ message: 'Reset code sent to your email.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.resetPassword = async (req, res) => {
  const { email, token, newPassword } = req.body;
  try {
    const user = await User.findOne({ email, resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset code' });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.tokenVersion += 1;
    await user.save();
    res.json({ message: 'Password updated. All sessions logged out.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });
    const verificationToken = crypto.randomBytes(20).toString('hex');
    user = new User({ name, email, password, role: role || 'registered', verificationToken });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    sendVerificationEmail(user.email, user.name, verificationToken);
    res.status(201).json({ message: 'Signup successful! Please check your email to verify your account.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.logoutAll = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.tokenVersion += 1;
    await user.save();
    res.json({ message: 'Logged out from all devices.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
