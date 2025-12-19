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
                    ${message.type !== 'text' ? 'p-1' : ''}
                `}
            >
                {/* Media Content */}
                {message.type === 'image' && (
                    <div className="mb-1">
                        <img
                            src={message.mediaUrl}
                            alt="Shared image"
                            className="rounded-lg max-w-[280px] w-full h-auto object-cover cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => window.open(message.mediaUrl, '_blank')}
                        />
                    </div>
                )}

                {message.type === 'video' && (
                    <div className="mb-1">
                        <video
                            src={message.mediaUrl}
                            controls
                            className="rounded-lg max-w-[280px] w-full h-auto"
                        />
                    </div>
                )}

                {/* Text Content (caption or message) */}
                {message.content && (
                    <div className={`flex flex-wrap items-end gap-1 ${message.type !== 'text' ? 'px-2 pb-1' : ''}`}>
                        <span className="text-[14.5px] leading-[19px] whitespace-pre-wrap break-words">
                            {message.content}
                        </span>
                        {/* Timestamp area - flows inline with text */}
                        <span className="flex items-center ml-1 mb-[-3px] float-right">
                            <span className={`text-[11px] leading-[15px] ${isOwn ? 'text-[#667781] dark:text-[#8696a0]' : 'text-[#667781] dark:text-[#8696a0]'}`}>
                                {time}
                            </span>
                            {isOwn && (
                                <span className="inline-flex ml-[3px]">
                                    {message.status === 'read' ? (
                                        <>
                                            <HiCheck className="w-[16px] h-[16px] text-[#53bdeb]" />
                                            <HiCheck className="w-[16px] h-[16px] text-[#53bdeb] -ml-[9px]" />
                                        </>
                                    ) : message.status === 'delivered' ? (
                                        <>
                                            <HiCheck className="w-[16px] h-[16px] text-[#667781] dark:text-[#8696a0]" />
                                            <HiCheck className="w-[16px] h-[16px] text-[#667781] dark:text-[#8696a0] -ml-[9px]" />
                                        </>
                                    ) : (
                                        <HiCheck className="w-[16px] h-[16px] text-[#667781] dark:text-[#8696a0]" />
                                    )}
                                </span>
                            )}
                        </span>
                    </div>
                )}

                {/* Timestamp for media-only messages */}
                {!message.content && (
                    <div className="absolute bottom-2 right-2 flex items-center bg-black/40 px-2 py-0.5 rounded">
                        <span className="text-[11px] leading-[15px] text-white">
                            {time}
                        </span>
                        {isOwn && (
                            <span className="inline-flex ml-[3px]">
                                {message.status === 'read' ? (
                                    <>
                                        <HiCheck className="w-[16px] h-[16px] text-[#53bdeb]" />
                                        <HiCheck className="w-[16px] h-[16px] text-[#53bdeb] -ml-[9px]" />
                                    </>
                                ) : message.status === 'delivered' ? (
                                    <>
                                        <HiCheck className="w-[16px] h-[16px] text-white" />
                                        <HiCheck className="w-[16px] h-[16px] text-white -ml-[9px]" />
                                    </>
                                ) : (
                                    <HiCheck className="w-[16px] h-[16px] text-white" />
                                )}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem;
