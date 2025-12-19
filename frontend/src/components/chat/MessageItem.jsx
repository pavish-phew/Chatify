import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { HiCheck } from 'react-icons/hi';

const MessageItem = forwardRef(({ message, isOwn }, ref) => {
    const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} px-4 py-0.5`}
        >
            <div
                className={`
                    message-bubble relative group
                    ${isOwn ? 'message-sent' : 'message-received'}
                `}
            >
                <div className="flex flex-wrap items-end gap-2 pr-12">
                    <p className="text-[14.5px] leading-[1.45] whitespace-pre-wrap break-words py-0.5">
                        {message.content}
                    </p>
                </div>

                <div className="absolute bottom-1 right-1.5 flex items-center gap-1 min-w-[32px] justify-end">
                    <span className={`text-[10px] ${isOwn ? 'text-foreground/50' : 'text-muted-foreground'} font-medium`}>
                        {time}
                    </span>
                    {isOwn && (
                        <div className="flex items-center -ml-0.5">
                            {message.status === 'read' ? (
                                <div className="flex -space-x-[11px]">
                                    <HiCheck className="w-[15px] h-[15px] text-[#53bdeb]" />
                                    <HiCheck className="w-[15px] h-[15px] text-[#53bdeb]" />
                                </div>
                            ) : message.status === 'delivered' ? (
                                <div className="flex -space-x-[11px]">
                                    <HiCheck className="w-[15px] h-[15px] text-muted-foreground/60" />
                                    <HiCheck className="w-[15px] h-[15px] text-muted-foreground/60" />
                                </div>
                            ) : (
                                <HiCheck className="w-[15px] h-[15px] text-muted-foreground/40" />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem;
