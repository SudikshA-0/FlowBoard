const express = require('express');
const router  = express.Router();
const { createComment, getComments, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/',          createComment);
router.get('/:taskId',    getComments);
router.delete('/:id',     deleteComment);

module.exports = router;
