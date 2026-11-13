import express from 'express';
import {
  createCard,
  getCardById,
  updateCard,
  moveCard,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  deleteCard
} from '../controllers/cardController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireWorkspaceMember } from '../middleware/workspaceAuth.js';

const router = express.Router();

router.use(protect);

router.post('/board/:boardId', requireWorkspaceMember, createCard);
router.get('/:cardId', getCardById);
router.put('/:cardId', requireWorkspaceMember, updateCard);
router.put('/:cardId/move', requireWorkspaceMember, moveCard);
router.post('/:cardId/checklist', addChecklistItem);
router.put('/:cardId/checklist/:itemId', toggleChecklistItem);
router.delete('/:cardId/checklist/:itemId', deleteChecklistItem);
router.delete('/:cardId', requireWorkspaceMember, deleteCard);

export default router;
