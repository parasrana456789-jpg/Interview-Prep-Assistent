const User = require('../models/User');
const Profile = require('../models/Profile');
const Resume = require('../models/Resume');
const AptitudeResult = require('../models/AptitudeResult');
const CodingResult = require('../models/CodingResult');
const InterviewResult = require('../models/InterviewResult');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const daysAgo = (n) => new Date(Date.now() - n * 86400000);
const perDay = (Model, since, field = 'createdAt') =>
  Model.aggregate([{ $match: { [field]: { $gte: since } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: `$${field}` } }, n: { $sum: 1 } } }]);

exports.overview = asyncHandler(async (req, res) => {
  const since = daysAgo(13);
  since.setHours(0, 0, 0, 0);
  const [users, active7, new7, admins, apt, cod, itv, resumes, aptAvg, codAvg, itvAvg, sUsers, sApt, sCod, sItv] = await Promise.all([
    User.countDocuments(), User.countDocuments({ lastLoginAt: { $gte: daysAgo(7) } }), User.countDocuments({ createdAt: { $gte: daysAgo(7) } }),
    User.countDocuments({ role: 'admin' }),
    AptitudeResult.countDocuments(), CodingResult.countDocuments(), InterviewResult.countDocuments(), Resume.countDocuments(),
    AptitudeResult.aggregate([{ $group: { _id: null, a: { $avg: '$score' } } }]),
    CodingResult.aggregate([{ $group: { _id: null, a: { $avg: '$score' } } }]),
    InterviewResult.aggregate([{ $group: { _id: null, a: { $avg: '$overallScore' } } }]),
    perDay(User, since), perDay(AptitudeResult, since), perDay(CodingResult, since), perDay(InterviewResult, since),
  ]);

  const map = (rows) => Object.fromEntries(rows.map((r) => [r._id, r.n]));
  const [mU, mA, mC, mI] = [map(sUsers), map(sApt), map(sCod), map(sItv)];
  const daily = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(since.getTime() + i * 86400000).toISOString().slice(0, 10);
    return { date, signups: mU[date] || 0, aptitude: mA[date] || 0, coding: mC[date] || 0, interview: mI[date] || 0 };
  });

  res.json({
    totals: { users, activeUsers7d: active7, newUsers7d: new7, admins, aptitude: apt, coding: cod, interview: itv, resumes, tests: apt + cod + itv },
    averages: { aptitude: Math.round(aptAvg[0]?.a || 0), coding: Math.round(codAvg[0]?.a || 0), interview: Math.round(itvAvg[0]?.a || 0) },
    daily,
  });
});

exports.users = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const filter = {};
  if (req.query.q) filter.$or = [{ name: new RegExp(esc(req.query.q), 'i') }, { email: new RegExp(esc(req.query.q), 'i') }];
  const [users, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit).select('name email role isActive createdAt lastLoginAt').lean(),
    User.countDocuments(filter),
  ]);
  const ids = users.map((u) => u._id);
  const count = (M) => M.aggregate([{ $match: { user: { $in: ids } } }, { $group: { _id: '$user', n: { $sum: 1 } } }]);
  const [a, c, i] = await Promise.all([count(AptitudeResult), count(CodingResult), count(InterviewResult)]);
  const tally = {};
  [a, c, i].forEach((rows) => rows.forEach((r) => { tally[r._id] = (tally[r._id] || 0) + r.n; }));
  res.json({ users: users.map((u) => ({ ...u, tests: tally[u._id] || 0 })), total, page, pages: Math.ceil(total / limit) });
});

exports.updateUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) throw new ApiError(400, 'You cannot change your own role or status');
  const update = {};
  if (['user', 'admin'].includes(req.body.role)) update.role = req.body.role;
  if (typeof req.body.isActive === 'boolean') { update.isActive = req.body.isActive; if (!req.body.isActive) update.$inc = { tokenVersion: 1 }; }
  const { $inc, ...set } = update;
  const user = await User.findByIdAndUpdate(req.params.id, { $set: set, ...($inc ? { $inc } : {}) }, { new: true }).select('name email role isActive');
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ user });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) throw new ApiError(400, 'You cannot delete your own account here');
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  const by = { user: user._id };
  await Promise.all([Profile.deleteOne(by), Resume.deleteOne(by), AptitudeResult.deleteMany(by), CodingResult.deleteMany(by), InterviewResult.deleteMany(by)]);
  res.json({ message: 'User and all related data deleted' });
});

exports.reports = asyncHandler(async (req, res) => {
  const topUsers = async (M) => M.aggregate([{ $group: { _id: '$user', n: { $sum: 1 } } }]);
  const [a, c, i, weak, langs, itvTypes] = await Promise.all([
    topUsers(AptitudeResult), topUsers(CodingResult), topUsers(InterviewResult),
    AptitudeResult.aggregate([
      { $unwind: '$topicBreakdown' },
      { $group: { _id: '$topicBreakdown.topic', total: { $sum: '$topicBreakdown.total' }, correct: { $sum: '$topicBreakdown.correct' } } },
      { $project: { topic: '$_id', _id: 0, accuracy: { $round: [{ $multiply: [{ $divide: ['$correct', '$total'] }, 100] }, 0] }, total: 1 } },
      { $sort: { accuracy: 1 } }, { $limit: 8 },
    ]),
    CodingResult.aggregate([{ $group: { _id: '$language', attempts: { $sum: 1 }, avgScore: { $avg: '$score' } } }, { $sort: { attempts: -1 } }]),
    InterviewResult.aggregate([{ $group: { _id: '$type', attempts: { $sum: 1 }, avgScore: { $avg: '$overallScore' } } }]),
  ]);
  const tally = {};
  [a, c, i].forEach((rows) => rows.forEach((r) => { tally[r._id] = (tally[r._id] || 0) + r.n; }));
  const top = Object.entries(tally).sort((x, y) => y[1] - x[1]).slice(0, 10);
  const owners = await User.find({ _id: { $in: top.map(([id]) => id) } }).select('name email').lean();
  const byId = Object.fromEntries(owners.map((u) => [String(u._id), u]));
  res.json({
    mostActive: top.map(([id, tests]) => ({ name: byId[id]?.name || 'Deleted user', email: byId[id]?.email || '', tests })),
    weakestTopics: weak,
    languages: langs.map((l) => ({ language: l._id, attempts: l.attempts, avgScore: Math.round(l.avgScore || 0) })),
    interviewTypes: itvTypes.map((t) => ({ type: t._id, attempts: t.attempts, avgScore: Math.round(t.avgScore || 0) })),
  });
});
