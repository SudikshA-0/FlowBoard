import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from './AuthContext';

const ProjectContext = createContext(null);

const ACTIVE_PROJECT_KEY = 'fb_active_project';

export const ProjectProvider = ({ children }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [personalProjects, setPersonalProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamProjects, setTeamProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(() => localStorage.getItem(ACTIVE_PROJECT_KEY) || '');

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Ensure default personal project exists and legacy tasks are backfilled.
      const boot = await api.get('/projects/bootstrap');
      const defaultProjectId = boot.data?.defaultProjectId;

      const [{ data }, teamsRes] = await Promise.all([
        api.get('/projects'),
        api.get('/teams'),
      ]);
      setPersonalProjects(data.personalProjects ?? []);
      setTeams(teamsRes.data?.teams ?? []);
      setTeamProjects(data.teamProjects ?? []);

      // Choose active project:
      // - keep existing if still accessible
      // - else fall back to default project created by bootstrap
      const all = [
        ...(data.personalProjects ?? []),
        ...(data.teamProjects ?? []),
      ];
      const stillValid = all.some((p) => p._id === activeProjectId);
      const nextId = stillValid ? activeProjectId : (defaultProjectId || all[0]?._id || '');
      if (nextId && nextId !== activeProjectId) {
        setActiveProjectId(nextId);
        localStorage.setItem(ACTIVE_PROJECT_KEY, nextId);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [user, activeProjectId]);

  useEffect(() => {
    if (!user) return;
    refresh();
  }, [user, refresh]);

  const setActiveProject = useCallback((projectId) => {
    setActiveProjectId(projectId);
    localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
  }, []);

  const createProject = useCallback(async ({ name, description, teamId }) => {
    const payload = {
      name,
      description,
      teamId: teamId || null,
      isPrivate: !teamId,
    };
    const { data } = await api.post('/projects', payload);
    await refresh();
    setActiveProject(data.project._id);
    return data.project;
  }, [refresh, setActiveProject]);

  const createTeam = useCallback(async ({ name }) => {
    const { data } = await api.post('/teams', { name });
    await refresh();
    return data.team;
  }, [refresh]);

  const getInviteLink = useCallback(async (teamId) => {
    const { data } = await api.get(`/teams/${teamId}/invite-link`);
    return data.link;
  }, []);

  const activeProject = useMemo(() => {
    const all = [...personalProjects, ...teamProjects];
    return all.find((p) => p._id === activeProjectId) ?? null;
  }, [personalProjects, teamProjects, activeProjectId]);

  const value = useMemo(() => ({
    loading,
    personalProjects,
    teams,
    teamProjects,
    activeProjectId,
    activeProject,
    setActiveProject,
    refresh,
    createProject,
    createTeam,
    getInviteLink,
  }), [
    loading,
    personalProjects,
    teams,
    teamProjects,
    activeProjectId,
    activeProject,
    setActiveProject,
    refresh,
    createProject,
    createTeam,
    getInviteLink,
  ]);

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjects must be used within ProjectProvider');
  return ctx;
};

