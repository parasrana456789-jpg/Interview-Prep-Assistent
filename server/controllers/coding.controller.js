const jwt = require('jsonwebtoken');
const CodingResult = require('../models/CodingResult');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const gemini = require('../services/gemini');
const judge0 = require('../services/judge0');
const { clamp } = require('../utils/helpers');

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const norm = (s) => String(s || '').replace(/\r/g, '').split('\n').map((l) => l.trimEnd()).join('\n').trim();

const ANALYSIS_SHAPE = `{"qualityScore":0-100,"timeComplexity":"O(...)","spaceComplexity":"O(...)","suggestions":["..."],"feedback":"2-3 sentences"}`;

async function analyse({ title, description, language, code, testSummary }) {
  return gemini.generateJSON(
    `You are a strict but encouraging senior code reviewer.
Problem: ${title}
${description}
Language: ${language}
${testSummary ? `Test results: ${testSummary}\n` : ''}Candidate code:
${code}

Assess readability, structure, edge-case handling and efficiency. Give the Big-O time and space complexity of THIS solution, and 2-4 specific improvement suggestions.
Return JSON only: ${ANALYSIS_SHAPE}`,
    { temperature: 0.3, validate: (d) => { if (d.qualityScore === undefined || !d.timeComplexity) throw new Error('bad analysis'); } }
  );
}

exports.generate = asyncHandler(async (req, res) => {
  const difficulty = DIFFICULTIES.includes(req.body.difficulty) ? req.body.difficulty : 'Easy';
  const topic = String(req.body.topic || 'any common interview topic (arrays, strings, hashing, recursion, sorting, etc.)').slice(0, 80);

  const data = await gemini.generateJSON(
    `Create one ${difficulty} coding interview problem about: ${topic}.
The solution must read from standard input and write to standard output, so it can be judged automatically (input format must be unambiguous, output must be deterministic and a single well-defined answer).
Provide 5 test cases covering normal and edge cases; "input" is the exact stdin text and "expectedOutput" the exact stdout.
Return JSON only:
{"title":"","topic":"","description":"problem statement incl. input and output format","constraints":["..."],"examples":[{"input":"","output":"","explanation":""}],"testCases":[{"input":"","expectedOutput":""}]}`,
    {
      validate: (d) => {
        if (!d.title || !d.description || !Array.isArray(d.testCases) || d.testCases.length < 2) throw new Error('bad problem');
        d.testCases.forEach((t) => { if (typeof t.input !== 'string' || typeof t.expectedOutput !== 'string') throw new Error('bad test'); });
      },
    }
  );

  const testCases = data.testCases.slice(0, 6).map((t) => ({ input: t.input, expectedOutput: t.expectedOutput }));
  const problem = {
    title: data.title,
    topic: data.topic || topic,
    difficulty,
    description: data.description,
    constraints: data.constraints || [],
    examples: (data.examples || []).slice(0, 3),
  };
  const token = jwt.sign({ uid: String(req.user._id), problem, testCases }, process.env.JWT_SECRET, { expiresIn: '6h' });
  res.json({ token, problem, sampleInput: data.examples?.[0]?.input ?? testCases[0].input });
});

exports.run = asyncHandler(async (req, res) => {
  const { language, code, stdin } = req.body;
  res.json({ result: await judge0.runCode({ language, code, stdin: String(stdin || '') }) });
});

exports.analyze = asyncHandler(async (req, res) => {
  const { title = 'Coding problem', description = '', language, code } = req.body;
  if (!code?.trim()) throw new ApiError(400, 'Write some code first');
  const a = await analyse({ title, description, language, code });
  res.json({
    analysis: { qualityScore: clamp(a.qualityScore), timeComplexity: a.timeComplexity, spaceComplexity: a.spaceComplexity, suggestions: a.suggestions || [], feedback: a.feedback || '' },
  });
});

exports.submit = asyncHandler(async (req, res) => {
  const { token, language, code } = req.body;
  let t;
  try {
    t = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(400, 'This problem has expired. Generate a new one.');
  }
  if (t.uid !== String(req.user._id)) throw new ApiError(403, 'This problem belongs to another account');

  const tests = [];
  let compileFailed = false;
  for (let i = 0; i < t.testCases.length; i++) {
    const tc = t.testCases[i];
    if (compileFailed) {
      tests.push({ index: i + 1, passed: false, status: 'Compilation Error' });
      continue;
    }
    const r = await judge0.runCode({ language, code, stdin: tc.input });
    if (r.statusId === 6) compileFailed = true;
    const passed = r.statusId === 3 && norm(r.stdout) === norm(tc.expectedOutput);
    tests.push({
      index: i + 1,
      passed,
      status: r.statusId === 3 && !passed ? 'Wrong Answer' : r.status,
      time: r.time,
      // only the first two tests are visible; the rest stay hidden
      ...(i < 2 ? { input: tc.input, expected: tc.expectedOutput, actual: r.stdout, error: r.stderr || r.compileOutput } : {}),
    });
  }

  const testsPassed = tests.filter((x) => x.passed).length;
  const correctness = Math.round((testsPassed / tests.length) * 100);

  let a = { qualityScore: 0, timeComplexity: 'N/A', spaceComplexity: 'N/A', suggestions: [], feedback: 'AI code analysis is unavailable right now.' };
  try {
    a = await analyse({
      title: t.problem.title,
      description: t.problem.description,
      language,
      code,
      testSummary: `${testsPassed}/${tests.length} test cases passed`,
    });
  } catch (e) {
    console.error('Code analysis failed:', e.message);
  }
  const quality = clamp(a.qualityScore);
  const score = a.qualityScore === 0 && a.timeComplexity === 'N/A' ? correctness : Math.round(correctness * 0.7 + quality * 0.3);

  const doc = await CodingResult.create({
    user: req.user._id,
    title: t.problem.title,
    description: t.problem.description,
    topic: t.problem.topic,
    difficulty: t.problem.difficulty,
    language,
    code,
    testsPassed,
    testsTotal: tests.length,
    correctness,
    score,
    timeComplexity: a.timeComplexity,
    spaceComplexity: a.spaceComplexity,
    suggestions: a.suggestions || [],
    feedback: a.feedback || '',
  });

  res.status(201).json({ result: doc, tests, quality });
});

exports.history = asyncHandler(async (req, res) => {
  const results = await CodingResult.find({ user: req.user._id }).select('-code -description').sort('-createdAt').limit(50);
  res.json({ results });
});

exports.getOne = asyncHandler(async (req, res) => {
  const result = await CodingResult.findOne({ _id: req.params.id, user: req.user._id });
  if (!result) throw new ApiError(404, 'Result not found');
  res.json({ result });
});
