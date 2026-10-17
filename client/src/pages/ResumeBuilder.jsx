import { useEffect, useState } from 'react';
import { Plus, Trash2, Download, Save, Sparkles, UserRound } from 'lucide-react';
import { resumeService } from '../services/services.js';
import { errMsg } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Card, PageHead, PageLoader, ErrorBox, Spinner, Tabs } from '../components/ui.jsx';

const BLANK = {
  education: { institution: '', degree: '', field: '', startYear: '', endYear: '', grade: '' },
  projects: { name: '', tech: '', link: '', description: '' },
  certifications: { name: '', issuer: '', year: '' },
  experience: { company: '', role: '', startDate: '', endDate: '', description: '' },
};

export default function ResumeBuilder() {
  const toast = useToast();
  const [r, setR] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [view, setView] = useState('edit');

  const load = () => resumeService.get().then((d) => setR(d.resume)).catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, []);
  if (error && !r) return <ErrorBox message={error} onRetry={load} />;
  if (!r) return <PageLoader />;

  const setP = (k) => (e) => setR({ ...r, personal: { ...r.personal, [k]: e.target.value } });
  const setItem = (sec, i, k, v) => setR({ ...r, [sec]: r[sec].map((x, j) => (j === i ? { ...x, [k]: v } : x)) });
  const add = (sec) => setR({ ...r, [sec]: [...r[sec], { ...BLANK[sec] }] });
  const del = (sec, i) => setR({ ...r, [sec]: r[sec].filter((_, j) => j !== i) });
  const run = async (name, fn) => { setBusy(name); try { await fn(); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(''); } };

  const save = () => run('save', async () => { const d = await resumeService.save(r); setR(d.resume); toast.success('Resume saved'); });
  const download = () => run('pdf', async () => {
    await resumeService.save(r);
    const blob = await resumeService.pdf();
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: `${(r.personal.name || 'resume').replace(/\s+/g, '_')}_resume.pdf` });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });
  const importProfile = () => run('profile', async () => { const d = await resumeService.fromProfile(); setR((cur) => ({ ...d.resume, projects: cur.projects, certifications: cur.certifications, experience: cur.experience, achievements: cur.achievements })); toast.success('Imported from your profile'); });
  const aiSummary = () => run('ai', async () => { const d = await resumeService.aiSummary(r.personal.name ? { name: r.personal.name, education: r.education, skills: r.skills, projects: r.projects, summary: r.personal.summary } : r); setR((cur) => ({ ...cur, personal: { ...cur.personal, summary: d.summary } })); });

  return (
    <div className="stack">
      <PageHead title="Resume builder" subtitle="Fill in the sections, check the live preview, then download a clean one-column PDF."
        action={<div className="row wrap"><button className="btn ghost" onClick={importProfile} disabled={!!busy}>{busy === 'profile' ? <Spinner /> : <UserRound size={16} />}Import profile</button><button className="btn soft" onClick={save} disabled={!!busy}>{busy === 'save' ? <Spinner /> : <Save size={16} />}Save</button><button className="btn" onClick={download} disabled={!!busy}>{busy === 'pdf' ? <Spinner /> : <Download size={16} />}Download PDF</button></div>} />

      <div className="resume-switch"><Tabs value={view} onChange={setView} items={[['edit', 'Edit'], ['preview', 'Preview']]} /></div>

      <div className="resume-grid">
        <div className="stack" data-hide={view === 'preview'}>
          <Card title="Personal information">
            <div className="grid g2">
              <F label="Full name" v={r.personal.name} on={setP('name')} />
              <F label="Email" v={r.personal.email} on={setP('email')} type="email" />
              <F label="Phone" v={r.personal.phone} on={setP('phone')} />
              <F label="Location" v={r.personal.location} on={setP('location')} />
              <F label="LinkedIn" v={r.personal.linkedin} on={setP('linkedin')} />
              <F label="GitHub" v={r.personal.github} on={setP('github')} />
              <F label="Portfolio" v={r.personal.portfolio} on={setP('portfolio')} />
            </div>
            <label className="f" style={{ marginTop: 14 }}>
              <span className="row between"><span>Professional summary</span><button type="button" className="btn sm ghost" onClick={aiSummary} disabled={!!busy}>{busy === 'ai' ? <Spinner /> : <Sparkles size={14} />}Write with AI</button></span>
              <textarea className="input" maxLength={1200} value={r.personal.summary || ''} onChange={setP('summary')} />
            </label>
          </Card>

          <Card title="Education" action={<AddBtn onClick={() => add('education')} />}>
            <Items items={r.education} onDel={(i) => del('education', i)} empty="Add your college and degree.">
              {(e, i) => <div className="grid g2">
                <F label="Institution" v={e.institution} on={(ev) => setItem('education', i, 'institution', ev.target.value)} />
                <F label="Degree" v={e.degree} on={(ev) => setItem('education', i, 'degree', ev.target.value)} />
                <F label="Field of study" v={e.field} on={(ev) => setItem('education', i, 'field', ev.target.value)} />
                <F label="Grade / CGPA" v={e.grade} on={(ev) => setItem('education', i, 'grade', ev.target.value)} />
                <F label="Start year" v={e.startYear} on={(ev) => setItem('education', i, 'startYear', ev.target.value)} />
                <F label="End year" v={e.endYear} on={(ev) => setItem('education', i, 'endYear', ev.target.value)} />
              </div>}
            </Items>
          </Card>

          <Card title="Skills">
            <label className="f">Skills<input className="input" placeholder="Java, React, SQL, Git" value={r.skills.join(', ')} onChange={(e) => setR({ ...r, skills: e.target.value.split(',').map((s) => s.trimStart()) })} onBlur={() => setR({ ...r, skills: r.skills.map((s) => s.trim()).filter(Boolean) })} /><span className="hint">Separate skills with commas.</span></label>
          </Card>

          <Card title="Projects" action={<AddBtn onClick={() => add('projects')} />}>
            <Items items={r.projects} onDel={(i) => del('projects', i)} empty="Add 2–3 projects that show what you can build.">
              {(p, i) => <div className="stack sm">
                <div className="grid g2"><F label="Project name" v={p.name} on={(ev) => setItem('projects', i, 'name', ev.target.value)} /><F label="Tech stack" v={p.tech} on={(ev) => setItem('projects', i, 'tech', ev.target.value)} /></div>
                <F label="Link" v={p.link} on={(ev) => setItem('projects', i, 'link', ev.target.value)} />
                <label className="f">Description<textarea className="input" placeholder="One achievement per line" value={p.description} onChange={(ev) => setItem('projects', i, 'description', ev.target.value)} /></label>
              </div>}
            </Items>
          </Card>

          <Card title="Experience" action={<AddBtn onClick={() => add('experience')} />}>
            <Items items={r.experience} onDel={(i) => del('experience', i)} empty="Internships, part-time work or freelance projects.">
              {(x, i) => <div className="stack sm">
                <div className="grid g2"><F label="Role" v={x.role} on={(ev) => setItem('experience', i, 'role', ev.target.value)} /><F label="Company" v={x.company} on={(ev) => setItem('experience', i, 'company', ev.target.value)} /><F label="Start" v={x.startDate} on={(ev) => setItem('experience', i, 'startDate', ev.target.value)} /><F label="End" v={x.endDate} on={(ev) => setItem('experience', i, 'endDate', ev.target.value)} /></div>
                <label className="f">Description<textarea className="input" placeholder="One achievement per line" value={x.description} onChange={(ev) => setItem('experience', i, 'description', ev.target.value)} /></label>
              </div>}
            </Items>
          </Card>

          <Card title="Certifications" action={<AddBtn onClick={() => add('certifications')} />}>
            <Items items={r.certifications} onDel={(i) => del('certifications', i)} empty="Courses and certificates you have completed.">
              {(c, i) => <div className="grid g3"><F label="Name" v={c.name} on={(ev) => setItem('certifications', i, 'name', ev.target.value)} /><F label="Issuer" v={c.issuer} on={(ev) => setItem('certifications', i, 'issuer', ev.target.value)} /><F label="Year" v={c.year} on={(ev) => setItem('certifications', i, 'year', ev.target.value)} /></div>}
            </Items>
          </Card>

          <Card title="Achievements">
            <label className="f">Achievements<textarea className="input" placeholder="One achievement per line" value={r.achievements.join('\n')} onChange={(e) => setR({ ...r, achievements: e.target.value.split('\n') })} /></label>
          </Card>
        </div>

        <div data-hide={view === 'edit'} style={{ position: 'sticky', top: 76 }}><Preview r={r} /></div>
      </div>
      <style>{`
        .resume-switch{display:none}
        @media (max-width: 1100px){ .resume-switch{display:block} [data-hide="true"]{display:none} .resume-grid > div[style*="sticky"]{position:static !important} }
      `}</style>
    </div>
  );
}

const F = ({ label, v, on, type = 'text' }) => <label className="f">{label}<input className="input" type={type} value={v || ''} onChange={on} /></label>;
const AddBtn = ({ onClick }) => <button type="button" className="btn soft sm" onClick={onClick}><Plus size={15} />Add</button>;

function Items({ items, onDel, children, empty }) {
  if (!items.length) return <p className="small muted">{empty}</p>;
  return <div className="stack">{items.map((it, i) => <div className="sub-card" key={i}>{children(it, i)}<div style={{ marginTop: 10, textAlign: 'right' }}><button type="button" className="btn ghost sm" onClick={() => onDel(i)}><Trash2 size={14} />Remove</button></div></div>)}</div>;
}

const lines = (s) => String(s || '').split('\n').map((l) => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);

function Preview({ r }) {
  const p = r.personal;
  const contact = [p.email, p.phone, p.location].filter(Boolean).join('  |  ');
  const links = [p.linkedin, p.github, p.portfolio].filter(Boolean).join('  |  ');
  return (
    <div className="paper" aria-label="Resume preview">
      <h1>{p.name || 'Your Name'}</h1>
      {contact && <div className="contact">{contact}</div>}{links && <div className="contact">{links}</div>}
      {p.summary && <><h4>Summary</h4><p>{p.summary}</p></>}
      {r.education.length > 0 && <><h4>Education</h4>{r.education.map((e, i) => <div key={i} style={{ marginBottom: 6 }}><div className="r">{e.institution}<span>{[e.startYear, e.endYear].filter(Boolean).join(' - ')}</span></div><div className="s">{[e.degree, e.field].filter(Boolean).join(', ')}{e.grade ? `  |  ${e.grade}` : ''}</div></div>)}</>}
      {r.skills.filter(Boolean).length > 0 && <><h4>Skills</h4><p>{r.skills.filter(Boolean).join('  •  ')}</p></>}
      {r.experience.length > 0 && <><h4>Experience</h4>{r.experience.map((x, i) => <div key={i}><div className="r">{x.role}<span>{[x.startDate, x.endDate].filter(Boolean).join(' - ')}</span></div><div className="s">{x.company}</div><ul>{lines(x.description).map((l, j) => <li key={j}>{l}</li>)}</ul></div>)}</>}
      {r.projects.length > 0 && <><h4>Projects</h4>{r.projects.map((x, i) => <div key={i}><div className="r">{x.name}<span>{x.link}</span></div>{x.tech && <div className="s">Tech: {x.tech}</div>}<ul>{lines(x.description).map((l, j) => <li key={j}>{l}</li>)}</ul></div>)}</>}
      {r.certifications.length > 0 && <><h4>Certifications</h4>{r.certifications.map((c, i) => <div key={i}><div className="r">{c.name}<span>{c.year}</span></div><div className="s">{c.issuer}</div></div>)}</>}
      {r.achievements.filter(Boolean).length > 0 && <><h4>Achievements</h4><ul>{r.achievements.filter(Boolean).map((a, i) => <li key={i}>{a}</li>)}</ul></>}
    </div>
  );
}
