import { Board } from '../models/Board.js';
import { List } from '../models/List.js';
import { Card } from '../models/Card.js';
import { Comment } from '../models/Comment.js';
import { recordActivity } from '../services/activityService.js';
import { getIO } from '../sockets/socketHandler.js';

export const getBoardsByWorkspace = async (req, res, next) => {
  try {
    const { search, archived } = req.query;
    const query = {
      workspace: req.workspace._id,
      archived: archived === 'true'
    };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const boards = await Board.find(query)
      .populate('createdBy', 'name email avatar')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: boards.length,
      boards
    });
  } catch (error) {
    next(error);
  }
};

export const getBoardById = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.boardId)
      .populate('createdBy', 'name email avatar')
      .populate('starredBy', 'name email avatar');

    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    // Fetch lists ordered by position
    const lists = await List.find({ board: board._id, archived: false }).sort({ position: 1 });

    // Fetch cards for all lists in this board
    const cards = await Card.find({ board: board._id, archived: false })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ position: 1 });

    return res.status(200).json({
      success: true,
      board,
      lists,
      cards,
      workspaceRole: req.workspaceRole
    });
  } catch (error) {
    next(error);
  }
};

export const createBoard = async (req, res, next) => {
  try {
    const { name, description, background } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Board name is required' });
    }

    const board = await Board.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      background: background || '#4F46E5',
      workspace: req.workspace._id,
      createdBy: req.user._id
    });

    // Create default lists for the new board
    const defaultListNames = ['To Do', 'In Progress', 'Done'];
    const createdLists = [];
    for (let i = 0; i < defaultListNames.length; i++) {
      const list = await List.create({
        name: defaultListNames[i],
        board: board._id,
        position: (i + 1) * 1000
      });
      createdLists.push(list);
    }

    const populatedBoard = await Board.findById(board._id).populate(
      'createdBy',
      'name email avatar'
    );

    await recordActivity({
      workspaceId: req.workspace._id,
      boardId: board._id,
      actorId: req.user._id,
      action: 'board:create',
      description: `${req.user.name} created board "${board.name}"`
    });

    const io = getIO();
    if (io) {
      io.to(`workspace:${req.workspace._id}`).emit('board:created', populatedBoard);
    }

    return res.status(201).json({
      success: true,
      message: 'Board created successfully',
      board: populatedBoard,
      lists: createdLists
    });
  } catch (error) {
    next(error);
  }
};

export const updateBoard = async (req, res, next) => {
  try {
    const { name, description, background } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (background) updates.background = background;

    const board = await Board.findByIdAndUpdate(req.params.boardId, updates, {
      new: true,
      runValidators: true
    }).populate('createdBy', 'name email avatar');

    await recordActivity({
      workspaceId: board.workspace,
      boardId: board._id,
      actorId: req.user._id,
      action: 'board:update',
      description: `${req.user.name} updated board "${board.name}"`
    });

    const io = getIO();
    if (io) {
      io.to(`board:${board._id}`).emit('board:updated', board);
      io.to(`workspace:${board.workspace}`).emit('board:updated', board);
    }

    return res.status(200).json({
      success: true,
      message: 'Board updated successfully',
      board
    });
  } catch (error) {
    next(error);
  }
};

export const toggleStarBoard = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    const userIdStr = req.user._id.toString();
    const isStarred = board.starredBy.some((id) => id.toString() === userIdStr);

    if (isStarred) {
      board.starredBy = board.starredBy.filter((id) => id.toString() !== userIdStr);
    } else {
      board.starredBy.push(req.user._id);
    }

    await board.save();

    return res.status(200).json({
      success: true,
      starred: !isStarred,
      starredBy: board.starredBy
    });
  } catch (error) {
    next(error);
  }
};

export const toggleArchiveBoard = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    board.archived = !board.archived;
    await board.save();

    await recordActivity({
      workspaceId: board.workspace,
      boardId: board._id,
      actorId: req.user._id,
      action: board.archived ? 'board:archive' : 'board:restore',
      description: `${req.user.name} ${board.archived ? 'archived' : 'restored'} board "${board.name}"`
    });

    const io = getIO();
    if (io) {
      io.to(`board:${board._id}`).emit('board:archived', {
        boardId: board._id,
        archived: board.archived
      });
      io.to(`workspace:${board.workspace}`).emit('board:archived', {
        boardId: board._id,
        archived: board.archived
      });
    }

    return res.status(200).json({
      success: true,
      message: `Board ${board.archived ? 'archived' : 'restored'} successfully`,
      board
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBoard = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    const cards = await Card.find({ board: board._id });
    const cardIds = cards.map((c) => c._id);

    await Comment.deleteMany({ card: { $in: cardIds } });
    await Card.deleteMany({ board: board._id });
    await List.deleteMany({ board: board._id });
    await Board.findByIdAndDelete(board._id);

    await recordActivity({
      workspaceId: board.workspace,
      boardId: board._id,
      actorId: req.user._id,
      action: 'board:delete',
      description: `${req.user.name} deleted board "${board.name}"`
    });

    const io = getIO();
    if (io) {
      io.to(`board:${board._id}`).emit('board:deleted', { boardId: board._id });
      io.to(`workspace:${board.workspace}`).emit('board:deleted', { boardId: board._id });
    }

    return res.status(200).json({
      success: true,
      message: 'Board deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
