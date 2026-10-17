import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AuthShell from './AuthShell.jsx';
import { authService } from '../services/services.js';
import { errMsg } from '../services/api.js';
import { Spinner } from '../components/ui.jsx';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try { setMsg(await authService.forgot(email)); } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <AuthShell>
      <div><h1>Reset your password</h1><p className="muted">Enter your email and we will send you a reset link.</p></div>
      {msg ? (
        <div className="stack">
          <div className="alert ok">{msg.message}</div>
          {msg.devResetLink && <div className="alert info small">Development mode (no email server set up): <a href={msg.devResetLink}>open the reset link</a></div>}
        </div>
      ) : (
        <form className="stack" onSubmit={submit}>
          {error && <div className="alert err" role="alert">{error}</div>}
          <label className="f">Email<input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <button className="btn block" disabled={busy}>{busy ? <Spinner /> : 'Send reset link'}</button>
        </form>
      )}
      <p className="center small"><Link to="/login">Back to log in</Link></p>
    </AuthShell>
  );
}

export function ResetPassword() {
  const { token } = useParams();
  const nav = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setBusy(true);
    try { await authService.reset(token, form.password); setDone(true); setTimeout(() => nav('/login'), 1800); }
    catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <AuthShell>
      <div><h1>Choose a new password</h1><p className="muted">Use at least 8 characters with a letter and a number.</p></div>
      {done ? <div className="alert ok">Password updated. Redirecting to log in…</div> : (
        <form className="stack" onSubmit={submit}>
          {error && <div className="alert err" role="alert">{error}</div>}
          <label className="f">New password<input className="input" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          <label className="f">Confirm password<input className="input" type="password" required autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} /></label>
          <button className="btn block" disabled={busy}>{busy ? <Spinner /> : 'Update password'}</button>
        </form>
      )}
      <p className="center small"><Link to="/login">Back to log in</Link></p>
    </AuthShell>
  );
}
