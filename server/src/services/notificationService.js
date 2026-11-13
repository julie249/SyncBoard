import { Notification } from '../models/Notification.js';
import { getIO } from '../sockets/socketHandler.js';

export const createNotification = async ({
  recipient,
  sender = null,
  type = 'general',
  title,
  message,
  entityId = null,
  entityType = 'Card'
}) => {
  try {
    // Avoid notifying the actor themselves
    if (sender && recipient.toString() === sender.toString()) {
      return null;
    }

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      entityId,
      entityType
    });

    const populatedNotification = await Notification.findById(notification._id).populate(
      'sender',
      'name email avatar'
    );

    const io = getIO();
    if (io) {
      io.to(`user:${recipient.toString()}`).emit('notification:new', populatedNotification);
    }

    return populatedNotification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};
