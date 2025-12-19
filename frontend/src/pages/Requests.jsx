import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext.jsx';
import Sidebar from '../components/chat/Sidebar.jsx';
import toast from 'react-hot-toast';
import { HiCheck, HiX, HiUserGroup, HiArrowLeft } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

const Requests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const { setUnreadRequestsCount } = useSocket();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const response = await axios.get('/friend-requests/pending');
            setRequests(response.data.requests);
            setUnreadRequestsCount(response.data.requests.length);
        } catch (error) {
            toast.error('Failed to fetch requests');
        } finally {
            setLoading(false);
        }
    };

    const handleResponse = async (requestId, status) => {
        try {
            await axios.post('/friend-requests/respond', { requestId, status });
            setRequests(prev => prev.filter(r => r._id !== requestId));
            setUnreadRequestsCount(prev => Math.max(0, prev - 1));

            if (status === 'accepted') {
                toast.success('Connection accepted!');
                navigate('/chat');
            } else {
                toast.success('Request rejected');
            }
        } catch (error) {
            toast.error('Action failed');
        }
    };

    return (
        <div className="flex h-screen bg-background overflow-hidden relative">
            <Sidebar
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                selectedChat={null}
                setSelectedChat={() => { }}
            />

            <main className="flex-1 flex flex-col min-w-0 bg-background/50 backdrop-blur-sm relative border-l border-border">
                {/* Header */}
                <div className="p-6 border-b border-border flex items-center justify-between bg-card/30 backdrop-blur-xl sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/chat')}
                            className="p-2 hover:bg-secondary rounded-xl transition-colors md:hidden"
                        >
                            <HiArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Friend Requests</h1>
                            <p className="text-sm text-muted-foreground font-medium">Manage your incoming connections</p>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <HiUserGroup className="w-6 h-6" />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-secondary/50 rounded-3xl animate-pulse" />
                            ))}
                        </div>
                    ) : requests.length > 0 ? (
                        <div className="grid gap-4 max-w-3xl mx-auto">
                            <AnimatePresence mode="popLayout">
                                {requests.map((request, idx) => (
                                    <motion.div
                                        key={request._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="glass-card p-5 flex items-center justify-between group hover:border-primary/30 transition-all border border-border/50"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xl shadow-inner overflow-hidden border border-primary/5">
                                                {request.sender.profilePicture ? (
                                                    <img src={request.sender.profilePicture} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    request.sender.username.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-foreground truncate">@{request.sender.username}</p>
                                                <p className="text-sm text-muted-foreground truncate italic">"{request.sender.bio || 'No bio yet'}"</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleResponse(request._id, 'accepted')}
                                                className="w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95"
                                                title="Accept"
                                            >
                                                <HiCheck className="w-6 h-6" />
                                            </button>
                                            <button
                                                onClick={() => handleResponse(request._id, 'rejected')}
                                                className="w-11 h-11 rounded-xl bg-secondary text-muted-foreground flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all active:scale-95"
                                                title="Reject"
                                            >
                                                <HiX className="w-6 h-6" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20">
                            <div className="w-20 h-20 bg-secondary/50 rounded-3xl flex items-center justify-center text-muted-foreground mb-4">
                                <HiUserGroup className="w-10 h-10 opacity-20" />
                            </div>
                            <h2 className="text-xl font-bold">No pending requests</h2>
                            <p className="text-muted-foreground max-w-xs mx-auto">
                                When people send you connection requests, they will show up here.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Requests;
