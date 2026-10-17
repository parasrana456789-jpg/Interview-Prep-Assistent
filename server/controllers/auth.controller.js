const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Profile = require('../models/Profile');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendMail } = require('../utils/mailer');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sign = (u) => jwt.sign({ id: u._id, tv: u.tokenVersion }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });
const clientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();

function checkPassword(pw) {
  if (typeof pw !== 'string' || pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw))
    throw new ApiError(400, 'Password must be at least 8 characters and include a letter and a number');
}

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name?.trim()) throw new ApiError(400, 'Name is required');
  if (!EMAIL_RE.test(email || '')) throw new ApiError(400, 'Enter a valid email address');
  checkPassword(password);

  if (await User.findOne({ email: email.toLowerCase() })) throw new ApiError(409, 'An account with this email already exists');

  const isAdmin = process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
  const user = await User.create({ name: name.trim(), email, password, role: isAdmin ? 'admin' : 'user', lastLoginAt: new Date() });
  await Profile.create({ user: user._id, fullName: user.name });
  res.status(201).json({ token: sign(user), user: publicUser(user) });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) throw new ApiError(401, 'Incorrect email or password');
  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated');
  user.lastLoginAt = new Date();
  await user.save();
  res.json({ token: sign(user), user: publicUser(user) });
});

exports.me = (req, res) => res.json({ user: publicUser(req.user) });

// Invalidates every token issued so far for this user.
exports.logout = asyncHandler(async (req, res) => {
  req.user.tokenVersion += 1;
  await req.user.save();
  res.json({ message: 'Logged out' });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const generic = { message: 'If an account exists for that email, a reset link has been sent.' };
  const user = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (!user) return res.json(generic);

  const raw = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(raw).digest('hex');
  user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();

  const link = `${clientUrl()}/reset-password/${raw}`;
  const sent = await sendMail({
    to: user.email,
    subject: 'Reset your password',
    html: `<p>Hi ${user.name},</p><p>Use the link below to choose a new password. It expires in 30 minutes.</p><p><a href="${link}">${link}</a></p><p>If you did not request this, you can ignore this email.</p>`,
  }).catch((e) => {
    console.error('Mail error', e.message);
    return false;
  });

  if (!sent && process.env.NODE_ENV !== 'production') {
    console.log(`[dev] Password reset link for ${user.email}: ${link}`);
    return res.json({ ...generic, devResetLink: link });
  }
  res.json(generic);
});

exports.resetPassword = asyncHandler(async (req, res) => {
  checkPassword(req.body.password);
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ resetPasswordToken: hashed, resetPasswordExpires: { $gt: new Date() } }).select('+resetPasswordToken +resetPasswordExpires');
  if (!user) throw new ApiError(400, 'This reset link is invalid or has expired');

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.tokenVersion += 1;
  await user.save();
  res.json({ message: 'Password updated. You can log in now.' });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword || ''))) throw new ApiError(400, 'Current password is incorrect');
  checkPassword(newPassword);
  user.password = newPassword;
  user.tokenVersion += 1;
  await user.save();
  res.json({ token: sign(user), message: 'Password changed' });
});
