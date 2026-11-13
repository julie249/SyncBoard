import mongoose from 'mongoose';
import { Card } from '../models/Card.js';
import { List } from '../models/List.js';
import { Board } from '../models/Board.js';
import { Comment } from '../models/Comment.js';
import { Activity } from '../models/Activity.js';
import { recordActivity } from '../services/activityService.js';
import { createNotification } from '../services/notificationService.js';
import { getIO } from '../sockets/socketHandler.js';

export const createCard = async (req, res, next) => {
  try {
    const { title, description, listId, priority = 'Medium', dueDate, assignedTo = [], labels = [] } = req.body;
    const boardId = req.params.boardId;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Card title is required' });
    }

    if (!listId) {
      return res.status(400).json({ success: false, message: 'List ID is required' });
    }

    const highestCard = await Card.findOne({ list: listId }).sort({ position: -1 });
    const position = highestCard ? highestCard.position + 1000 : 1000;

    const card = await Card.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      board: boardId,
      list: listId,
      position,
      priority,
      dueDate: dueDate || null,
      assignedTo,
      labels,
      createdBy: req.user._id
    });

    const populatedCard = await Card.findById(card._id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    const targetList = await List.findById(listId);

    await recordActivity({
      workspaceId: req.workspace._id,
      boardId,
      cardId: card._id,
      actorId: req.user._id,
      action: 'card:create',
      description: `${req.user.name} added "${card.title}" to ${targetList?.name || 'a list'}`
    });

    // Notify assigned members
    if (Array.isArray(assignedTo)) {
      for (const memberId of assignedTo) {
        await createNotification({
          recipient: memberId,
          sender: req.user._id,
          type: 'assignment',
          title: 'Task Assigned',
          message: `${req.user.name} assigned you to "${card.title}"`,
          entityId: card._id,
          entityType: 'Card'
        });
      }
    }

    const io = getIO();
    if (io) {
      io.to(`board:${boardId}`).emit('card:created', populatedCard);
    }

    return res.status(201).json({
      success: true,
      message: 'Card created successfully',
      card: populatedCard
    });
  } catch (error) {
    next(error);
  }
};

export const getCardById = async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.cardId)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('board', 'name workspace')
      .populate('list', 'name');

    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    const comments = await Comment.find({ card: card._id })
      .populate('author', 'name email avatar')
      .sort({ createdAt: 1 });

    const activities = await Activity.find({ card: card._id })
      .populate('actor', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      card,
      comments,
      activities
    });
  } catch (error) {
    next(error);
  }
};

export const updateCard = async (req, res, next) => {
  try {
    const { title, description, priority, dueDate, startDate, labels, assignedTo, archived } = req.body;
    const cardId = req.params.cardId;

    const existingCard = await Card.findById(cardId);
    if (!existingCard) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    const updates = {};
    if (title) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (priority) updates.priority = priority;
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (startDate !== undefined) updates.startDate = startDate;
    if (labels !== undefined) updates.labels = labels;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo;
    if (archived !== undefined) updates.archived = archived;

    const updatedCard = await Card.findByIdAndUpdate(cardId, updates, {
      new: true,
      runValidators: true
    })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('list', 'name');

    // Notify newly assigned members
    if (assignedTo && Array.isArray(assignedTo)) {
      const oldAssigneeIds = existingCard.assignedTo.map((id) => id.toString());
      const newAssigneeIds = assignedTo.filter(
        (id) => !oldAssigneeIds.includes(id.toString()) && id.toString() !== req.user._id.toString()
      );

      for (const newAssignee of newAssigneeIds) {
        await createNotification({
          recipient: newAssignee,
          sender: req.user._id,
          type: 'assignment',
          title: 'Task Assigned',
          message: `${req.user.name} assigned you to "${updatedCard.title}"`,
          entityId: updatedCard._id,
          entityType: 'Card'
        });
      }
    }

    await recordActivity({
      workspaceId: req.workspace._id,
      boardId: updatedCard.board,
      cardId: updatedCard._id,
      actorId: req.user._id,
      action: 'card:update',
      description: `${req.user.name} updated details of "${updatedCard.title}"`
    });

    const io = getIO();
    if (io) {
      io.to(`board:${updatedCard.board}`).emit('card:updated', updatedCard);
    }

    return res.status(200).json({
      success: true,
      message: 'Card updated successfully',
      card: updatedCard
    });
  } catch (error) {
    next(error);
  }
};

export const moveCard = async (req, res, next) => {
  try {
    const { targetListId, newPosition, orderedCardIds } = req.body;
    const cardId = req.params.cardId;

    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    const sourceListId = card.list;
    const destinationListId = targetListId || sourceListId;
    const isDifferentList = sourceListId.toString() !== destinationListId.toString();

    const [sourceList, destinationList] = await Promise.all([
      List.findById(sourceListId),
      List.findById(destinationListId)
    ]);

    card.list = destinationListId;
    if (newPosition !== undefined) {
      card.position = newPosition;
    }
    await card.save();

    // If an ordered array of card IDs for the target list was sent, bulk-update positions
    if (Array.isArray(orderedCardIds) && orderedCardIds.length > 0) {
      const bulkOps = orderedCardIds.map((id, index) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { position: (index + 1) * 1000, list: destinationListId } }
        }
      }));
      await Card.bulkWrite(bulkOps);
    }

    const populatedCard = await Card.findById(card._id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('list', 'name');

    // Record activity
    const activityDesc = isDifferentList
      ? `${req.user.name} moved "${card.title}" from ${sourceList?.name || 'a list'} to ${destinationList?.name || 'another list'}`
      : `${req.user.name} reordered "${card.title}" in ${sourceList?.name || 'list'}`;

    await recordActivity({
      workspaceId: req.workspace._id,
      boardId: card.board,
      cardId: card._id,
      actorId: req.user._id,
      action: 'card:move',
      description: activityDesc,
      metadata: {
        sourceListId,
        destinationListId,
        sourceListName: sourceList?.name,
        destinationListName: destinationList?.name
      }
    });

    const io = getIO();
    if (io) {
      io.to(`board:${card.board}`).emit('card:moved', {
        card: populatedCard,
        sourceListId,
        destinationListId,
        newPosition: card.position
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Card moved successfully',
      card: populatedCard
    });
  } catch (error) {
    next(error);
  }
};

export const addChecklistItem = async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Checklist title is required' });
    }

    const card = await Card.findById(req.params.cardId);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    card.checklist.push({ title: title.trim(), completed: false });
    await card.save();

    const populatedCard = await Card.findById(card._id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    const io = getIO();
    if (io) {
      io.to(`board:${card.board}`).emit('card:updated', populatedCard);
    }

    return res.status(200).json({
      success: true,
      card: populatedCard
    });
  } catch (error) {
    next(error);
  }
};

export const toggleChecklistItem = async (req, res, next) => {
  try {
    const { cardId, itemId } = req.params;
    const { completed } = req.body;

    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    const item = card.checklist.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Checklist item not found' });
    }

    item.completed = completed !== undefined ? completed : !item.completed;
    await card.save();

    const populatedCard = await Card.findById(card._id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    const io = getIO();
    if (io) {
      io.to(`board:${card.board}`).emit('card:updated', populatedCard);
    }

    return res.status(200).json({
      success: true,
      card: populatedCard
    });
  } catch (error) {
    next(error);
  }
};

export const deleteChecklistItem = async (req, res, next) => {
  try {
    const { cardId, itemId } = req.params;

    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    card.checklist = card.checklist.filter((item) => item._id.toString() !== itemId);
    await card.save();

    const populatedCard = await Card.findById(card._id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    const io = getIO();
    if (io) {
      io.to(`board:${card.board}`).emit('card:updated', populatedCard);
    }

    return res.status(200).json({
      success: true,
      card: populatedCard
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCard = async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.cardId);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    await Comment.deleteMany({ card: card._id });
    await Card.findByIdAndDelete(card._id);

    await recordActivity({
      workspaceId: req.workspace._id,
      boardId: card.board,
      actorId: req.user._id,
      action: 'card:delete',
      description: `${req.user.name} deleted task "${card.title}"`
    });

    const io = getIO();
    if (io) {
      io.to(`board:${card.board}`).emit('card:deleted', {
        cardId: card._id,
        listId: card.list
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Card deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
