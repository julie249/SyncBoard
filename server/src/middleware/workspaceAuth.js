import mongoose from 'mongoose';
import { Workspace } from '../models/Workspace.js';
import { Board } from '../models/Board.js';
import { Card } from '../models/Card.js';

export const requireWorkspaceMember = async (req, res, next) => {
  try {
    let workspaceId = req.params.workspaceId || req.body.workspaceId || req.query.workspaceId;

    // If workspaceId is not directly in request, try resolving from cardId
    if (!workspaceId && req.params.cardId) {
      if (!mongoose.Types.ObjectId.isValid(req.params.cardId)) {
        return res.status(400).json({ success: false, message: 'Invalid Card ID format' });
      }
      const card = await Card.findById(req.params.cardId);
      if (!card) {
        return res.status(404).json({ success: false, message: 'Card not found' });
      }
      req.card = card;
      const board = await Board.findById(card.board);
      if (!board) {
        return res.status(404).json({ success: false, message: 'Board not found' });
      }
      req.board = board;
      workspaceId = board.workspace;
    }

    // If workspaceId is not directly in request, try resolving from boardId
    if (!workspaceId && req.params.boardId) {
      if (!mongoose.Types.ObjectId.isValid(req.params.boardId)) {
        return res.status(400).json({ success: false, message: 'Invalid Board ID format' });
      }
      const board = await Board.findById(req.params.boardId);
      if (!board) {
        return res.status(404).json({ success: false, message: 'Board not found' });
      }
      workspaceId = board.workspace;
      req.board = board;
    }

    if (!workspaceId) {
      return res.status(400).json({ success: false, message: 'Workspace ID required' });
    }

    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({ success: false, message: 'Invalid Workspace ID format' });
    }

    const workspace = await Workspace.findById(workspaceId).populate('members.user', 'name email avatar');
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    const userIdStr = req.user._id.toString();
    const isOwner = workspace.owner.toString() === userIdStr;

    const memberEntry = workspace.members.find(
      (m) => m.user && (m.user._id ? m.user._id.toString() : m.user.toString()) === userIdStr
    );

    if (!isOwner && !memberEntry) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this workspace'
      });
    }

    req.workspace = workspace;
    req.workspaceRole = isOwner ? 'admin' : memberEntry.role;
    next();
  } catch (error) {
    console.error('Workspace membership check error:', error);
    return res.status(500).json({ success: false, message: 'Server error checking workspace permissions' });
  }
};

export const requireWorkspaceAdmin = (req, res, next) => {
  if (req.workspaceRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Admin role required for this action'
    });
  }
  next();
};
