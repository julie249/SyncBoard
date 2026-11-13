import { Comment } from '../models/Comment.js';
import { Card } from '../models/Card.js';
import { recordActivity } from '../services/activityService.js';
import { createNotification } from '../services/notificationService.js';
import { getIO } from '../sockets/socketHandler.js';

export const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ card: req.params.cardId })
      .populate('author', 'name email avatar')
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      comments
    });
  } catch (error) {
    next(error);
  }
};

export const createComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const cardId = req.params.cardId;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty' });
    }

    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    const comment = await Comment.create({
      card: cardId,
      author: req.user._id,
      content: content.trim()
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      'author',
      'name email avatar'
    );

    await recordActivity({
      workspaceId: req.workspace._id,
      boardId: card.board,
      cardId: card._id,
      actorId: req.user._id,
      action: 'comment:create',
      description: `${req.user.name} commented on "${card.title}"`
    });

    // Notify card creator and assignees (if not the author)
    const usersToNotify = new Set([
      card.createdBy.toString(),
      ...card.assignedTo.map((id) => id.toString())
    ]);
    usersToNotify.delete(req.user._id.toString());

    for (const userId of usersToNotify) {
      await createNotification({
        recipient: userId,
        sender: req.user._id,
        type: 'comment',
        title: 'New Comment',
        message: `${req.user.name} commented on "${card.title}": "${content.slice(0, 50)}${content.length > 50 ? '...' : ''}"`,
        entityId: card._id,
        entityType: 'Card'
      });
    }

    const io = getIO();
    if (io) {
      io.to(`board:${card.board}`).emit('comment:created', {
        cardId: card._id,
        comment: populatedComment
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: populatedComment
    });
  } catch (error) {
    next(error);
  }
};

export const updateComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const commentId = req.params.commentId;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Only author or workspace admin can edit
    if (
      comment.author.toString() !== req.user._id.toString() &&
      req.workspaceRole !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this comment'
      });
    }

    comment.content = content.trim();
    await comment.save();

    const populatedComment = await Comment.findById(comment._id).populate(
      'author',
      'name email avatar'
    );

    const card = await Card.findById(comment.card);

    const io = getIO();
    if (io && card) {
      io.to(`board:${card.board}`).emit('comment:updated', {
        cardId: card._id,
        comment: populatedComment
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      comment: populatedComment
    });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const commentId = req.params.commentId;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Only author or workspace admin can delete
    if (
      comment.author.toString() !== req.user._id.toString() &&
      req.workspaceRole !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this comment'
      });
    }

    const card = await Card.findById(comment.card);
    await Comment.findByIdAndDelete(commentId);

    const io = getIO();
    if (io && card) {
      io.to(`board:${card.board}`).emit('comment:deleted', {
        cardId: card._id,
        commentId
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
