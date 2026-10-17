import { Brain, Code2, MessagesSquare } from 'lucide-react';

export default function AuthShell({ children }) {
  return (
    <div className="auth">
      <div className="auth-art">
        <div className="row" style={{ fontWeight: 800, fontSize: '1.2rem' }}><img src="/favicon.svg" alt="" width="34" height="34" />PrepPilot</div>
        <div className="stack">
          <h1>Walk into your interview already warmed up.</h1>
          <p>Timed aptitude tests, real code execution and mock interviews that give you scored feedback.</p>
        </div>
        <div className="auth-points">
          <div><span className="ico"><Brain size={16} /></span>Aptitude tests generated for your target role</div>
          <div><span className="ico"><Code2 size={16} /></span>Run Java, Python, C++ and JavaScript in the browser</div>
          <div><span className="ico"><MessagesSquare size={16} /></span>HR and technical mock interviews with AI feedback</div>
        </div>
      </div>
      <div className="auth-form"><div className="auth-card">{children}</div></div>
    </div>
  );
}
