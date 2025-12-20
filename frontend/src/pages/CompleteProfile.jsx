import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import axios from 'axios';
import toast from 'react-hot-toast';
import { HiUser, HiIdentification, HiPhotograph, HiArrowRight, HiCamera } from 'react-icons/hi';

const CompleteProfile = () => {
    const { user, updateUser, loading, isInitialized } = useAuth();
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [profilePicture, setProfilePicture] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    if (!isInitialized || loading) return null;
    if (!user) return <Navigate to="/login" replace />;
    if (user.isProfileComplete) return <Navigate to="/chat" replace />;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePicture(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (username.length < 3) {
            return toast.error('Username must be at least 3 characters');
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('username', username);
        formData.append('bio', bio);
        if (profilePicture) {
            formData.append('profilePicture', profilePicture);
        }

        try {
            const response = await axios.post('/users/complete-profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            updateUser(response.data.user);
            toast.success('Profile complete! Welcome to the chat.');
            navigate('/chat');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg glass-card p-8 md:p-10 relative z-10"
            >
                <div className="text-center mb-10">
                    <div className="relative w-28 h-28 mx-auto mb-6 group">
                        <div className="w-full h-full rounded-[2.5rem] bg-primary/10 border-2 border-dashed border-primary/30 flex items-center justify-center text-primary shadow-inner overflow-hidden group-hover:border-primary/50 transition-all">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <HiPhotograph className="w-12 h-12 opacity-50" />
                            )}
                        </div>
                        <label className="absolute bottom-[-4px] right-[-4px] w-10 h-10 bg-primary text-white rounded-2xl flex items-center justify-center cursor-pointer shadow-lg shadow-primary/30 hover:scale-110 transition-transform active:scale-95">
                            <HiCamera className="w-5 h-5" />
                            <input
                                type="file"
                                className="hidden"
                                accept=".jpg,.jpeg,.png,.webp"
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Finish your profile</h1>
                    <p className="text-muted-foreground mt-2">Choose a unique username and tell us about yourself</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
                            <HiUser className="w-4 h-4 text-primary" />
                            Username
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                                required
                                className="w-full h-12 rounded-xl bg-secondary/50 border border-border px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                placeholder="unique_username"
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground/70 uppercase tracking-widest font-bold px-1">
                            Minimum 3 characters. This cannot be changed later.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
                            <HiPhotograph className="w-4 h-4 text-primary" />
                            Bio
                        </label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="w-full h-32 rounded-xl bg-secondary/50 border border-border p-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none font-medium"
                            placeholder="Tell others a bit about yourself..."
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-12 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                Let's Start
                                <HiArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
};

export default CompleteProfile;
