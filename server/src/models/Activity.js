import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      default: null,
      index: true
    },
    card: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card',
      default: null,
      index: true
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

activitySchema.index({ workspace: 1, createdAt: -1 });
activitySchema.index({ board: 1, createdAt: -1 });
activitySchema.index({ card: 1, createdAt: -1 });

export const Activity = mongoose.model('Activity', activitySchema);
