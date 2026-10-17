import { useEffect, useRef, useState } from 'react';
import { Camera, Pencil, Save, X, Trash2 } from 'lucide-react';
import { profileService } from '../services/services.js';
import { errMsg } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, PageHead, Avatar, Ring, PageLoader, ErrorBox, Spinner } from '../components/ui.jsx';
import { resizeImage } from '../lib/utils.js';

const EMPTY = { fullName: '', phone: '', dob: '', gender: '', college: '', degree: '', branch: '', semester: '', skills: '', linkedin: '', github: '', portfolio: '', careerGoal: '' };

const toForm = (p) => ({ ...EMPTY, ...p, dob: p.dob ? p.dob.slice(0, 10) : '', semester: p.semester ?? '', skills: (p.skills || []).join(', ') });

export default function Profile() {
  const toast = useToast();
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const load = () => profileService.get().then(({ profile }) => { setProfile(profile); setForm(toForm(profile)); }).catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, []);

  if (error && !profile) return <ErrorBox message={error} onRetry={load} />;
  if (!profile) return <PageLoader />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const ro = !editing;

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const { profile: p } = await profileService.update(form);
      setProfile(p); setForm(toForm(p)); setEditing(false); refreshUser();
      toast.success('Profile saved');
    } catch (err) { setError(errMsg(err)); } finally { setSaving(false); }
  };
  const cancel = () => { setForm(toForm(profile)); setEditing(false); setError(''); };

  const onFile = async (e) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const blob = await resizeImage(file);
      const { profile: p } = await profileService.uploadAvatar(blob);
      setProfile(p); toast.success('Photo updated');
    } catch (err) { toast.error(err.response ? errMsg(err) : err.message); } finally { setUploading(false); }
  };
  const removePhoto = async () => { const { profile: p } = await profileService.removeAvatar(); setProfile(p); toast.success('Photo removed'); };

  const comp = profile.completion;
  return (
    <form onSubmit={save}>
      <PageHead title="My profile" subtitle="Keep this up to date. Your resume and dashboard use it."
        action={editing ? <div className="row"><button type="button" className="btn ghost" onClick={cancel}><X size={16} />Cancel</button><button className="btn" disabled={saving}>{saving ? <Spinner /> : <Save size={16} />}Save profile</button></div>
          : <button type="button" className="btn" onClick={() => setEditing(true)}><Pencil size={16} />Edit profile</button>} />
      {error && <div className="alert err" style={{ marginBottom: 16 }} role="alert">{error}</div>}

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,2.2fr)', alignItems: 'start' }} id="prof-split">
        <div className="stack">
          <Card>
            <div className="stack center" style={{ alignItems: 'center' }}>
              <Avatar src={profile.avatar} name={form.fullName} size="xl" />
              <div className="row wrap" style={{ justifyContent: 'center' }}>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onFile} />
                <button type="button" className="btn soft sm" onClick={() => fileRef.current.click()} disabled={uploading}>{uploading ? <Spinner /> : <Camera size={15} />}{profile.avatar ? 'Change photo' : 'Upload photo'}</button>
                {profile.avatar && <button type="button" className="btn ghost sm" onClick={removePhoto} aria-label="Remove photo"><Trash2 size={15} /></button>}
              </div>
              <div><strong>{profile.fullName}</strong><div className="small muted">{profile.email}</div></div>
            </div>
          </Card>
          <Card title="Profile completion">
            <div className="row" style={{ gap: 16 }}>
              <Ring value={comp.percent} size={84} />
              <div className="small muted grow">{comp.percent === 100 ? 'Your profile is complete.' : <>Add: {comp.missing.slice(0, 5).join(', ')}{comp.missing.length > 5 ? '…' : ''}</>}</div>
            </div>
          </Card>
        </div>

        <div className="stack">
          <Card title="Personal details">
            <div className="grid g2">
              <label className="f">Full name<input className="input" disabled={ro} required value={form.fullName} onChange={set('fullName')} /></label>
              <label className="f">Email<input className="input" disabled value={profile.email} /></label>
              <label className="f">Phone number<input className="input" disabled={ro} type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} /></label>
              <label className="f">Date of birth<input className="input" disabled={ro} type="date" max={new Date().toISOString().slice(0, 10)} value={form.dob} onChange={set('dob')} /></label>
              <label className="f">Gender<select className="input" disabled={ro} value={form.gender} onChange={set('gender')}><option value="">Select</option>{['Male', 'Female', 'Other', 'Prefer not to say'].map((g) => <option key={g}>{g}</option>)}</select></label>
            </div>
          </Card>
          <Card title="Education">
            <div className="grid g2">
              <label className="f">College name<input className="input" disabled={ro} value={form.college} onChange={set('college')} /></label>
              <label className="f">Degree<input className="input" disabled={ro} placeholder="B.Tech" value={form.degree} onChange={set('degree')} /></label>
              <label className="f">Branch<input className="input" disabled={ro} placeholder="Computer Science" value={form.branch} onChange={set('branch')} /></label>
              <label className="f">Current semester<select className="input" disabled={ro} value={form.semester} onChange={set('semester')}><option value="">Select</option>{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
            </div>
          </Card>
          <Card title="Skills and goals">
            <div className="stack">
              <label className="f">Skills<input className="input" disabled={ro} placeholder="Java, React, SQL" value={form.skills} onChange={set('skills')} /><span className="hint">Separate skills with commas.</span></label>
              <label className="f">Career goal<textarea className="input" disabled={ro} maxLength={500} placeholder="e.g. Backend developer at a product company" value={form.careerGoal} onChange={set('careerGoal')} /></label>
            </div>
          </Card>
          <Card title="Links">
            <div className="grid g3">
              <label className="f">LinkedIn URL<input className="input" disabled={ro} type="url" placeholder="https://linkedin.com/in/…" value={form.linkedin} onChange={set('linkedin')} /></label>
              <label className="f">GitHub URL<input className="input" disabled={ro} type="url" placeholder="https://github.com/…" value={form.github} onChange={set('github')} /></label>
              <label className="f">Portfolio URL<input className="input" disabled={ro} type="url" placeholder="https://…" value={form.portfolio} onChange={set('portfolio')} /></label>
            </div>
          </Card>
        </div>
      </div>
      <style>{`@media (max-width: 960px){ #prof-split{ grid-template-columns: 1fr !important; } }`}</style>
    </form>
  );
}
