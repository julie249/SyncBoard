import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    type: {
      type: String,
      enum: ['assignment', 'comment', 'mention', 'invitation', 'due_soon', 'overdue', 'workspace', 'general'],
      default: 'general'
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    entityType: {
      type: String,
      enum: ['Card', 'Board', 'Workspace', 'Invitation'],
      default: 'Card'
    },
    read: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
