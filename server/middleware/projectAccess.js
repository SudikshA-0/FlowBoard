const Project = require('../models/Project');
const Team = require('../models/Team');

/**
 * Loads a project and enforces access control.
 *
 * Rules:
 * - Private project: only owner can access
 * - Team project: any team member can access
 */
const requireProjectAccess = () => async (req, res, next) => {
  try {
    const projectId =
      req.params.projectId ||
      req.params.id ||
      req.body.projectId ||
      req.query.projectId;

    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required.' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    // Personal/private project
    if (!project.teamId) {
      if (project.ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You do not have access to this project.' });
      }
      req.project = project;
      return next();
    }

    // Team project
    const team = await Team.findById(project.teamId).select('memberIds');
    if (!team) return res.status(404).json({ message: 'Team not found.' });

    const userId = req.user._id.toString();
    const isMember = team.memberIds.some((m) => m.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ message: 'You do not have access to this project.' });
    }

    req.project = project;
    req.team = team;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireProjectAccess };

