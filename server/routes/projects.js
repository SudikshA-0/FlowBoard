const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { requireProjectAccess } = require('../middleware/projectAccess');
const {
  bootstrap,
  createProject,
  getProjects,
  getProjectById,
} = require('../controllers/projectController');

router.use(protect);

router.get('/bootstrap', bootstrap);
router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', requireProjectAccess(), getProjectById);

module.exports = router;

