const Comment = require('../models/Comment');
const Task    = require('../models/Task');

// ── POST /api/comments ─────────────────────────────────────────────────────
exports.createComment = async (req, res, next) => {
  try {
    const { taskId, text } = req.body;
    if (!taskId || !text?.trim()) {
      return res.status(400).json({ message: 'taskId and text are required.' });
    }

    // Ensure task belongs to this user
    const task = await Task.findOne({ _id: taskId, userId: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const comment = await Comment.create({ taskId, text: text.trim(), userId: req.user._id });
    await comment.populate('userId', 'name email avatar');

    req.app.get('io')?.to(`task:${taskId}`).emit('commentAdded', comment);

    res.status(201).json({ success: true, comment });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/comments/:taskId ──────────────────────────────────────────────
exports.getComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    // Security: ensure task belongs to requesting user
    const task = await Task.findOne({ _id: taskId, userId: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const comments = await Comment.find({ taskId })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: 1 });

    res.json({ success: true, comments });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/comments/:id ───────────────────────────────────────────────
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });

    req.app.get('io')
      ?.to(`task:${comment.taskId}`)
      .emit('commentDeleted', req.params.id);

    res.json({ success: true, message: 'Comment deleted.' });
  } catch (err) {
    next(err);
  }
};
