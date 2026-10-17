import { Link } from 'react-router-dom';
import { Brain, Code2, MessagesSquare, Library, FileText, TrendingUp, ClipboardList, Target } from 'lucide-react';
import { analyticsService } from '../services/services.js';
import useAsync from '../hooks/useAsync.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, StatCard, Ring, Avatar, Empty, ScoreBadge, Skeleton, ErrorBox, Bar } from '../components/ui.jsx';
import { timeAgo } from '../lib/utils.js';

const TYPE = { aptitude: [Brain, '/aptitude', ''], coding: [Code2, '/coding', 'green'], interview: [MessagesSquare, '/interview', 'amber'] };
const QUICK = [
  ['/aptitude', Brain, 'Aptitude test', 'Timed MCQs for your role'], ['/coding', Code2, 'Coding practice', 'Write and run real code'],
  ['/interview', MessagesSquare, 'Mock interview', 'HR or technical, with feedback'], ['/questions', Library, 'Question bank', 'Revise 7 core subjects'],
  ['/resume', FileText, 'Resume builder', 'Download a clean PDF'], ['/analytics', TrendingUp, 'Progress', 'Charts and weak topics'],
];

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(analyticsService.dashboard, []);

  if (loading) return <div className="stack"><Skeleton h={150} /><div className="grid g5">{[...Array(5)].map((_, i) => <Skeleton key={i} h={96} />)}</div><Skeleton h={260} /></div>;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const { stats, recent, profile } = data;
  const name = profile.fullName || user.name;
  const comp = profile.completion;

  return (
    <div className="stack">
      <div className="card hero">
        <div className="row" style={{ gap: 18, alignItems: 'flex-start' }}>
          <Avatar src={profile.avatar} name={name} size="lg" />
          <div className="grow stack sm">
            <h1 style={{ color: '#fff' }}>Welcome back, {name.split(' ')[0]}</h1>
            <p>{profile.careerGoal || (stats.totalTests ? `You have completed ${stats.totalTests} practice ${stats.totalTests === 1 ? 'session' : 'sessions'}.` : 'Take your first test to get a readiness score.')}</p>
            <div style={{ maxWidth: 360, marginTop: 6 }}>
              <div className="row between small" style={{ marginBottom: 6 }}><span>Profile {comp.percent}% complete</span>{comp.percent < 100 && <Link to="/profile" style={{ color: '#ffd37a' }}>Finish profile</Link>}</div>
              <Bar value={comp.percent} className="" />
            </div>
          </div>
        </div>
        <div className="center"><Ring value={stats.averageScore} size={118} stroke={11} label="average" color="var(--amber)" /></div>
      </div>

      <div className="grid g5">
        <StatCard label="Tests attempted" value={stats.totalTests} icon={ClipboardList} />
        <StatCard label="Aptitude" value={stats.aptitudeAvg} suffix="%" icon={Brain} />
        <StatCard label="Coding" value={stats.codingAvg} suffix="%" icon={Code2} color="green" />
        <StatCard label="Interview" value={stats.interviewAvg} suffix="%" icon={MessagesSquare} color="amber" />
        <StatCard label="Average score" value={stats.averageScore} suffix="%" icon={Target} color="red" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,3fr) minmax(0,2fr)' }} id="dash-split">
        <Card title="Recent activity" action={<Link className="small" to="/analytics">View progress</Link>}>
          {recent.length === 0 ? <Empty title="No activity yet" action={<Link className="btn sm" to="/aptitude">Take an aptitude test</Link>}>Your tests and interviews will show up here.</Empty> : recent.map((r, i) => {
            const [Icon, to, color] = TYPE[r.type];
            return (
              <div className="list-item" key={i}>
                <span className={`ico ${color}`}><Icon size={16} /></span>
                <div className="grow"><Link to={to} style={{ color: 'var(--ink)' }}>{r.title}</Link><div className="small muted">{r.detail} · {timeAgo(r.createdAt)}</div></div>
                <ScoreBadge value={r.score} />
              </div>
            );
          })}
        </Card>

        <Card title="Your profile" action={<Link className="small" to="/profile">Edit</Link>}>
          <div className="stack sm">
            <div><strong>{name}</strong><div className="small muted">{[profile.degree, profile.branch].filter(Boolean).join(' · ') || 'Add your degree and branch'}</div></div>
            <div className="small muted">{profile.college || 'College not added'}{profile.semester ? ` · Semester ${profile.semester}` : ''}</div>
            <div className="row wrap" style={{ gap: 6 }}>{profile.skills?.length ? profile.skills.slice(0, 8).map((s) => <span className="chip" key={s}>{s}</span>) : <span className="small muted">No skills added yet</span>}</div>
            {comp.missing?.length > 0 && <div className="alert info small">Still missing: {comp.missing.slice(0, 4).join(', ')}{comp.missing.length > 4 ? '…' : ''}</div>}
          </div>
        </Card>
      </div>

      <Card title="Quick access">
        <div className="grid g3">{QUICK.map(([to, Icon, t, s]) => <Link key={to} to={to} className="quick"><span className="ico"><Icon size={16} /></span>{t}<span>{s}</span></Link>)}</div>
      </Card>
      <style>{`@media (max-width: 860px){ #dash-split{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
