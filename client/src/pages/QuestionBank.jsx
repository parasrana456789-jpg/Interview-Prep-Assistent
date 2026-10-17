import { useEffect, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { questionService } from '../services/services.js';
import { errMsg } from '../services/api.js';
import { Card, PageHead, Empty, Spinner, ErrorBox } from '../components/ui.jsx';

const CATS = ['Java', 'Python', 'DSA', 'DBMS', 'Operating System', 'Computer Networks', 'HR'];
const dtone = { Easy: 'good', Medium: 'mid', Hard: 'bad' };

export default function QuestionBank() {
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);

  useEffect(() => { const t = setTimeout(() => { setQuery(q); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);
  useEffect(() => {
    let live = true;
    setError('');
    questionService.list({ category, difficulty, q: query, page, limit: 10 }).then((d) => live && setData(d)).catch((e) => live && setError(errMsg(e)));
    return () => { live = false; };
  }, [category, difficulty, query, page]);

  const pick = (fn) => (v) => { fn(v); setPage(1); setOpen(null); };

  return (
    <div className="stack">
      <PageHead title="Question bank" subtitle="Core questions with short model answers. Say each one aloud before opening the answer." />
      <div className="row wrap">
        <button className={`chip ${category === '' ? 'on' : ''}`} onClick={() => pick(setCategory)('')}>All{data ? ` (${Object.values(data.counts).reduce((a, b) => a + b, 0)})` : ''}</button>
        {CATS.map((c) => <button key={c} className={`chip ${category === c ? 'on' : ''}`} onClick={() => pick(setCategory)(c)}>{c}{data?.counts[c] ? ` (${data.counts[c]})` : ''}</button>)}
      </div>
      <div className="row wrap">
        <div className="grow" style={{ position: 'relative', minWidth: 220 }}><Search size={16} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--muted)' }} /><input className="input" style={{ paddingLeft: 36 }} placeholder="Search questions" aria-label="Search questions" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select className="input" style={{ width: 160 }} aria-label="Difficulty" value={difficulty} onChange={(e) => pick(setDifficulty)(e.target.value)}><option value="">All levels</option>{['Easy', 'Medium', 'Hard'].map((d) => <option key={d}>{d}</option>)}</select>
      </div>
      <ErrorBox message={error} />
      {!data && !error ? <div className="page-loader"><Spinner /></div> : data && (
        data.items.length === 0 ? <Card><Empty title="No questions found">Try another category or search term.</Empty></Card> : (
          <div>
            {data.items.map((item) => (
              <div className="faq" key={item._id}>
                <button aria-expanded={open === item._id} onClick={() => setOpen(open === item._id ? null : item._id)}>
                  <span>{item.question}<span className="row" style={{ marginTop: 6, gap: 6 }}><span className="chip">{item.category}</span><span className={`badge ${dtone[item.difficulty]}`}>{item.difficulty}</span></span></span>
                  <ChevronDown size={18} style={{ transform: open === item._id ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flex: 'none' }} />
                </button>
                {open === item._id && <div className="ans">{item.answer}</div>}
              </div>
            ))}
            {data.pages > 1 && <div className="row between" style={{ marginTop: 16 }}><button className="btn ghost sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span className="small muted">Page {data.page} of {data.pages}</span><button className="btn ghost sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button></div>}
          </div>
        )
      )}
    </div>
  );
}
