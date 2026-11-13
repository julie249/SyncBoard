import { List } from '../models/List.js';
import { Card } from '../models/Card.js';
import { Comment } from '../models/Comment.js';
import { recordActivity } from '../services/activityService.js';
import { getIO } from '../sockets/socketHandler.js';

export const createList = async (req, res, next) => {
  try {
    const { name, position } = req.body;
    const boardId = req.params.boardId;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'List name is required' });
    }

    let calculatedPosition = position;
    if (calculatedPosition === undefined) {
      const highestList = await List.findOne({ board: boardId }).sort({ position: -1 });
      calculatedPosition = highestList ? highestList.position + 1000 : 1000;
    }

    const list = await List.create({
      name: name.trim(),
      board: boardId,
      position: calculatedPosition
    });

    await recordActivity({
      workspaceId: req.workspace._id,
      boardId,
      actorId: req.user._id,
      action: 'list:create',
      description: `${req.user.name} created list "${list.name}"`
    });

    const io = getIO();
    if (io) {
      io.to(`board:${boardId}`).emit('list:created', list);
    }

    return res.status(201).json({
      success: true,
      message: 'List created successfully',
      list
    });
  } catch (error) {
    next(error);
  }
};

export const updateList = async (req, res, next) => {
  try {
    const { name, position, archived } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (position !== undefined) updates.position = position;
    if (archived !== undefined) updates.archived = archived;

    const list = await List.findByIdAndUpdate(req.params.listId, updates, {
      new: true,
      runValidators: true
    });

    if (!list) {
      return res.status(404).json({ success: false, message: 'List not found' });
    }

    const io = getIO();
    if (io) {
      io.to(`board:${list.board}`).emit('list:updated', list);
    }

    return res.status(200).json({
      success: true,
      message: 'List updated successfully',
      list
    });
  } catch (error) {
    next(error);
  }
};

export const reorderLists = async (req, res, next) => {
  try {
    const { orderedListIds } = req.body; // array of list IDs in new order
    const boardId = req.params.boardId;

    if (!Array.isArray(orderedListIds)) {
      return res.status(400).json({ success: false, message: 'orderedListIds array is required' });
    }

    const bulkOps = orderedListIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, board: boardId },
        update: { $set: { position: (index + 1) * 1000 } }
      }
    }));

    await List.bulkWrite(bulkOps);

    const updatedLists = await List.find({ board: boardId, archived: false }).sort({ position: 1 });

    const io = getIO();
    if (io) {
      io.to(`board:${boardId}`).emit('list:reordered', {
        boardId,
        lists: updatedLists
      });
    }

    return res.status(200).json({
      success: true,
      lists: updatedLists
    });
  } catch (error) {
    next(error);
  }
};

export const deleteList = async (req, res, next) => {
  try {
    const list = await List.findById(req.params.listId);
    if (!list) {
      return res.status(404).json({ success: false, message: 'List not found' });
    }

    const cards = await Card.find({ list: list._id });
    const cardIds = cards.map((c) => c._id);

    await Comment.deleteMany({ card: { $in: cardIds } });
    await Card.deleteMany({ list: list._id });
    await List.findByIdAndDelete(list._id);

    await recordActivity({
      workspaceId: req.workspace._id,
      boardId: list.board,
      actorId: req.user._id,
      action: 'list:delete',
      description: `${req.user.name} deleted list "${list.name}"`
    });

    const io = getIO();
    if (io) {
      io.to(`board:${list.board}`).emit('list:deleted', { listId: list._id });
    }

    return res.status(200).json({
      success: true,
      message: 'List deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
