const bcrypt = require('bcryptjs');
const { z } = require('zod');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  email: z.string().trim().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});
const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1) });
const profileSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  masteryThreshold: z.number().int().min(1).max(100).optional(),
});

const publicUser = (u) => ({
  id: u._id, name: u.name, email: u.email, role: u.role, masteryThreshold: u.masteryThreshold, createdAt: u.createdAt,
});

const register = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  if (await User.findOne({ email })) throw new HttpError(409, 'An account with this email already exists');
  const password = await bcrypt.hash(req.body.password, 10);
  // Role is never taken from the request: public sign-ups are always students.
  const user = await User.create({ name: req.body.name, email, password, role: 'student' });
  res.status(201).json({ token: generateToken(user._id), user: publicUser(user) });
});

const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() });
  const ok = user && (await bcrypt.compare(req.body.password, user.password));
  if (!ok) throw new HttpError(401, 'Invalid email or password');
  res.json({ token: generateToken(user._id), user: publicUser(user) });
});

const me = asyncHandler(async (req, res) => res.json({ user: publicUser(req.user) }));

const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, { $set: req.body }, { returnDocument: 'after' }).lean();
  res.json({ user: publicUser(user) });
});

module.exports = { register, login, me, updateMe, registerSchema, loginSchema, profileSchema };
