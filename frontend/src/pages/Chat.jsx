
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import Sidebar from '../components/chat/Sidebar.jsx';
import ChatWindow from '../components/chat/ChatWindow.jsx';
import { HiChatAlt2 } from 'react-icons/hi';

const Chat = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [selectedChat, setSelectedChat] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Close sidebar on mobile when a chat is selected
  useEffect(() => {
    if (selectedChat && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [selectedChat]);

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`, backgroundSize: '32px 32px' }} />

      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        selectedChat={selectedChat}
        setSelectedChat={setSelectedChat}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-background/50 backdrop-blur-sm relative border-l border-border">
        <AnimatePresence mode="wait">
          {selectedChat ? (
            <motion.div
              key={selectedChat._id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col h-full"
            >
              <ChatWindow
                chat={selectedChat}
                onBack={() => setIsSidebarOpen(true)}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                <HiChatAlt2 className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-3">Select a conversation</h2>
              <p className="text-muted-foreground max-w-sm text-lg leading-relaxed">
                Connect with your friends and start a secure conversation. Choose a contact from the sidebar to begin.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Chat;
