import { socketAuth } from '../middleware/auth.middleware.js';
import User from '../models/User.model.js';
import Message from '../models/Message.model.js';
import Chat from '../models/Chat.model.js';

const onlineUsers = new Map();

export const initializeSocket = (io) => {
  io.use(socketAuth);

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`[DEBUG] Socket connected: ${userId} (${socket.id})`);

    // Join personal room for notifications
    socket.join(userId.toString());

    onlineUsers.set(userId.toString(), socket.id);
    User.findByIdAndUpdate(userId, { isOnline: true }).catch(() => { });

    // Broadcast status to everyone
    io.emit('user-online', { userId: userId.toString() });

    // Mark pending messages to this user as delivered
    (async () => {
      try {
        const chats = await Chat.find({ participants: userId });
        const chatIds = chats.map(c => c._id);
        const pendingMessages = await Message.find({
          chat: { $in: chatIds },
          sender: { $ne: userId },
          status: 'sent'
        });

        if (pendingMessages.length > 0) {
          await Message.updateMany(
            { _id: { $in: pendingMessages.map(m => m._id) } },
            { $set: { status: 'delivered' } }
          );
          const sendersToNotify = [...new Set(pendingMessages.map(m => m.sender.toString()))];
          sendersToNotify.forEach(sId => io.to(sId).emit('messages-delivered', { receiverId: userId }));
        }
      } catch (err) { }
    })();

    // Send current online users list to the new connection
    socket.emit('get-online-users', Array.from(onlineUsers.keys()));

    socket.on('join-chat', (chatId) => {
      if (!chatId) return;
      // Leave all other chat rooms first to avoid duplicates/stale rooms
      Array.from(socket.rooms).forEach(room => {
        if (room.startsWith('chat:')) {
          socket.leave(room);
        }
      });

      const room = `chat:${chatId}`;
      socket.join(room);
      console.log(`[DEBUG] User ${userId} joined room: ${room}`);
    });

    socket.on('leave-chat', (chatId) => {
      if (!chatId) return;
      const room = `chat:${chatId}`;
      socket.leave(room);
      console.log(`[DEBUG] User ${userId} left room: ${room}`);
    });

    socket.on('send-message', async ({ chatId, content, receiverId, clientId }) => {
      console.log(`[DEBUG] Received send-message: chat=${chatId}, from=${userId}, clientId=${clientId}`);
      try {
        if (!chatId || !content) return;

        // 1. Save to DB
        const message = await Message.create({
          chat: chatId,
          sender: userId,
          content: content.trim(),
        });

        // 2. Populate
        const populated = await Message.findById(message._id)
          .populate('sender', 'username profilePicture name');

        const messageObject = populated.toObject();
        messageObject.clientId = clientId;

        // 3. Update Chat Meta
        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: message._id,
          lastMessageAt: new Date(),
        });

        // 4. Determine status
        if (onlineUsers.has(receiverId?.toString())) {
          message.status = 'delivered';
          await message.save();
          messageObject.status = 'delivered';
        }

        // 5. BROADCAST
        const room = `chat:${chatId}`;

        // Emit to others in the chat room
        socket.to(room).emit('new-message', { message: messageObject });

        // Also emit to the receiver's private room (for sidebar updates if they aren't in the chat)
        if (receiverId) {
          socket.to(receiverId.toString()).emit('message-notification', { message: messageObject, chatId });
        }

        // IMPORTANT: Send confirmation back to sender so they can update their optimistic UI
        // We use 'new-message' for consistency OR a specific 'message-sent'
        // User wants "no refresh needed", so sender needs this.
        socket.emit('new-message', { message: messageObject });

        console.log(`[DEBUG] Message handled and broadcasted to room ${room}`);
      } catch (err) {
        console.error('[DEBUG] Socket message processing error:', err);
        socket.emit('error', { message: 'Failed to process message' });
      }
    });

    socket.on('typing', ({ chatId, receiverId }) => {
      if (!chatId) return;
      socket.to(`chat:${chatId}`).emit('user-typing', { chatId, userId });
    });

    socket.on('stop-typing', ({ chatId, receiverId }) => {
      if (!chatId) return;
      socket.to(`chat:${chatId}`).emit('user-stop-typing', { chatId, userId });
    });

    socket.on('mark-as-read', async ({ chatId, senderId }) => {
      try {
        if (!chatId || !senderId) return;

        await Message.updateMany(
          { chat: chatId, sender: senderId, status: { $ne: 'read' } },
          { $set: { status: 'read' } }
        );

        const room = `chat:${chatId}`;
        // Notify others in the chat room
        socket.to(room).emit('messages-read', { chatId, readerId: userId });
        // Also notify the sender specifically if they are not in the room
        socket.to(senderId.toString()).emit('messages-read', { chatId, readerId: userId });

        console.log(`[DEBUG] Messages marked as read in chat ${chatId} by ${userId}`);
      } catch (err) {
        console.error('[DEBUG] Mark as read error:', err);
      }
    });

    socket.on('disconnect', async () => {
      console.log(`[DEBUG] Socket disconnected: ${userId}`);
      onlineUsers.delete(userId.toString());
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      }).catch(() => { });
      io.emit('user-offline', { userId: userId.toString() });
    });

  });
};
