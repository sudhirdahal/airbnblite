import React, { useState, useEffect } from 'react';
import { Mail, MessageCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns'; 
import API from '../services/api';
import socket from '../services/socket';
import PageHeader from '../components/layout/PageHeader';

/**
 * ============================================================================
 * INBOX PAGE (The Communication Hub)
 * ============================================================================
 * This page manages the aggregation of message threads across multiple listings.
 * It has transitioned from a basic host-only view to a universal, 
 * real-time symmetrical messaging system.
 */
const Inbox = ({ user, onThreadOpened }) => {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /**
   * DATA FETCHING ENGINE
   * Refetches the unified threads from the backend. 
   * (Uses the advanced .distinct() logic on the server)
   */
  const fetchInbox = async () => {
    try {
      const response = await API.get('/auth/inbox');
      setThreads(response.data);
    } catch (err) { 
      console.error('Inbox Sync Failure:', err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchInbox();

    /**
     * ========================================================================
     * REAL-TIME INBOX SYNCHRONICITY
     * ========================================================================
     * BUG FIX HISTORY: We originally listened for 'chat message', but that 
     * required the user to be in a property room. We now listen for 
     * 'new_message_alert' which is pushed to the user's PRIVATE private room.
     */
    const handleNewMessageInbox = (message) => {
      console.log("Inbox: New push alert detected. Re-sorting threads...");
      fetchInbox(); // Silent refresh to keep the list updated in real-time
    };

    socket.on('new_message_alert', handleNewMessageInbox);
    return () => {
      socket.off('new_message_alert', handleNewMessageInbox);
    };
  }, []);

  /**
   * THREAD INTERACTION LOGIC
   * Marks the entire thread as read before navigating to the specific chat.
   */
  const handleOpenThread = async (listingId) => {
    try {
      // 1. Mark as read on DB
      await API.put(`/auth/chat-read/${listingId}`);
      // 2. Clear global state immediately
      if (onThreadOpened) onThreadOpened();
      // 3. Pivot to the listing detail view where the chat lives
      navigate(`/listing/${listingId}`);
    } catch (err) { 
      navigate(`/listing/${listingId}`); 
    }
  };

  /* --- HISTORICAL STAGE 1: PRIMITIVE VIEW ---
   * return (
   *   <div>
   *     {messages.map(m => <p>{m.content}</p>)}
   *   </div>
   * );
   */

  if (loading && threads.length === 0) return <div style={{ textAlign: 'center', padding: '4rem' }}>Connecting to secure messages...</div>;

  return (
    <div style={{ maxWidth: '2560px', width: '98%', margin: '3rem auto', padding: '0 2rem' }}>
      <PageHeader title="Messages" subtitle="Keep track of your conversations with guests and hosts." icon={MessageCircle} />
      
      {threads.length === 0 ? (
        <div style={emptyStateStyle}><Mail size={48} color="#ddd" /><h2>No messages yet</h2></div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {threads.map(thread => (
            <ThreadCard 
              key={thread.listing._id} 
              thread={thread} 
              onOpen={() => handleOpenThread(thread.listing._id)} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * THREAD CARD COMPONENT
 * Renders a high-fidelity summary of a conversation thread.
 */
const ThreadCard = ({ thread, onOpen }) => {
  const { listing, lastMessage, unreadCount } = thread;
  return (
    <motion.div whileHover={{ y: -2 }} onClick={onOpen} style={threadCardStyle(unreadCount > 0)}>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', width: '100%' }}>
        {/* S3-Hosted Thumbnail */}
        <img src={listing.images[0]} style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' }} alt="Thumb" />
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>{listing.title}</h3>
            {/* Relative Timestamp (date-fns) */}
            <span style={{ fontSize: '0.75rem', color: '#717171' }}>{formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: true })}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
            <div style={{ fontWeight: 'bold' }}>{lastMessage.sender.name}:</div>
            <p style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '400px' }}>{lastMessage.content}</p>
          </div>
        </div>

        {/* Dynamic Unread Badge */}
        {unreadCount > 0 && <div style={badgeStyle}>{unreadCount}</div>}
        
        <button style={actionLinkStyle}>View Chat <ArrowRight size={16} /></button>
      </div>
    </motion.div>
  );
};

// --- STYLES ---
const emptyStateStyle = { padding: '4rem', textAlign: 'center', border: '1px solid #eee', borderRadius: '24px' };
const threadCardStyle = (isUnread) => ({ padding: '1.2rem', border: isUnread ? '2px solid #ff385c' : '1px solid #eee', borderRadius: '20px', backgroundColor: '#fff', display: 'flex', cursor: 'pointer', transition: 'all 0.2s' });
const badgeStyle = { backgroundColor: '#ff385c', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '10px' };
const actionLinkStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', color: '#ff385c', fontWeight: 'bold', backgroundColor: '#fff1f2', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' };

export default Inbox;
