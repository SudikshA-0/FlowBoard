const crypto = require('crypto');
const Project = require('../models/Project');
const Team = require('../models/Team');
const Task = require('../models/Task');

const DEFAULT_PERSONAL_PROJECT_NAME = 'Default';

async function ensureDefaultPersonalProject(userId) {
  let project = await Project.findOne({
    ownerId: userId,
    teamId: null,
    isPrivate: true,
    name: DEFAULT_PERSONAL_PROJECT_NAME,
  });

  if (!project) {
    project = await Project.create({
      name: DEFAULT_PERSONAL_PROJECT_NAME,
      description: 'Your personal default project.',
      ownerId: userId,
      teamId: null,
      isPrivate: true,
    });
  }

  return project;
}

// ── GET /api/projects/bootstrap ─────────────────────────────────────────────
exports.bootstrap = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const defaultProject = await ensureDefaultPersonalProject(userId);

    // Backfill: any legacy tasks without projectId move into default project
    await Task.updateMany(
      { userId, projectId: null },
      { $set: { projectId: defaultProject._id } }
    );

    res.json({ success: true, defaultProjectId: defaultProject._id });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/projects ──────────────────────────────────────────────────────
exports.createProject = async (req, res, next) => {
  try {
    const { name, description = '', teamId = null, isPrivate } = req.body;

    const trimmedName = name?.trim();
    if (!trimmedName) return res.status(400).json({ message: 'Project name is required.' });

    // Personal project if no teamId
    if (!teamId) {
      const project = await Project.create({
        name: trimmedName,
        description: description?.trim() || '',
        ownerId: req.user._id,
        teamId: null,
        isPrivate: true,
      });
      return res.status(201).json({ success: true, project });
    }

    // Team project
    const team = await Team.findById(teamId).select('memberIds');
    if (!team) return res.status(404).json({ message: 'Team not found.' });

    const userId = req.user._id.toString();
    const isMember = team.memberIds.some((m) => m.toString() === userId);
    if (!isMember) return res.status(403).json({ message: 'You are not a member of this team.' });

    const project = await Project.create({
      name: trimmedName,
      description: description?.trim() || '',
      ownerId: req.user._id,
      teamId: team._id,
      isPrivate: Boolean(isPrivate) === true ? true : false,
    });

    res.status(201).json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/projects ───────────────────────────────────────────────────────
exports.getProjects = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const teams = await Team.find({ memberIds: userId }).select('name adminId memberIds');
    const teamIds = teams.map((t) => t._id);

    const [personalProjects, teamProjects] = await Promise.all([
      Project.find({ ownerId: userId, teamId: null, isPrivate: true }).sort({ createdAt: -1 }),
      Project.find({ teamId: { $in: teamIds } }).sort({ createdAt: -1 }),
    ]);

    res.json({
      success: true,
      personalProjects,
      teams: teams.map((t) => ({ _id: t._id, name: t.name })),
      teamProjects,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/projects/:id ───────────────────────────────────────────────────
exports.getProjectById = async (req, res) => {
  // Access enforced by requireProjectAccess middleware; project attached to req.
  res.json({ success: true, project: req.project });
};

