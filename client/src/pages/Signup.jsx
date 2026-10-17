import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../services/api.js';
import { Spinner } from '../components/ui.jsx';

export default function Signup() {
  const { user, signup } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  if (user) return <Navigate to="/dashboard" replace />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setBusy(true);
    try { await signup(form.name, form.email, form.password); nav('/profile', { replace: true }); }
    catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <AuthShell>
      <div><h1>Create your account</h1><p className="muted">It takes under a minute.</p></div>
      <form className="stack" onSubmit={submit}>
        {error && <div className="alert err" role="alert">{error}</div>}
        <label className="f">Full name<input className="input" required autoComplete="name" value={form.name} onChange={set('name')} /></label>
        <label className="f">Email<input className="input" type="email" required autoComplete="email" value={form.email} onChange={set('email')} /></label>
        <label className="f">Password<input className="input" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={set('password')} /><span className="hint">At least 8 characters, with a letter and a number.</span></label>
        <label className="f">Confirm password<input className="input" type="password" required autoComplete="new-password" value={form.confirm} onChange={set('confirm')} /></label>
        <button className="btn block" disabled={busy}>{busy ? <Spinner /> : 'Create account'}</button>
      </form>
      <p className="muted center small">Already registered? <Link to="/login">Log in</Link></p>
    </AuthShell>
  );
}
