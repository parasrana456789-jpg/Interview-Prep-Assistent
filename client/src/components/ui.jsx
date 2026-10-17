import { initials, tone } from '../lib/utils.js';

export const Spinner = () => <span className="spinner" aria-label="Loading" />;
export const PageLoader = () => <div className="page-loader"><Spinner /></div>;

export function AiLoader({ text = 'Working on it…' }) {
  return (
    <div className="ai-loader" role="status">
      <div className="dots"><i /><i /><i /></div>
      <div><strong>{text}</strong><div className="small">AI responses can take 10–20 seconds.</div></div>
    </div>
  );
}

export const Skeleton = ({ h = 90 }) => <div className="skeleton" style={{ height: h }} />;

export function Card({ title, action, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && <div className="card-head">{title && <h2>{title}</h2>}{action}</div>}
      {children}
    </section>
  );
}

export function StatCard({ label, value, suffix, icon: Icon, color = '' }) {
  return (
    <div className="card stat">
      <div className="k">{Icon && <span className={`ico ${color}`}><Icon size={16} /></span>}{label}</div>
      <div className="v">{value}{suffix && <small> {suffix}</small>}</div>
    </div>
  );
}

export function Ring({ value = 0, size = 96, stroke = 9, label, color }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, value));
  const col = color || (tone(v) === 'good' ? 'var(--green)' : tone(v) === 'mid' ? 'var(--amber)' : 'var(--red)');
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity=".14" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * v) / 100} style={{ transition: 'stroke-dashoffset .8s ease' }} />
      </svg>
      <div className="num" style={{ fontSize: size / 4.2 }}>{Math.round(v)}%{label && <small>{label}</small>}</div>
    </div>
  );
}

export const Bar = ({ value, className }) => <div className={`bar ${className ?? tone(value)}`}><i style={{ width: `${Math.max(2, Math.min(100, value))}%` }} /></div>;
export const ScoreBadge = ({ value }) => <span className={`badge ${tone(value)}`}>{Math.round(value)}%</span>;

export function Avatar({ src, name, size = '' }) {
  return <div className={`avatar ${size}`}>{src ? <img src={src} alt={name ? `${name} profile` : 'Profile'} /> : initials(name)}</div>;
}

export function Empty({ title, children, action }) {
  return <div className="empty"><h3>{title}</h3><p>{children}</p>{action && <div style={{ marginTop: 14 }}>{action}</div>}</div>;
}

export function PageHead({ title, subtitle, action }) {
  return <div className="page-head"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</div>;
}

export function Tabs({ value, onChange, items }) {
  return <div className="tabs" role="tablist">{items.map(([k, label]) => <button key={k} role="tab" aria-selected={value === k} className={value === k ? 'on' : ''} onClick={() => onChange(k)}>{label}</button>)}</div>;
}

export const ErrorBox = ({ message, onRetry }) => message ? <div className="alert err row between"><span>{message}</span>{onRetry && <button className="btn sm ghost" onClick={onRetry}>Retry</button>}</div> : null;
