import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { HiUser, HiMail, HiLockClosed } from 'react-icons/hi';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return;
    }
    setLoading(true);
    const result = await signup(name, email, password);
    setLoading(false);
    if (result.success) {
      navigate('/chat');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Dynamic Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,hsl(var(--background))_70%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md glass-card p-10 relative z-10 my-10 border border-white/10 dark:border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]"
      >
        <div className="mb-10 text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-[2rem] mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-primary/30 -rotate-3"
          >
            <HiUser className="text-white text-4xl" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-extrabold tracking-tight text-foreground"
          >
            Create Account
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground mt-3 font-medium text-lg opacity-80"
          >
          </motion.p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {[
            { label: 'Full Name', value: name, setter: setName, type: 'text', icon: HiUser, placeholder: 'Your name', delay: 0.5 },
            { label: 'Email Address', value: email, setter: setEmail, type: 'email', icon: HiMail, placeholder: 'Your email address ', delay: 0.6 },
            { label: 'Password', value: password, setter: setPassword, type: 'password', icon: HiLockClosed, placeholder: 'At least 6 characters', delay: 0.7 },
            { label: 'Confirm Password', value: confirmPassword, setter: setConfirmPassword, type: 'password', icon: HiLockClosed, placeholder: 'Repeat password', delay: 0.8 },
          ].map((field, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: field.delay }}
              className="space-y-2"
            >
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 px-1">
                {field.label}
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors duration-300">
                  <field.icon className="text-xl" />
                </div>
                <input
                  type={field.type}
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  required
                  autoComplete="off"
                  className="flex h-12 w-full rounded-2xl border border-border/50 bg-secondary/30 dark:bg-[#0f172a]/60 pl-12 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all duration-300"
                  placeholder={field.placeholder}
                />
              </div>
            </motion.div>
          ))}

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full h-12 flex items-center justify-center rounded-2xl bg-gradient-to-r from-primary to-primary/90 px-8 text-sm font-bold text-white shadow-xl shadow-primary/25 hover:shadow-primary/40 focus:outline-none disabled:opacity-50 transition-all duration-300 relative overflow-hidden group mt-4"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative">
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                'Create Secure Account'
              )}
            </span>
          </motion.button>
        </form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-10 text-center"
        >
          <span className="text-muted-foreground font-medium">Already a member? </span>
          <Link to="/login" className="font-bold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 group">
            Sign In
            <span className="block w-4 h-[2px] bg-primary group-hover:w-6 transition-all" />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Signup;


