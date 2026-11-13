import { Activity } from '../models/Activity.js';

export const getWorkspaceActivity = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      Activity.find({ workspace: req.workspace._id })
        .populate('actor', 'name email avatar')
        .populate('board', 'name')
        .populate('card', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Activity.countDocuments({ workspace: req.workspace._id })
    ]);

    return res.status(200).json({
      success: true,
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getBoardActivity = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      Activity.find({ board: req.params.boardId })
        .populate('actor', 'name email avatar')
        .populate('card', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Activity.countDocuments({ board: req.params.boardId })
    ]);

    return res.status(200).json({
      success: true,
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};
