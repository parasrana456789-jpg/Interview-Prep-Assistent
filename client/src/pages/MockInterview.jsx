import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, ChevronLeft, ChevronRight, Sparkles, Lightbulb } from 'lucide-react';
import { interviewService } from '../services/services.js';
import { errMsg } from '../services/api.js';
import useAsync from '../hooks/useAsync.js';
import { Card, PageHead, Tabs, AiLoader, Ring, ScoreBadge, Empty, Spinner } from '../components/ui.jsx';
import { fmtDateTime, fmtTime } from '../lib/utils.js';

const ROLES = ['Software Developer', 'Web Developer', 'Data Analyst', 'QA / Test Engineer', 'Business Analyst', 'General Fresher'];
const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

export default function MockInterview() {
  const [tab, setTab] = useState('new');
  const [phase, setPhase] = useState('setup'); // setup | loading | session | submitting | result
  const [cfg, setCfg] = useState({ type: 'HR', role: ROLES[0], difficulty: 'Medium', count: 5 });
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [cur, setCur] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [listening, setListening] = useState(false);
  const startedAt = useRef(0);
  const rec = useRef(null);
  const history = useAsync(interviewService.history, []);

  useEffect(() => () => rec.current?.stop(), []);

  const start = async () => {
    setError(''); setPhase('loading');
    try {
      const s = await interviewService.start(cfg);
      setSession(s); setAnswers(Array(s.questions.length).fill('')); setCur(0); startedAt.current = Date.now(); setPhase('session');
    } catch (e) { setError(errMsg(e)); setPhase('setup'); }
  };

  const toggleMic = () => {
    if (listening) { rec.current?.stop(); return; }
    const r = new SR();
    r.lang = 'en-IN'; r.interimResults = false; r.continuous = true;
    r.onresult = (ev) => {
      const text = Array.from(ev.results).slice(ev.resultIndex).map((x) => x[0].transcript).join(' ');
      setAnswers((a) => a.map((x, i) => (i === cur ? `${x}${x ? ' ' : ''}${text.trim()}` : x)));
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r; r.start(); setListening(true);
  };

  const finish = async () => {
    rec.current?.stop();
    setPhase('submitting'); setError('');
    try {
      const { result } = await interviewService.submit({ token: session.token, answers, durationSec: Math.round((Date.now() - startedAt.current) / 1000) });
      setResult(result); setPhase('result'); history.reload();
    } catch (e) { setError(errMsg(e)); setPhase('session'); }
  };

  const reset = () => { setPhase('setup'); setSession(null); setResult(null); setError(''); };
  const inSetup = phase === 'setup';

  return (
    <div className="stack">
      <PageHead title="Mock interview" subtitle="Answer like it is the real thing. You get scores for communication, confidence and technical depth." action={inSetup && <Tabs value={tab} onChange={setTab} items={[['new', 'New interview'], ['history', 'History']]} />} />

      {inSetup && tab === 'history' ? (
        <Card>{history.loading ? <Spinner /> : !history.data?.results.length ? <Empty title="No interviews yet">Finish a mock interview to build your history.</Empty> : (
          <div className="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Role</th><th>Comm.</th><th>Confidence</th><th>Technical</th><th>Overall</th></tr></thead><tbody>
            {history.data.results.map((r) => <tr key={r._id}><td>{fmtDateTime(r.createdAt)}</td><td>{r.type}</td><td>{r.role}</td><td>{r.communicationScore}</td><td>{r.confidenceScore}</td><td>{r.technicalScore}</td><td><ScoreBadge value={r.overallScore} /></td></tr>)}
          </tbody></table></div>)}</Card>
      ) : inSetup ? (
        <Card title="Choose your interview">
          <div className="stack" style={{ maxWidth: 560 }}>
            {error && <div className="alert err" role="alert">{error}</div>}
            <div className="grid g2">{[['HR', 'HR interview', 'Behavioural and situational questions'], ['Technical', 'Technical interview', 'Concepts and problem solving']].map(([k, t, s]) => (
              <button key={k} className={`opt ${cfg.type === k ? 'sel' : ''}`} onClick={() => setCfg({ ...cfg, type: k })} style={{ flexDirection: 'column', gap: 2 }}><span>{t}</span><span className="small muted" style={{ fontWeight: 500 }}>{s}</span></button>))}</div>
            <label className="f">Target role<select className="input" value={cfg.role} onChange={(e) => setCfg({ ...cfg, role: e.target.value })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></label>
            <div className="grid g2">
              <label className="f">Difficulty<select className="input" value={cfg.difficulty} onChange={(e) => setCfg({ ...cfg, difficulty: e.target.value })}>{['Easy', 'Medium', 'Hard'].map((d) => <option key={d}>{d}</option>)}</select></label>
              <label className="f">Questions<select className="input" value={cfg.count} onChange={(e) => setCfg({ ...cfg, count: +e.target.value })}>{[3, 5, 7, 10].map((n) => <option key={n}>{n}</option>)}</select></label>
            </div>
            <button className="btn" onClick={start}><Sparkles size={16} />Start interview</button>
          </div>
        </Card>
      ) : phase === 'loading' ? <Card><AiLoader text="Your interviewer is preparing questions…" /></Card>
      : phase === 'submitting' ? <Card><AiLoader text="Evaluating your answers…" /></Card>
      : phase === 'session' ? (
        <Card>
          <div className="row between" style={{ marginBottom: 8 }}><span className="chip">{session.type} · Question {cur + 1} of {session.questions.length}</span><span className="small muted">{answers.filter((a) => a.trim()).length} answered</span></div>
          <div className="bar" style={{ marginBottom: 18 }}><i style={{ width: `${((cur + 1) / session.questions.length) * 100}%` }} /></div>
          <h2 style={{ fontWeight: 600, lineHeight: 1.5 }}>{session.questions[cur].question}</h2>
          {session.questions[cur].hint && <p className="small muted row" style={{ marginTop: 8, alignItems: 'flex-start' }}><Lightbulb size={15} style={{ flex: 'none', marginTop: 3 }} />{session.questions[cur].hint}</p>}
          <textarea className="input" style={{ marginTop: 16, minHeight: 180 }} placeholder="Type your answer, or use the microphone to dictate…" maxLength={3000} value={answers[cur]} onChange={(e) => setAnswers((a) => a.map((x, i) => (i === cur ? e.target.value : x)))} />
          {error && <div className="alert err" style={{ marginTop: 12 }} role="alert">{error}</div>}
          <div className="row between wrap" style={{ marginTop: 16 }}>
            <div className="row">
              <button className="btn ghost" disabled={cur === 0} onClick={() => { rec.current?.stop(); setCur(cur - 1); }}><ChevronLeft size={16} />Back</button>
              {SR && <button className={`btn ${listening ? 'danger' : 'soft'}`} onClick={toggleMic}>{listening ? <MicOff size={16} /> : <Mic size={16} />}{listening ? 'Stop' : 'Dictate'}</button>}
            </div>
            {cur < session.questions.length - 1 ? <button className="btn" onClick={() => { rec.current?.stop(); setCur(cur + 1); }}>Next<ChevronRight size={16} /></button> : <button className="btn" onClick={finish}>Finish and get feedback</button>}
          </div>
        </Card>
      ) : <Result r={result} onAgain={reset} />}
    </div>
  );
}

function Result({ r, onAgain }) {
  return (
    <div className="stack">
      <Card title="Your scores">
        <div className="grid g4" style={{ justifyItems: 'center' }}>
          <Ring value={r.overallScore} size={118} stroke={11} label="overall" />
          <Ring value={r.communicationScore} size={92} label="communication" />
          <Ring value={r.confidenceScore} size={92} label="confidence" />
          <Ring value={r.technicalScore} size={92} label={r.type === 'HR' ? 'content' : 'technical'} />
        </div>
        <p style={{ marginTop: 18 }}>{r.summary}</p>
        {r.durationSec > 0 && <p className="small muted" style={{ marginTop: 6 }}>Interview length {fmtTime(r.durationSec)}</p>}
      </Card>
      <div className="grid g2">
        <Card title="Strengths"><ul style={{ margin: 0, paddingLeft: 18 }}>{r.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul></Card>
        <Card title="Work on"><ul style={{ margin: 0, paddingLeft: 18 }}>{r.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul></Card>
      </div>
      <Card title="Question by question">
        <div className="stack">{r.answers.map((a, i) => (
          <div key={i} className="sub-card stack sm">
            <div className="row between" style={{ alignItems: 'flex-start' }}><strong>{i + 1}. {a.question}</strong><span className={`badge ${a.score >= 7 ? 'good' : a.score >= 4 ? 'mid' : 'bad'}`}>{a.score}/10</span></div>
            <div><div className="small muted">Your answer</div><p style={{ whiteSpace: 'pre-wrap' }}>{a.answer || '(skipped)'}</p></div>
            <div><div className="small muted">Feedback</div><p>{a.feedback}</p></div>
            {a.idealAnswer && <div><div className="small muted">A strong answer</div><p>{a.idealAnswer}</p></div>}
          </div>))}</div>
      </Card>
      <div><button className="btn" onClick={onAgain}>Start another interview</button></div>
    </div>
  );
}
