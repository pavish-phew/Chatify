import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingScreen from './LoadingScreen.jsx';

const PublicRoute = ({ children }) => {
    const { user, loading, isInitialized } = useAuth();

    // Show loading screen while auth status is being verified on app load
    if (!isInitialized || loading) {
        return <LoadingScreen />;
    }

    // If user is already authenticated, redirect them to the chat page
    if (user) {
        return <Navigate to="/chat" replace />;
    }

    return children;
};

export default PublicRoute;
