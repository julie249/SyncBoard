import express from 'express';
import {
  createList,
  updateList,
  reorderLists,
  deleteList
} from '../controllers/listController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireWorkspaceMember } from '../middleware/workspaceAuth.js';

const router = express.Router();

router.use(protect);

router.post('/board/:boardId', requireWorkspaceMember, createList);
router.put('/board/:boardId/reorder', requireWorkspaceMember, reorderLists);
router.put('/:listId', updateList);
router.delete('/:listId', deleteList);

export default router;
