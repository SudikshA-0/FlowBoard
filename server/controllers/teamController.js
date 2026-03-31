const crypto = require('crypto');
const Team = require('../models/Team');

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const newInviteToken = () => {
  const rawToken = crypto.randomBytes(24).toString('hex');
  const tokenHash = hashToken(rawToken);
  return { rawToken, tokenHash };
};

const getAppUrl = () =>
  process.env.APP_URL ||
  process.env.CLIENT_ORIGIN ||
  'http://localhost:5173';

// ── POST /api/teams ─────────────────────────────────────────────────────────
exports.createTeam = async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ message: 'Team name is required.' });

    const { rawToken, tokenHash } = newInviteToken();
    const team = await Team.create({
      name,
      adminId: req.user._id,
      memberIds: [req.user._id],
      inviteTokens: [
        {
          tokenHash,
          createdBy: req.user._id,
          expiresAt: new Date(Date.now() + INVITE_TTL_MS),
        },
      ],
    });

    res.status(201).json({
      success: true,
      team,
      inviteToken: rawToken,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/teams ──────────────────────────────────────────────────────────
exports.getTeams = async (req, res, next) => {
  try {
    const teams = await Team.find({ memberIds: req.user._id })
      .select('name adminId memberIds createdAt updatedAt')
      .sort({ createdAt: -1 });
    res.json({ success: true, teams });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/teams/:id/invite ──────────────────────────────────────────────
exports.createInvite = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found.' });

    if (team.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the team admin can invite members.' });
    }

    const { rawToken, tokenHash } = newInviteToken();

    team.inviteTokens.push({
      tokenHash,
      createdBy: req.user._id,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    });

    await team.save();

    res.status(201).json({
      success: true,
      inviteToken: rawToken,
      expiresAt: team.inviteTokens[team.inviteTokens.length - 1].expiresAt,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/teams/:id/invite-link ───────────────────────────────────────────
exports.getInviteLink = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found.' });

    if (team.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the team admin can invite members.' });
    }

    // Reuse the newest non-expired invite token if present; otherwise create a new one.
    const now = Date.now();
    const validInvites = (team.inviteTokens ?? []).filter((t) => t.expiresAt?.getTime?.() > now);
    let rawToken = null;

    if (validInvites.length === 0) {
      const { rawToken: rt, tokenHash } = newInviteToken();
      rawToken = rt;
      team.inviteTokens.push({
        tokenHash,
        createdBy: req.user._id,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      });
      await team.save();
    } else {
      // Cannot reconstruct raw token from hash; create a new one for link.
      const { rawToken: rt, tokenHash } = newInviteToken();
      rawToken = rt;
      team.inviteTokens.push({
        tokenHash,
        createdBy: req.user._id,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      });
      await team.save();
    }

    const link = `${getAppUrl()}/join?token=${encodeURIComponent(rawToken)}`;
    res.json({ success: true, link });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/teams/join ────────────────────────────────────────────────────
exports.joinByInvite = async (req, res, next) => {
  try {
    const token = (req.body.token || req.query.token || '').trim();
    if (!token) return res.status(400).json({ message: 'Invite token is required.' });

    const tokenHash = hashToken(token);
    const team = await Team.findOne({ 'inviteTokens.tokenHash': tokenHash });
    if (!team) return res.status(404).json({ message: 'Invite not found.' });

    const invite = team.inviteTokens.find((t) => t.tokenHash === tokenHash);
    if (!invite) return res.status(404).json({ message: 'Invite not found.' });

    if (invite.expiresAt.getTime() < Date.now()) {
      return res.status(410).json({ message: 'Invite has expired.' });
    }

    const userId = req.user._id.toString();
    const isMember = team.memberIds.some((m) => m.toString() === userId);
    if (!isMember) {
      team.memberIds.push(req.user._id);
      await team.save();
    }

    res.json({ success: true, team: { _id: team._id, name: team.name } });
  } catch (err) {
    next(err);
  }
};

