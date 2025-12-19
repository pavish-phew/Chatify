import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video'],
      default: 'text',
    },
    content: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    mediaUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

messageSchema.index({ chat: 1, createdAt: -1 });

messageSchema.methods.markAsRead = function (userId) {
  const already = this.readBy.some((r) => r.user.toString() === userId.toString());
  if (!already) {
    this.readBy.push({ user: userId, readAt: new Date() });
    this.status = 'read';
  }
  return this.save();
};

messageSchema.methods.markAsDelivered = function () {
  if (this.status === 'sent') {
    this.status = 'delivered';
    return this.save();
  }
  return Promise.resolve(this);
};

const Message = mongoose.model('Message', messageSchema);

export default Message;


