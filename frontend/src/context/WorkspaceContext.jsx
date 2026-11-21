import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const [meetings, setMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadWorkspace() {
      setLoading(true);
      setError('');

      try {
        const [meetingData, taskData, decisionData, healthData] = await Promise.all([
          api.getMeetings(controller.signal),
          api.getTasks(controller.signal),
          api.getDecisions(controller.signal),
          api.getHealth(controller.signal),
        ]);

        if (!active) return;

        setMeetings(meetingData || []);
        setTasks(taskData || []);
        setDecisions(decisionData?.decisions || []);
        setConflicts(decisionData?.conflicts || []);
        setHealth(healthData);
      } catch (loadError) {
        if (!active || loadError.name === 'AbortError') return;
        setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadWorkspace();

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey]);

  const updateTask = useCallback(async (id, patch) => {
    const updated = await api.updateTask(id, patch);
    setTasks((current) => current.map((task) => (task.id === id ? updated : task)));
    return updated;
  }, []);

  const updateConflict = useCallback(async (id, reviewStatus) => {
    const updated = await api.updateConflict(id, reviewStatus);
    setConflicts((current) =>
      current.map((conflict) => (conflict.id === id ? { ...conflict, ...updated } : conflict)),
    );
    return updated;
  }, []);

  const value = useMemo(
    () => ({
      meetings,
      tasks,
      decisions,
      conflicts,
      health,
      loading,
      error,
      refresh,
      updateTask,
      updateConflict,
    }),
    [
      meetings,
      tasks,
      decisions,
      conflicts,
      health,
      loading,
      error,
      refresh,
      updateTask,
      updateConflict,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error('useWorkspace must be used inside a WorkspaceProvider.');
  }

  return context;
}
