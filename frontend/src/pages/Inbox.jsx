import React, { useState, useEffect } from 'react';
import { Mail, MessageCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns'; 
import API from '../services/api';
import socket from '../services/socket';
import PageHeader from '../components/layout/PageHeader';
import { theme } from '../theme'; // --- NEW: THEME AUTHORITY ---

/**
 * ============================================================================
 * INBOX PAGE (The Communication Hub)
 * ============================================================================
 * OVERHAUL: Refactored to consume the centralized Design Token system.
 * Ensures that message threads, status badges, and typography are 
 * visually synchronized across the platform.
 */
const Inbox = ({ user, onThreadOpened }) => {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchInbox = async () => {
    try {
      const response = await API.get('/auth/inbox');
      setThreads(response.data);
    } catch (err) { console.error('Inbox Sync Failure'); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchInbox();
    const handleNewMessageInbox = (message) => fetchInbox();
    socket.on('new_message_alert', handleNewMessageInbox);
    return () => socket.off('new_message_alert', handleNewMessageInbox);
  }, []);

  const handleOpenThread = async (listingId) => {
    try {
      await API.put(`/auth/chat-read/${listingId}`);
      if (onThreadOpened) onThreadOpened();
      navigate(`/listing/${listingId}`);
    } catch (err) { navigate(`/listing/${listingId}`); }
  };

  if (loading && threads.length === 0) return <div style={{ textAlign: 'center', padding: '10rem' }}>Connecting to messages...</div>;

  return (
    <div style={{ maxWidth: '2560px', width: '98%', margin: '3rem auto', padding: '0 4rem' }}>
      <PageHeader title="Messages" subtitle="Keep track of your conversations." icon={MessageCircle} />
      
      {threads.length === 0 ? (
        <div style={emptyStateStyle}><Mail size={48} color={theme.colors.divider} /><h2>No messages yet</h2></div>
      ) : (
        <div style={{ display: 'grid', gap: '1.2rem' }}>
          {threads.map(thread => (
            <ThreadCard key={thread.listing._id} thread={thread} onOpen={() => handleOpenThread(thread.listing._id)} />
          ))}
        </div>
      )}
    </div>
  );
};

const ThreadCard = ({ thread, onOpen }) => {
  const { listing, lastMessage, unreadCount } = thread;
  const isUnread = unreadCount > 0;

  return (
    <motion.div whileHover={{ y: -2 }} onClick={onOpen} style={threadCardStyle(isUnread)}>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', width: '100%' }}>
        <img src={listing.images[0]} style={thumbStyle} alt="Listing" />
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: theme.typography.weights.bold }}>{listing.title}</h3>
            <span style={{ fontSize: '0.75rem', color: theme.colors.slate }}>{formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: true })}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
            <div style={{ fontWeight: theme.typography.weights.bold, color: theme.colors.charcoal }}>{lastMessage.sender.name}:</div>
            <p style={messagePreviewStyle}>{lastMessage.content}</p>
          </div>
        </div>

        {isUnread && <div style={badgeStyle}>{unreadCount}</div>}
        <button style={actionLinkStyle}>View Chat <ArrowRight size={16} /></button>
      </div>
    </motion.div>
  );
};

// --- TOKEN-BASED STYLES ---
const emptyStateStyle = { padding: '6rem', textAlign: 'center', border: `1px solid ${theme.colors.divider}`, borderRadius: theme.radius.lg };
const threadCardStyle = (isUnread) => ({ padding: '1.5rem', border: isUnread ? `2px solid ${theme.colors.brand}` : `1px solid ${theme.colors.divider}`, borderRadius: theme.radius.lg, backgroundColor: theme.colors.white, display: 'flex', cursor: 'pointer', boxShadow: theme.shadows.card });
const thumbStyle = { width: '80px', height: '80px', borderRadius: theme.radius.md, objectFit: 'cover' };
const messagePreviewStyle = { margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '400px', color: theme.colors.slate };
const badgeStyle = { backgroundColor: theme.colors.brand, color: theme.colors.white, fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px' };
const actionLinkStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', color: theme.colors.brand, fontWeight: theme.typography.weights.bold, backgroundColor: '#fff1f2', padding: '0.6rem 1.2rem', borderRadius: theme.radius.sm, cursor: 'pointer' };

export default Inbox;
