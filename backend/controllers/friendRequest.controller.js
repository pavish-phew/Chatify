import FriendRequest from '../models/FriendRequest.model.js';
import User from '../models/User.model.js';
import Chat from '../models/Chat.model.js';
import { io } from '../server.js';

export const sendRequest = async (req, res) => {
    try {
        const { receiverId } = req.body;
        const senderId = req.user.userId;

        if (senderId === receiverId) {
            return res.status(400).json({ message: "You cannot send a request to yourself" });
        }

        // Check if they are already friends (chat exists)
        const existingChat = await Chat.findOne({
            participants: { $all: [senderId, receiverId] }
        });

        if (existingChat) {
            return res.status(400).json({ message: "You are already connected with this user" });
        }

        // Check if a request already exists
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ]
        });

        if (existingRequest) {
            if (existingRequest.status === 'pending') {
                return res.status(400).json({ message: "A request is already pending" });
            }
            if (existingRequest.status === 'accepted') {
                return res.status(400).json({ message: "You are already connected" });
            }
            // If rejected, we allow sending again? For now, let's just update to pending if sender is different
            if (existingRequest.status === 'rejected') {
                existingRequest.status = 'pending';
                existingRequest.sender = senderId;
                existingRequest.receiver = receiverId;
                await existingRequest.save();
                return res.json({ message: "Friend request sent", request: existingRequest });
            }
        }

        const request = await FriendRequest.create({
            sender: senderId,
            receiver: receiverId,
        });

        // Notify receiver via socket if online
        io.to(receiverId).emit('new-friend-request', {
            request: await request.populate('sender', 'username profilePicture')
        });

        res.status(201).json({ message: "Friend request sent", request });
    } catch (err) {
        console.error('Send request error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getRequests = async (req, res) => {
    try {
        const userId = req.user.userId;
        const requests = await FriendRequest.find({
            receiver: userId,
            status: 'pending'
        }).populate('sender', 'username profilePicture bio');

        res.json({ requests });
    } catch (err) {
        console.error('Get requests error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

export const respondToRequest = async (req, res) => {
    try {
        const { requestId, status } = req.body; // status: 'accepted' or 'rejected'
        const userId = req.user.userId;

        const request = await FriendRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        if (request.receiver.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        if (status === 'accepted') {
            request.status = 'accepted';
            await request.save();

            // Create a chat using the static method for consistency
            const chat = await Chat.findOrCreateChat(request.sender, request.receiver);

            // Notify both via socket
            io.to(request.sender.toString()).emit('friend-request-accepted', { chat });
            io.to(request.receiver.toString()).emit('friend-request-accepted', { chat });

            res.json({ message: "Request accepted", chat });
        } else {
            request.status = 'rejected';
            await request.save();
            res.json({ message: "Request rejected" });
        }
    } catch (err) {
        console.error('Respond to request error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getPendingCount = async (req, res) => {
    try {
        const userId = req.user.userId;
        const count = await FriendRequest.countDocuments({
            receiver: userId,
            status: 'pending'
        });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
