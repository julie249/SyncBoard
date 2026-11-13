import express from 'express';
import {
  getUserWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  inviteMember,
  getMyInvitations,
  respondToInvitation,
  updateMemberRole,
  removeMember,
  leaveWorkspace
} from '../controllers/workspaceController.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  requireWorkspaceMember,
  requireWorkspaceAdmin
} from '../middleware/workspaceAuth.js';

const router = express.Router();

router.use(protect);

router.get('/', getUserWorkspaces);
router.post('/', createWorkspace);
router.get('/invitations/my', getMyInvitations);
router.post('/invitations/respond', respondToInvitation);

// Workspace specific routes
router.get('/:workspaceId', requireWorkspaceMember, getWorkspaceById);
router.put('/:workspaceId', requireWorkspaceMember, requireWorkspaceAdmin, updateWorkspace);
router.delete('/:workspaceId', requireWorkspaceMember, requireWorkspaceAdmin, deleteWorkspace);

// Members & Invitations
router.post('/:workspaceId/invite', requireWorkspaceMember, requireWorkspaceAdmin, inviteMember);
router.put('/:workspaceId/members/role', requireWorkspaceMember, requireWorkspaceAdmin, updateMemberRole);
router.delete('/:workspaceId/members', requireWorkspaceMember, requireWorkspaceAdmin, removeMember);
router.post('/:workspaceId/leave', requireWorkspaceMember, leaveWorkspace);

export default router;
