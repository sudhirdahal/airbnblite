const User = require('../models/User'); 
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const crypto = require('crypto'); 
const { sendVerificationEmail, sendWelcomeEmail, sendResetPasswordEmail } = require('../services/emailService'); 

/**
 * Utility to generate signed JWTs.
 * Includes user ID, role, and the critical 'version' claim for security.
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, version: user.tokenVersion },
    process.env.JWT_SECRET || 'secret_key_123', 
    { expiresIn: '1d' }           
  );
};

/**
 * @desc Get current authenticated user profile
 * @route GET /api/auth/profile
 * @access Private
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error('getProfile Error:', err.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc Update user profile (Name, Email, Avatar)
 * @route PUT /api/auth/profile
 * @access Private
 */
exports.updateProfile = async (req, res) => {
  const { name, email, avatar } = req.body;
  try {
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name || user.name;
    user.email = email || user.email;
    user.avatar = avatar || user.avatar; // Phase 5: S3 Avatar support

    await user.save();
    res.json({ 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      avatar: user.avatar, 
      wishlist: user.wishlist 
    });
  } catch (err) {
    console.error('updateProfile Error:', err.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc Verify email token and activate account
 * @route GET /api/auth/verify/:token
 * @access Public
 */
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
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, wishlist: user.wishlist }
    });
  } catch (err) { res.status(500).send('Server Error'); }
};

/**
 * @desc Login user & issue session token
 * @route POST /api/auth/login
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid Credentials' });
    
    // Phase 2: Enforce email verification
    if (!user.isVerified) return res.status(401).json({ message: 'Please verify your email.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, wishlist: user.wishlist }
    });
  } catch (err) { res.status(500).send('Server Error'); }
};

/**
 * ============================================================================
 * SECURITY EVOLUTION: GLOBAL LOGOUT
 * ============================================================================
 */
exports.logoutAll = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    /**
     * Logic: By incrementing tokenVersion, we ensure that every token 
     * currently in the wild (on user's phone, laptop, etc.) becomes 
     * mathematically invalid during the next middleware check.
     */
    user.tokenVersion += 1; 
    await user.save();
    res.json({ message: 'Logged out from all devices.' });
  } catch (err) { res.status(500).send('Server Error'); }
};

/* --- HISTORICAL STAGE 1: SIMPLE LOGOUT (UNSAFE) ---
 * Early versions just cleared the token on the client side. This was unsafe 
 * because the token remained valid on the server until it expired.
 * 
 * exports.logout = (req, res) => {
 *   res.json({ msg: 'Logged out locally' });
 * };
 */

// ... (forgotPassword and resetPassword remain with JSDoc descriptions)
/**
 * @desc Generate password reset code
 */
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
    res.json({ message: 'Reset code sent.' });
  } catch (err) { res.status(500).send('Server Error'); }
};

/**
 * @desc Reset password using 6-digit code
 */
exports.resetPassword = async (req, res) => {
  const { email, token, newPassword } = req.body;
  try {
    const user = await User.findOne({ email, resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired code' });
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.tokenVersion += 1; // Security: Invalidate old sessions
    await user.save();
    res.json({ message: 'Password updated.' });
  } catch (err) { res.status(500).send('Server Error'); }
};

/**
 * @desc Register a new account
 * @route POST /api/auth/register
 */
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
    res.status(201).json({ message: 'Check email to verify your account.' });
  } catch (err) { res.status(500).send('Server Error'); }
};

/**
 * @desc Wishlist Management Logic
 * Includes defensive check for legacy null arrays.
 */
exports.toggleWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const listingId = req.params.id;
    if (!user.wishlist) user.wishlist = []; // Defensive fix
    const index = user.wishlist.indexOf(listingId);
    if (index === -1) user.wishlist.push(listingId);
    else user.wishlist.splice(index, 1);
    await user.save();
    res.json(user.wishlist);
  } catch (err) { res.status(500).send('Server Error'); }
};

exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('wishlist');
    res.json(user.wishlist || []);
  } catch (err) { res.status(500).send('Server Error'); }
};
