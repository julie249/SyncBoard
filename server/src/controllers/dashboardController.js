import { Board } from '../models/Board.js';
import { List } from '../models/List.js';
import { Card } from '../models/Card.js';
import { Activity } from '../models/Activity.js';

export const getDashboardMetrics = async (req, res, next) => {
  try {
    const workspaceId = req.workspace._id;
    const userId = req.user._id;

    // Find all boards in this workspace
    const boards = await Board.find({ workspace: workspaceId, archived: false });
    const boardIds = boards.map((b) => b._id);

    // Find lists in these boards
    const lists = await List.find({ board: { $in: boardIds }, archived: false });
    const listMap = new Map();
    lists.forEach((list) => {
      listMap.set(list._id.toString(), list.name.toLowerCase());
    });

    // Find all cards in these boards
    const cards = await Card.find({ board: { $in: boardIds }, archived: false })
      .populate('assignedTo', 'name email avatar')
      .populate('board', 'name')
      .populate('list', 'name');

    const totalBoards = boards.length;
    const totalTasks = cards.length;

    let assignedToMe = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    let overdueTasks = 0;

    const now = new Date();

    const priorityCounts = { Low: 0, Medium: 0, High: 0, Urgent: 0 };
    const statusCounts = {};

    cards.forEach((card) => {
      // Assigned to me
      const isAssigned = card.assignedTo.some(
        (u) => (u._id ? u._id.toString() : u.toString()) === userId.toString()
      );
      if (isAssigned) assignedToMe++;

      // Priority
      if (priorityCounts[card.priority] !== undefined) {
        priorityCounts[card.priority]++;
      }

      // Status by list name
      const listName = card.list?.name || 'To Do';
      statusCounts[listName] = (statusCounts[listName] || 0) + 1;

      const lowerListName = listName.toLowerCase();
      if (lowerListName.includes('done') || lowerListName.includes('complete')) {
        completedTasks++;
      } else if (
        lowerListName.includes('progress') ||
        lowerListName.includes('doing') ||
        lowerListName.includes('review')
      ) {
        inProgressTasks++;
      }

      // Overdue
      if (
        card.dueDate &&
        new Date(card.dueDate) < now &&
        !lowerListName.includes('done') &&
        !lowerListName.includes('complete')
      ) {
        overdueTasks++;
      }
    });

    // Upcoming deadlines: tasks due in next 7 days that are not completed
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = cards
      .filter((card) => {
        if (!card.dueDate) return false;
        const d = new Date(card.dueDate);
        const lowerListName = (card.list?.name || '').toLowerCase();
        return (
          d >= now &&
          d <= nextWeek &&
          !lowerListName.includes('done') &&
          !lowerListName.includes('complete')
        );
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 8);

    // Recent activities
    const recentActivity = await Activity.find({ workspace: workspaceId })
      .populate('actor', 'name email avatar')
      .populate('board', 'name')
      .populate('card', 'title')
      .sort({ createdAt: -1 })
      .limit(6);

    // Format chart data
    const priorityChartData = Object.keys(priorityCounts).map((key) => ({
      name: key,
      count: priorityCounts[key]
    }));

    const statusChartData = Object.keys(statusCounts).map((key) => ({
      name: key,
      count: statusCounts[key]
    }));

    return res.status(200).json({
      success: true,
      metrics: {
        totalBoards,
        totalTasks,
        assignedToMe,
        completedTasks,
        inProgressTasks,
        overdueTasks
      },
      charts: {
        priority: priorityChartData,
        status: statusChartData,
        completion: [
          { name: 'Completed', value: completedTasks },
          { name: 'Pending', value: Math.max(0, totalTasks - completedTasks) }
        ]
      },
      upcomingDeadlines,
      recentBoards: boards.slice(0, 5),
      recentActivity
    });
  } catch (error) {
    next(error);
  }
};

export const getMyTasks = async (req, res, next) => {
  try {
    const { workspaceId, boardId, priority, status, search, sortBy = 'dueDate' } = req.query;

    const query = {
      assignedTo: req.user._id,
      archived: false
    };

    if (boardId) {
      query.board = boardId;
    } else if (workspaceId) {
      const boards = await Board.find({ workspace: workspaceId });
      query.board = { $in: boards.map((b) => b._id) };
    }

    if (priority) {
      query.priority = priority;
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    let sort = {};
    if (sortBy === 'dueDate') {
      sort = { dueDate: 1, createdAt: -1 };
    } else if (sortBy === 'priority') {
      sort = { priority: -1, createdAt: -1 };
    } else {
      sort = { createdAt: -1 };
    }

    let cards = await Card.find(query)
      .populate('board', 'name workspace')
      .populate('list', 'name')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort(sort);

    // Filter by status/list if requested
    if (status) {
      const lowerStatus = status.toLowerCase();
      cards = cards.filter((card) => {
        const listName = (card.list?.name || '').toLowerCase();
        if (lowerStatus === 'completed') {
          return listName.includes('done') || listName.includes('complete');
        } else if (lowerStatus === 'in_progress') {
          return listName.includes('progress') || listName.includes('doing') || listName.includes('review');
        } else if (lowerStatus === 'todo') {
          return listName.includes('todo') || listName.includes('backlog');
        }
        return true;
      });
    }

    return res.status(200).json({
      success: true,
      count: cards.length,
      tasks: cards
    });
  } catch (error) {
    next(error);
  }
};
