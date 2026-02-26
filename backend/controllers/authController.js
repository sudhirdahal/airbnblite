const User = require('../models/User'); 
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const crypto = require('crypto'); 
const { sendVerificationEmail, sendWelcomeEmail, sendResetPasswordEmail } = require('../services/emailService'); 

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, version: user.tokenVersion },
    process.env.JWT_SECRET || 'secret_key_123', 
    { expiresIn: '1d' }           
  );
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) { res.status(500).send('Server Error'); }
};

// @desc Update user profile (Including Avatar)
exports.updateProfile = async (req, res) => {
  const { name, email, avatar } = req.body; // --- UPDATED: avatar added ---
  try {
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name || user.name;
    user.email = email || user.email;
    user.avatar = avatar || user.avatar; // Save the S3 URL

    await user.save();
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, wishlist: user.wishlist });
  } catch (err) { res.status(500).send('Server Error'); }
};

// ... (Other controllers remain unchanged)
exports.verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user) return res.status(400).json({ message: 'Invalid or expired link.' });
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = generateToken(user);
    res.json({ message: 'Email verified successfully!', token, user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, wishlist: user.wishlist } });
  } catch (err) { res.status(500).send('Server Error'); }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid Credentials' });
    if (!user.isVerified) return res.status(401).json({ message: 'Verify email first.' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });
    const token = generateToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, wishlist: user.wishlist } });
  } catch (err) { res.status(500).send('Server Error'); }
};

exports.toggleWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const listingId = req.params.id;
    if (!user.wishlist) user.wishlist = [];
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
  } catch (err) { res.status(500).send('Server Error'); }
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
    res.status(201).json({ message: 'Check email to verify your account.' });
  } catch (err) { res.status(500).send('Server Error'); }
};

exports.logoutAll = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.tokenVersion += 1;
    await user.save();
    res.json({ message: 'Logged out from all devices.' });
  } catch (err) { res.status(500).send('Server Error'); }
};
