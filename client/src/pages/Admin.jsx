import { useEffect, useState } from 'react';
import { Users, Activity, ClipboardList, FileText, Trash2, ShieldCheck, ShieldOff, Search } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar as RBar } from 'recharts';
import { adminService } from '../services/services.js';
import { errMsg } from '../services/api.js';
import useAsync from '../hooks/useAsync.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, PageHead, Tabs, StatCard, Skeleton, ErrorBox, Spinner, Empty, ScoreBadge } from '../components/ui.jsx';
import { fmtDate, timeAgo } from '../lib/utils.js';

const tip = { contentStyle: { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 } };

export default function Admin() {
  const [tab, setTab] = useState('overview');
  return (
    <div className="stack">
      <PageHead title="Admin panel" subtitle="Platform usage, users and performance reports." action={<Tabs value={tab} onChange={setTab} items={[['overview', 'Overview'], ['users', 'Users'], ['reports', 'Reports']]} />} />
      {tab === 'overview' ? <Overview /> : tab === 'users' ? <UsersTab /> : <Reports />}
    </div>
  );
}

function Overview() {
  const { data, loading, error, reload } = useAsync(adminService.overview, []);
  if (loading) return <div className="grid g4">{[...Array(4)].map((_, i) => <Skeleton key={i} h={96} />)}</div>;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const { totals: t, averages: a, daily } = data;
  const short = daily.map((d) => ({ ...d, day: d.date.slice(5) }));
  return (
    <div className="stack">
      <div className="grid g4">
        <StatCard label="Total users" value={t.users} icon={Users} />
        <StatCard label="Active (7 days)" value={t.activeUsers7d} icon={Activity} color="green" />
        <StatCard label="Tests taken" value={t.tests} icon={ClipboardList} color="amber" />
        <StatCard label="Resumes saved" value={t.resumes} icon={FileText} color="red" />
      </div>
      <div className="grid g2">
        <Card title="Platform usage, last 14 days"><div style={{ height: 260 }}><ResponsiveContainer><LineChart data={short} margin={{ left: -20, right: 8 }}><CartesianGrid stroke="var(--line)" vertical={false} /><XAxis dataKey="day" stroke="var(--muted)" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} stroke="var(--muted)" tick={{ fontSize: 11 }} /><Tooltip {...tip} /><Legend wrapperStyle={{ fontSize: 12 }} />
          <Line dataKey="aptitude" name="Aptitude" stroke="var(--primary)" strokeWidth={2} dot={false} /><Line dataKey="coding" name="Coding" stroke="var(--green)" strokeWidth={2} dot={false} /><Line dataKey="interview" name="Interview" stroke="var(--amber)" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></Card>
        <Card title="New signups per day"><div style={{ height: 260 }}><ResponsiveContainer><BarChart data={short} margin={{ left: -20, right: 8 }}><CartesianGrid stroke="var(--line)" vertical={false} /><XAxis dataKey="day" stroke="var(--muted)" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} stroke="var(--muted)" tick={{ fontSize: 11 }} /><Tooltip {...tip} /><RBar dataKey="signups" name="Signups" fill="var(--primary)" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
      </div>
      <Card title="Module summary">
        <div className="table-wrap"><table><thead><tr><th>Module</th><th>Attempts</th><th>Average score</th></tr></thead><tbody>
          <tr><td>Aptitude</td><td>{t.aptitude}</td><td><ScoreBadge value={a.aptitude} /></td></tr><tr><td>Coding</td><td>{t.coding}</td><td><ScoreBadge value={a.coding} /></td></tr><tr><td>Mock interview</td><td>{t.interview}</td><td><ScoreBadge value={a.interview} /></td></tr>
        </tbody></table></div>
        <p className="small muted" style={{ marginTop: 10 }}>{t.newUsers7d} new users this week · {t.admins} admin{t.admins === 1 ? '' : 's'}</p>
      </Card>
    </div>
  );
}

function UsersTab() {
  const toast = useToast();
  const { user: me } = useAuth();
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => { const t = setTimeout(() => { setQuery(q); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);
  useEffect(() => { adminService.users({ q: query, page, limit: 10 }).then(setData).catch((e) => setError(errMsg(e))); }, [query, page, tick]);

  const act = async (fn, ok) => { try { await fn(); toast.success(ok); setTick((n) => n + 1); } catch (e) { toast.error(errMsg(e)); } };
  const remove = (u) => { if (window.confirm(`Delete ${u.name} and all their data? This cannot be undone.`)) act(() => adminService.deleteUser(u._id), 'User deleted'); };

  return (
    <Card>
      <div style={{ position: 'relative', maxWidth: 360, marginBottom: 14 }}><Search size={16} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--muted)' }} /><input className="input" style={{ paddingLeft: 36 }} placeholder="Search by name or email" aria-label="Search users" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <ErrorBox message={error} />
      {!data ? <Spinner /> : data.users.length === 0 ? <Empty title="No users found">Try a different search.</Empty> : (
        <>
          <div className="table-wrap"><table><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Tests</th><th>Joined</th><th>Last login</th><th /></tr></thead><tbody>
            {data.users.map((u) => { const self = u._id === me.id; return (
              <tr key={u._id}><td><strong>{u.name}</strong><div className="small muted">{u.email}</div></td>
                <td><span className={`badge ${u.role === 'admin' ? 'mid' : ''}`}>{u.role}</span></td><td><span className={`badge ${u.isActive ? 'good' : 'bad'}`}>{u.isActive ? 'Active' : 'Disabled'}</span></td>
                <td>{u.tests}</td><td>{fmtDate(u.createdAt)}</td><td>{u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'Never'}</td>
                <td><div className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
                  <button className="btn ghost sm" disabled={self} onClick={() => act(() => adminService.updateUser(u._id, { role: u.role === 'admin' ? 'user' : 'admin' }), 'Role updated')} title={u.role === 'admin' ? 'Make regular user' : 'Make admin'} aria-label="Toggle admin">{u.role === 'admin' ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}</button>
                  <button className="btn ghost sm" disabled={self} onClick={() => act(() => adminService.updateUser(u._id, { isActive: !u.isActive }), u.isActive ? 'User disabled' : 'User enabled')}>{u.isActive ? 'Disable' : 'Enable'}</button>
                  <button className="btn danger sm" disabled={self} onClick={() => remove(u)} aria-label="Delete user"><Trash2 size={14} /></button></div></td></tr>); })}
          </tbody></table></div>
          <div className="row between" style={{ marginTop: 14 }}><span className="small muted">{data.total} users</span><div className="row"><button className="btn ghost sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span className="small muted">{data.page} / {data.pages || 1}</span><button className="btn ghost sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button></div></div>
        </>
      )}
    </Card>
  );
}

function Reports() {
  const { data, loading, error, reload } = useAsync(adminService.reports, []);
  if (loading) return <Skeleton h={300} />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  return (
    <div className="stack">
      <div className="grid g2">
        <Card title="Most active users">{data.mostActive.length === 0 ? <Empty title="No activity yet">Reports fill in as users take tests.</Empty> : data.mostActive.map((u, i) => <div key={i} className="list-item"><div className="grow"><strong>{u.name}</strong><div className="small muted">{u.email}</div></div><span className="badge">{u.tests} tests</span></div>)}</Card>
        <Card title="Weakest aptitude topics (all users)">{data.weakestTopics.length === 0 ? <Empty title="No data yet">Topic accuracy appears after aptitude tests.</Empty> : <div style={{ height: 280 }}><ResponsiveContainer><BarChart data={data.weakestTopics} layout="vertical" margin={{ left: 10, right: 16 }}><CartesianGrid stroke="var(--line)" horizontal={false} /><XAxis type="number" domain={[0, 100]} stroke="var(--muted)" unit="%" /><YAxis type="category" dataKey="topic" width={120} stroke="var(--muted)" tick={{ fontSize: 11 }} /><Tooltip {...tip} /><RBar dataKey="accuracy" name="Accuracy" fill="var(--amber)" radius={[0, 5, 5, 0]} barSize={16} /></BarChart></ResponsiveContainer></div>}</Card>
      </div>
      <div className="grid g2">
        <Card title="Coding by language"><div className="table-wrap"><table><thead><tr><th>Language</th><th>Attempts</th><th>Avg score</th></tr></thead><tbody>{data.languages.length === 0 ? <tr><td colSpan="3" className="muted">No submissions yet</td></tr> : data.languages.map((l) => <tr key={l.language}><td>{l.language}</td><td>{l.attempts}</td><td><ScoreBadge value={l.avgScore} /></td></tr>)}</tbody></table></div></Card>
        <Card title="Interviews by type"><div className="table-wrap"><table><thead><tr><th>Type</th><th>Attempts</th><th>Avg score</th></tr></thead><tbody>{data.interviewTypes.length === 0 ? <tr><td colSpan="3" className="muted">No interviews yet</td></tr> : data.interviewTypes.map((l) => <tr key={l.type}><td>{l.type}</td><td>{l.attempts}</td><td><ScoreBadge value={l.avgScore} /></td></tr>)}</tbody></table></div></Card>
      </div>
    </div>
  );
}
