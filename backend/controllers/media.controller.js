import cloudinary from '../config/cloudinary.js';
import Message from '../models/Message.model.js';
import Chat from '../models/Chat.model.js';
import { io } from '../server.js';

export const uploadMedia = async (req, res) => {
    try {
        const { chatId, type, caption } = req.body;
        const userId = req.user.userId;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        if (!chatId) {
            return res.status(400).json({ message: 'Chat ID is required' });
        }

        // Validate type
        if (!['image', 'video'].includes(type)) {
            return res.status(400).json({ message: 'Invalid media type' });
        }

        // Upload to Cloudinary
        const uploadOptions = {
            folder: 'chat-app-media',
            resource_type: type === 'video' ? 'video' : 'image',
        };

        // Convert buffer to base64 for Cloudinary upload
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        const result = await cloudinary.uploader.upload(dataURI, uploadOptions);

        // Create message with media
        const message = await Message.create({
            chat: chatId,
            sender: userId,
            type: type,
            content: caption || '',
            mediaUrl: result.secure_url,
        });

        // Populate sender info
        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'username profilePicture name');

        // Update chat metadata
        await Chat.findByIdAndUpdate(chatId, {
            lastMessage: message._id,
            lastMessageAt: new Date(),
        });

        // Get receiver ID from chat
        const chat = await Chat.findById(chatId);
        const receiverId = chat.participants.find(p => p.toString() !== userId.toString());

        // Emit socket event
        const messageObject = populatedMessage.toObject();
        io.to(`chat:${chatId}`).emit('new-message', { message: messageObject });
        io.to(userId.toString()).emit('message-notification', { message: messageObject, chatId });
        if (receiverId) {
            io.to(receiverId.toString()).emit('message-notification', { message: messageObject, chatId });
        }

        res.status(201).json({ message: populatedMessage });
    } catch (error) {
        console.error('Media upload error:', error);
        res.status(500).json({ message: 'Failed to upload media' });
    }
};
