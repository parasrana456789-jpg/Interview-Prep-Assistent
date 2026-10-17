import { useRef, useState } from 'react';
import { Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { BarChart, Bar as RBar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { aptitudeService } from '../services/services.js';
import { errMsg } from '../services/api.js';
import useTimer from '../hooks/useTimer.js';
import useAsync from '../hooks/useAsync.js';
import { Card, PageHead, Tabs, AiLoader, Ring, ScoreBadge, Empty, Spinner } from '../components/ui.jsx';
import { fmtTime, fmtDateTime } from '../lib/utils.js';

const ROLES = ['Software Developer', 'Web Developer', 'Data Analyst', 'QA / Test Engineer', 'Business Analyst', 'General Campus Placement'];
const LETTERS = ['A', 'B', 'C', 'D'];

export default function Aptitude() {
  const [tab, setTab] = useState('test');
  const [phase, setPhase] = useState('setup'); // setup | loading | test | submitting | result
  const [cfg, setCfg] = useState({ role: ROLES[0], difficulty: 'Medium', count: 10 });
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [cur, setCur] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const timer = useTimer();
  const submitRef = useRef();
  const history = useAsync(aptitudeService.history, []);

  const start = async () => {
    setError(''); setPhase('loading');
    try {
      const t = await aptitudeService.generate(cfg);
      setTest(t); setAnswers(Array(t.questions.length).fill(null)); setCur(0); setPhase('test');
      timer.start(t.timeLimit, () => submitRef.current?.());
    } catch (e) { setError(errMsg(e)); setPhase('setup'); }
  };

  const submit = async () => {
    if (phase === 'submitting' || !test) return;
    timer.stop(); setPhase('submitting');
    try {
      const { result } = await aptitudeService.submit({ testToken: test.testToken, answers, timeTaken: test.timeLimit - timer.left });
      setResult(result); setPhase('result'); history.reload();
    } catch (e) { setError(errMsg(e)); setPhase('result-error'); }
  };
  submitRef.current = submit;

  const reset = () => { setPhase('setup'); setTest(null); setResult(null); setError(''); };
  const answered = answers.filter((a) => a !== null).length;

  return (
    <div className="stack">
      <PageHead title="Aptitude test" subtitle="Questions are generated for your role. Finish before the timer runs out." action={phase === 'setup' && <Tabs value={tab} onChange={setTab} items={[['test', 'New test'], ['history', 'History']]} />} />

      {tab === 'history' && phase === 'setup' ? (
        <Card>
          {history.loading ? <Spinner /> : !history.data?.results.length ? <Empty title="No tests yet">Your finished tests will be listed here.</Empty> : (
            <div className="table-wrap"><table><thead><tr><th>Date</th><th>Role</th><th>Level</th><th>Correct</th><th>Time</th><th>Score</th></tr></thead><tbody>
              {history.data.results.map((r) => <tr key={r._id}><td>{fmtDateTime(r.createdAt)}</td><td>{r.role}</td><td>{r.difficulty}</td><td>{r.correct}/{r.totalQuestions}</td><td className="mono">{fmtTime(r.timeTaken)}</td><td><ScoreBadge value={r.score} /></td></tr>)}
            </tbody></table></div>
          )}
        </Card>
      ) : phase === 'setup' ? (
        <Card title="Set up your test">
          <div className="stack" style={{ maxWidth: 560 }}>
            {error && <div className="alert err" role="alert">{error}</div>}
            <label className="f">Target role<select className="input" value={cfg.role} onChange={(e) => setCfg({ ...cfg, role: e.target.value })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></label>
            <div className="f"><span style={{ fontWeight: 600, fontSize: '.88rem' }}>Difficulty</span><div className="row wrap">{['Easy', 'Medium', 'Hard'].map((d) => <button key={d} type="button" className={`chip ${cfg.difficulty === d ? 'on' : ''}`} onClick={() => setCfg({ ...cfg, difficulty: d })} style={{ cursor: 'pointer' }}>{d}</button>)}</div></div>
            <label className="f">Number of questions<select className="input" value={cfg.count} onChange={(e) => setCfg({ ...cfg, count: +e.target.value })}>{[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n} questions · {n} minutes</option>)}</select></label>
            <button className="btn" onClick={start}><Sparkles size={16} />Generate and start</button>
          </div>
        </Card>
      ) : phase === 'loading' ? <Card><AiLoader text="Writing your questions…" /></Card>
      : phase === 'submitting' ? <Card><AiLoader text="Scoring your test…" /></Card>
      : phase === 'test' ? (
        <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 260px', alignItems: 'start' }} id="apt-split">
          <Card>
            <div className="row between" style={{ marginBottom: 14 }}>
              <span className="chip">{test.questions[cur].topic}</span>
              <span className={`timer ${timer.left < 60 ? 'low' : ''}`} role="timer"><Clock size={14} style={{ verticalAlign: -2 }} /> {fmtTime(timer.left)}</span>
            </div>
            <h2 style={{ marginBottom: 16, fontWeight: 600, lineHeight: 1.5 }}>{cur + 1}. {test.questions[cur].question}</h2>
            <div className="stack sm">
              {test.questions[cur].options.map((o, i) => (
                <button key={i} className={`opt ${answers[cur] === i ? 'sel' : ''}`} onClick={() => setAnswers((a) => a.map((x, j) => (j === cur ? (x === i ? null : i) : x)))}><b>{LETTERS[i]}</b><span>{o}</span></button>
              ))}
            </div>
            <div className="row between" style={{ marginTop: 20 }}>
              <button className="btn ghost" disabled={cur === 0} onClick={() => setCur(cur - 1)}><ChevronLeft size={16} />Previous</button>
              {cur < test.questions.length - 1 ? <button className="btn" onClick={() => setCur(cur + 1)}>Next<ChevronRight size={16} /></button> : <button className="btn" onClick={submit}>Submit test</button>}
            </div>
          </Card>
          <Card title="Questions" className="tight">
            <div className="qnav">{test.questions.map((_, i) => <button key={i} className={i === cur ? 'cur' : answers[i] !== null ? 'done' : ''} onClick={() => setCur(i)} aria-label={`Question ${i + 1}`}>{i + 1}</button>)}</div>
            <p className="small muted" style={{ margin: '12px 0' }}>{answered} of {test.questions.length} answered</p>
            <button className="btn block soft" onClick={submit}>Finish now</button>
          </Card>
        </div>
      ) : phase === 'result-error' ? (
        <Card><div className="stack"><div className="alert err">{error}</div><div className="row"><button className="btn" onClick={submit}>Try submitting again</button><button className="btn ghost" onClick={reset}>Discard test</button></div></div></Card>
      ) : (
        <Result result={result} onAgain={reset} />
      )}
      <style>{`@media (max-width: 860px){ #apt-split{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

function Result({ result: r, onAgain }) {
  const chart = r.topicBreakdown.map((t) => ({ topic: t.topic.replace('Role-Based ', ''), accuracy: Math.round((t.correct / t.total) * 100) }));
  return (
    <div className="stack">
      <div className="grid" style={{ gridTemplateColumns: 'auto minmax(0,1fr)', alignItems: 'center' }}>
        <Card><div className="row" style={{ gap: 20 }}><Ring value={r.score} size={120} stroke={11} label="score" /><div><h2>{r.correct} of {r.totalQuestions} correct</h2><p className="muted small">{r.role} · {r.difficulty}<br />Time used {fmtTime(r.timeTaken)} of {fmtTime(r.timeLimit)}</p></div></div></Card>
        <Card title="Performance analysis"><p>{r.analysis}</p></Card>
      </div>
      <Card title="Accuracy by topic">
        <div style={{ height: Math.max(180, chart.length * 52) }}>
          <ResponsiveContainer><BarChart data={chart} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid horizontal={false} stroke="var(--line)" /><XAxis type="number" domain={[0, 100]} stroke="var(--muted)" unit="%" /><YAxis type="category" dataKey="topic" width={130} stroke="var(--muted)" tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 }} /><RBar dataKey="accuracy" fill="var(--primary)" radius={[0, 6, 6, 0]} barSize={20} />
          </BarChart></ResponsiveContainer>
        </div>
      </Card>
      <Card title="Review answers">
        <div className="stack">
          {r.questions.map((q, i) => (
            <div key={i} className="stack sm" style={{ paddingBottom: 16, borderBottom: i < r.questions.length - 1 ? '1px solid var(--line)' : 0 }}>
              <div className="row" style={{ alignItems: 'flex-start' }}>{q.selected === q.correct ? <CheckCircle2 color="var(--green)" size={20} /> : <XCircle color="var(--red)" size={20} />}<strong className="grow">{i + 1}. {q.question}</strong></div>
              {q.options.map((o, j) => <div key={j} className={`opt ${j === q.correct ? 'right' : j === q.selected ? 'wrong' : ''}`} style={{ cursor: 'default' }}><b>{LETTERS[j]}</b><span>{o}</span></div>)}
              {q.selected === null && <span className="small muted">You skipped this question.</span>}
              {q.explanation && <p className="small muted"><strong>Explanation:</strong> {q.explanation}</p>}
            </div>
          ))}
        </div>
      </Card>
      <div><button className="btn" onClick={onAgain}>Take another test</button></div>
    </div>
  );
}
