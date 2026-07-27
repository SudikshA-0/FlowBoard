const mongoose = require('mongoose');

const inviteTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
  },
  { _id: false }
);

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      maxlength: [80, 'Team name cannot exceed 80 characters'],
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    memberIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    inviteTokens: {
      type: [inviteTokenSchema],
      default: [],
    },
  },
  { timestamps: true }
);

teamSchema.index({ adminId: 1 });
teamSchema.index({ memberIds: 1 });

module.exports = mongoose.model('Team', teamSchema);

