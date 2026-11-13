import { Activity } from '../models/Activity.js';
import { getIO } from '../sockets/socketHandler.js';

export const recordActivity = async ({
  workspaceId,
  boardId = null,
  cardId = null,
  actorId,
  action,
  description,
  metadata = {}
}) => {
  try {
    const activity = await Activity.create({
      workspace: workspaceId,
      board: boardId,
      card: cardId,
      actor: actorId,
      action,
      description,
      metadata
    });

    const populatedActivity = await Activity.findById(activity._id).populate(
      'actor',
      'name email avatar'
    );

    const io = getIO();
    if (io) {
      if (boardId) {
        io.to(`board:${boardId}`).emit('activity:new', populatedActivity);
      }
      if (workspaceId) {
        io.to(`workspace:${workspaceId}`).emit('activity:new', populatedActivity);
      }
    }

    return populatedActivity;
  } catch (error) {
    console.error('Failed to record activity:', error);
    return null;
  }
};
