import express from 'express';
import {
  getComments,
  createComment,
  updateComment,
  deleteComment
} from '../controllers/commentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireWorkspaceMember } from '../middleware/workspaceAuth.js';

const router = express.Router();

router.use(protect);

router.get('/card/:cardId', getComments);
router.post('/card/:cardId', requireWorkspaceMember, createComment);
router.put('/:commentId', updateComment);
router.delete('/:commentId', deleteComment);

export default router;
