import mongoose from 'mongoose';

const checklistItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  { _id: true }
);

const labelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    color: {
      type: String,
      required: true
    }
  },
  { _id: true }
);

const cardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Card title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true
    },
    list: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'List',
      required: true,
      index: true
    },
    position: {
      type: Number,
      required: true,
      default: 1000
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
      index: true
    },
    labels: [labelSchema],
    checklist: [checklistItemSchema],
    startDate: {
      type: Date,
      default: null
    },
    dueDate: {
      type: Date,
      default: null,
      index: true
    },
    archived: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

cardSchema.index({ list: 1, position: 1 });
cardSchema.index({ board: 1, archived: 1 });
cardSchema.index({ assignedTo: 1 });

export const Card = mongoose.model('Card', cardSchema);
