const User = require('../models/User'); 
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const crypto = require('crypto'); 
const { sendVerificationEmail, sendWelcomeEmail, sendResetPasswordEmail } = require('../services/emailService'); 

/**
 * ============================================================================
 * 🔐 AUTH CONTROLLER (The Identity Authority)
 * ============================================================================
 * 
 * MASTERCLASS NOTES:
 * The Auth Controller is the vault. It manages the entire lifecycle of a user's 
 * identity, from provisioning (registration) to revocation (logout).
 * 
 * Architectural Evolution:
 * - Phase 1: Basic JWT issuance. (Stateless, but dangerous because tokens couldn't be killed).
 * - Phase 2: Email verification enforced. (Preventing bot/spam accounts).
 * - Phase 5: The "Token Versioning" Pivot. (Enabling Global Session Revocation).
 */

/**
 * UTILITY: generateToken
 * 
 * Logic: Includes the 'version' claim. This is the heart of our 
 * stateless session revocation engine. By injecting `user.tokenVersion` 
 * into the payload, we tie the stateless JWT to a stateful database flag.
 */
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'secret_key_123';
  return jwt.sign(
    { id: user._id, role: user.role, version: user.tokenVersion },
    secret, 
    { expiresIn: '7d' } // High-fidelity session length (7 days)
  );
};

/* ============================================================================
 * 👻 HISTORICAL GHOST: PHASE 1 (The Immortal Session)
 * ============================================================================
 * In Phase 1, our logout function simply told the frontend to delete the token.
 * 
 * exports.logoutLegacy = (req, res) => {
 *   // The token was deleted from the browser, but the string itself 
 *   // remained valid mathematically until its expiration date!
 *   res.json({ msg: 'Logged out locally' }); 
 * };
 * 
 * THE FLAW: If an attacker copied the token from LocalStorage, they could 
 * use it forever (or until expiration), even if the user clicked "Logout".
 * ============================================================================ */

/**
 * @desc Revoke all active sessions globally
 * @route POST /api/auth/logout-all
 * 
 * SECURITY PIVOT (Phase 5):
 * By incrementing 'tokenVersion' in the database, we instantly turn every 
 * existing token currently in the wild into a "Ghost Token". When those old 
 * tokens attempt to authenticate, our middleware will see `Token.version (1) !== DB.version (2)` 
 * and reject the request. This is True Global Logout.
 */
exports.logoutAll = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.tokenVersion += 1; // The Nuclear Switch
    await user.save();
    res.json({ message: 'Global session revocation successful.' });
  } catch (err) { res.status(500).send('Revocation Failure'); }
};

/**
 * @desc Authenticate user & issue versioned token
 * @route POST /api/auth/login
 * 
 * Logic:
 * 1. Existence Check: Do they exist?
 * 2. Trust Check: Did they verify their email?
 * 3. Cryptographic Check: Does the bcrypt hash match?
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    // Defensive UX: We return "Invalid Identity" instead of "User not found" 
    // to prevent attackers from guessing which emails are registered.
    if (!user) return res.status(400).json({ message: 'Invalid Identity' });
    
    // Phase 2: Trust verification pivot
    if (!user.isVerified) {
      return res.status(401).json({ message: 'Identity not verified. Please check email.' });
    }

    // Hash comparison prevents plain-text storage vulnerabilities
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Identity' });

    const token = generateToken(user);
    
    // We never send the password hash back to the client!
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, wishlist: user.wishlist }
    });
  } catch (err) { res.status(500).send('Authentication Handshake Failure'); }
};

/**
 * @desc Provision a new identity
 * @route POST /api/auth/register
 */
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'Identity already claimed' });
    
    // Generate a secure, random hex string for the email link
    const verificationToken = crypto.randomBytes(20).toString('hex');
    user = new User({ name, email, password, role: role || 'registered', verificationToken });
    
    // Cryptography: Salting and Hashing
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    
    // Dispatch asynchronous email (does not block the HTTP response)
    sendVerificationEmail(user.email, user.name, verificationToken);
    res.status(201).json({ message: 'Trust Handshake initiated. Check email.' });
  } catch (err) { res.status(500).send('Identity Provisioning Failure'); }
};

/**
 * @desc Verify and activate identity via email link
 * @route GET /api/auth/verify/:token
 */
exports.verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token.' });

    // Flip the trust flag and destroy the single-use token
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    sendWelcomeEmail(user.email, user.name);
    const token = generateToken(user); // Auto-login upon verification

    res.json({ 
      message: 'Account activated.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, wishlist: user.wishlist }
    });
  } catch (err) { res.status(500).send('Verification Sync Failure'); }
};

/**
 * @desc Fetch the current logged-in profile data
 * @route GET /api/auth/profile
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) { res.status(500).send('Server Error'); }
};

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
    
    // Generate a 6-digit numeric code for easy mobile entry
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // Strict 1-hour Time-To-Live (TTL)
    await user.save();
    
    sendResetPasswordEmail(user.email, user.name, resetToken);
    res.json({ message: 'Security code dispatched.' });
  } catch (err) { res.status(500).send('Dispatch Failure'); }
};

exports.resetPassword = async (req, res) => {
  const { email, token, newPassword } = req.body;
  try {
    // 1. Verify existence, token match, AND that the token hasn't expired ($gt)
    const user = await User.findOne({ 
      email, 
      resetPasswordToken: token, 
      resetPasswordExpires: { $gt: Date.now() } 
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired code.' });
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // 2. Clean up tokens to prevent reuse
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    // 3. NUCLEAR SECURITY: Revoke all existing sessions immediately
    user.tokenVersion += 1; 
    
    await user.save();
    res.json({ message: 'Identity secured with new password.' });
  } catch (err) { res.status(500).send('Sync Failure'); }
};

/**
 * @desc Fetch public metadata for a specific user
 * @route GET /api/auth/profile/:id
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name avatar');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { res.status(500).send('Discovery Failure'); }
};

exports.toggleWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.wishlist) user.wishlist = []; // Defensive array initialization
    const index = user.wishlist.indexOf(req.params.id);
    
    if (index === -1) user.wishlist.push(req.params.id);
    else user.wishlist.splice(index, 1);
    
    await user.save();
    res.json(user.wishlist);
  } catch (err) { res.status(500).send('Wishlist Sync Failure'); }
};

exports.getWishlist = async (req, res) => {
  try {
    // Mongoose populate converts the array of IDs into an array of full Listing objects
    const user = await User.findById(req.user.id).populate('wishlist');
    res.json(user.wishlist || []);
  } catch (err) { res.status(500).send('Collection Retrieval Failure'); }
};
