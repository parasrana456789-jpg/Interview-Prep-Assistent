const Question = require('../models/Question');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.list = asyncHandler(async (req, res) => {
  const { category, difficulty, q } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const filter = {};
  if (Question.CATEGORIES.includes(category)) filter.category = category;
  if (['Easy', 'Medium', 'Hard'].includes(difficulty)) filter.difficulty = difficulty;
  if (q) filter.$or = [{ question: new RegExp(esc(q), 'i') }, { answer: new RegExp(esc(q), 'i') }];

  const [items, total, counts] = await Promise.all([
    Question.find(filter).sort({ category: 1, createdAt: 1 }).skip((page - 1) * limit).limit(limit),
    Question.countDocuments(filter),
    Question.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit), counts: Object.fromEntries(counts.map((c) => [c._id, c.count])) });
});

exports.create = asyncHandler(async (req, res) => {
  const { category, difficulty, question, answer } = req.body;
  res.status(201).json({ question: await Question.create({ category, difficulty, question, answer }) });
});

exports.update = asyncHandler(async (req, res) => {
  const { category, difficulty, question, answer } = req.body;
  const doc = await Question.findByIdAndUpdate(req.params.id, { category, difficulty, question, answer }, { new: true, runValidators: true });
  if (!doc) throw new ApiError(404, 'Question not found');
  res.json({ question: doc });
});

exports.remove = asyncHandler(async (req, res) => {
  const doc = await Question.findByIdAndDelete(req.params.id);
  if (!doc) throw new ApiError(404, 'Question not found');
  res.json({ message: 'Deleted' });
});
