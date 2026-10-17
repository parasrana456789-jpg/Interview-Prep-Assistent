const jwt = require('jsonwebtoken');
const InterviewResult = require('../models/InterviewResult');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const gemini = require('../services/gemini');
const { clamp } = require('../utils/helpers');

exports.start = asyncHandler(async (req, res) => {
  const type = req.body.type === 'HR' ? 'HR' : 'Technical';
  const role = String(req.body.role || 'Software Developer').slice(0, 60);
  const difficulty = ['Easy', 'Medium', 'Hard'].includes(req.body.difficulty) ? req.body.difficulty : 'Medium';
  const count = Math.min(10, Math.max(3, Number(req.body.count) || 5));

  const focus =
    type === 'HR'
      ? 'behavioural and HR questions (strengths/weaknesses, teamwork, conflict, leadership, motivation, career goals, situational judgement)'
      : 'technical questions on core concepts, problem solving and practical experience relevant to the role';

  const data = await gemini.generateJSON(
    `You are an experienced interviewer. Write ${count} ${difficulty}-level ${type} interview questions for a fresher/entry-level "${role}" candidate, focused on ${focus}.
Order them as a natural interview flow and avoid yes/no questions.
Return JSON only: {"questions":[{"question":"","hint":"one-line tip on what a good answer covers"}]}`,
    { validate: (d) => { if (!Array.isArray(d.questions) || d.questions.length < 2 || d.questions.some((q) => !q.question)) throw new Error('bad'); } }
  );

  const questions = data.questions.slice(0, count).map((q) => ({ question: q.question, hint: q.hint || '' }));
  const token = jwt.sign({ uid: String(req.user._id), type, role, difficulty, questions }, process.env.JWT_SECRET, { expiresIn: '3h' });
  res.json({ token, type, role, difficulty, questions });
});

exports.submit = asyncHandler(async (req, res) => {
  const { token, answers = [], durationSec = 0 } = req.body;
  let t;
  try {
    t = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(400, 'This interview session has expired. Start a new one.');
  }
  if (t.uid !== String(req.user._id)) throw new ApiError(403, 'This session belongs to another account');

  const qa = t.questions.map((q, i) => ({ question: q.question, answer: String(answers[i] || '').slice(0, 3000).trim() }));
  if (qa.every((x) => !x.answer)) throw new ApiError(400, 'Answer at least one question before finishing');

  const transcript = qa.map((x, i) => `Q${i + 1}: ${x.question}\nA${i + 1}: ${x.answer || '(no answer)'}`).join('\n\n');
  const ev = await gemini.generateJSON(
    `You are a fair, constructive interview coach evaluating a ${t.difficulty} ${t.type} interview for a "${t.role}" fresher. Answers were typed or dictated, so judge content, structure and clarity, not spelling.
Scoring (0-100): communicationScore = clarity, structure, vocabulary; confidenceScore = decisiveness, ownership, specific examples vs vague hedging; technicalScore = ${t.type === 'HR' ? 'relevance, self-awareness and depth of content' : 'technical accuracy and depth'}; overallScore = weighted overall. Unanswered questions score 0 for that question.
${transcript}

Return JSON only:
{"perQuestion":[{"score":0-10,"feedback":"1-2 sentences","idealAnswer":"a concise model answer"}],"communicationScore":0,"confidenceScore":0,"technicalScore":0,"overallScore":0,"strengths":["..."],"improvements":["..."],"summary":"3 sentences"}
"perQuestion" must have exactly ${qa.length} items in order.`,
    { temperature: 0.3, validate: (d) => { if (!Array.isArray(d.perQuestion) || d.perQuestion.length < qa.length) throw new Error('bad eval'); } }
  );

  const doc = await InterviewResult.create({
    user: req.user._id,
    type: t.type,
    role: t.role,
    difficulty: t.difficulty,
    durationSec: Math.max(0, Number(durationSec) || 0),
    answers: qa.map((x, i) => ({
      ...x,
      score: clamp(ev.perQuestion[i]?.score, 0, 10),
      feedback: ev.perQuestion[i]?.feedback || '',
      idealAnswer: ev.perQuestion[i]?.idealAnswer || '',
    })),
    communicationScore: clamp(ev.communicationScore),
    confidenceScore: clamp(ev.confidenceScore),
    technicalScore: clamp(ev.technicalScore),
    overallScore: clamp(ev.overallScore),
    strengths: (ev.strengths || []).slice(0, 5),
    improvements: (ev.improvements || []).slice(0, 5),
    summary: ev.summary || '',
  });
  res.status(201).json({ result: doc });
});

exports.history = asyncHandler(async (req, res) => {
  const results = await InterviewResult.find({ user: req.user._id }).select('-answers').sort('-createdAt').limit(50);
  res.json({ results });
});

exports.getOne = asyncHandler(async (req, res) => {
  const result = await InterviewResult.findOne({ _id: req.params.id, user: req.user._id });
  if (!result) throw new ApiError(404, 'Result not found');
  res.json({ result });
});
