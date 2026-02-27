import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import socket from '../services/socket';

/**
 * ============================================================================
 * 🧠 AUTH CONTEXT (The Identity & Sync Authority)
 * ============================================================================
 * 
 * MASTERCLASS NOTES:
 * This module is the "Brain" of the frontend architecture (Implemented in Phase 23).
 * It centralizes the application's global state, managing authentication 
 * persistence, real-time notification syncing, and Socket.IO identification.
 */

/* ============================================================================
 * 👻 HISTORICAL GHOST: PHASE 1-22 (The Prop-Drilling Nightmare)
 * ============================================================================
 * Before Phase 23, the `user` state lived inside `App.jsx`.
 * 
 * const App = () => {
 *   const [user, setUser] = useState(null);
 *   return <Navbar user={user} />
 *          <ListingDetail user={user} /> // Had to pass it down manually!
 * }
 * 
 * THE FLAW (Prop-Drilling): 
 * To get the user's Avatar to show up inside a deeply nested <ReviewForm />, 
 * we had to pass the `user` prop through 6 intermediate components that didn't 
 * even need it! This made the code brittle and hard to read.
 * 
 * THE FIX: The Context API. By wrapping the app in <AuthProvider>, any 
 * component can now "teleport" the user state directly using `useAuth()`.
 * ============================================================================ */

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Global Notification States
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  /**
   * GLOBAL SYNC ENGINE
   * 
   * Logic: Synchronizes the local unread counters and alerts with the database.
   * Why useCallback? We pass this function into `useEffect` dependency arrays.
   * If we didn't use `useCallback`, React would create a new function reference
   * on every render, causing infinite loops!
   */
  const syncUpdates = useCallback(async () => {
    if (!localStorage.getItem('token')) return;
    try {
      // Promise.all runs these requests in parallel, halving network wait time
      const [inboxRes, notifRes] = await Promise.all([
        API.get('/auth/inbox'),
        API.get('/auth/notifications')
      ]);
      
      // Calculate the total unread messages across all chat threads
      setUnreadCount(inboxRes.data.reduce((acc, curr) => acc + curr.unreadCount, 0));
      setNotifications(notifRes.data);
    } catch (err) {
      console.warn('Sync Engine: Background synchronization failed quietly.');
    }
  }, []);

  /**
   * INITIALIZATION: Auth Hydration
   * 
   * Logic: Validates the presence of a local session on app boot.
   * Even if localStorage has a token, we hit the `/auth/profile` endpoint 
   * to ensure the backend hasn't revoked the session (Token Versioning Check).
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
          // If the backend rejects the token, wipe the local session immediately
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setIsAuthLoading(false); // Drop the loading screen, unblock the UI
    };
    initAuth();
  }, []);

  /**
   * REAL-TIME ORCHESTRATION (The Push Architecture)
   * 
   * Logic: Manages Socket.IO 'identify' and listens for push alerts.
   * 
   * PHASE 25 UPGRADE: We added the 'connect' listener. Why?
   * If a user closes their laptop (sleep mode), the socket disconnects. When they 
   * open it again, the socket reconnects, but the server FORGETS who they are!
   * The 'connect' listener ensures we re-send our Identity so we don't miss alerts.
   */
  useEffect(() => {
    if (!user) return; // Don't connect sockets for anonymous guests

    const handleConnect = () => {
      // Tell the server: "I am user XYZ. Add me to my private room."
      socket.emit('identify', user._id || user.id);
    };

    // 1. Immediate identification on initial render
    handleConnect();
    // 2. Attach listener for future reconnections (sleep/wake cycles)
    socket.on('connect', handleConnect);
    
    // 3. Force an immediate UI sync to grab any alerts missed while offline
    syncUpdates(); 

    // 4. Attach listeners for real-time PUSH events
    const handleInstantAlert = () => { syncUpdates(); };
    socket.on('new_notification', handleInstantAlert);
    socket.on('new_message_alert', handleInstantAlert);
    
    // 5. CLEANUP: Always remove listeners when the component unmounts
    // to prevent memory leaks and duplicate alert firing.
    return () => {
      socket.off('connect', handleConnect);
      socket.off('new_notification', handleInstantAlert);
      socket.off('new_message_alert', handleInstantAlert);
    };
  }, [user, syncUpdates]);

  /**
   * SECURITY ACTIONS
   */
  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try { 
      // Tell backend to increment the tokenVersion (Global Revocation)
      await API.post('/auth/logout-all'); 
    } catch (err) {}
    
    // Wipe local traces
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
 * 
 * Provides a high-fidelity shorthand for accessing the global Auth state.
 * Instead of `useContext(AuthContext)`, components just call `useAuth()`.
 * It also includes a defensive error boundary.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider. Did you forget to wrap your app?');
  }
  return context;
};
