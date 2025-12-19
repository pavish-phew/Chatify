import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import MessageItem from './MessageItem.jsx';
import { HiChevronLeft, HiPhone, HiVideoCamera, HiDotsVertical, HiPlus, HiPaperAirplane, HiEmojiHappy } from 'react-icons/hi';
import EmojiPicker from 'emoji-picker-react';
import { useTheme } from '../../context/ThemeContext';

const ChatWindow = ({ chat, onBack }) => {
    const { user: currentUser } = useAuth();
    const { socket, isOnline } = useSocket();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const typingTimeoutRef = useRef(null);
    const messagesEndRef = useRef(null);
    const { theme } = useTheme();
    const emojiPickerRef = useRef(null);

    const otherUser = chat.participants?.find(p => p._id.toString() !== currentUser?._id?.toString());

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        fetchMessages();
        if (socket) {
            console.log(`[DEBUG] Joining chat room: chat:${chat._id}`);
            socket.emit('join-chat', chat._id);

            const handleNewMessage = ({ message }) => {
                console.log(`[DEBUG] Received new-message:`, message);
                const chatId = message.chat?._id || message.chat;
                if (chatId === chat._id) {
                    setMessages(prev => {
                        // Prevent duplicates (especially with optimistic updates)
                        const exists = prev.find(m =>
                            (m._id && m._id === message._id) ||
                            (m.clientId && m.clientId === message.clientId) ||
                            (m.createdAt === message.createdAt && m.content === message.content)
                        );
                        if (exists) {
                            console.log(`[DEBUG] Message already exists, skipping state update`);
                            return prev;
                        }
                        return [...prev, message];
                    });
                }
            };

            const handleTyping = ({ chatId, userId }) => {
                if (chatId === chat._id && userId === otherUser?._id) {
                    setOtherUserTyping(true);
                }
            };

            const handleStopTyping = ({ chatId, userId }) => {
                if (chatId === chat._id && userId === otherUser?._id) {
                    setOtherUserTyping(false);
                }
            };

            const handleMessagesRead = ({ chatId, readerId }) => {
                if (chatId === chat._id && readerId.toString() !== currentUser?._id?.toString()) {
                    setMessages(prev => prev.map(m =>
                        m.sender?._id?.toString() === currentUser?._id?.toString() || m.sender === currentUser?._id?.toString()
                            ? { ...m, status: 'read' }
                            : m
                    ));
                }
            };

            const handleMessagesDelivered = ({ receiverId }) => {
                setMessages(prev => prev.map(m =>
                    ((m.sender?._id || m.sender)?.toString() === currentUser?._id?.toString() && m.status === 'sent')
                        ? { ...m, status: 'delivered' }
                        : m
                ));
            };

            socket.on('new-message', handleNewMessage);
            socket.on('user-typing', handleTyping);
            socket.on('user-stop-typing', handleStopTyping);
            socket.on('messages-read', handleMessagesRead);
            socket.on('messages-delivered', handleMessagesDelivered);

            // Mark as read immediately on join
            socket.emit('mark-as-read', { chatId: chat._id, senderId: otherUser?._id });

            return () => {
                socket.emit('leave-chat', chat._id);
                socket.off('new-message', handleNewMessage);
                socket.off('user-typing', handleTyping);
                socket.off('user-stop-typing', handleStopTyping);
                socket.off('messages-read', handleMessagesRead);
                socket.off('messages-delivered', handleMessagesDelivered);
            };
        }
    }, [chat._id, socket, otherUser?._id, currentUser?._id]);

    // Handle clicks outside emoji picker
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Mark as read when new messages arrive and we are in the chat
    useEffect(() => {
        if (messages.length > 0 && socket) {
            const lastMsg = messages[messages.length - 1];
            const isFromOther = (lastMsg.sender?._id || lastMsg.sender)?.toString() === otherUser?._id?.toString();
            if (isFromOther && lastMsg.status !== 'read') {
                socket.emit('mark-as-read', { chatId: chat._id, senderId: otherUser?._id });
            }
        }
    }, [messages.length, socket, chat._id, otherUser?._id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/messages/${chat._id}`);
            setMessages(response.data.messages);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInput = (e) => {
        setNewMessage(e.target.value);

        if (!socket) return;

        if (!isTyping) {
            setIsTyping(true);
            socket.emit('typing', { chatId: chat._id, receiverId: otherUser?._id });
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            socket.emit('stop-typing', { chatId: chat._id, receiverId: otherUser?._id });
        }, 3000);
    };

    const onEmojiClick = (emojiData) => {
        setNewMessage(prev => prev + emojiData.emoji);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const content = newMessage.trim();
        if (!content || !chat?._id) {
            console.warn(`[DEBUG] Send failed: content empty or no chatId`);
            return;
        }

        const clientId = Date.now().toString(); // For duplicate prevention with optimistic UI
        const optimisticMessage = {
            clientId,
            content,
            sender: currentUser,
            createdAt: new Date().toISOString(),
            status: 'sending'
        };

        // Update UI immediately (Optimistic Update)
        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');
        setIsTyping(false);

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket.emit('stop-typing', { chatId: chat._id, receiverId: otherUser?._id });

        console.log(`[DEBUG] Emitting send-message for chat: ${chat._id}`);
        try {
            socket.emit('send-message', {
                chatId: chat._id,
                content,
                receiverId: otherUser?._id,
                clientId // include clientId for backend to include in return
            });
        } catch (error) {
            console.error('[DEBUG] Error sending message via socket:', error);
            toast.error('Failed to send message');
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
            {/* Header */}
            <header className="h-[60px] flex items-center justify-between px-4 bg-[#f0f2f5] dark:bg-[#202c33] shrink-0 border-b border-border z-20">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-1 -ml-1 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors lg:hidden"
                    >
                        <HiChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                            <img
                                src={otherUser?.profilePicture || `https://ui-avatars.com/api/?name=${otherUser?.name || 'User'}&background=random`}
                                alt={otherUser?.username}
                                className="w-[40px] h-[40px] rounded-full object-cover"
                            />
                            {isOnline(otherUser?._id) && (
                                <div className="absolute bottom-0 right-0 w-[10px] h-[10px] bg-[#00a884] border-2 border-[#f0f2f5] dark:border-[#202c33] rounded-full" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-[15px] font-medium leading-tight text-foreground">
                                {otherUser?.username || otherUser?.name || 'Chat'}
                            </h2>
                            <p className="text-[12px] text-muted-foreground">
                                {otherUserTyping ? (
                                    <span className="text-[#00a884] font-medium">typing...</span>
                                ) : isOnline(otherUser?._id) ? (
                                    'online'
                                ) : (
                                    'last seen recently'
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button className="p-2 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                        <HiVideoCamera className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                        <HiPhone className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                        <HiDotsVertical className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <div className="absolute inset-0 chat-wallpaper pointer-events-none" />

                <div className="flex-1 overflow-y-auto scrollbar-hide z-10 px-4">
                    <div className="flex flex-col min-h-full py-4 gap-0.5">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center flex-1 gap-4 text-muted-foreground">
                                <div className="w-8 h-8 border-[3px] border-[#00a884]/20 border-t-[#00a884] rounded-full animate-spin" />
                            </div>
                        ) : (
                            <AnimatePresence initial={false} mode="popLayout">
                                {messages.length === 0 ? (
                                    <motion.div
                                        key="empty-state"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-60"
                                    >
                                        <div className="p-6 bg-card rounded-full mb-4">
                                            <HiPaperAirplane className="w-8 h-8 rotate-90 text-[#00a884]" />
                                        </div>
                                        <p className="text-sm font-medium">No messages yet. Say hi!</p>
                                    </motion.div>
                                ) : (
                                    messages.map((msg, index) => (
                                        <MessageItem
                                            key={msg._id || `msg-${index}-${msg.createdAt}`}
                                            message={msg}
                                            isOwn={msg.sender === currentUser?._id?.toString() || msg.sender?._id === currentUser?._id?.toString()}
                                        />
                                    ))
                                )}
                                {otherUserTyping && (
                                    <motion.div
                                        key="typing-indicator"
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="px-4 py-1"
                                    >
                                        <div className="message-received px-3 py-1.5 flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-bounce [animation-duration:0.6s]" />
                                            <span className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]" />
                                            <span className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.4s]" />
                                        </div>
                                    </motion.div>
                                )}
                                <div key="scroll-anchor" ref={messagesEndRef} className="h-4 shrink-0" />
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </div>

            {/* Input Bar */}
            <footer className="p-2 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-border relative">
                <AnimatePresence>
                    {showEmojiPicker && (
                        <motion.div
                            ref={emojiPickerRef}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full left-2 mb-2 z-50 shadow-2xl rounded-lg overflow-hidden border border-border"
                        >
                            <EmojiPicker
                                theme={theme === 'dark' ? 'dark' : 'light'}
                                onEmojiClick={onEmojiClick}
                                skinTonesDisabled
                                searchDisabled
                                width={320}
                                height={400}
                                previewConfig={{ showPreview: false }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-[1600px] mx-auto">
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className={`p-2 rounded-full transition-colors ${showEmojiPicker ? 'text-[#00a884]' : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'}`}
                        >
                            <HiEmojiHappy className="w-6 h-6" />
                        </button>
                        <button type="button" className="p-2 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                            <HiPlus className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 bg-card dark:bg-[#2a3942] rounded-lg border-none">
                        <input
                            type="text"
                            placeholder="Type a message"
                            value={newMessage}
                            onChange={handleInput}
                            className="w-full bg-transparent px-4 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className={`p-2.5 rounded-full transition-all active:scale-95 ${newMessage.trim()
                            ? 'text-[#00a884]'
                            : 'text-muted-foreground opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <HiPaperAirplane className={`w-6 h-6 rotate-90`} />
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default ChatWindow;
