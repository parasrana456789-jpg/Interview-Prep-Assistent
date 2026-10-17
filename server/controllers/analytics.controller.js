const AptitudeResult = require('../models/AptitudeResult');
const CodingResult = require('../models/CodingResult');
const InterviewResult = require('../models/InterviewResult');
const Profile = require('../models/Profile');
const asyncHandler = require('../utils/asyncHandler');
const { completion } = require('./profile.controller');
const { avg } = require('../utils/helpers');

const mean = (docs, key) => avg(docs.map((d) => d[key] || 0));

exports.dashboard = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const [apt, cod, itv, profile] = await Promise.all([
    AptitudeResult.find({ user: uid }).select('score role difficulty createdAt').sort('-createdAt'),
    CodingResult.find({ user: uid }).select('score title language createdAt').sort('-createdAt'),
    InterviewResult.find({ user: uid }).select('overallScore type role createdAt').sort('-createdAt'),
    Profile.findOne({ user: uid }),
  ]);

  const aptitudeAvg = mean(apt, 'score'), codingAvg = mean(cod, 'score'), interviewAvg = mean(itv, 'overallScore');
  const active = [apt.length && aptitudeAvg, cod.length && codingAvg, itv.length && interviewAvg].filter((x) => x !== 0 && x !== false);

  const recent = [
    ...apt.slice(0, 6).map((r) => ({ type: 'aptitude', title: `Aptitude test: ${r.role}`, detail: r.difficulty, score: r.score, createdAt: r.createdAt })),
    ...cod.slice(0, 6).map((r) => ({ type: 'coding', title: r.title, detail: r.language, score: r.score, createdAt: r.createdAt })),
    ...itv.slice(0, 6).map((r) => ({ type: 'interview', title: `${r.type} interview: ${r.role}`, detail: r.type, score: r.overallScore, createdAt: r.createdAt })),
  ].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);

  const comp = profile ? completion(profile) : { percent: 7, missing: [] };
  res.json({
    stats: {
      totalTests: apt.length + cod.length + itv.length,
      counts: { aptitude: apt.length, coding: cod.length, interview: itv.length },
      aptitudeAvg, codingAvg, interviewAvg,
      averageScore: avg(active),
    },
    recent,
    profile: profile
      ? { avatar: profile.avatar, fullName: profile.fullName, college: profile.college, degree: profile.degree, branch: profile.branch, semester: profile.semester, skills: profile.skills, careerGoal: profile.careerGoal, completion: comp }
      : { fullName: req.user.name, skills: [], completion: comp },
  });
});

const RESOURCES = {
  'Quantitative Aptitude': 'Practise percentages, ratios, time & work and speed-distance daily for 20 minutes.',
  'Logical Reasoning': 'Solve seating arrangements, series and syllogisms; timebox each puzzle to 90 seconds.',
  'Verbal Ability': 'Read one editorial a day and practise reading-comprehension passages.',
  'Data Interpretation': 'Practise tables and charts; estimate before you calculate.',
  'Role-Based Technical Fundamentals': 'Revisit core CS fundamentals in the Question Bank.',
};

exports.progress = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const [apt, cod, itv, aptTopics] = await Promise.all([
    AptitudeResult.find({ user: uid }).select('score createdAt').sort('createdAt').limit(40),
    CodingResult.find({ user: uid }).select('score topic difficulty language createdAt').sort('createdAt').limit(40),
    InterviewResult.find({ user: uid }).select('overallScore communicationScore confidenceScore technicalScore type createdAt').sort('createdAt').limit(40),
    AptitudeResult.aggregate([
      { $match: { user: uid } }, { $unwind: '$topicBreakdown' },
      { $group: { _id: '$topicBreakdown.topic', total: { $sum: '$topicBreakdown.total' }, correct: { $sum: '$topicBreakdown.correct' } } },
    ]),
  ]);

  const d = (x) => x.createdAt.toISOString().slice(0, 10);
  const series = {
    aptitude: apt.map((r) => ({ date: d(r), score: r.score })),
    coding: cod.map((r) => ({ date: d(r), score: r.score })),
    interview: itv.map((r) => ({ date: d(r), score: r.overallScore, communication: r.communicationScore, confidence: r.confidenceScore, technical: r.technicalScore })),
  };

  const weakTopics = [];
  aptTopics.forEach((t) => {
    const score = Math.round((t.correct / t.total) * 100);
    if (t.total >= 2 && score < 60) weakTopics.push({ module: 'Aptitude', topic: t._id, score, attempts: t.total });
  });
  const byTopic = {};
  cod.forEach((r) => { if (r.topic) (byTopic[r.topic] = byTopic[r.topic] || []).push(r.score); });
  Object.entries(byTopic).forEach(([topic, scores]) => { const s = avg(scores); if (s < 60) weakTopics.push({ module: 'Coding', topic, score: s, attempts: scores.length }); });
  if (itv.length) {
    const dims = { Communication: mean(itv, 'communicationScore'), Confidence: mean(itv, 'confidenceScore'), 'Technical depth': mean(itv, 'technicalScore') };
    Object.entries(dims).forEach(([topic, score]) => { if (score < 60) weakTopics.push({ module: 'Interview', topic, score, attempts: itv.length }); });
  }
  weakTopics.sort((a, b) => a.score - b.score);

  const suggestions = [];
  const recommendations = [];
  if (!apt.length && !cod.length && !itv.length) suggestions.push('Take your first test to unlock personalised insights.');
  if (!apt.length) recommendations.push({ title: 'Start with an aptitude test', description: 'A 10-question test takes 10 minutes and shows your baseline.', link: '/aptitude' });
  if (!cod.length) recommendations.push({ title: 'Solve a coding problem', description: 'Pick an Easy problem in your strongest language.', link: '/coding' });
  if (!itv.length) recommendations.push({ title: 'Try a mock HR interview', description: 'Practise "Tell me about yourself" and get scored feedback.', link: '/interview' });

  weakTopics.slice(0, 4).forEach((w) => {
    if (w.module === 'Aptitude') { suggestions.push(`${w.topic} accuracy is ${w.score}%. ${RESOURCES[w.topic] || 'Practise this topic with timed sets.'}`); recommendations.push({ title: `Strengthen ${w.topic}`, description: RESOURCES[w.topic] || 'Take a focused aptitude test.', link: '/aptitude' }); }
    if (w.module === 'Coding') { suggestions.push(`Your ${w.topic} coding average is ${w.score}%. Revisit the pattern, then solve two more problems on it.`); recommendations.push({ title: `Practise ${w.topic} problems`, description: 'Generate a problem on this topic and compare approaches.', link: '/coding' }); }
    if (w.module === 'Interview') { suggestions.push(`${w.topic} is averaging ${w.score}%. Use the STAR method and rehearse answers aloud.`); recommendations.push({ title: `Improve ${w.topic.toLowerCase()}`, description: 'Re-attempt a mock interview and focus on structured answers.', link: '/interview' }); }
  });

  const trend = (s) => (s.length >= 4 ? s.slice(-2).reduce((a, b) => a + b.score, 0) / 2 - s.slice(0, 2).reduce((a, b) => a + b.score, 0) / 2 : 0);
  [['aptitude', 'Aptitude'], ['coding', 'Coding'], ['interview', 'Interview']].forEach(([k, label]) => {
    const t = trend(series[k]);
    if (t >= 5) suggestions.push(`${label} scores are up ${Math.round(t)} points since you started. Keep the streak going.`);
    else if (series[k].length >= 4 && t <= -5) suggestions.push(`${label} scores have dipped ${Math.abs(Math.round(t))} points. Slow down and review mistakes before the next attempt.`);
  });
  if (weakTopics.length === 0 && (apt.length || cod.length || itv.length)) suggestions.push('No weak areas detected. Raise the difficulty level for your next attempt.');
  if (!recommendations.length) recommendations.push({ title: 'Browse the question bank', description: 'Revise fundamentals in Java, Python, DSA, DBMS, OS and Networks.', link: '/questions' });

  res.json({ series, weakTopics, suggestions, recommendations });
});
