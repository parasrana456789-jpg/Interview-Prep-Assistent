const jwt = require('jsonwebtoken');
const AptitudeResult = require('../models/AptitudeResult');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const gemini = require('../services/gemini');

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

exports.generate = asyncHandler(async (req, res) => {
  const role = String(req.body.role || 'Software Developer').slice(0, 60);
  const difficulty = DIFFICULTIES.includes(req.body.difficulty) ? req.body.difficulty : 'Medium';
  const count = Math.min(20, Math.max(5, Number(req.body.count) || 10));

  const prompt = `You are an expert placement-test setter. Create ${count} multiple-choice aptitude questions for a "${role}" candidate at ${difficulty} difficulty.
Mix these topics: Quantitative Aptitude, Logical Reasoning, Verbal Ability, Data Interpretation, Role-Based Technical Fundamentals.
Rules: exactly 4 options per question, exactly one correct option, no "all of the above", every question must be self-contained and solvable without a diagram.
Return JSON only in this shape:
{"questions":[{"question":"","options":["","","",""],"answer":0,"topic":"","explanation":""}]}
"answer" is the 0-based index of the correct option. "topic" must be one of the topics listed above. "explanation" is a short worked solution.`;

  const data = await gemini.generateJSON(prompt, {
    validate: (d) => {
      if (!Array.isArray(d.questions) || d.questions.length < 3) throw new Error('no questions');
      d.questions.forEach((q) => {
        if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || !Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3)
          throw new Error('bad question');
      });
    },
  });

  const questions = data.questions.slice(0, count).map((q) => ({
    question: q.question,
    options: q.options.map(String),
    answer: q.answer,
    topic: q.topic || 'General Aptitude',
    explanation: q.explanation || '',
  }));
  const timeLimit = questions.length * 60;

  // The signed token carries the answer key so nothing about the test is stored until it is submitted.
  const testToken = jwt.sign({ uid: String(req.user._id), role, difficulty, timeLimit, questions }, process.env.JWT_SECRET, { expiresIn: '3h' });
  res.json({
    testToken,
    timeLimit,
    role,
    difficulty,
    questions: questions.map(({ question, options, topic }) => ({ question, options, topic })),
  });
});

exports.submit = asyncHandler(async (req, res) => {
  const { testToken, answers = [], timeTaken = 0 } = req.body;
  let t;
  try {
    t = jwt.verify(testToken, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(400, 'This test has expired. Please start a new one.');
  }
  if (t.uid !== String(req.user._id)) throw new ApiError(403, 'This test belongs to another account');

  const topics = {};
  let correct = 0;
  const review = t.questions.map((q, i) => {
    const selected = Number.isInteger(answers[i]) ? answers[i] : null;
    const isCorrect = selected === q.answer;
    if (isCorrect) correct++;
    topics[q.topic] = topics[q.topic] || { topic: q.topic, total: 0, correct: 0 };
    topics[q.topic].total++;
    if (isCorrect) topics[q.topic].correct++;
    return { question: q.question, options: q.options, selected, correct: q.answer, topic: q.topic, explanation: q.explanation };
  });

  const total = review.length;
  const score = Math.round((correct / total) * 100);
  const topicBreakdown = Object.values(topics);

  let analysis = '';
  try {
    const summary = topicBreakdown.map((x) => `${x.topic}: ${x.correct}/${x.total}`).join('; ');
    analysis = (
      await gemini.generateText(
        `A candidate for "${t.role}" took a ${t.difficulty} aptitude test and scored ${score}% (${correct}/${total}) in ${Math.round(timeTaken / 60)} minutes of ${Math.round(t.timeLimit / 60)}. Topic results: ${summary}.
Write a 3-4 sentence performance analysis: what went well, what to improve, and one concrete study tip. Plain text, no markdown.`,
        { temperature: 0.5 }
      )
    ).trim();
  } catch (e) {
    analysis = 'AI analysis is unavailable right now. Review the topic breakdown below to see where to focus.';
  }

  const doc = await AptitudeResult.create({
    user: req.user._id,
    role: t.role,
    difficulty: t.difficulty,
    totalQuestions: total,
    correct,
    score,
    timeTaken: Math.max(0, Math.min(Number(timeTaken) || 0, t.timeLimit)),
    timeLimit: t.timeLimit,
    topicBreakdown,
    analysis,
    questions: review,
  });

  res.status(201).json({ result: doc });
});

exports.history = asyncHandler(async (req, res) => {
  const results = await AptitudeResult.find({ user: req.user._id }).select('-questions').sort('-createdAt').limit(50);
  res.json({ results });
});

exports.getOne = asyncHandler(async (req, res) => {
  const result = await AptitudeResult.findOne({ _id: req.params.id, user: req.user._id });
  if (!result) throw new ApiError(404, 'Result not found');
  res.json({ result });
});
