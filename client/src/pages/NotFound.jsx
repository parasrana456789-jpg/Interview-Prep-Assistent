import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page-loader" style={{ minHeight: '100vh', color: 'var(--ink)' }}>
      <div className="center stack sm"><h1>Page not found</h1><p className="muted">That address does not exist.</p><Link className="btn" to="/dashboard">Go to dashboard</Link></div>
    </div>
  );
}
