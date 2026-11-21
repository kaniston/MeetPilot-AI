import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import LoadingState from '../ui/LoadingState.jsx';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { error, refresh } = useWorkspace();
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <div className="ambient-glow ambient-glow-one" aria-hidden="true" />
      <div className="ambient-glow ambient-glow-two" aria-hidden="true" />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen ? (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}

      <div className="main-shell">
        <Topbar onMenu={() => setSidebarOpen(true)} />

        {error ? (
          <div className="connection-banner" role="alert">
            <TriangleAlert size={16} aria-hidden="true" />
            <span>{error}</span>
            <button type="button" className="connection-retry" onClick={refresh}>
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        ) : null}

        <main className="page">
          <Suspense
            fallback={
              <div className="route-loading">
                <LoadingState label="Loading MeetPilot…" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
