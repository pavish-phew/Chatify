import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

chatSchema.index({ participants: 1 });
chatSchema.index({ lastMessageAt: -1 });

chatSchema.pre('save', function (next) {
  if (this.participants.length !== 2) {
    return next(new Error('Chat must have exactly 2 participants'));
  }
  next();
});

chatSchema.statics.findOrCreateChat = async function (user1Id, user2Id) {
  let chat = await this.findOne({
    participants: { $all: [user1Id, user2Id] },
  })
    .populate('participants', 'name email profilePicture isOnline lastSeen')
    .populate('lastMessage');

  if (!chat) {
    chat = await this.create({ participants: [user1Id, user2Id] });
    chat = await this.findById(chat._id)
      .populate('participants', 'name email profilePicture isOnline lastSeen')
      .populate('lastMessage');
  }

  return chat;
};

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;


