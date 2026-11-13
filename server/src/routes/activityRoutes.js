import express from 'express';
import {
  getWorkspaceActivity,
  getBoardActivity
} from '../controllers/activityController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireWorkspaceMember } from '../middleware/workspaceAuth.js';

const router = express.Router();

router.use(protect);

router.get('/workspace/:workspaceId', requireWorkspaceMember, getWorkspaceActivity);
router.get('/board/:boardId', requireWorkspaceMember, getBoardActivity);

export default router;
