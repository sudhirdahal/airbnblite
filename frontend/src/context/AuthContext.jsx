import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import socket from '../services/socket';

/**
 * ============================================================================
 * AUTH CONTEXT (The Identity & Sync Authority)
 * ============================================================================
 * This module centralizes the application's global state.
 * It manages authentication persistence, real-time notification syncing, 
 * and Socket.IO identification.
 */
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  /**
   * GLOBAL SYNC ENGINE
   * Logic: Synchronizes the local unread counters and alerts with the database.
   */
  const syncUpdates = useCallback(async () => {
    if (!localStorage.getItem('token')) return;
    try {
      const [inboxRes, notifRes] = await Promise.all([
        API.get('/auth/inbox'),
        API.get('/auth/notifications')
      ]);
      setUnreadCount(inboxRes.data.reduce((acc, curr) => acc + curr.unreadCount, 0));
      setNotifications(notifRes.data);
    } catch (err) {}
  }, []);

  /**
   * INITIALIZATION: Auth Hydration
   * Logic: Validates the presence of a local session on app boot.
   */
  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (savedUser && token) {
        try {
          const res = await API.get('/auth/profile');
          setUser(res.data);
        } catch (e) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setIsAuthLoading(false);
    };
    initAuth();
  }, []);

  /**
   * REAL-TIME ORCHESTRATION
   * Logic: Manages Socket.IO 'identify' and listens for push alerts.
   * UPDATED: Added 'connect' listener to handle automatic re-identification
   * upon socket reconnection (e.g., after laptop sleep or network switch).
   */
  useEffect(() => {
    if (!user) return;

    const handleConnect = () => {
      socket.emit('identify', user._id || user.id);
    };

    // Immediate identification and listener attachment
    handleConnect();
    socket.on('connect', handleConnect);
    syncUpdates(); 

    const handleInstantAlert = () => { syncUpdates(); };
    socket.on('new_notification', handleInstantAlert);
    socket.on('new_message_alert', handleInstantAlert);
    
    return () => {
      socket.off('connect', handleConnect);
      socket.off('new_notification', handleInstantAlert);
      socket.off('new_message_alert', handleInstantAlert);
    };
  }, [user, syncUpdates]);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try { await API.post('/auth/logout-all'); } catch (err) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, setUser, isAuthLoading, unreadCount, notifications, 
      syncUpdates, login, logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * HOOK: useAuth
 * Provides a high-fidelity shorthand for accessing the global Auth state.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

/* --- HISTORICAL STAGE 1: LOCAL APP STATE ---
 * In early phases, all user state lived in App.jsx.
 * Problem: To access the 'user' in a deep component like ReviewForm, 
 * we had to pass props through 5-6 intermediate layers (Prop Drilling).
 */
