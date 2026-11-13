import { Board } from '../models/Board.js';
import { Card } from '../models/Card.js';

export const getCalendarTasks = async (req, res, next) => {
  try {
    const { start, end, boardId } = req.query;
    const workspaceId = req.workspace._id;

    let targetBoardIds = [];
    if (boardId) {
      targetBoardIds = [boardId];
    } else {
      const boards = await Board.find({ workspace: workspaceId });
      targetBoardIds = boards.map((b) => b._id);
    }

    const query = {
      board: { $in: targetBoardIds },
      dueDate: { $ne: null },
      archived: false
    };

    if (start || end) {
      query.dueDate = {};
      if (start) query.dueDate.$gte = new Date(start);
      if (end) query.dueDate.$lte = new Date(end);
    }

    const tasks = await Card.find(query)
      .populate('board', 'name background')
      .populate('list', 'name')
      .populate('assignedTo', 'name email avatar')
      .sort({ dueDate: 1 });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    next(error);
  }
};
