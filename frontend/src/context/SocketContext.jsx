import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import axios from 'axios';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadRequestsCount, setUnreadRequestsCount] = useState(0);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setOnlineUsers(new Set());
      setUnreadRequestsCount(0);
      return;
    }

    // Fetch initial pending requests count
    const fetchRequestCount = async () => {
      try {
        const response = await axios.get('/friend-requests/count');
        setUnreadRequestsCount(response.data.count);
      } catch (error) {
        console.error('Error fetching request count:', error);
      }
    };
    fetchRequestCount();

    const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.MODE === 'production' ? window.location.origin : 'http://localhost:5000');
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('[DEBUG] Socket connected successfully');
    });

    newSocket.on('connect_error', (err) => {
      console.error('[DEBUG] Socket connection error:', err.message);
    });

    newSocket.on('get-online-users', (users) => {
      console.log('[DEBUG] Received online users list:', users);
      setOnlineUsers(new Set(users));
    });

    newSocket.on('user-online', ({ userId }) => {
      console.log('[DEBUG] User online:', userId);
      setOnlineUsers((prev) => new Set([...prev, userId]));
    });

    newSocket.on('user-offline', ({ userId }) => {
      console.log('[DEBUG] User offline:', userId);
      setOnlineUsers((prev) => {
        const s = new Set(prev);
        s.delete(userId);
        return s;
      });
    });

    newSocket.on('new-friend-request', ({ request }) => {
      setUnreadRequestsCount(prev => prev + 1);
      toast(`New friend request from @${request.sender.username}`, {
        icon: '👤',
        duration: 4000,
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const isOnline = (userId) => {
    if (!userId) return false;
    return onlineUsers.has(userId.toString());
  };

  const value = {
    socket,
    onlineUsers,
    isOnline,
    unreadRequestsCount,
    setUnreadRequestsCount
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
