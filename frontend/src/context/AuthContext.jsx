import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '/api';

// Queue to handle multiple 401s during a single refresh call
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Axios interceptor for transparent token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is not 401 or has already been retried, or is an auth endpoint, reject
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url.includes('/auth/refresh') ||
      originalRequest.url.includes('/auth/login')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => {
          return axios(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await axios.post('/auth/refresh');
      processQueue(null);
      return axios(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      // Logic for session death is handled in the components/context using the 401 rejection
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // Only used for action loading (login/signup)
  const [isInitialized, setIsInitialized] = useState(false); // Crucial for persistent auth check
  const navigate = useNavigate();

  // Check if user is authenticated on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setIsInitialized(true);
      }
    };
    initAuth();

    // Sync logout across tabs
    const handleStorageChange = (e) => {
      if (e.key === 'chatapp_logout') {
        setUser(null);
        navigate('/login');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      setUser(null);
      throw error;
    }
  };

  const signup = async (name, email, password) => {
    try {
      setLoading(true);
      const response = await axios.post('/auth/signup', {
        name,
        email,
        password,
      });
      setUser(response.data.user);
      localStorage.removeItem('chatapp_logout');
      toast.success('Account created successfully!');
      navigate('/chat');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Signup failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await axios.post('/auth/login', {
        email,
        password,
      });
      setUser(response.data.user);
      localStorage.removeItem('chatapp_logout');
      toast.success('Welcome back!');
      navigate('/chat');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.setItem('chatapp_logout', Date.now().toString());
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  const updateUser = (userData) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : null));
  };

  const value = {
    user,
    loading,
    isInitialized,
    signup,
    login,
    logout,
    updateUser,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
