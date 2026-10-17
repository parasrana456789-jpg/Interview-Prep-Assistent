import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, RadialBarChart, RadialBar } from 'recharts';
import { Lightbulb, ArrowRight, AlertTriangle } from 'lucide-react';
import { analyticsService } from '../services/services.js';
import useAsync from '../hooks/useAsync.js';
import { Card, PageHead, Empty, Skeleton, ErrorBox, Bar } from '../components/ui.jsx';

const tip = { contentStyle: { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 } };

function Trend({ title, data, lines, to, cta }) {
  return (
    <Card title={title}>
      {data.length === 0 ? <Empty title="No data yet" action={<Link className="btn sm" to={to}>{cta}</Link>}>Complete an attempt to see your trend.</Empty> : (
        <div style={{ height: 230 }}><ResponsiveContainer>
          <LineChart data={data.map((d, i) => ({ ...d, n: i + 1 }))} margin={{ left: -18, right: 10, top: 6 }}>
            <CartesianGrid stroke="var(--line)" vertical={false} /><XAxis dataKey="n" stroke="var(--muted)" tick={{ fontSize: 12 }} label={{ value: 'Attempt', position: 'insideBottom', offset: -2, fill: 'var(--muted)', fontSize: 11 }} height={36} />
            <YAxis domain={[0, 100]} stroke="var(--muted)" tick={{ fontSize: 12 }} /><Tooltip {...tip} labelFormatter={(n, p) => `Attempt ${n}${p?.[0]?.payload?.date ? ` · ${p[0].payload.date}` : ''}`} />
            {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {lines.map(([key, name, color]) => <Line key={key} type="monotone" dataKey={key} name={name} stroke={color} strokeWidth={2.5} dot={{ r: 3 }} />)}
          </LineChart></ResponsiveContainer></div>
      )}
    </Card>
  );
}

export default function Analytics() {
  const { data, loading, error, reload } = useAsync(analyticsService.progress, []);
  if (loading) return <div className="stack"><Skeleton h={260} /><Skeleton h={260} /></div>;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const { series, weakTopics, suggestions, recommendations } = data;

  const latest = series.interview.at(-1);
  const radial = latest ? [{ name: 'Technical', value: latest.technical, fill: 'var(--green)' }, { name: 'Confidence', value: latest.confidence, fill: 'var(--amber)' }, { name: 'Communication', value: latest.communication, fill: 'var(--primary)' }] : [];

  return (
    <div className="stack">
      <PageHead title="Progress" subtitle="Scores over time, the topics holding you back, and what to practise next." />
      <div className="grid g2">
        <Trend title="Aptitude progress" data={series.aptitude} lines={[['score', 'Score', 'var(--primary)']]} to="/aptitude" cta="Take a test" />
        <Trend title="Coding progress" data={series.coding} lines={[['score', 'Score', 'var(--green)']]} to="/coding" cta="Solve a problem" />
      </div>
      <div className="grid g2">
        <Trend title="Interview progress" data={series.interview} lines={[['score', 'Overall', 'var(--primary)'], ['communication', 'Communication', 'var(--amber)'], ['confidence', 'Confidence', 'var(--red)'], ['technical', 'Technical', 'var(--green)']]} to="/interview" cta="Start an interview" />
        <Card title="Latest interview breakdown">
          {!latest ? <Empty title="No interviews yet">Your latest scores by skill will appear here.</Empty> : (
            <div style={{ height: 230 }}><ResponsiveContainer><RadialBarChart innerRadius="30%" outerRadius="100%" data={radial} startAngle={90} endAngle={-270}><RadialBar dataKey="value" background cornerRadius={8} label={{ position: 'insideStart', fill: '#fff', fontSize: 11 }} /><Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} /><Tooltip {...tip} /></RadialBarChart></ResponsiveContainer></div>
          )}
        </Card>
      </div>

      <div className="grid g2">
        <Card title="Weak topics">
          {weakTopics.length === 0 ? <Empty title="No weak topics detected">Topics below 60% show up here once you have enough attempts.</Empty> : (
            <div className="stack">{weakTopics.map((w, i) => (
              <div key={i}><div className="row between small" style={{ marginBottom: 6 }}><span className="row" style={{ gap: 8 }}><AlertTriangle size={15} color="var(--amber)" /><strong>{w.topic}</strong><span className="badge">{w.module}</span></span><span className="muted">{w.score}% · {w.attempts} {w.module === 'Aptitude' ? 'questions' : 'attempts'}</span></div><Bar value={w.score} /></div>
            ))}</div>
          )}
        </Card>
        <Card title="Improvement suggestions">
          {suggestions.length === 0 ? <Empty title="Nothing yet">Suggestions appear as you complete tests.</Empty> : (
            <div className="stack sm">{suggestions.map((s, i) => <div key={i} className="row" style={{ alignItems: 'flex-start' }}><span className="ico amber"><Lightbulb size={15} /></span><p className="grow">{s}</p></div>)}</div>
          )}
        </Card>
      </div>

      <Card title="Recommended next steps">
        <div className="grid g3">{recommendations.map((r, i) => <Link key={i} to={r.link} className="quick">{r.title}<span>{r.description}</span><span className="row" style={{ gap: 4, color: 'var(--primary)', fontWeight: 700 }}>Start <ArrowRight size={14} /></span></Link>)}</div>
      </Card>
    </div>
  );
}
