import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a workspace name'],
      trim: true,
      maxlength: [60, 'Workspace name cannot exceed 60 characters']
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [300, 'Description cannot exceed 300 characters']
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [memberSchema]
  },
  {
    timestamps: true
  }
);

workspaceSchema.index({ 'members.user': 1 });
workspaceSchema.index({ owner: 1 });

export const Workspace = mongoose.model('Workspace', workspaceSchema);
