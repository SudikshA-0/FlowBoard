import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  predictTaskDelay,
  setTaskMl,
  mergeTaskWithMlResponse,
} from '../services/mlApi';
import { useAuth } from './AuthContext';
import { useProjects } from './ProjectContext';

const TaskContext = createContext(null);

export const TaskProvider = ({ children }) => {
  const { user } = useAuth();
  const { activeProjectId } = useProjects();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', priority: '', status: '' });
  const [analytics, setAnalytics] = useState(null);

  // ---------------- FETCH ----------------
  const fetchTasks = useCallback(async () => {
    if (!user || !activeProjectId) return;
    setLoading(true);
    try {
      const params = { projectId: activeProjectId };
      if (filters.search) params.search = filters.search;
      if (filters.priority) params.priority = filters.priority;
      if (filters.status) params.status = filters.status;

      const { data } = await api.get('/tasks', { params });
      setTasks(data.tasks);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [user, activeProjectId, filters]);

  const fetchAnalytics = useCallback(async () => {
    if (!user || !activeProjectId) return;
    try {
      const { data } = await api.get('/tasks/analytics', {
        params: { projectId: activeProjectId },
      });
      setAnalytics(data.analytics);
    } catch {}
  }, [user, activeProjectId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  // ---------------- ML APPLY ----------------
  const applyMlToTask = useCallback(async (baseTask, label) => {
    if (!baseTask?._id) return baseTask;

    const pred = await predictTaskDelay(baseTask);
    const enriched = mergeTaskWithMlResponse(baseTask, pred);

    setTaskMl(baseTask._id, pred);

    setTasks((prev) =>
      prev.map((t) => (t._id === baseTask._id ? { ...enriched } : t))
    );

    return enriched;
  }, []);

  // ---------------- CREATE ----------------
  const createTask = useCallback(async (payload) => {
    const { data } = await api.post('/tasks', {
      ...payload,
      projectId: activeProjectId,
    });

    // add immediately
    setTasks(prev => [data.task, ...prev]);
    fetchAnalytics();

    // 🔥 then enrich with ML
    try {
      return await applyMlToTask(data.task, 'create');
    } catch {
      return data.task;
    }
  }, [activeProjectId, fetchAnalytics, applyMlToTask]);

  // ---------------- UPDATE ----------------
  const updateTask = useCallback(async (id, payload) => {
    const { data } = await api.put(`/tasks/${id}`, payload);

    setTasks((prev) => prev.map((t) => (t._id === id ? data.task : t)));

    fetchAnalytics();

    try {
      return await applyMlToTask(data.task, 'update');
    } catch {
      return data.task;
    }
  }, [fetchAnalytics, applyMlToTask]);

  // ---------------- DELETE ----------------
  const deleteTask = useCallback(async (id) => {
    await api.delete(`/tasks/${id}`);
    setTasks(prev => prev.filter(t => t._id !== id));
    fetchAnalytics();
  }, [fetchAnalytics]);

  // ---------------- MOVE (MOST IMPORTANT FIX) ----------------
  const moveTask = useCallback(async (id, newStatus, newOrder) => {
    const prevTask = tasks.find(t => t._id === id);

    setTasks((prev) =>
      prev.map((t) =>
        t._id === id ? { ...t, status: newStatus, order: newOrder } : t
      )
    );

    try {
      const { data } = await api.put(`/tasks/${id}`, {
        status: newStatus,
        order: newOrder,
      });

      const pred = await predictTaskDelay(data.task);
      const enriched = mergeTaskWithMlResponse(data.task, pred);

      const oldStatus = prevTask?.status;
      const norm = (s) => (s === 'in progress' ? 'inprogress' : s);
      const oldNorm = norm(oldStatus);
      const newNorm = norm(newStatus);

      if (oldNorm === 'todo' && newNorm === 'inprogress') {
        enriched.delay_risk = enriched.delay_risk * 0.7;
      }
      if (oldNorm === 'inprogress' && newNorm === 'todo') {
        enriched.delay_risk = enriched.delay_risk * 1.3;
      }

      enriched.delay_risk = Math.max(0, Math.min(100, enriched.delay_risk));

      setTaskMl(enriched._id, {
        delay_risk: enriched.delay_risk,
        reasons: enriched.reasons,
        suggestions: enriched.suggestions,
      });
      setTasks((prev) =>
        prev.map((t) => (t._id === id ? { ...enriched } : t))
      );

      fetchAnalytics();
    } catch (err) {
      console.error(err);
      toast.error('Failed to move task');
      fetchTasks();
    }
  }, [tasks, fetchTasks, fetchAnalytics]);

  // ---------------- REFRESH ----------------
  const refreshTaskMl = useCallback(async (task) => {
    if (!task?._id) return null;
    return applyMlToTask(task, 'refresh');
  }, [applyMlToTask]);

  return (
    <TaskContext.Provider value={{
      tasks,
      loading,
      filters,
      setFilters,
      analytics,
      fetchAnalytics,
      createTask,
      updateTask,
      deleteTask,
      moveTask,
      refreshTaskMl,
      refetch: fetchTasks,
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be used within TaskProvider');
  return ctx;
};
