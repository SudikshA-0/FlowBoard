const jwt = require('jsonwebtoken');
const User = require('../models/User');

/** Generate a signed JWT for a user */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/** Helper to send token + user in response */
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user,
  });
};

// ── POST /api/auth/signup ──────────────────────────────────────────────────
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const normalizedName = name?.trim();
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password.' });
    }

    // Check duplicate email
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use.' });
    }

    const user = await User.create({ name: normalizedName, email: normalizedEmail, password });
    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/login ───────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    // Explicitly select password (it is select:false in schema)
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/auth/me ───────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};
