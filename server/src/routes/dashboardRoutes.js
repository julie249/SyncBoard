import express from 'express';
import {
  getDashboardMetrics,
  getMyTasks
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireWorkspaceMember } from '../middleware/workspaceAuth.js';

const router = express.Router();

router.use(protect);

router.get('/metrics/:workspaceId', requireWorkspaceMember, getDashboardMetrics);
router.get('/my-tasks', getMyTasks);

export default router;
