import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../services/api.js';
import { Spinner } from '../components/ui.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try { await login(form.email, form.password); nav(loc.state?.from || '/dashboard', { replace: true }); }
    catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <AuthShell>
      <div><h1>Welcome back</h1><p className="muted">Log in to continue your preparation.</p></div>
      <form className="stack" onSubmit={submit}>
        {error && <div className="alert err" role="alert">{error}</div>}
        <label className="f">Email<input className="input" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label className="f">Password<input className="input" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <div className="row between small"><span /><Link to="/forgot-password">Forgot password?</Link></div>
        <button className="btn block" disabled={busy}>{busy ? <Spinner /> : 'Log in'}</button>
      </form>
      <p className="muted center small">New here? <Link to="/signup">Create an account</Link></p>
    </AuthShell>
  );
}
