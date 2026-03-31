import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { getSocket, joinProject, leaveProject } from '../services/socket';
import { useAuth } from './AuthContext';
import { useProjects } from './ProjectContext';

const TaskContext = createContext(null);

export const TaskProvider = ({ children }) => {
  const { user } = useAuth();
  const { activeProjectId } = useProjects();
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', priority: '', status: '' });
  const [analytics, setAnalytics] = useState(null);
  const socketRef = useRef(null);

  // Fetch tasks whenever filters change or user changes
  const fetchTasks = useCallback(async () => {
    if (!user || !activeProjectId) return;
    setLoading(true);
    try {
      const params = {};
      params.projectId = activeProjectId;
      if (filters.search)   params.search   = filters.search;
      if (filters.priority) params.priority = filters.priority;
      if (filters.status)   params.status   = filters.status;
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
      const { data } = await api.get('/tasks/analytics', { params: { projectId: activeProjectId } });
      setAnalytics(data.analytics);
    } catch { /* silent */ }
  }, [user, activeProjectId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  // Real-time socket events
  useEffect(() => {
    if (!user || !activeProjectId) return;
    const socket = getSocket();
    socketRef.current = socket;
    joinProject(activeProjectId);

    const onCreated = (task) => {
      if (task.userId === user._id || task.userId?._id === user._id) {
        setTasks(p => [task, ...p.filter(t => t._id !== task._id)]);
        fetchAnalytics();
      }
    };
    const onUpdated = (task) => {
      setTasks(p => p.map(t => t._id === task._id ? task : t));
      fetchAnalytics();
    };
    const onDeleted = (id) => {
      setTasks(p => p.filter(t => t._id !== id));
      fetchAnalytics();
    };

    socket.on('taskCreated', onCreated);
    socket.on('taskUpdated', onUpdated);
    socket.on('taskDeleted', onDeleted);

    return () => {
      leaveProject(activeProjectId);
      socket.off('taskCreated', onCreated);
      socket.off('taskUpdated', onUpdated);
      socket.off('taskDeleted', onDeleted);
    };
  }, [user, activeProjectId, fetchAnalytics]);

  // ── CRUD ───────────────────────────────────────────────────────────────
  const createTask = useCallback(async (payload) => {
    const { data } = await api.post('/tasks', { ...payload, projectId: activeProjectId });
    setTasks(p => [data.task, ...p]);
    fetchAnalytics();
    return data.task;
  }, [activeProjectId, fetchAnalytics]);

  const updateTask = useCallback(async (id, payload) => {
    const { data } = await api.put(`/tasks/${id}`, payload);
    setTasks(p => p.map(t => t._id === id ? data.task : t));
    fetchAnalytics();
    return data.task;
  }, [fetchAnalytics]);

  const deleteTask = useCallback(async (id) => {
    await api.delete(`/tasks/${id}`);
    setTasks(p => p.filter(t => t._id !== id));
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Optimistic drag-and-drop status change
  const moveTask = useCallback(async (id, newStatus, newOrder) => {
    setTasks(p => p.map(t => t._id === id ? { ...t, status: newStatus, order: newOrder } : t));
    try {
      await api.put(`/tasks/${id}`, { status: newStatus, order: newOrder });
      fetchAnalytics();
    } catch {
      toast.error('Failed to move task');
      fetchTasks(); // rollback
    }
  }, [fetchTasks, fetchAnalytics]);

  return (
    <TaskContext.Provider value={{
      tasks, loading, filters, setFilters,
      analytics, fetchAnalytics,
      createTask, updateTask, deleteTask, moveTask,
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
