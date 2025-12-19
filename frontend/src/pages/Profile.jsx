import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import axios from 'axios';
import toast from 'react-hot-toast';
import { HiUser, HiChevronLeft, HiPencil, HiCheck, HiX, HiCamera } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState(user?.bio || '');
    const [profilePicture, setProfilePicture] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePicture(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
            // Auto update photo when selected
            updatePhoto(file);
        }
    };

    const updatePhoto = async (file) => {
        const formData = new FormData();
        formData.append('profilePicture', file);
        setIsSubmitting(true);
        try {
            const response = await axios.put('/users/update-profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            updateUser(response.data.user);
            toast.success('Photo updated!');
            setPreviewUrl(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            if (bio !== user?.bio) { // Only append bio if it has changed
                formData.append('bio', bio);
            }
            // If profilePicture is selected, it's handled by updatePhoto,
            // but if we want to update both simultaneously with one button,
            // we'd append it here. For now, assuming bio is updated separately.
            // If the instruction meant to combine, this part needs adjustment.
            // Based on the provided `handleUpdate` snippet, it only sends bio.

            const response = await axios.put('/users/update-profile', { bio }); // This line is from the instruction's snippet
            updateUser(response.data.user);
            toast.success('Profile updated!');
            setIsEditing(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col items-center">
            <div className="w-full max-w-2xl">
                {/* Back Button */}
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('/chat')}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
                >
                    <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center group-hover:bg-secondary transition-all">
                        <HiChevronLeft className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm uppercase tracking-widest">Back to Chat</span>
                </motion.button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card overflow-hidden"
                >
                    {/* Header/Cover aspect */}
                    <div className="h-32 bg-gradient-to-r from-primary/20 to-blue-500/20 relative" />

                    <div className="px-8 pb-8">
                        <div className="relative -mt-16 mb-6 flex flex-col items-center sm:items-start">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-[2rem] bg-card border-4 border-background overflow-hidden shadow-2xl flex items-center justify-center text-primary text-4xl font-bold">
                                    {previewUrl || user?.profilePicture ? (
                                        <img src={previewUrl || user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        user?.name?.charAt(0).toUpperCase()
                                    )}
                                    {isSubmitting && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <label className="absolute bottom-2 right-2 p-2.5 rounded-2xl bg-primary text-white shadow-lg shadow-primary/30 hover:scale-105 transition-transform cursor-pointer">
                                    <HiCamera className="w-5 h-5" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                            </div>

                            <div className="mt-6 text-center sm:text-left">
                                <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{user?.name}</h1>
                                <p className="text-primary font-bold tracking-widest uppercase text-[10px] mt-1">@{user?.username}</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
                                        <HiIdentification className="w-4 h-4" />
                                        Bio / Status
                                    </h3>
                                    {!isEditing ? (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="p-2 rounded-lg hover:bg-secondary text-primary transition-colors"
                                        >
                                            <HiPencil className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                                            >
                                                <HiX className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={handleUpdate}
                                                disabled={isSubmitting}
                                                className="p-2 rounded-lg hover:bg-green-50 text-green-500 transition-colors"
                                            >
                                                {isSubmitting ? (
                                                    <div className="w-4 h-4 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                                                ) : (
                                                    <HiCheck className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {isEditing ? (
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        autoFocus
                                        className="w-full h-32 rounded-2xl bg-secondary/50 border border-primary/20 p-4 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none font-medium leading-relaxed"
                                    />
                                ) : (
                                    <p className="text-foreground/80 text-sm leading-relaxed font-medium p-4 bg-secondary/30 rounded-2xl border border-border/50">
                                        {user?.bio || "No bio yet..."}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-3xl bg-card border border-border/50 space-y-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</p>
                                    <p className="text-sm font-semibold truncate">{user?.email}</p>
                                </div>
                                <div className="p-4 rounded-3xl bg-card border border-border/50 space-y-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Member Since</p>
                                    <p className="text-sm font-semibold">{new Date(user?.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

// Internal icon dependency for brevity
const HiIdentification = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.333 0 4 1 4 3" />
    </svg>
);

export default Profile;
