import React, { useState, useEffect } from 'react';
import { Mail, MessageCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../services/api';
import PageHeader from '../components/layout/PageHeader';

/**
 * Inbox Page: A central hub for all guest/host communications.
 * Features thread grouping and unread message indicators.
 */
const Inbox = () => {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInbox = async () => {
      try {
        const response = await API.get('/auth/inbox');
        setThreads(response.data);
      } catch (err) {
        console.error('Error fetching inbox:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInbox();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading messages...</div>;

  return (
    <div style={{ maxWidth: '2560px', width: '98%', margin: '3rem auto', padding: '0 2rem' }}>
      <PageHeader 
        title="Messages" 
        subtitle="Keep track of your conversations with hosts and guests." 
        icon={MessageCircle} 
      />

      {threads.length === 0 ? (
        <div style={emptyStateStyle}>
          <Mail size={48} color="#ddd" style={{ marginBottom: '1rem' }} />
          <h2>You have no messages</h2>
          <p style={{ color: '#717171' }}>When you contact a host or receive an inquiry, your messages will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {threads.map(thread => (
            <ThreadCard key={thread.listing._id} thread={thread} />
          ))}
        </div>
      )}
    </div>
  );
};

const ThreadCard = ({ thread }) => {
  const { listing, lastMessage, unreadCount } = thread;
  
  return (
    <motion.div 
      whileHover={{ y: -2, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
      style={threadCardStyle(unreadCount > 0)}
    >
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', width: '100%' }}>
        
        {/* Listing Thumbnail */}
        <img 
          src={listing.images[0]} 
          style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' }} 
          alt="listing" 
        />

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{listing.title}</h3>
            <span style={{ fontSize: '0.75rem', color: '#717171' }}>
              {new Date(lastMessage.timestamp).toLocaleDateString()}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
            <div style={{ fontWeight: unreadCount > 0 ? '700' : '500', color: unreadCount > 0 ? '#222' : '#717171', fontSize: '0.9rem' }}>
              {lastMessage.sender.name}:
            </div>
            <p style={{ 
              margin: 0, color: unreadCount > 0 ? '#222' : '#717171', 
              fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '400px',
              fontWeight: unreadCount > 0 ? '600' : '400'
            }}>
              {lastMessage.content}
            </p>
          </div>
        </div>

        {/* Unread Indicator */}
        {unreadCount > 0 && (
          <div style={unreadBadgeStyle}>{unreadCount}</div>
        )}

        {/* Action Link */}
        <Link to={`/listing/${listing._id}`} style={actionLinkStyle}>
          View Chat <ArrowRight size={16} />
        </Link>

      </div>
    </motion.div>
  );
};

// --- STYLES ---
const emptyStateStyle = { padding: '4rem', textAlign: 'center', border: '1px solid #eee', borderRadius: '24px', backgroundColor: '#fafafa' };
const threadCardStyle = (isUnread) => ({
  padding: '1.2rem', 
  border: isUnread ? '2px solid #ff385c' : '1px solid #eee', 
  borderRadius: '20px', 
  backgroundColor: '#fff', 
  display: 'flex', 
  alignItems: 'center',
  transition: 'all 0.2s'
});
const unreadBadgeStyle = { backgroundColor: '#ff385c', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '10px' };
const actionLinkStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#ff385c', fontWeight: 'bold', fontSize: '0.9rem', padding: '0.5rem 1rem', borderRadius: '8px', backgroundColor: '#fff1f2' };

export default Inbox;
