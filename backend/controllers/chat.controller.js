import Chat from '../models/Chat.model.js';
import User from '../models/User.model.js';

export const createOrGetChat = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ message: 'Participant ID is required' });
    }

    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userId.toString() === participantId.toString()) {
      return res.status(400).json({ message: 'Cannot create chat with yourself' });
    }

    const chat = await Chat.findOrCreateChat(userId, participantId);

    const formattedChat = {
      _id: chat._id,
      participants: chat.participants,
      lastMessage: chat.lastMessage,
      lastMessageAt: chat.lastMessageAt,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    };

    res.status(201).json({ chat: formattedChat });
  } catch (err) {
    console.error('Create/get chat error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


