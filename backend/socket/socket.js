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
        // Emit to chat room (for focused users)
        io.to(`chat:${chatId}`).emit('new-message', { message: messageObject });

        // Emit notifications to BOTH participants' private rooms (for sidebar updates)
        // This ensures the sender gets confirmation even if some room logic glitches,
        // and the receiver gets it even if not in the chat window.
        io.to(userId.toString()).emit('message-notification', { message: messageObject, chatId });
        if (receiverId) {
          io.to(receiverId.toString()).emit('message-notification', { message: messageObject, chatId });
        }

        console.log(`[DEBUG] Message handled and broadcasted: ${message._id}`);
      } catch (err) {
        console.error('[DEBUG] Socket message processing error:', err);
        socket.emit('error', { message: 'Failed to process message' });
      }
    });

    socket.on('join-chat', (chatId) => {
      socket.join(`chat:${chatId}`);
      console.log(`[DEBUG] User ${userId} joined room: chat:${chatId}`);
    });

    socket.on('leave-chat', (chatId) => {
      socket.leave(`chat:${chatId}`);
      console.log(`[DEBUG] User ${userId} left room: chat:${chatId}`);
    });

    socket.on('typing', ({ chatId, receiverId }) => {
      socket.to(`chat:${chatId}`).emit('user-typing', { chatId, userId });
    });

    socket.on('mark-as-read', async ({ chatId, senderId }) => {
      try {
        if (!chatId || !senderId) return;

        await Message.updateMany(
          { chat: chatId, sender: senderId, status: { $ne: 'read' } },
          { $set: { status: 'read' } }
        );

        // Notify the sender that their messages were read
        io.to(`chat:${chatId}`).emit('messages-read', { chatId, readerId: userId });
        socket.to(senderId.toString()).emit('messages-read', { chatId, readerId: userId });

        console.log(`[DEBUG] Messages marked as read in chat ${chatId} by ${userId}`);
      } catch (err) {
        console.error('[DEBUG] Mark as read error:', err);
      }
    });

    socket.on('stop-typing', ({ chatId, receiverId }) => {
      socket.to(`chat:${chatId}`).emit('user-stop-typing', { chatId, userId });
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
