import { Link, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  ChevronRight,
  LayoutDashboard,
  ListChecks,
  Plane,
  Plus,
  Scale,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/meetings', label: 'Meetings', icon: CalendarDays },
      { to: '/meetings/new', label: 'New meeting', icon: Plus },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/decisions', label: 'Decisions', icon: Scale },
      { to: '/tasks', label: 'Tasks', icon: ListChecks },
      { to: '/assistant', label: 'AI assistant', icon: Sparkles },
    ],
  },
  {
    label: 'System',
    items: [{ to: '/settings', label: 'Settings', icon: Settings }],
  },
];

function isItemActive(pathname, to) {
  if (to === '/') return pathname === '/';
  if (to === '/meetings') {
    return pathname === '/meetings' || (pathname.startsWith('/meetings/') && pathname !== '/meetings/new');
  }
  return pathname === to;
}

export default function Sidebar({ open, onClose }) {
  const { health, error, tasks } = useWorkspace();
  const location = useLocation();
  const pendingTasks = tasks.filter((task) => task.status !== 'completed').length;

  let aiTone = 'neutral';
  let aiLabel = 'Checking AI status';
  let aiDetail = 'Connecting to the API';

  if (error) {
    aiTone = 'danger';
    aiLabel = 'API offline';
    aiDetail = 'Start the backend server';
  } else if (health?.ai?.configured) {
    aiTone = 'success';
    aiLabel = 'Gemini connected';
    aiDetail = health.ai.model;
  } else if (health) {
    aiTone = 'warning';
    aiLabel = 'AI not configured';
    aiDetail = 'Add your Gemini key';
  }

  return (
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`} aria-label="Main navigation">
      <div className="sidebar-top">
        <Link to="/" className="brand" onClick={onClose}>
          <span className="brand-mark" aria-hidden="true">
            <Plane size={19} strokeWidth={2.2} />
          </span>
          <span className="brand-copy">
            <span className="brand-name">
              MeetPilot <span className="brand-ai">AI</span>
            </span>
            <span className="brand-tagline">Meeting intelligence</span>
          </span>
        </Link>

        <button type="button" className="sidebar-close" onClick={onClose} aria-label="Close menu">
          <X size={18} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV_GROUPS.map((group) => (
          <div className="nav-group" key={group.label}>
            <p className="nav-label">{group.label}</p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const showCount = item.to === '/tasks' && pendingTasks > 0;
              const active = isItemActive(location.pathname, item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  aria-current={active ? 'page' : undefined}
                  className={`nav-link ${active ? 'nav-link-active' : ''}`}
                >
                  <Icon size={17} strokeWidth={1.9} aria-hidden="true" />
                  <span className="nav-link-label">{item.label}</span>
                  {showCount ? <span className="nav-count">{pendingTasks}</span> : null}
                  {item.to === '/assistant' ? <span className="nav-new">AI</span> : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <Link to="/settings" className={`ai-status-card ai-status-${aiTone}`} onClick={onClose}>
          <span className="ai-status-dot" aria-hidden="true" />
          <span className="ai-status-copy">
            <span className="ai-status-label">{aiLabel}</span>
            <span className="ai-status-detail">{aiDetail}</span>
          </span>
          <ChevronRight size={15} aria-hidden="true" />
        </Link>

        <div className="workspace-card">
          <span className="workspace-avatar" aria-hidden="true">
            MP
          </span>
          <span className="workspace-copy">
            <span className="workspace-name">Personal workspace</span>
            <span className="workspace-detail">Stored locally</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
