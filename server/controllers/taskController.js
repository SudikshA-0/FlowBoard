const Task = require('../models/Task');
const Project = require('../models/Project');

async function resolveDefaultProjectId(userId) {
  const defaultProject = await Project.findOne({
    ownerId: userId,
    teamId: null,
    isPrivate: true,
    name: 'Default',
  }).select('_id');
  return defaultProject?._id ?? null;
}

// ── GET /api/tasks ─────────────────────────────────────────────────────────
exports.getTasks = async (req, res, next) => {
  try {
    const { status, priority, search, projectId } = req.query;
    const filter = { userId: req.user._id };

    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;
    if (projectId) filter.projectId = projectId;

    if (search) {
      filter.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags:        { $in: [new RegExp(search, 'i')] } },
      ];
    }

    // Backward compat: if projectId not provided, restrict to default personal project when present.
    if (!projectId) {
      const defaultProjectId = await resolveDefaultProjectId(req.user._id);
      if (defaultProjectId) filter.projectId = defaultProjectId;
    }

    const tasks = await Task.find(filter).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, tasks });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/tasks ────────────────────────────────────────────────────────
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, priority, status, tags, dueDate, projectId } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: 'Title is required.' });
    }

    let resolvedProjectId = projectId;
    if (!resolvedProjectId) {
      resolvedProjectId = await resolveDefaultProjectId(req.user._id);
    }
    if (!resolvedProjectId) {
      return res.status(400).json({ message: 'projectId is required.' });
    }

    // Set order = highest + 1 in that column
    const last = await Task.findOne({ userId: req.user._id, projectId: resolvedProjectId, status: status || 'todo' })
      .sort({ order: -1 });
    const order = last ? last.order + 1 : 0;

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim() || '',
      priority: priority || 'medium',
      status: status || 'todo',
      tags: Array.isArray(tags) ? tags : [],
      dueDate: dueDate || null,
      userId: req.user._id,
      projectId: resolvedProjectId,
      order,
    });

    // Emit real-time event via socket (attached to app in server.js)
    req.app.get('io')?.to(`project:${resolvedProjectId}`).emit('taskCreated', task);

    res.status(201).json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/tasks/:id ─────────────────────────────────────────────────────
exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const allowed = ['title', 'description', 'priority', 'status', 'tags', 'dueDate', 'order', 'assignees'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });

    await task.save();
    req.app.get('io')?.to(`project:${task.projectId}`).emit('taskUpdated', task);

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/tasks/:id ──────────────────────────────────────────────────
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    req.app.get('io')?.to(`project:${task.projectId}`).emit('taskDeleted', req.params.id);

    res.json({ success: true, message: 'Task deleted.' });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/tasks/analytics ───────────────────────────────────────────────
exports.getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId } = req.query;

    const filter = { userId };
    if (projectId) filter.projectId = projectId;
    if (!projectId) {
      const defaultProjectId = await resolveDefaultProjectId(userId);
      if (defaultProjectId) filter.projectId = defaultProjectId;
    }

    const [total, byStatus, byPriority] = await Promise.all([
      Task.countDocuments(filter),
      Task.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: filter },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
    ]);

    // Overdue tasks
    const overdue = await Task.countDocuments({
      ...filter,
      status: { $ne: 'done' },
      dueDate: { $lt: new Date() },
      $and: [{ dueDate: { $ne: null } }],
    });

    res.json({
      success: true,
      analytics: {
        total,
        overdue,
        byStatus:   Object.fromEntries(byStatus.map(s   => [s._id, s.count])),
        byPriority: Object.fromEntries(byPriority.map(p => [p._id, p.count])),
      },
    });
  } catch (err) {
    next(err);
  }
};
