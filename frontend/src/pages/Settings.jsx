import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Database,
  ExternalLink,
  KeyRound,
  ListChecks,
  Plane,
  RefreshCw,
  Scale,
  Server,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Card, { CardHeader } from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import Alert from '../components/ui/Alert.jsx';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { formatRelativeTime } from '../utils/format.js';
import { supabase } from '../services/supabase.js';

export default function Settings() {
  const { health, error, refresh, loading, meetings, tasks, decisions } = useWorkspace();
  const [session, setSession] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (!supabase) return undefined;

    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function sendMagicLink(event) {
    event.preventDefault();
    if (!supabase || !authEmail.trim()) return;

    setAuthLoading(true);
    setAuthMessage('');
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: authEmail.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setAuthLoading(false);
    setAuthMessage(authError ? authError.message : 'Check your email for a secure sign-in link.');
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  const configured = Boolean(health?.ai?.configured);
  const apiOnline = Boolean(health?.status === 'ok' && !error);

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Workspace configuration."
        description="Check the API connection, configure Gemini, and review where your meeting data lives."
        actions={
          <button type="button" className="btn btn-secondary" onClick={refresh} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>{loading ? 'Refreshing…' : 'Refresh status'}</span>
          </button>
        }
      />

      <div className="settings-grid">
        <div className="stack">
          <Card>
            <CardHeader
              title="API connection"
              subtitle="The frontend talks only to the local Express API."
              icon={Server}
            />
            <div className="settings-rows">
              <div className="settings-row">
                <span className="settings-key">Status</span>
                <span className="settings-value">
                  {error ? (
                    <Badge tone="danger" dot>Offline</Badge>
                  ) : apiOnline ? (
                    <Badge tone="success" dot>Connected</Badge>
                  ) : (
                    <Badge tone="neutral" dot>Checking</Badge>
                  )}
                </span>
              </div>
              <div className="settings-row">
                <span className="settings-key">API route</span>
                <code className="settings-code">/api → localhost:5000</code>
              </div>
              <div className="settings-row">
                <span className="settings-key">Storage</span>
                <span className="settings-value">
                  {health?.storage === 'json-file' ? 'Local JSON file' : 'Not reported'}
                </span>
              </div>
              <div className="settings-row">
                <span className="settings-key">Last checked</span>
                <span className="settings-value settings-muted">
                  {health?.timestamp ? formatRelativeTime(health.timestamp) : '—'}
                </span>
              </div>
            </div>
            {error ? (
              <Alert tone="danger" title="The API is not reachable">
                {error}
              </Alert>
            ) : null}
          </Card>

          <Card>
            <CardHeader
              title="Supabase account"
              subtitle="Optional secure sign-in for the configured Supabase project."
              icon={ShieldCheck}
              action={<Badge tone={supabase ? 'success' : 'warning'} dot>{supabase ? 'Configured' : 'Missing config'}</Badge>}
            />
            {supabase ? (
              session ? (
                <div className="settings-note">
                  <ShieldCheck size={16} />
                  <p>
                    Signed in as <strong>{session.user.email || session.user.id}</strong>.
                  </p>
                  <button type="button" className="btn btn-secondary" onClick={signOut}>
                    Sign out
                  </button>
                </div>
              ) : (
                <form className="meeting-form" onSubmit={sendMagicLink}>
                  <div className="field">
                    <label className="field-label" htmlFor="supabase-email">Email address</label>
                    <input
                      id="supabase-email"
                      className="input"
                      type="email"
                      value={authEmail}
                      onChange={(event) => setAuthEmail(event.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={authLoading}>
                    {authLoading ? 'Sending…' : 'Send magic link'}
                  </button>
                  {authMessage ? <p className="field-hint">{authMessage}</p> : null}
                </form>
              )
            ) : (
              <Alert tone="warning" title="Supabase client is not configured">
                Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to frontend/.env.local.
              </Alert>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Workspace data"
              subtitle="Your saved meetings, confirmed decisions, and tracked tasks."
              icon={Database}
            />
            <div className="settings-rows">
              <Link to="/meetings" className="settings-row settings-row-link">
                <span className="settings-key"><CalendarDays size={15} /> Meetings</span>
                <span className="settings-value"><strong>{meetings.length}</strong></span>
              </Link>
              <Link to="/decisions" className="settings-row settings-row-link">
                <span className="settings-key"><Scale size={15} /> Confirmed decisions</span>
                <span className="settings-value"><strong>{decisions.length}</strong></span>
              </Link>
              <Link to="/tasks" className="settings-row settings-row-link">
                <span className="settings-key"><ListChecks size={15} /> Tasks</span>
                <span className="settings-value"><strong>{tasks.length}</strong></span>
              </Link>
            </div>
            <div className="settings-note">
              <ShieldCheck size={16} />
              <p>
                The active application store is <code>backend/data/db.json</code>. Supabase schema,
                authentication, and RLS policies are provided for migration to cloud persistence.
              </p>
            </div>
          </Card>
        </div>

        <div className="stack">
          <Card>
            <CardHeader
              title="Gemini AI"
              subtitle="All AI calls run on the backend. The key never reaches the browser."
              icon={KeyRound}
              action={
                <Badge tone={configured ? 'success' : 'warning'} dot>
                  {configured ? 'Configured' : 'Not configured'}
                </Badge>
              }
            />
            <div className="settings-rows">
              <div className="settings-row">
                <span className="settings-key">Provider</span>
                <span className="settings-value">Google Gemini</span>
              </div>
              <div className="settings-row">
                <span className="settings-key">Model</span>
                <code className="settings-code">{health?.ai?.model || 'gemini-2.5-flash'}</code>
              </div>
              <div className="settings-row">
                <span className="settings-key">API key</span>
                <span className="settings-value settings-muted">
                  {configured ? '•••••••••••• stored in backend/.env' : 'Not set'}
                </span>
              </div>
            </div>

            {!configured ? (
              <div className="setup-instructions">
                <p className="setup-instructions-title">
                  <TriangleAlert size={15} /> Add your key to enable analysis
                </p>
                <ol>
                  <li>Open <code>backend/.env</code>.</li>
                  <li>Paste your key after <code>GEMINI_API_KEY=</code>.</li>
                  <li>Restart the backend, then refresh this page.</li>
                </ol>
                <pre className="code-block">{`GEMINI_API_KEY=your_key_here\nGEMINI_MODEL=gemini-2.5-flash`}</pre>
                <a
                  className="text-link"
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                >
                  Get a Gemini API key <ExternalLink size={13} />
                </a>
              </div>
            ) : (
              <div className="settings-success">
                <CheckCircle2 size={16} />
                Gemini is configured and ready for transcript analysis, audio transcription, and chat.
              </div>
            )}
          </Card>

          <Card className="about-card">
            <div className="about-brand">
              <span className="brand-mark brand-mark-large" aria-hidden="true">
                <Plane size={22} strokeWidth={2.1} />
              </span>
              <div>
                <p className="about-name">
                  MeetPilot <span className="brand-ai">AI</span>
                </p>
                <p className="about-tagline">
                  From Conversations to Decisions. From Decisions to Action.
                </p>
              </div>
            </div>
            <div className="settings-rows">
              <div className="settings-row">
                <span className="settings-key">Version</span>
                <span className="settings-value settings-muted">1.0.0 · hackathon build</span>
              </div>
              <div className="settings-row">
                <span className="settings-key">Frontend</span>
                <span className="settings-value settings-muted">React · Vite · Lucide</span>
              </div>
              <div className="settings-row">
                <span className="settings-key">Backend</span>
                <span className="settings-value settings-muted">Node.js · Express · Gemini</span>
              </div>
            </div>
            <div className="about-footer">
              <Sparkles size={14} />
              Built to keep decisions and follow-through from getting lost.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
