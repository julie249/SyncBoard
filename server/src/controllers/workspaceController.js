import crypto from 'crypto';
import { Workspace } from '../models/Workspace.js';
import { Board } from '../models/Board.js';
import { List } from '../models/List.js';
import { Card } from '../models/Card.js';
import { Comment } from '../models/Comment.js';
import { Activity } from '../models/Activity.js';
import { Invitation } from '../models/Invitation.js';
import { User } from '../models/User.js';
import { recordActivity } from '../services/activityService.js';
import { createNotification } from '../services/notificationService.js';
import { getIO } from '../sockets/socketHandler.js';

export const getUserWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }]
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: workspaces.length,
      workspaces
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceById = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    return res.status(200).json({
      success: true,
      workspace,
      userRole: req.workspaceRole
    });
  } catch (error) {
    next(error);
  }
};

export const createWorkspace = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Workspace name is required' });
    }

    const workspace = await Workspace.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }]
    });

    const populatedWorkspace = await Workspace.findById(workspace._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    await recordActivity({
      workspaceId: workspace._id,
      actorId: req.user._id,
      action: 'workspace:create',
      description: `${req.user.name} created workspace "${workspace.name}"`
    });

    return res.status(201).json({
      success: true,
      message: 'Workspace created successfully',
      workspace: populatedWorkspace
    });
  } catch (error) {
    next(error);
  }
};

export const updateWorkspace = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();

    const workspace = await Workspace.findByIdAndUpdate(req.params.workspaceId, updates, {
      new: true,
      runValidators: true
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    await recordActivity({
      workspaceId: workspace._id,
      actorId: req.user._id,
      action: 'workspace:update',
      description: `${req.user.name} updated workspace settings`
    });

    const io = getIO();
    if (io) {
      io.to(`workspace:${workspace._id}`).emit('workspace:updated', workspace);
    }

    return res.status(200).json({
      success: true,
      message: 'Workspace updated successfully',
      workspace
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWorkspace = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the workspace owner can delete this workspace'
      });
    }

    // Cascade deletion
    const boards = await Board.find({ workspace: workspace._id });
    const boardIds = boards.map((b) => b._id);

    const cards = await Card.find({ board: { $in: boardIds } });
    const cardIds = cards.map((c) => c._id);

    await Comment.deleteMany({ card: { $in: cardIds } });
    await Card.deleteMany({ board: { $in: boardIds } });
    await List.deleteMany({ board: { $in: boardIds } });
    await Board.deleteMany({ workspace: workspace._id });
    await Activity.deleteMany({ workspace: workspace._id });
    await Invitation.deleteMany({ workspace: workspace._id });
    await Workspace.findByIdAndDelete(workspace._id);

    const io = getIO();
    if (io) {
      io.to(`workspace:${workspace._id}`).emit('workspace:deleted', { workspaceId: workspace._id });
    }

    return res.status(200).json({
      success: true,
      message: 'Workspace and all associated data deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const inviteMember = async (req, res, next) => {
  try {
    const { email, role = 'member' } = req.body;
    const workspaceId = req.params.workspaceId;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const workspace = await Workspace.findById(workspaceId);

    // Check if user is already a member
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      const isAlreadyMember = workspace.members.some(
        (m) => m.user.toString() === existingUser._id.toString()
      );
      if (isAlreadyMember) {
        return res.status(400).json({
          success: false,
          message: 'This user is already a member of this workspace'
        });
      }
    }

    // Check for existing pending invitation
    let invitation = await Invitation.findOne({
      workspace: workspaceId,
      email: cleanEmail,
      status: 'pending'
    });

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    if (invitation) {
      invitation.token = token;
      invitation.role = role;
      invitation.expiresAt = expiresAt;
      await invitation.save();
    } else {
      invitation = await Invitation.create({
        workspace: workspaceId,
        email: cleanEmail,
        invitedBy: req.user._id,
        role,
        token,
        expiresAt,
        status: 'pending'
      });
    }

    // If existing user, create in-app notification
    if (existingUser) {
      await createNotification({
        recipient: existingUser._id,
        sender: req.user._id,
        type: 'invitation',
        title: 'Workspace Invitation',
        message: `${req.user.name} invited you to join workspace "${workspace.name}"`,
        entityId: invitation._id,
        entityType: 'Workspace'
      });
    }

    await recordActivity({
      workspaceId,
      actorId: req.user._id,
      action: 'member:invite',
      description: `${req.user.name} invited ${cleanEmail} as ${role}`
    });

    return res.status(200).json({
      success: true,
      message: `Invitation created for ${cleanEmail}`,
      invitation: {
        id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        token: invitation.token,
        status: invitation.status,
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMyInvitations = async (req, res, next) => {
  try {
    const invitations = await Invitation.find({
      email: req.user.email,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    })
      .populate('workspace', 'name description')
      .populate('invitedBy', 'name email avatar');

    return res.status(200).json({
      success: true,
      invitations
    });
  } catch (error) {
    next(error);
  }
};

export const respondToInvitation = async (req, res, next) => {
  try {
    const { token, action } = req.body; // action: 'accept' | 'decline'

    if (!token || !['accept', 'decline'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Valid token and action (accept/decline) required' });
    }

    const invitation = await Invitation.findOne({
      token,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (!invitation) {
      return res.status(400).json({ success: false, message: 'Invitation is invalid or has expired' });
    }

    if (action === 'decline') {
      invitation.status = 'declined';
      await invitation.save();
      return res.status(200).json({ success: true, message: 'Invitation declined' });
    }

    // Accept invitation
    invitation.status = 'accepted';
    await invitation.save();

    const workspace = await Workspace.findById(invitation.workspace);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace no longer exists' });
    }

    // Check if not already member
    const alreadyMember = workspace.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!alreadyMember) {
      workspace.members.push({
        user: req.user._id,
        role: invitation.role
      });
      await workspace.save();
    }

    await recordActivity({
      workspaceId: workspace._id,
      actorId: req.user._id,
      action: 'member:join',
      description: `${req.user.name} joined the workspace`
    });

    const io = getIO();
    if (io) {
      io.to(`workspace:${workspace._id}`).emit('workspace:member_joined', {
        workspaceId: workspace._id,
        user: { id: req.user._id, name: req.user.name, email: req.user.email, avatar: req.user.avatar },
        role: invitation.role
      });
    }

    return res.status(200).json({
      success: true,
      message: `You have joined "${workspace.name}"`,
      workspaceId: workspace._id
    });
  } catch (error) {
    next(error);
  }
};

export const updateMemberRole = async (req, res, next) => {
  try {
    const { targetUserId, role } = req.body;
    const workspaceId = req.params.workspaceId;

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be admin or member' });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (workspace.owner.toString() === targetUserId) {
      return res.status(400).json({ success: false, message: 'Cannot modify workspace owner role' });
    }

    const member = workspace.members.find((m) => m.user.toString() === targetUserId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found in workspace' });
    }

    member.role = role;
    await workspace.save();

    const targetUser = await User.findById(targetUserId);

    await recordActivity({
      workspaceId,
      actorId: req.user._id,
      action: 'member:role_change',
      description: `${req.user.name} changed ${targetUser?.name || 'a member'}'s role to ${role}`
    });

    const io = getIO();
    if (io) {
      io.to(`workspace:${workspaceId}`).emit('workspace:member_updated', {
        workspaceId,
        userId: targetUserId,
        role
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Member role updated successfully',
      members: workspace.members
    });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { targetUserId } = req.body;
    const workspaceId = req.params.workspaceId;

    const workspace = await Workspace.findById(workspaceId);
    if (workspace.owner.toString() === targetUserId) {
      return res.status(400).json({ success: false, message: 'Cannot remove workspace owner' });
    }

    workspace.members = workspace.members.filter(
      (m) => m.user.toString() !== targetUserId
    );
    await workspace.save();

    const targetUser = await User.findById(targetUserId);

    await recordActivity({
      workspaceId,
      actorId: req.user._id,
      action: 'member:remove',
      description: `${req.user.name} removed ${targetUser?.name || 'a member'} from the workspace`
    });

    const io = getIO();
    if (io) {
      io.to(`workspace:${workspaceId}`).emit('workspace:member_removed', {
        workspaceId,
        userId: targetUserId
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const leaveWorkspace = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId;
    const workspace = await Workspace.findById(workspaceId);

    if (workspace.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Owner cannot leave their own workspace. Delete it or transfer ownership first.'
      });
    }

    workspace.members = workspace.members.filter(
      (m) => m.user.toString() !== req.user._id.toString()
    );
    await workspace.save();

    await recordActivity({
      workspaceId,
      actorId: req.user._id,
      action: 'member:leave',
      description: `${req.user.name} left the workspace`
    });

    const io = getIO();
    if (io) {
      io.to(`workspace:${workspaceId}`).emit('workspace:member_removed', {
        workspaceId,
        userId: req.user._id
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully left the workspace'
    });
  } catch (error) {
    next(error);
  }
};
