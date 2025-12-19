import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiSearch, HiLogout, HiPlus, HiDotsVertical, HiUserCircle, HiMoon, HiSun, HiUserGroup, HiChatAlt2 } from 'react-icons/hi';

const Sidebar = ({ isOpen, setIsOpen, selectedChat, setSelectedChat }) => {
    const { logout, user: currentUser } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { isOnline, unreadRequestsCount, socket } = useSocket();
    const [chats, setChats] = useState([]);
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        fetchChats();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('friend-request-accepted', ({ chat }) => {
            setChats(prev => [chat, ...prev]);
            toast.success('Your friend request was accepted!');
        });

        const handleGlobalNewMessage = ({ message }) => {
            const chatId = message.chat?._id || message.chat;

            setChats(prev => {
                const chatIndex = prev.findIndex(c => c._id === chatId);

                if (chatIndex > -1) {
                    const existingChat = prev[chatIndex];

                    // Prevent duplicate updates for the same message
                    if (existingChat.lastMessage?._id === message._id) return prev;

                    const updatedChats = [...prev];
                    const chatToUpdate = {
                        ...existingChat,
                        lastMessage: message,
                        lastMessageAt: message.createdAt,
                        unreadCount: (selectedChat?._id === chatId || (message.sender?._id || message.sender)?.toString() === currentUser?._id?.toString())
                            ? 0
                            : (existingChat.unreadCount || 0) + 1
                    };

                    // Move to top
                    updatedChats.splice(chatIndex, 1);
                    return [chatToUpdate, ...updatedChats];
                }
                return prev;
            });

            // Notification for background messages
            if (selectedChat?._id !== chatId && (message.sender?._id || message.sender)?.toString() !== currentUser?._id?.toString()) {
                toast(`New message from @${message.sender?.username}`, {
                    icon: '💬',
                    position: 'bottom-right'
                });
            }
        };

        const handleMessagesRead = ({ chatId, readerId }) => {
            if (readerId.toString() === currentUser?._id?.toString()) {
                setChats(prev => prev.map(c => c._id === chatId ? { ...c, unreadCount: 0 } : c));
            }
        };

        const handleMessagesDelivered = ({ receiverId }) => {
            setChats(prev => prev.map(c => {
                if (c.lastMessage && (c.lastMessage.sender?._id || c.lastMessage.sender)?.toString() === currentUser?._id?.toString()) {
                    return { ...c, lastMessage: { ...c.lastMessage, status: 'delivered' } };
                }
                return c;
            }));
        };

        socket.on('new-message', handleGlobalNewMessage);
        socket.on('message-notification', handleGlobalNewMessage);
        socket.on('messages-read', handleMessagesRead);
        socket.on('messages-delivered', handleMessagesDelivered);

        return () => {
            socket.off('friend-request-accepted');
            socket.off('new-message', handleGlobalNewMessage);
            socket.off('message-notification', handleGlobalNewMessage);
            socket.off('messages-read', handleMessagesRead);
            socket.off('messages-delivered', handleMessagesDelivered);
        };
    }, [socket, selectedChat?._id, currentUser?._id]);

    const fetchChats = async () => {
        try {
            const response = await axios.get('/users/chats');
            setChats(response.data.chats);
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query) => {
        setSearch(query);
        if (query.trim().length < 1) {
            setSearchResults([]);
            return;
        }
        try {
            const response = await axios.get(`/users/search?q=${query.trim()}`);
            setSearchResults(response.data.users);
        } catch (error) {
            console.error('Search error:', error);
        }
    };

    const handleAddButton = async (userId) => {
        try {
            const response = await axios.post('/friend-requests/send', { receiverId: userId });
            toast.success(response.data.message || 'Friend request sent!');
            setSearch('');
            setSearchResults([]);
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to send request';

            // If already connected, find the chat and open it
            if (message.toLowerCase().includes('already connected')) {
                const existingChat = chats.find(c =>
                    c.participants?.some(p => p._id === userId)
                );
                if (existingChat) {
                    setSelectedChat(existingChat);
                    if (location.pathname !== '/chat') navigate('/chat');
                    toast.success('Opening existing conversation');
                } else {
                    toast.error(message);
                }
                setSearch('');
                setSearchResults([]);
                return;
            }
            toast.error(message);
        }
    };

    return (
        <aside className={`
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            fixed md:static inset-y-0 left-0 z-40 w-[380px] bg-card border-r border-[#e9edef] dark:border-[#2a3942]
            transition-all duration-300 ease-in-out flex flex-col
        `}>
            {/* User Header */}
            <div className="h-[60px] px-4 flex items-center justify-between bg-[#f0f2f5] dark:bg-[#202c33] shrink-0">
                <Link to="/profile" className="flex items-center gap-3">
                    <img
                        src={currentUser?.profilePicture || `https://ui-avatars.com/api/?name=${currentUser?.name || 'User'}&background=random`}
                        alt=""
                        className="w-[40px] h-[40px] rounded-full object-cover"
                    />
                </Link>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/requests')}
                        className={`p-2.5 rounded-xl transition-all relative ${location.pathname === '/requests' ? 'text-[#00a884]' : 'text-muted-foreground'}`}
                        title="Friend Requests"
                    >
                        <HiUserGroup className="w-6 h-6" />
                        {unreadRequestsCount > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#f0f2f5] dark:border-[#202c33]" />
                        )}
                    </button>
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 rounded-xl text-muted-foreground transition-all"
                        title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                    >
                        {theme === 'dark' ? <HiSun className="w-6 h-6" /> : <HiMoon className="w-6 h-6" />}
                    </button>
                    <button
                        onClick={logout}
                        className="p-2.5 rounded-xl text-muted-foreground hover:text-red-500 transition-all"
                    >
                        <HiLogout className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="p-3">
                <div className="relative flex items-center bg-[#f0f2f5] dark:bg-[#202c33] rounded-lg">
                    <div className="absolute left-3 text-muted-foreground">
                        <HiSearch className="w-[18px] h-[18px]" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search or start new chat"
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-2 bg-transparent border-none text-[15px] focus:ring-0 placeholder:text-muted-foreground"
                    />
                </div>
            </div>

            {/* List Area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide bg-card">
                <AnimatePresence mode="popLayout">
                    {search.trim().length > 0 ? (
                        <motion.div
                            key="search-results-container"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="pb-4"
                        >
                            <p className="px-6 py-4 text-xs font-medium text-[#00a884] uppercase tracking-wide">Global Search</p>
                            {searchResults.map((u, idx) => (
                                <motion.button
                                    key={u._id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => handleAddButton(u._id)}
                                    className="w-full flex items-center gap-4 px-6 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] transition-colors group"
                                >
                                    <img src={u.profilePicture || `https://ui-avatars.com/api/?name=${u.username}&background=random`} alt="" className="w-12 h-12 rounded-full object-cover" />
                                    <div className="text-left flex-1 min-w-0">
                                        <p className="text-[16px] font-medium text-foreground truncate">{u.username}</p>
                                        <p className="text-[13px] text-muted-foreground truncate">{u.bio || 'Available'}</p>
                                    </div>
                                    <HiPlus className="w-5 h-5 text-[#00a884]" />
                                </motion.button>
                            ))}
                            {searchResults.length === 0 && (
                                <div className="text-center py-8">
                                    <p className="text-sm text-muted-foreground">No users found</p>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="active-chats-container"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="pb-4"
                        >
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <div key={i} className="flex items-center gap-4 px-4 h-[72px] animate-pulse">
                                        <div className="w-[49px] h-[49px] rounded-full bg-secondary" />
                                        <div className="flex-1 space-y-2 border-b border-border h-full flex flex-col justify-center">
                                            <div className="h-4 bg-secondary rounded w-1/3" />
                                            <div className="h-3 bg-secondary rounded w-1/2" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                chats.map((chat) => {
                                    const otherUser = chat.participants?.find(p => p._id.toString() !== currentUser?._id?.toString());
                                    const isSelected = selectedChat?._id === chat._id;

                                    return (
                                        <button
                                            key={chat._id}
                                            onClick={() => {
                                                setSelectedChat(chat);
                                                if (location.pathname !== '/chat') navigate('/chat');
                                            }}
                                            className={`w-full flex items-center gap-4 px-4 h-[72px] transition-colors ${isSelected ? 'bg-[#f0f2f5] dark:bg-[#2a3942]' : 'hover:bg-[#f5f6f6] dark:hover:bg-[#222d34]'}`}
                                        >
                                            <div className="relative shrink-0">
                                                <img
                                                    src={otherUser?.profilePicture || `https://ui-avatars.com/api/?name=${otherUser?.username || 'User'}&background=random`}
                                                    alt=""
                                                    className="w-[49px] h-[49px] rounded-full object-cover"
                                                />
                                                {isOnline(otherUser?._id) && (
                                                    <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-[#00a884] border-2 border-card rounded-full" />
                                                )}
                                            </div>
                                            <div className="flex-1 text-left min-w-0 h-full flex flex-col justify-center border-b border-[#f0f2f5] dark:border-[#2a3942]">
                                                <div className="flex justify-between items-baseline">
                                                    <p className={`text-[16px] truncate ${chat.unreadCount > 0 ? 'font-bold text-foreground' : 'text-foreground'}`}>
                                                        {otherUser?.username || 'Unknown User'}
                                                    </p>
                                                    <span className={`text-[12px] shrink-0 ${chat.unreadCount > 0 ? 'text-[#00a884] font-bold' : 'text-muted-foreground'}`}>
                                                        {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center mt-0.5">
                                                    <p className={`text-[14px] truncate flex-1 pr-2 ${chat.unreadCount > 0 ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                                                        {chat.lastMessage?.content || 'Click to start chatting'}
                                                    </p>
                                                    {chat.unreadCount > 0 && (
                                                        <span className="shrink-0 min-w-[20px] h-5 flex items-center justify-center bg-[#00a884] text-white text-[11px] font-bold rounded-full px-1">
                                                            {chat.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                            {!loading && chats.length === 0 && (
                                <div className="text-center p-8 mt-10">
                                    <HiChatAlt2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                    <p className="text-muted-foreground text-sm">No chats found. Search for friends to start chatting!</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </aside>
    );
};

export default Sidebar;
