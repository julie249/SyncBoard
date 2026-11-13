import express from 'express';
import { getCalendarTasks } from '../controllers/calendarController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireWorkspaceMember } from '../middleware/workspaceAuth.js';

const router = express.Router();

router.use(protect);

router.get('/workspace/:workspaceId', requireWorkspaceMember, getCalendarTasks);

export default router;
