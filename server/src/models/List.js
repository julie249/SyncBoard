import mongoose from 'mongoose';

const listSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a list name'],
      trim: true,
      maxlength: [60, 'List name cannot exceed 60 characters']
    },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true
    },
    position: {
      type: Number,
      required: true,
      default: 1000
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

listSchema.index({ board: 1, position: 1 });

export const List = mongoose.model('List', listSchema);
