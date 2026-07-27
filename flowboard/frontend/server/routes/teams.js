const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const {
  createTeam,
  getTeams,
  createInvite,
  getInviteLink,
  joinByInvite,
} = require('../controllers/teamController');

router.use(protect);

router.post('/', createTeam);
router.get('/', getTeams);
router.post('/:id/invite', createInvite);
router.get('/:id/invite-link', getInviteLink);
router.post('/join', joinByInvite);

module.exports = router;

