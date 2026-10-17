const Profile = require('../models/Profile');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const FIELDS = [
  ['avatar', 'Profile photo'], ['fullName', 'Full name'], ['phone', 'Phone number'], ['dob', 'Date of birth'],
  ['gender', 'Gender'], ['college', 'College'], ['degree', 'Degree'], ['branch', 'Branch'], ['semester', 'Semester'],
  ['skills', 'Skills'], ['linkedin', 'LinkedIn'], ['github', 'GitHub'], ['portfolio', 'Portfolio'], ['careerGoal', 'Career goal'],
];

function completion(profile) {
  const missing = FIELDS.filter(([key]) => {
    const v = profile[key];
    return Array.isArray(v) ? v.length === 0 : !v;
  }).map(([, label]) => label);
  // email always exists, so it counts as completed
  const total = FIELDS.length + 1;
  const done = total - missing.length;
  return { percent: Math.round((done / total) * 100), missing };
}
exports.completion = completion;

const shape = (profile, user) => ({ ...profile.toObject(), email: user.email, completion: completion(profile) });

exports.getProfile = asyncHandler(async (req, res) => {
  const profile = await Profile.findOneAndUpdate(
    { user: req.user._id },
    { $setOnInsert: { fullName: req.user.name } },
    { upsert: true, new: true }
  );
  res.json({ profile: shape(profile, req.user) });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const b = req.body;
  const update = {};
  for (const k of ['fullName', 'phone', 'gender', 'college', 'degree', 'branch', 'linkedin', 'github', 'portfolio', 'careerGoal']) {
    if (b[k] !== undefined) update[k] = String(b[k]).trim();
  }
  if (b.dob !== undefined) update.dob = b.dob ? new Date(b.dob) : null;
  if (b.semester !== undefined) update.semester = b.semester === '' || b.semester === null ? null : Number(b.semester);
  if (b.skills !== undefined) {
    const arr = Array.isArray(b.skills) ? b.skills : String(b.skills).split(',');
    update.skills = [...new Set(arr.map((s) => String(s).trim()).filter(Boolean))].slice(0, 40);
  }
  if (update.fullName === '') throw new ApiError(400, 'Full name cannot be empty');
  for (const k of ['linkedin', 'github', 'portfolio']) {
    if (update[k] && !/^https?:\/\//i.test(update[k])) throw new ApiError(400, `${k} must start with http:// or https://`);
  }
  if (update.phone && !/^[+\d][\d\s-]{6,18}$/.test(update.phone)) throw new ApiError(400, 'Enter a valid phone number');

  const profile = await Profile.findOneAndUpdate({ user: req.user._id }, { $set: update }, { upsert: true, new: true, runValidators: true });
  if (update.fullName) await User.updateOne({ _id: req.user._id }, { name: update.fullName });
  res.json({ profile: shape(profile, { email: req.user.email }) });
});

exports.uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Choose an image to upload');
  const avatar = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  const profile = await Profile.findOneAndUpdate({ user: req.user._id }, { $set: { avatar } }, { upsert: true, new: true });
  res.json({ profile: shape(profile, req.user) });
});

exports.removeAvatar = asyncHandler(async (req, res) => {
  const profile = await Profile.findOneAndUpdate({ user: req.user._id }, { $set: { avatar: '' } }, { new: true });
  res.json({ profile: shape(profile, req.user) });
});
