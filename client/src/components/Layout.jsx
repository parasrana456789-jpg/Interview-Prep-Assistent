import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, User, Brain, Code2, MessagesSquare, Library, FileText, TrendingUp, ShieldCheck, Sun, Moon, Menu, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const NAV = [
  ['/dashboard', 'Dashboard', LayoutDashboard], ['/aptitude', 'Aptitude Test', Brain], ['/coding', 'Coding Practice', Code2],
  ['/interview', 'Mock Interview', MessagesSquare], ['/questions', 'Question Bank', Library], ['/resume', 'Resume Builder', FileText],
  ['/analytics', 'Progress', TrendingUp], ['/profile', 'My Profile', User],
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const nav = useNavigate();
  useEffect(() => setOpen(false), [pathname]);

  const current = [...NAV, ['/admin', 'Admin Panel']].find(([p]) => pathname.startsWith(p))?.[1] || '';
  const onLogout = async () => { await logout(); nav('/login'); };

  return (
    <div className="app">
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Main navigation">
        <div className="brand"><img src="/favicon.svg" alt="" />PrepPilot</div>
        <nav className="nav">
          {NAV.map(([to, label, Icon]) => <NavLink key={to} to={to}><Icon size={18} />{label}</NavLink>)}
          {user?.role === 'admin' && <><div className="sep" /><NavLink to="/admin"><ShieldCheck size={18} />Admin Panel</NavLink></>}
        </nav>
        <div className="side-foot">Signed in as<br /><strong style={{ color: '#fff' }}>{user?.email}</strong></div>
      </aside>
      <div className={`scrim ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />
      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <div className="title">{current}</div>
          <button className="icon-btn" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
          <button className="btn ghost sm" onClick={onLogout}><LogOut size={16} />Log out</button>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
