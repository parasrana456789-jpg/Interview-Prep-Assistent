const PDFDocument = require('pdfkit');
const Resume = require('../models/Resume');
const Profile = require('../models/Profile');
const asyncHandler = require('../utils/asyncHandler');
const gemini = require('../services/gemini');

const text = (v, max = 2000) => String(v ?? '').slice(0, max);
const arr = (v, fn) => (Array.isArray(v) ? v.slice(0, 30).map(fn) : []);

async function defaultsFromProfile(user) {
  const p = (await Profile.findOne({ user: user._id })) || {};
  return {
    personal: {
      name: p.fullName || user.name, email: user.email, phone: p.phone || '', location: '',
      linkedin: p.linkedin || '', github: p.github || '', portfolio: p.portfolio || '', summary: p.careerGoal || '',
    },
    education: p.college ? [{ institution: p.college, degree: p.degree || '', field: p.branch || '', startYear: '', endYear: '', grade: '' }] : [],
    skills: p.skills || [], projects: [], certifications: [], experience: [], achievements: [],
  };
}

exports.get = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ user: req.user._id });
  res.json({ resume: resume ? resume.toObject() : await defaultsFromProfile(req.user), saved: !!resume });
});

exports.fromProfile = asyncHandler(async (req, res) => res.json({ resume: await defaultsFromProfile(req.user) }));

exports.save = asyncHandler(async (req, res) => {
  const b = req.body;
  const data = {
    personal: Object.fromEntries(['name', 'email', 'phone', 'location', 'linkedin', 'github', 'portfolio', 'summary'].map((k) => [k, text(b.personal?.[k], k === 'summary' ? 1200 : 200)])),
    education: arr(b.education, (e) => ({ institution: text(e.institution, 150), degree: text(e.degree, 100), field: text(e.field, 100), startYear: text(e.startYear, 10), endYear: text(e.endYear, 10), grade: text(e.grade, 30) })),
    skills: arr(b.skills, (s) => text(s, 40)).filter(Boolean),
    projects: arr(b.projects, (p) => ({ name: text(p.name, 120), tech: text(p.tech, 200), link: text(p.link, 200), description: text(p.description, 1000) })),
    certifications: arr(b.certifications, (c) => ({ name: text(c.name, 150), issuer: text(c.issuer, 100), year: text(c.year, 10) })),
    experience: arr(b.experience, (x) => ({ company: text(x.company, 120), role: text(x.role, 120), startDate: text(x.startDate, 20), endDate: text(x.endDate, 20), description: text(x.description, 1500) })),
    achievements: arr(b.achievements, (a) => text(a, 300)).filter(Boolean),
  };
  const resume = await Resume.findOneAndUpdate({ user: req.user._id }, { $set: data }, { upsert: true, new: true, setDefaultsOnInsert: true });
  res.json({ resume });
});

exports.aiSummary = asyncHandler(async (req, res) => {
  const b = req.body;
  const out = await gemini.generateText(
    `Write a professional 2-3 sentence resume summary for a fresher. Use first-person implied (no "I"), confident and specific, no clichés, no markdown.
Name: ${text(b.name, 80)}
Education: ${arr(b.education, (e) => `${e.degree} ${e.field} at ${e.institution}`).join('; ')}
Skills: ${arr(b.skills, (s) => s).join(', ')}
Projects: ${arr(b.projects, (p) => p.name).join(', ')}
Career goal: ${text(b.summary, 300)}`,
    { temperature: 0.6 }
  );
  res.json({ summary: out.trim().replace(/^["']|["']$/g, '') });
});

exports.pdf = asyncHandler(async (req, res) => {
  const r = (await Resume.findOne({ user: req.user._id })) || { personal: {}, education: [], skills: [], projects: [], certifications: [], experience: [], achievements: [] };
  const p = r.personal || {};
  const M = 48;
  const doc = new PDFDocument({ size: 'A4', margin: M, info: { Title: `${p.name || 'Resume'} - Resume` } });
  const W = doc.page.width - M * 2;
  const INK = '#111827', MUTED = '#4B5563', ACCENT = '#2B47D6';

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${(p.name || 'resume').replace(/[^\w-]+/g, '_')}_resume.pdf"`);
  doc.pipe(res);

  doc.font('Helvetica-Bold').fontSize(24).fillColor(INK).text(p.name || 'Your Name');
  const contact = [p.email, p.phone, p.location].filter(Boolean).join('   |   ');
  const links = [p.linkedin, p.github, p.portfolio].filter(Boolean).join('   |   ');
  doc.font('Helvetica').fontSize(9.5).fillColor(MUTED);
  if (contact) doc.text(contact);
  if (links) doc.text(links);

  const section = (title) => {
    doc.moveDown(0.9);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(ACCENT).text(title.toUpperCase(), M, doc.y, { characterSpacing: 1 });
    const y = doc.y + 2;
    doc.moveTo(M, y).lineTo(M + W, y).lineWidth(0.8).strokeColor('#CBD5E1').stroke();
    doc.y = y + 6;
    doc.fillColor(INK);
  };
  const row = (left, right, sub) => {
    const y = doc.y;
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor(INK).text(left || '', M, y, { width: W * 0.72 });
    const yl = doc.y;
    doc.font('Helvetica').fontSize(9.5).fillColor(MUTED).text(right || '', M + W * 0.72, y, { width: W * 0.28, align: 'right' });
    doc.y = Math.max(yl, doc.y);
    doc.x = M;
    if (sub) doc.font('Helvetica-Oblique').fontSize(9.5).fillColor(MUTED).text(sub, M, doc.y, { width: W });
  };
  const bullets = (desc) => {
    String(desc || '').split('\n').map((l) => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean).forEach((line) => {
      doc.font('Helvetica').fontSize(10).fillColor(INK).text(`•  ${line}`, M + 8, doc.y + 1, { width: W - 8 });
    });
    doc.x = M;
    doc.moveDown(0.4);
  };

  if (p.summary) { section('Summary'); doc.font('Helvetica').fontSize(10).fillColor(INK).text(p.summary, M, doc.y, { width: W, lineGap: 2 }); }
  if (r.education?.length) {
    section('Education');
    r.education.forEach((e) => { row(e.institution, [e.startYear, e.endYear].filter(Boolean).join(' - '), [e.degree, e.field].filter(Boolean).join(', ') + (e.grade ? `  |  ${e.grade}` : '')); doc.moveDown(0.5); });
  }
  if (r.skills?.length) { section('Skills'); doc.font('Helvetica').fontSize(10).fillColor(INK).text(r.skills.join('  •  '), M, doc.y, { width: W, lineGap: 2 }); }
  if (r.experience?.length) {
    section('Experience');
    r.experience.forEach((x) => { row(x.role, [x.startDate, x.endDate].filter(Boolean).join(' - '), x.company); bullets(x.description); });
  }
  if (r.projects?.length) {
    section('Projects');
    r.projects.forEach((pr) => { row(pr.name, pr.link, pr.tech ? `Tech: ${pr.tech}` : ''); bullets(pr.description); });
  }
  if (r.certifications?.length) {
    section('Certifications');
    r.certifications.forEach((c) => { row(c.name, c.year, c.issuer); doc.moveDown(0.3); });
  }
  if (r.achievements?.length) { section('Achievements'); bullets(r.achievements.join('\n')); }
  doc.end();
});
