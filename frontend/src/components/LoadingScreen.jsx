import { motion } from 'framer-motion';

const LoadingScreen = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background">
            <div className="relative w-24 h-24">
                <motion.div
                    className="absolute inset-0 border-4 border-primary rounded-full opacity-25"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.5, 0.25] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                    className="absolute inset-0 border-t-4 border-primary rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
            </div>
            <motion.p
                className="mt-6 text-muted-foreground font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                Initializing secure connection...
            </motion.p>
        </div>
    );
};

export default LoadingScreen;
