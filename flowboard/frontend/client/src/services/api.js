/**
 * Hybrid API client.
 *
 * Auth routes call the Express backend via Axios (httpClient).
 * All other routes still use the in-browser localStorage mock until migrated.
 */

import http, { setUnauthorizedHandler, triggerUnauthorized } from './httpClient';

export { setUnauthorizedHandler };

const DEFAULT_DELAY_MS = 350;

const sleep = (ms = DEFAULT_DELAY_MS) => new Promise((r) => setTimeout(r, ms));

const jsonParse = (v, fallback) => {
  try { return JSON.parse(v); } catch { return fallback; }
};

const nowIso = () => new Date().toISOString();
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const COMPLETED_AT_MIGRATION_KEY = 'fb_completedAt_migration_v1';
const COMPLETED_AT_REBALANCE_KEY = 'fb_completedAt_rebalance_v2';
const DUMMY_CLEANUP_KEY = 'fb_dummy_cleanup_v1';
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomJitterMs = () => (randomInt(0, 23) * HOUR_MS) + (randomInt(0, 59) * MINUTE_MS);

const isValidCompletedAtForTask = (task) => {
  if (!task?.completedAt) return false;
  const createdMs = task?.createdAt ? new Date(task.createdAt).getTime() : NaN;
  const completedMs = new Date(task.completedAt).getTime();
  if (Number.isNaN(createdMs) || Number.isNaN(completedMs)) return false;
  return completedMs >= createdMs;
};

const isSameUtcDay = (a, b) =>
  a.getUTCFullYear() === b.getUTCFullYear() &&
  a.getUTCMonth() === b.getUTCMonth() &&
  a.getUTCDate() === b.getUTCDate();

const shouldRebalanceCompletedAt = (task) => {
  if (String(task?.status || 'todo').toLowerCase() !== 'done') return false;
  if (!isValidCompletedAtForTask(task)) return true;
  if (!task?.completedAt) return true;

  // Rebalance unrealistic "completed today" values once for training datasets.
  const completed = new Date(task.completedAt);
  if (Number.isNaN(completed.getTime())) return true;
  const today = new Date();
  return isSameUtcDay(completed, today);
};

const generateRealisticCompletedAt = (task) => {
  const createdMs = task?.createdAt ? new Date(task.createdAt).getTime() : NaN;
  if (Number.isNaN(createdMs)) return null;

  const dueMs = task?.dueDate ? new Date(task.dueDate).getTime() : NaN;
  const hasDueDate = !Number.isNaN(dueMs);
  let randomDays = randomInt(1, 15);
  let completedMs = createdMs + (randomDays * DAY_MS) + randomJitterMs();

  if (!hasDueDate) {
    // No due date: complete in 1-10 days from creation.
    randomDays = randomInt(1, 10);
    completedMs = createdMs + (randomDays * DAY_MS) + randomJitterMs();
    return new Date(completedMs).toISOString();
  }

  const onTime = Math.random() < 0.7; // 70% on-time, 30% delayed
  if (onTime) {
    const maxOnTimeDays = Math.floor((dueMs - createdMs) / DAY_MS);
    if (maxOnTimeDays >= 1) {
      randomDays = randomInt(1, Math.min(15, maxOnTimeDays));
      completedMs = createdMs + (randomDays * DAY_MS) + randomJitterMs();
      completedMs = Math.min(completedMs, dueMs);
    }
  } else {
    // Delayed: after due date with realistic spread.
    const minDelayedDays = Math.floor((dueMs - createdMs) / DAY_MS) + 1;
    if (minDelayedDays <= 15) {
      randomDays = randomInt(Math.max(1, minDelayedDays), 15);
      completedMs = createdMs + (randomDays * DAY_MS) + randomJitterMs();
      if (completedMs <= dueMs) completedMs = dueMs + HOUR_MS + randomInt(0, 59) * MINUTE_MS;
    }
  }

  if (completedMs < createdMs) completedMs = createdMs + randomInt(1, 12) * HOUR_MS;
  return new Date(completedMs).toISOString();
};

const normalizeCompletedAt = (task) => {
  if (!task) return task;
  const status = String(task.status || 'todo').toLowerCase();
  if (status !== 'done') return { ...task, completedAt: null };

  // Keep existing valid values intact (no override).
  if (isValidCompletedAtForTask(task)) return task;

  // One-time migration fill for done tasks missing/invalid completedAt.
  return { ...task, completedAt: generateRealisticCompletedAt(task) };
};

const newId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
};

const DB_KEY = 'fb_db_v1';
const USER_KEY = 'fb_user';
const emptyDb = () => ({ users: [], teams: [], projects: [], tasks: [], comments: [] });

const cleanupDummyDataOnce = (db) => {
  if (localStorage.getItem(DUMMY_CLEANUP_KEY) === '1') return db;

  const hasDemoProjects = (db?.projects || []).some(
    (p) => typeof p?.name === 'string' && p.name.toLowerCase().startsWith('demo')
  );

  if (!hasDemoProjects) {
    localStorage.setItem(DUMMY_CLEANUP_KEY, '1');
    return db;
  }

  const clean = emptyDb();
  localStorage.setItem(DB_KEY, JSON.stringify(clean));

  // Clear old training/demo markers and cached ML prediction artifacts.
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (
      key.startsWith('fb_demo_seeded_') ||
      key.startsWith('fb_extra_overdue_') ||
      key === 'fb_ml_v1' ||
      key === COMPLETED_AT_MIGRATION_KEY ||
      key === COMPLETED_AT_REBALANCE_KEY
    ) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
  localStorage.setItem(DUMMY_CLEANUP_KEY, '1');
  return clean;
};

const readDb = () => {
  const raw = localStorage.getItem(DB_KEY);
  const db = raw ? jsonParse(raw, null) : null;
  if (db) {
    const cleanDb = cleanupDummyDataOnce(db);
    // Run completion-date preparation once for training data migration.
    if (!localStorage.getItem(COMPLETED_AT_MIGRATION_KEY)) {
      let touched = false;
      cleanDb.tasks = (cleanDb.tasks || []).map((task) => {
        const normalized = normalizeCompletedAt(task);
        if ((normalized?.completedAt ?? null) !== (task?.completedAt ?? null)) touched = true;
        return normalized;
      });
      if (touched) localStorage.setItem(DB_KEY, JSON.stringify(cleanDb));
      localStorage.setItem(COMPLETED_AT_MIGRATION_KEY, '1');
    }

    // One-time rebalance pass: backdate "completed today" done tasks for ML training spread.
    if (!localStorage.getItem(COMPLETED_AT_REBALANCE_KEY)) {
      let touched = false;
      cleanDb.tasks = (cleanDb.tasks || []).map((task) => {
        if (!shouldRebalanceCompletedAt(task)) return task;
        const generated = generateRealisticCompletedAt(task);
        if (!generated) return task;
        const normalized = { ...task, completedAt: generated };
        if ((normalized?.completedAt ?? null) !== (task?.completedAt ?? null)) touched = true;
        return normalized;
      });
      if (touched) localStorage.setItem(DB_KEY, JSON.stringify(cleanDb));
      localStorage.setItem(COMPLETED_AT_REBALANCE_KEY, '1');
    }
    return cleanDb;
  }
  const seed = emptyDb();
  localStorage.setItem(DB_KEY, JSON.stringify(seed));
  return seed;
};

const writeDb = (db) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

const getAuthedUser = () => {
  const user = jsonParse(localStorage.getItem(USER_KEY), null);
  const token = localStorage.getItem('fb_token');
  if (!token || !user?._id) return null;
  return user;
};

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.response = { status, data: { message } };
  }
}

const requireAuth = () => {
  const user = getAuthedUser();
  if (!user) {
    localStorage.removeItem('fb_token');
    triggerUnauthorized();
    throw new ApiError(401, 'Not authorized.');
  }
  return user;
};

const ensureDefaultProject = (db, userId) => {
  let p = db.projects.find(
    (x) => x.ownerId === userId && x.teamId === null && x.isPrivate === true && x.name === 'Default'
  );
  if (!p) {
    p = {
      _id: newId(),
      name: 'Default',
      description: 'Your personal default project.',
      ownerId: userId,
      teamId: null,
      isPrivate: true,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.projects.unshift(p);
  }

  db.tasks = db.tasks.map((t) => {
    if (t.userId === userId && (t.projectId === null || t.projectId === undefined)) {
      return { ...t, projectId: p._id, updatedAt: nowIso() };
    }
    return t;
  });

  return p;
};

const isFlowboardProjectName = (name) =>
  String(name || '').trim().toLowerCase() === 'flowboard';

const projectHasMlDemoTasks = (db, projectId) =>
  (db.tasks || []).some(
    (t) =>
      t.projectId === projectId && Array.isArray(t.tags) && t.tags.includes('ml-demo')
  );

/** Ten diverse tasks for delay_risk / insights testing when a "flowboard" project is created. */
const buildFlowboardMlSampleTasks = (userId, projectId) => {
  const addDays = (n) => new Date(Date.now() + n * DAY_MS).toISOString();
  const mk = (fields) => ({
    _id: newId(),
    projectId,
    userId,
    description: '',
    tags: ['ml-demo'],
    assignedTo: null,
    assignees: [],
    boardId: 'default',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    ...fields,
  });

  let todoOrder = 0;
  const todo = (overrides) =>
    mk({
      status: 'todo',
      order: todoOrder++,
      completedAt: null,
      ...overrides,
    });

  const completedAgo = addDays(-3);

  return [
    todo({
      title: 'Research next-quarter roadmap themes',
      dueDate: addDays(90),
      priority: 'low',
    }),
    todo({
      title: 'Board security audit and hardening',
      dueDate: addDays(75),
      priority: 'high',
    }),
    todo({
      title: 'Publish weekly metrics dashboard',
      dueDate: addDays(1),
      priority: 'medium',
    }),
    todo({
      title: 'Integrate analytics export API',
      dueDate: addDays(5),
      priority: 'medium',
    }),
    todo({
      title: 'Fix broken notification emails',
      dueDate: addDays(-5),
      priority: 'medium',
    }),
    todo({
      title: 'Executive demo dry-run',
      dueDate: addDays(2),
      priority: 'high',
    }),
    todo({
      title: 'Tidy documentation typos',
      dueDate: addDays(-12),
      priority: 'low',
    }),
    mk({
      title: 'Implement column WIP limits',
      dueDate: addDays(4),
      priority: 'medium',
      status: 'inprogress',
      order: 0,
      completedAt: null,
    }),
    mk({
      title: 'Migrate legacy theme tokens',
      dueDate: addDays(30),
      priority: 'high',
      status: 'done',
      order: 0,
      completedAt: completedAgo,
    }),
    todo({
      title: 'Weekly sync agenda and stakeholder notes',
      dueDate: addDays(8),
      priority: 'low',
    }),
  ];
};

const computeAnalytics = (tasks) => {
  const byStatus = { todo: 0, inprogress: 0, done: 0 };
  const byPriority = { low: 0, medium: 0, high: 0 };
  let overdue = 0;
  const now = Date.now();

  for (const t of tasks) {
    if (byStatus[t.status] !== undefined) byStatus[t.status] += 1;
    if (byPriority[t.priority] !== undefined) byPriority[t.priority] += 1;
    if (t.status !== 'done' && t.dueDate) {
      const due = new Date(t.dueDate).getTime();
      if (!Number.isNaN(due) && due < now) overdue += 1;
    }
  }
  return { total: tasks.length, overdue, byStatus, byPriority };
};

const normalizeUrl = (url) => (url || '').replace(/^\/api/, '');

const api = {
  async get(url, config = {}) {
    await sleep();
    const u = normalizeUrl(url);
    const params = config?.params || {};
    const db = readDb();

    if (u === '/auth/me') {
      const user = requireAuth();
      return { data: { success: true, user } };
    }

    if (u === '/projects/bootstrap') {
      const user = requireAuth();
      const db2 = readDb();
      const p = ensureDefaultProject(db2, user._id);
      writeDb(db2);
      return { data: { success: true, defaultProjectId: p._id } };
    }

    if (u === '/projects') {
      const user = requireAuth();
      const myTeams = db.teams.filter((t) => (t.memberIds || []).includes(user._id));
      const teamIds = myTeams.map((t) => t._id);

      const personalProjects = db.projects
        .filter((p) => p.ownerId === user._id && p.teamId === null && p.isPrivate === true)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const teamProjects = db.projects
        .filter((p) => p.teamId && teamIds.includes(p.teamId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return {
        data: {
          success: true,
          personalProjects,
          teams: myTeams.map((t) => ({ _id: t._id, name: t.name })),
          teamProjects,
        },
      };
    }

    if (u.startsWith('/projects/')) {
      const user = requireAuth();
      const id = u.split('/')[2];
      const project = db.projects.find((p) => p._id === id);
      if (!project) throw new ApiError(404, 'Project not found.');
      if (project.teamId === null) {
        if (project.ownerId !== user._id) throw new ApiError(403, 'You do not have access to this project.');
      } else {
        const team = db.teams.find((t) => t._id === project.teamId);
        const isMember = !!team && (team.memberIds || []).includes(user._id);
        if (!isMember) throw new ApiError(403, 'You do not have access to this project.');
      }
      return { data: { success: true, project } };
    }

    if (u === '/teams') {
      const user = requireAuth();
      const teams = db.teams
        .filter((t) => (t.memberIds || []).includes(user._id))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return { data: { success: true, teams } };
    }

    if (u.endsWith('/invite-link') && u.startsWith('/teams/')) {
      const user = requireAuth();
      const teamId = u.split('/')[2];
      const team = db.teams.find((t) => t._id === teamId);
      if (!team) throw new ApiError(404, 'Team not found.');
      if (team.adminId !== user._id) throw new ApiError(403, 'Only the team admin can invite members.');

      const token = newId().replace(/-/g, '').slice(0, 24);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      team.inviteTokens = team.inviteTokens || [];
      team.inviteTokens.push({ token, createdBy: user._id, expiresAt });
      team.updatedAt = nowIso();
      writeDb(db);

      const base = window.location.origin;
      const link = `${base}/join?token=${encodeURIComponent(token)}`;
      return { data: { success: true, link } };
    }

    if (u === '/tasks') {
      const user = requireAuth();
      const { status, priority, search, projectId } = params || {};

      let tasks = db.tasks.filter((t) => t.userId === user._id);
      if (projectId) tasks = tasks.filter((t) => t.projectId === projectId);
      if (status) tasks = tasks.filter((t) => t.status === status);
      if (priority) tasks = tasks.filter((t) => t.priority === priority);
      if (search) {
        const s = String(search).toLowerCase();
        tasks = tasks.filter((t) =>
          (t.title || '').toLowerCase().includes(s) ||
          (t.description || '').toLowerCase().includes(s) ||
          (t.tags || []).some((tag) => String(tag).toLowerCase().includes(s))
        );
      }
      tasks = tasks.sort((a, b) => (a.order - b.order) || (new Date(b.createdAt) - new Date(a.createdAt)));
      return { data: { success: true, tasks } };
    }

    if (u === '/tasks/analytics') {
      const user = requireAuth();
      const projectId = params?.projectId;
      let tasks = db.tasks.filter((t) => t.userId === user._id);
      if (projectId) tasks = tasks.filter((t) => t.projectId === projectId);
      return { data: { success: true, analytics: computeAnalytics(tasks) } };
    }

    if (u.startsWith('/comments/')) {
      const user = requireAuth();
      const taskId = u.split('/')[2];
      const task = db.tasks.find((t) => t._id === taskId && t.userId === user._id);
      if (!task) throw new ApiError(404, 'Task not found.');
      const comments = db.comments
        .filter((c) => c.taskId === taskId)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .map((c) => ({
          ...c,
          userId: db.users.find((u2) => u2._id === c.userId) || { _id: c.userId, name: 'User', email: '' },
        }));
      return { data: { success: true, comments } };
    }

    throw new ApiError(404, 'Route not found.');
  },

  async post(url, body = {}) {
    await sleep();
    const u = normalizeUrl(url);
    const db = readDb();

    if (u === '/auth/signup' || u === '/auth/login') {
      const res = await http.post(u, body);
      return { data: res.data };
    }

    if (u === '/teams') {
      const user = requireAuth();
      const name = String(body.name || '').trim();
      if (!name) throw new ApiError(400, 'Team name is required.');
      const team = {
        _id: newId(),
        name,
        adminId: user._id,
        memberIds: [user._id],
        inviteTokens: [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.teams.unshift(team);
      writeDb(db);
      return { data: { success: true, team, inviteToken: null } };
    }

    if (u === '/teams/join') {
      const user = requireAuth();
      const token = String(body.token || '').trim();
      if (!token) throw new ApiError(400, 'Invite token is required.');
      const team = db.teams.find((t) => (t.inviteTokens || []).some((it) => it.token === token));
      if (!team) throw new ApiError(404, 'Invite not found.');
      const invite = (team.inviteTokens || []).find((it) => it.token === token);
      if (!invite) throw new ApiError(404, 'Invite not found.');
      if (new Date(invite.expiresAt).getTime() < Date.now()) throw new ApiError(410, 'Invite has expired.');

      if (!(team.memberIds || []).includes(user._id)) {
        team.memberIds = [...(team.memberIds || []), user._id];
        team.updatedAt = nowIso();
        writeDb(db);
      }
      return { data: { success: true, team: { _id: team._id, name: team.name } } };
    }

    if (u === '/projects') {
      const user = requireAuth();
      const name = String(body.name || '').trim();
      if (!name) throw new ApiError(400, 'Project name is required.');

      const teamId = body.teamId || null;
      if (teamId) {
        const team = db.teams.find((t) => t._id === teamId);
        if (!team) throw new ApiError(404, 'Team not found.');
        if (!(team.memberIds || []).includes(user._id)) throw new ApiError(403, 'You are not a member of this team.');
      }

      const project = {
        _id: newId(),
        name,
        description: String(body.description || '').trim(),
        ownerId: user._id,
        teamId,
        isPrivate: teamId ? Boolean(body.isPrivate) : true,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.projects.unshift(project);
      if (isFlowboardProjectName(name) && !projectHasMlDemoTasks(db, project._id)) {
        const samples = buildFlowboardMlSampleTasks(user._id, project._id);
        db.tasks = [...samples, ...db.tasks];
      }
      writeDb(db);
      return { data: { success: true, project } };
    }

    if (u === '/tasks') {
      const user = requireAuth();
      const title = String(body.title || '').trim();
      if (!title) throw new ApiError(400, 'Title is required.');

      const projectId = body.projectId || ensureDefaultProject(db, user._id)._id;
      const status = body.status || 'todo';

      const colTasks = db.tasks
        .filter((t) => t.userId === user._id && t.projectId === projectId && t.status === status)
        .sort((a, b) => b.order - a.order);
      const order = colTasks[0]?.order != null ? colTasks[0].order + 1 : 0;

      const task = {
        _id: newId(),
        projectId,
        title,
        description: String(body.description || '').trim(),
        priority: body.priority || 'medium',
        status,
        tags: Array.isArray(body.tags) ? body.tags : [],
        dueDate: body.dueDate || null,
        completedAt: status === 'done' ? nowIso() : null,
        order,
        userId: user._id,
        assignedTo: null,
        assignees: [],
        boardId: 'default',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.tasks.unshift(task);
      writeDb(db);
      return { data: { success: true, task } };
    }

    if (u === '/comments') {
      const user = requireAuth();
      const taskId = String(body.taskId || '').trim();
      const text = String(body.text || '').trim();
      if (!taskId || !text) throw new ApiError(400, 'taskId and text are required.');
      const task = db.tasks.find((t) => t._id === taskId && t.userId === user._id);
      if (!task) throw new ApiError(404, 'Task not found.');
      const comment = {
        _id: newId(),
        text,
        taskId,
        userId: user._id,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.comments.push(comment);
      writeDb(db);
      return {
        data: {
          success: true,
          comment: { ...comment, userId: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar } },
        },
      };
    }

    throw new ApiError(404, 'Route not found.');
  },

  async put(url, body = {}) {
    await sleep();
    const u = normalizeUrl(url);
    const db = readDb();
    const user = requireAuth();

    if (u.startsWith('/tasks/')) {
      const id = u.split('/')[2];
      const idx = db.tasks.findIndex((t) => t._id === id && t.userId === user._id);
      if (idx === -1) throw new ApiError(404, 'Task not found.');

      const allowed = ['title', 'description', 'priority', 'status', 'tags', 'dueDate', 'order', 'assignees'];
      const next = { ...db.tasks[idx] };
      const prevStatus = next.status || 'todo';
      for (const k of allowed) {
        if (body[k] !== undefined) next[k] = body[k];
      }
      const nextStatus = next.status || 'todo';
      if (prevStatus !== 'done' && nextStatus === 'done') {
        next.completedAt = nowIso();
      } else if (prevStatus === 'done' && nextStatus !== 'done') {
        next.completedAt = null;
      } else if (nextStatus !== 'done') {
        next.completedAt = null;
      } else if (nextStatus === 'done' && !next.completedAt) {
        next.completedAt = nowIso();
      }
      next.updatedAt = nowIso();
      db.tasks[idx] = next;
      writeDb(db);
      return { data: { success: true, task: next } };
    }

    throw new ApiError(404, 'Route not found.');
  },

  async delete(url) {
    await sleep();
    const u = normalizeUrl(url);
    const db = readDb();
    const user = requireAuth();

    if (u.startsWith('/projects/')) {
      const projectId = u.split('/')[2];
      const project = db.projects.find((p) => p._id === projectId);
      if (!project) throw new ApiError(404, 'Project not found.');

      // Personal project: owner only
      if (project.teamId == null) {
        if (project.ownerId !== user._id) throw new ApiError(403, 'You do not have access to this project.');
      } else {
        // Team project: allow team admin only
        const team = db.teams.find((t) => t._id === project.teamId);
        if (!team) throw new ApiError(404, 'Team not found.');
        if (team.adminId !== user._id) throw new ApiError(403, 'Only the team admin can delete this project.');
      }

      db.projects = db.projects.filter((p) => p._id !== projectId);
      // Cascade delete tasks/comments for this user+project (tasks are user-scoped in this app)
      const taskIds = new Set(db.tasks.filter((t) => t.userId === user._id && t.projectId === projectId).map((t) => t._id));
      db.tasks = db.tasks.filter((t) => !(t.userId === user._id && t.projectId === projectId));
      db.comments = db.comments.filter((c) => !taskIds.has(c.taskId));
      writeDb(db);

      // If active project was deleted, clear selection (ProjectContext will pick a fallback on refresh)
      if (localStorage.getItem('fb_active_project') === projectId) {
        localStorage.removeItem('fb_active_project');
      }

      return { data: { success: true, message: 'Project deleted.' } };
    }

    if (u.startsWith('/teams/')) {
      const teamId = u.split('/')[2];
      const team = db.teams.find((t) => t._id === teamId);
      if (!team) throw new ApiError(404, 'Team not found.');
      if (team.adminId !== user._id) throw new ApiError(403, 'Only the team admin can delete this team.');

      // Remove team + its projects, cascade delete tasks/comments under those projects for this user
      const teamProjectIds = db.projects.filter((p) => p.teamId === teamId).map((p) => p._id);
      db.teams = db.teams.filter((t) => t._id !== teamId);
      db.projects = db.projects.filter((p) => p.teamId !== teamId);

      const taskIds = new Set(
        db.tasks
          .filter((t) => t.userId === user._id && teamProjectIds.includes(t.projectId))
          .map((t) => t._id)
      );
      db.tasks = db.tasks.filter((t) => !(t.userId === user._id && teamProjectIds.includes(t.projectId)));
      db.comments = db.comments.filter((c) => !taskIds.has(c.taskId));
      writeDb(db);

      const active = localStorage.getItem('fb_active_project');
      if (active && teamProjectIds.includes(active)) {
        localStorage.removeItem('fb_active_project');
      }

      return { data: { success: true, message: 'Team deleted.' } };
    }

    if (u.startsWith('/tasks/')) {
      const id = u.split('/')[2];
      const task = db.tasks.find((t) => t._id === id && t.userId === user._id);
      if (!task) throw new ApiError(404, 'Task not found.');
      db.tasks = db.tasks.filter((t) => !(t._id === id && t.userId === user._id));
      db.comments = db.comments.filter((c) => c.taskId !== id);
      writeDb(db);
      return { data: { success: true, message: 'Task deleted.' } };
    }

    if (u.startsWith('/comments/')) {
      const id = u.split('/')[2];
      const comment = db.comments.find((c) => c._id === id && c.userId === user._id);
      if (!comment) throw new ApiError(404, 'Comment not found.');
      db.comments = db.comments.filter((c) => !(c._id === id && c.userId === user._id));
      writeDb(db);
      return { data: { success: true, message: 'Comment deleted.' } };
    }

    throw new ApiError(404, 'Route not found.');
  },
};

export default api;
