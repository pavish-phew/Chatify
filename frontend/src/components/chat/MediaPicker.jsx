import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiPhotograph, HiVideoCamera, HiPaperAirplane } from 'react-icons/hi';
import axios from 'axios';
import toast from 'react-hot-toast';

const MediaPicker = ({ chatId, onMediaSent, onClose }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [caption, setCaption] = useState('');
    const [uploading, setUploading] = useState(false);
    const [mediaType, setMediaType] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (!isImage && !isVideo) {
            toast.error('Please select an image or video file');
            return;
        }

        // Validate file size (50MB max)
        if (file.size > 50 * 1024 * 1024) {
            toast.error('File size must be less than 50MB');
            return;
        }

        setSelectedFile(file);
        setMediaType(isImage ? 'image' : 'video');

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSend = async () => {
        if (!selectedFile) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('media', selectedFile);
        formData.append('chatId', chatId);
        formData.append('type', mediaType);
        if (caption.trim()) {
            formData.append('caption', caption.trim());
        }

        try {
            const response = await axios.post('/media/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast.success('Media sent successfully');
            onMediaSent(response.data.message);
            handleClose();
        } catch (error) {
            console.error('Media upload error:', error);
            toast.error(error.response?.data?.message || 'Failed to send media');
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        setPreview(null);
        setCaption('');
        setMediaType(null);
        onClose();
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-background rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <h3 className="text-lg font-semibold">Send Media</h3>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-muted rounded-full transition-colors"
                        >
                            <HiX className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {!preview ? (
                            <div className="flex flex-col items-center gap-4">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.webm"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex flex-col items-center gap-2 p-8 border-2 border-dashed border-border rounded-xl hover:border-[#00a884] hover:bg-[#00a884]/5 transition-all"
                                    >
                                        <HiPhotograph className="w-12 h-12 text-[#00a884]" />
                                        <span className="text-sm font-medium">Select Image</span>
                                    </button>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex flex-col items-center gap-2 p-8 border-2 border-dashed border-border rounded-xl hover:border-[#00a884] hover:bg-[#00a884]/5 transition-all"
                                    >
                                        <HiVideoCamera className="w-12 h-12 text-[#00a884]" />
                                        <span className="text-sm font-medium">Select Video</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Preview */}
                                <div className="relative bg-black rounded-xl overflow-hidden">
                                    {mediaType === 'image' ? (
                                        <img
                                            src={preview}
                                            alt="Preview"
                                            className="w-full h-auto max-h-[400px] object-contain"
                                        />
                                    ) : (
                                        <video
                                            src={preview}
                                            controls
                                            className="w-full h-auto max-h-[400px]"
                                        />
                                    )}
                                </div>

                                {/* Caption Input */}
                                <div className="flex items-center gap-2 bg-muted rounded-xl p-3">
                                    <input
                                        type="text"
                                        placeholder="Add a caption..."
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        className="flex-1 bg-transparent border-none outline-none text-sm"
                                        disabled={uploading}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={uploading}
                                        className="p-2 bg-[#00a884] text-white rounded-full hover:bg-[#00a884]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {uploading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <HiPaperAirplane className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default MediaPicker;
