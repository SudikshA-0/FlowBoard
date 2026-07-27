const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [120, 'Project name cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    isPrivate: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

projectSchema.index({ ownerId: 1, isPrivate: 1 });
projectSchema.index({ teamId: 1, name: 1 });

module.exports = mongoose.model('Project', projectSchema);

