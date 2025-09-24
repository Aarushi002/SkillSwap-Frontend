import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser } from './store/slices/authSlice';
import { setTheme } from './store/slices/themeSlice';
import socketService from './services/socketService';

// Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import DiscoverPage from './pages/DiscoverPage';
import ProfilePage from './pages/ProfilePage';
import MatchesPage from './pages/MatchesPage';
import MessagesPage from './pages/MessagesPage';
import WalletPage from './pages/WalletPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import SessionsPage from './pages/SessionsPage';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading, token, user } = useSelector((state) => state.auth);
  const { isDarkMode } = useSelector((state) => state.theme);

  // Initialize theme on app start
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    dispatch(setTheme(shouldBeDark));
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, [dispatch]);

  useEffect(() => {
    // Check if user is logged in on app start
    if (token && !user) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, token, user]);

  useEffect(() => {
    // Connect to socket when user is authenticated
    if (isAuthenticated && token && user) {
      socketService.connect(token);

      // Setup socket event listeners
      socketService.onNewNotification((notification) => {
        // Handle new notification
        console.log('New notification:', notification);
        // You can dispatch to notification slice here
      });

      socketService.onMessageNotification((data) => {
        // Handle message notification when not in chat
        console.log('Message notification:', data);
      });

      // Cleanup on unmount
      return () => {
        socketService.removeAllListeners();
      };
    } else {
      socketService.disconnect();
    }
  }, [isAuthenticated, token, user]);

  // Show loading spinner while checking authentication
  if (isLoading && !user) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`App min-h-screen bg-gray-50 dark:bg-gray-900 ${isDarkMode ? 'dark' : ''}`}>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <HomePage />} 
        />
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} 
        />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/:matchId" element={<MessagesPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
