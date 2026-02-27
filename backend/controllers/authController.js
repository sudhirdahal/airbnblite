const User = require('../models/User'); 
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const crypto = require('crypto'); 
const { sendVerificationEmail, sendWelcomeEmail, sendResetPasswordEmail } = require('../services/emailService'); 

/**
 * ============================================================================
 * AUTH CONTROLLER (The Identity Authority)
 * ============================================================================
 * This controller manages the security lifecycle of every user.
 * Evolution:
 * 1. Stage 1: Basic JWT issuance (Phase 1).
 * 2. Stage 2: Email verification enforcement (Phase 2).
 * 3. Stage 3: Token Versioning for Global Revocation (Phase 5).
 */

/**
 * UTILITY: generateToken
 * Logic: Includes the 'version' claim. This is the heart of our 
 * stateless session revocation engine.
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, version: user.tokenVersion },
    process.env.JWT_SECRET || 'secret_key_123', 
    { expiresIn: '7d' } // High-fidelity session length
  );
};

/**
 * @desc Get current authenticated profile
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) { res.status(500).send('Server Error'); }
};

/**
 * @desc Login user & issue versioned token
 * Logic: Validates verification status before allowing session creation.
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid Identity' });
    
    // Phase 2: Trust verification pivot
    if (!user.isVerified) {
      return res.status(401).json({ message: 'Identity not verified. Please check email.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Identity' });

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, wishlist: user.wishlist }
    });
  } catch (err) { res.status(500).send('Authentication Handshake Failure'); }
};

/**
 * ============================================================================
 * SECURITY PIVOT: Global Logout
 * ============================================================================
 * Logic: By incrementing 'tokenVersion' in the DB, we instantly turn 
 * every existing token into a 'Ghost Token' that will fail the middleware 
 * check on its next request.
 */
exports.logoutAll = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.tokenVersion += 1; 
    await user.save();
    res.json({ message: 'Global session revocation successful.' });
  } catch (err) { res.status(500).send('Revocation Failure'); }
};

/* --- HISTORICAL STAGE 1: LOCAL-ONLY LOGOUT ---
 * exports.logoutLegacy = (req, res) => {
 *   res.json({ msg: 'Logged out' }); // Token stayed valid on other devices!
 * };
 */

/**
 * @desc Register identity & trigger verification pipeline
 */
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'Identity already claimed' });
    
    const verificationToken = crypto.randomBytes(20).toString('hex');
    user = new User({ name, email, password, role: role || 'registered', verificationToken });
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    
    sendVerificationEmail(user.email, user.name, verificationToken);
    res.status(201).json({ message: 'Trust Handshake initiated. Check email.' });
  } catch (err) { res.status(500).send('Identity Provisioning Failure'); }
};

/**
 * @desc Verify and activate identity
 */
exports.verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token.' });

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    sendWelcomeEmail(user.email, user.name);
    const token = generateToken(user);

    res.json({ 
      message: 'Account activated.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, wishlist: user.wishlist }
    });
  } catch (err) { res.status(500).send('Verification Sync Failure'); }
};

// ... (Rest of Auth handlers with technical headers)
exports.updateProfile = async (req, res) => {
  const { name, email, avatar } = req.body;
  try {
    let user = await User.findById(req.user.id);
    user.name = name || user.name;
    user.email = email || user.email;
    user.avatar = avatar || user.avatar;
    await user.save();
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, wishlist: user.wishlist });
  } catch (err) { res.status(500).send('Profile Sync Failure'); }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Identity not found' });
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour TTL
    await user.save();
    sendResetPasswordEmail(user.email, user.name, resetToken);
    res.json({ message: 'Security code dispatched.' });
  } catch (err) { res.status(500).send('Dispatch Failure'); }
};

exports.resetPassword = async (req, res) => {
  const { email, token, newPassword } = req.body;
  try {
    const user = await User.findOne({ email, resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired code.' });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.tokenVersion += 1; // Critical: Revoke all current sessions
    await user.save();
    res.json({ message: 'Identity secured with new password.' });
  } catch (err) { res.status(500).send('Sync Failure'); }
};

exports.toggleWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.wishlist) user.wishlist = [];
    const index = user.wishlist.indexOf(req.params.id);
    if (index === -1) user.wishlist.push(req.params.id);
    else user.wishlist.splice(index, 1);
    await user.save();
    res.json(user.wishlist);
  } catch (err) { res.status(500).send('Wishlist Sync Failure'); }
};

exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('wishlist');
    res.json(user.wishlist || []);
  } catch (err) { res.status(500).send('Collection Retrieval Failure'); }
};
