import { Link, useLocation } from 'react-router-dom';
import { Menu, Plus } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';

const PAGE_LABELS = {
  '/': 'Dashboard',
  '/meetings': 'Meetings',
  '/meetings/new': 'New meeting',
  '/decisions': 'Decisions',
  '/tasks': 'Tasks',
  '/assistant': 'AI assistant',
  '/settings': 'Settings',
};

function getPageLabel(pathname) {
  if (PAGE_LABELS[pathname]) return PAGE_LABELS[pathname];
  if (pathname.startsWith('/meetings/')) return 'Meeting report';
  return 'Workspace';
}

export default function Topbar({ onMenu }) {
  const location = useLocation();
  const { health, error } = useWorkspace();
  const pageLabel = getPageLabel(location.pathname);

  const aiConfigured = Boolean(health?.ai?.configured);
  const statusLabel = error ? 'API offline' : aiConfigured ? 'AI ready' : 'Setup needed';
  const statusTone = error ? 'danger' : aiConfigured ? 'success' : 'warning';

  const dateLabel = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button type="button" className="topbar-menu" onClick={onMenu} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <div className="breadcrumb" aria-label="Breadcrumb">
          <span className="breadcrumb-root">Workspace</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{pageLabel}</span>
        </div>
      </div>

      <div className="topbar-right">
        <span className="topbar-date">{dateLabel}</span>
        <Link
          to="/settings"
          className={`topbar-status topbar-status-${statusTone}`}
          title="Open AI configuration"
        >
          <span className="status-dot" aria-hidden="true" />
          {statusLabel}
        </Link>
        <Link
          to="/meetings/new"
          className="btn btn-primary btn-sm topbar-action"
          aria-label="New meeting"
        >
          <Plus size={15} strokeWidth={2.2} aria-hidden="true" />
          <span>New meeting</span>
        </Link>
      </div>
    </header>
  );
}
