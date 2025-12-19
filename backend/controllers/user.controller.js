import User from '../models/User.model.js';
import Chat from '../models/Chat.model.js';
import Message from '../models/Message.model.js';

export const searchUsers = async (req, res) => {
  try {
    const query = req.query.q || req.query.query;
    const userId = req.user.userId;

    if (!query || !query.trim()) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const users = await User.find({
      _id: { $ne: userId },
      username: { $regex: query.trim(), $options: 'i' },
      isProfileComplete: true, // Only search users who finished signup
    }).select('username bio profilePicture _id isOnline lastSeen');

    res.json({ users });
  } catch (err) {
    console.error('Search users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserChats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const chats = await Chat.find({ participants: userId })
      .populate('participants', 'name email username profilePicture isOnline lastSeen')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });

    const formatted = await Promise.all(chats.map(async (chat) => {
      const otherUser = chat.participants.find(p => p._id.toString() !== userId.toString());

      const unreadCount = await Message.countDocuments({
        chat: chat._id,
        sender: otherUser?._id,
        status: { $ne: 'read' }
      });

      return {
        _id: chat._id,
        participants: chat.participants,
        lastMessage: chat.lastMessage,
        lastMessageAt: chat.lastMessageAt,
        unreadCount,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      };
    }));

    res.json({ chats: formatted });
  } catch (err) {
    console.error('Get user chats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select(
      'name email username bio profilePicture isOnline lastSeen createdAt'
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const completeProfile = async (req, res) => {
  try {
    const { bio, profilePicture } = req.body;
    const username = req.body.username?.trim().toLowerCase();
    const userId = req.user.userId;

    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isProfileComplete) {
      return res.status(400).json({ message: 'Profile is already complete' });
    }

    user.username = username;
    user.bio = bio || '';

    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      user.profilePicture = `${baseUrl}/uploads/${req.file.filename}`;
    } else if (profilePicture) {
      user.profilePicture = profilePicture;
    }

    user.isProfileComplete = true;

    await user.save();

    res.json({
      message: 'Profile completed successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        bio: user.bio,
        profilePicture: user.profilePicture,
        isProfileComplete: user.isProfileComplete,
      }
    });
  } catch (err) {
    console.error('Complete profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { bio, profilePicture } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (bio !== undefined) user.bio = bio;

    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      user.profilePicture = `${baseUrl}/uploads/${req.file.filename}`;
    } else if (profilePicture) {
      user.profilePicture = profilePicture;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        bio: user.bio,
        profilePicture: user.profilePicture,
        isProfileComplete: user.isProfileComplete,
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


