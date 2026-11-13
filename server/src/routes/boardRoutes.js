import express from 'express';
import {
  getBoardsByWorkspace,
  getBoardById,
  createBoard,
  updateBoard,
  toggleStarBoard,
  toggleArchiveBoard,
  deleteBoard
} from '../controllers/boardController.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  requireWorkspaceMember,
  requireWorkspaceAdmin
} from '../middleware/workspaceAuth.js';

const router = express.Router();

router.use(protect);

router.get('/workspace/:workspaceId', requireWorkspaceMember, getBoardsByWorkspace);
router.post('/workspace/:workspaceId', requireWorkspaceMember, createBoard);

router.get('/:boardId', requireWorkspaceMember, getBoardById);
router.put('/:boardId', requireWorkspaceMember, updateBoard);
router.post('/:boardId/star', requireWorkspaceMember, toggleStarBoard);
router.post('/:boardId/archive', requireWorkspaceMember, toggleArchiveBoard);
router.delete('/:boardId', requireWorkspaceMember, requireWorkspaceAdmin, deleteBoard);

export default router;
