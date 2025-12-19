import Message from '../models/Message.model.js';
import Chat from '../models/Chat.model.js';

export const sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;
    const userId = req.user.userId;

    if (!chatId || !content) {
      return res.status(400).json({ message: 'Chat ID and content are required' });
    }

    const chat = await Chat.findOne({ _id: chatId, participants: userId });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const message = await Message.create({
      chat: chatId,
      sender: userId,
      content: content.trim(),
    });

    await message.populate('sender', 'name email profilePicture');

    chat.lastMessage = message._id;
    chat.lastMessageAt = new Date();
    await chat.save();

    res.status(201).json({ message });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const chat = await Chat.findOne({ _id: chatId, participants: userId });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    messages.reverse();

    res.json({
      messages,
      pagination: {
        page,
        limit,
        hasMore: messages.length === limit,
      },
    });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


