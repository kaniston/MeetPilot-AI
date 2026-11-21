import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout.jsx';
import { WorkspaceProvider } from './context/WorkspaceContext.jsx';
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Meetings = lazy(() => import('./pages/Meetings.jsx'));
const NewMeeting = lazy(() => import('./pages/NewMeeting.jsx'));
const MeetingReport = lazy(() => import('./pages/MeetingReport.jsx'));
const Decisions = lazy(() => import('./pages/Decisions.jsx'));
const Tasks = lazy(() => import('./pages/Tasks.jsx'));
const Assistant = lazy(() => import('./pages/Assistant.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

export default function App() {
  return (
    <WorkspaceProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/meetings/new" element={<NewMeeting />} />
          <Route path="/meetings/:id" element={<MeetingReport />} />
          <Route path="/decisions" element={<Decisions />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </WorkspaceProvider>
  );
}
