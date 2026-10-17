import { useState, lazy, Suspense } from 'react';
import { Play, Send, Sparkles, ScanSearch, CheckCircle2, XCircle } from 'lucide-react';
import { codingService } from '../services/services.js';
import { errMsg } from '../services/api.js';
import useAsync from '../hooks/useAsync.js';
import { useTheme } from '../context/ThemeContext.jsx';
import { Card, PageHead, Tabs, AiLoader, Ring, ScoreBadge, Empty, Spinner } from '../components/ui.jsx';
import { STARTERS, fmtDateTime } from '../lib/utils.js';

const Editor = lazy(() => import('@monaco-editor/react'));
const LANGS = [['java', 'Java'], ['python', 'Python'], ['cpp', 'C++'], ['javascript', 'JavaScript']];
const TOPICS = ['Any topic', 'Arrays', 'Strings', 'Hashing', 'Recursion', 'Sorting and searching', 'Math', 'Stacks and queues', 'Dynamic programming'];

export default function Coding() {
  const { theme } = useTheme();
  const [tab, setTab] = useState('practice');
  const [cfg, setCfg] = useState({ difficulty: 'Easy', topic: 'Any topic' });
  const [prob, setProb] = useState(null); // { token, problem }
  const [lang, setLang] = useState('python');
  const [codes, setCodes] = useState({ ...STARTERS });
  const [stdin, setStdin] = useState('');
  const [busy, setBusy] = useState(''); // generate | run | analyze | submit
  const [out, setOut] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [error, setError] = useState('');
  const history = useAsync(codingService.history, []);

  const code = codes[lang];
  const wrap = async (name, fn) => { setBusy(name); setError(''); try { await fn(); } catch (e) { setError(errMsg(e)); } finally { setBusy(''); } };

  const generate = () => wrap('generate', async () => {
    const d = await codingService.generate({ difficulty: cfg.difficulty, topic: cfg.topic === 'Any topic' ? '' : cfg.topic });
    setProb(d); setStdin(d.sampleInput || ''); setCodes({ ...STARTERS }); setOut(null); setAnalysis(null); setSubmission(null);
  });
  const run = () => wrap('run', async () => { setOut((await codingService.run({ language: lang, code, stdin })).result); });
  const analyze = () => wrap('analyze', async () => { setAnalysis((await codingService.analyze({ title: prob?.problem.title, description: prob?.problem.description, language: lang, code })).analysis); });
  const submit = () => wrap('submit', async () => { setSubmission(await codingService.submit({ token: prob.token, language: lang, code })); history.reload(); });

  const p = prob?.problem;
  return (
    <div className="stack">
      <PageHead title="Coding practice" subtitle="Generate a problem, write a solution and run it on real test cases." action={<Tabs value={tab} onChange={setTab} items={[['practice', 'Practice'], ['history', 'History']]} />} />

      {tab === 'history' ? (
        <Card>{history.loading ? <Spinner /> : !history.data?.results.length ? <Empty title="No submissions yet">Submit a solution to see it here.</Empty> : (
          <div className="table-wrap"><table><thead><tr><th>Date</th><th>Problem</th><th>Language</th><th>Tests</th><th>Complexity</th><th>Score</th></tr></thead><tbody>
            {history.data.results.map((r) => <tr key={r._id}><td>{fmtDateTime(r.createdAt)}</td><td>{r.title}<div className="small muted">{r.difficulty} · {r.topic}</div></td><td>{r.language}</td><td>{r.testsPassed}/{r.testsTotal}</td><td className="mono small">{r.timeComplexity} / {r.spaceComplexity}</td><td><ScoreBadge value={r.score} /></td></tr>)}
          </tbody></table></div>)}</Card>
      ) : (
        <>
          <Card className="tight">
            <div className="row wrap">
              <label className="f" style={{ minWidth: 140 }}>Difficulty<select className="input" value={cfg.difficulty} onChange={(e) => setCfg({ ...cfg, difficulty: e.target.value })}>{['Easy', 'Medium', 'Hard'].map((d) => <option key={d}>{d}</option>)}</select></label>
              <label className="f" style={{ minWidth: 200 }}>Topic<select className="input" value={cfg.topic} onChange={(e) => setCfg({ ...cfg, topic: e.target.value })}>{TOPICS.map((d) => <option key={d}>{d}</option>)}</select></label>
              <button className="btn" style={{ alignSelf: 'flex-end' }} onClick={generate} disabled={!!busy}>{busy === 'generate' ? <Spinner /> : <Sparkles size={16} />}{prob ? 'New problem' : 'Generate problem'}</button>
            </div>
          </Card>
          {error && <div className="alert err" role="alert">{error}</div>}
          {busy === 'generate' && <Card><AiLoader text="Designing a problem…" /></Card>}

          {!prob && busy !== 'generate' && <Card><Empty title="Pick a difficulty to begin">The problem comes with hidden test cases, so your score reflects real correctness.</Empty></Card>}

          {prob && busy !== 'generate' && (
            <div className="code-grid">
              <Card className="prob">
                <div className="row between"><h2>{p.title}</h2><span className="badge">{p.difficulty}</span></div>
                <p className="small muted" style={{ marginTop: 2 }}>{p.topic}</p>
                <p style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>{p.description}</p>
                {p.constraints?.length > 0 && <><h3>Constraints</h3><ul style={{ margin: 0, paddingLeft: 18 }}>{p.constraints.map((c, i) => <li key={i} className="mono small">{c}</li>)}</ul></>}
                {p.examples?.map((ex, i) => (
                  <div key={i}><h3>Example {i + 1}</h3><div className="small muted">Input</div><pre>{ex.input}</pre><div className="small muted" style={{ marginTop: 6 }}>Output</div><pre>{ex.output}</pre>{ex.explanation && <p className="small muted" style={{ marginTop: 6 }}>{ex.explanation}</p>}</div>
                ))}
              </Card>

              <div className="stack">
                <div className="row wrap between">
                  <Tabs value={lang} onChange={setLang} items={LANGS} />
                  <div className="row wrap">
                    <button className="btn ghost sm" onClick={analyze} disabled={!!busy}>{busy === 'analyze' ? <Spinner /> : <ScanSearch size={15} />}Analyze</button>
                    <button className="btn soft sm" onClick={run} disabled={!!busy}>{busy === 'run' ? <Spinner /> : <Play size={15} />}Run</button>
                    <button className="btn sm" onClick={submit} disabled={!!busy}>{busy === 'submit' ? <Spinner /> : <Send size={15} />}Submit</button>
                  </div>
                </div>
                <div className="editor">
                  <Suspense fallback={<div className="page-loader" style={{ minHeight: 380 }}><Spinner /></div>}>
                    <Editor height="380px" language={lang} theme={theme === 'dark' ? 'vs-dark' : 'light'} value={code} onChange={(v) => setCodes((c) => ({ ...c, [lang]: v ?? '' }))} options={{ minimap: { enabled: false }, fontSize: 14, fontFamily: 'JetBrains Mono, monospace', scrollBeyondLastLine: false, automaticLayout: true, tabSize: 4, padding: { top: 10 } }} />
                  </Suspense>
                </div>
                <Card title="Custom input and output" className="tight">
                  <div className="grid g2">
                    <label className="f">Input (stdin)<textarea className="input mono" style={{ minHeight: 110 }} value={stdin} onChange={(e) => setStdin(e.target.value)} /></label>
                    <div className="f"><span style={{ fontWeight: 600, fontSize: '.88rem' }}>Output {out && <span className={`badge ${out.statusId === 3 ? 'good' : 'bad'}`}>{out.status}{out.time ? ` · ${out.time}s` : ''}</span>}</span>
                      <pre className={`out ${out && out.statusId !== 3 ? 'err' : 'ok'}`} style={{ minHeight: 110 }}>{out ? (out.compileOutput || out.stderr || out.message || out.stdout || '(no output)') : 'Run your code to see output here.'}</pre></div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {analysis && <Card title="Code analysis"><Analysis a={analysis} /></Card>}
          {busy === 'submit' && <Card><AiLoader text="Running all test cases and reviewing your code…" /></Card>}
          {submission && busy !== 'submit' && <Submission s={submission} />}
        </>
      )}
    </div>
  );
}

function Analysis({ a }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: 'auto minmax(0,1fr)', alignItems: 'start' }}>
      <Ring value={a.qualityScore} size={90} label="quality" />
      <div className="stack sm">
        <div className="row wrap"><span className="chip">Time {a.timeComplexity}</span><span className="chip">Space {a.spaceComplexity}</span></div>
        {a.feedback && <p>{a.feedback}</p>}
        {a.suggestions?.length > 0 && <ul style={{ margin: 0, paddingLeft: 18 }}>{a.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>}
      </div>
    </div>
  );
}

function Submission({ s }) {
  const r = s.result;
  return (
    <Card title="Submission result">
      <div className="stack">
        <div className="grid g4">
          <div className="center"><Ring value={r.score} size={104} label="score" /></div>
          <div className="stat"><div className="k">Correctness</div><div className="v">{r.correctness}<small>%</small></div><div className="small muted">{r.testsPassed} of {r.testsTotal} tests passed</div></div>
          <div className="stat"><div className="k">Time complexity</div><div className="v mono" style={{ fontSize: '1.3rem' }}>{r.timeComplexity}</div></div>
          <div className="stat"><div className="k">Space complexity</div><div className="v mono" style={{ fontSize: '1.3rem' }}>{r.spaceComplexity}</div></div>
        </div>
        {r.feedback && <p>{r.feedback}</p>}
        {r.suggestions?.length > 0 && <div><h3 style={{ marginBottom: 6 }}>Suggestions</h3><ul style={{ margin: 0, paddingLeft: 18 }}>{r.suggestions.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
        <div><h3 style={{ marginBottom: 8 }}>Test cases</h3>
          <div className="stack sm">{s.tests.map((t) => (
            <div key={t.index} className="sub-card">
              <div className="row">{t.passed ? <CheckCircle2 size={18} color="var(--green)" /> : <XCircle size={18} color="var(--red)" />}<strong>Test {t.index}{t.input === undefined ? ' (hidden)' : ''}</strong><span className={`badge ${t.passed ? 'good' : 'bad'}`}>{t.status}</span></div>
              {!t.passed && t.input !== undefined && <div className="grid g3" style={{ marginTop: 8 }}>
                <div><div className="small muted">Input</div><pre className="out">{t.input}</pre></div><div><div className="small muted">Expected</div><pre className="out">{t.expected}</pre></div><div><div className="small muted">Your output</div><pre className="out err">{t.error || t.actual || '(empty)'}</pre></div>
              </div>}
            </div>))}</div>
        </div>
      </div>
    </Card>
  );
}
