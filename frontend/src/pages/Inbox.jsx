import React, { useState, useEffect } from 'react';
import { Mail, MessageCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../services/api';
import PageHeader from '../components/layout/PageHeader';

const Inbox = () => {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInbox = async () => {
    try {
      const response = await API.get('/auth/inbox');
      setThreads(response.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchInbox(); }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading messages...</div>;

  return (
    <div style={{ maxWidth: '2560px', width: '98%', margin: '3rem auto', padding: '0 2rem' }}>
      <PageHeader title="Messages" subtitle="Keep track of your conversations with hosts and guests." icon={MessageCircle} />
      {threads.length === 0 ? (
        <div style={emptyStateStyle}><Mail size={48} color="#ddd" /><h2>No messages yet</h2></div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {threads.map(thread => (<ThreadCard key={thread.listing._id} thread={thread} />))}
        </div>
      )}
    </div>
  );
};

const ThreadCard = ({ thread }) => {
  const { listing, lastMessage, unreadCount } = thread;
  return (
    <motion.div whileHover={{ y: -2 }} style={threadCardStyle(unreadCount > 0)}>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', width: '100%' }}>
        <img src={listing.images[0]} style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><h3 style={{ margin: 0 }}>{listing.title}</h3><span style={{ fontSize: '0.75rem' }}>{new Date(lastMessage.timestamp).toLocaleDateString()}</span></div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}><div style={{ fontWeight: 'bold' }}>{lastMessage.sender.name}:</div><p style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '400px' }}>{lastMessage.content}</p></div>
        </div>
        {unreadCount > 0 && <div style={badgeStyle}>{unreadCount}</div>}
        <Link to={`/listing/${listing._id}`} style={actionLinkStyle}>View Chat <ArrowRight size={16} /></Link>
      </div>
    </motion.div>
  );
};

const emptyStateStyle = { padding: '4rem', textAlign: 'center', border: '1px solid #eee', borderRadius: '24px' };
const threadCardStyle = (isUnread) => ({ padding: '1.2rem', border: isUnread ? '2px solid #ff385c' : '1px solid #eee', borderRadius: '20px', backgroundColor: '#fff', display: 'flex' });
const badgeStyle = { backgroundColor: '#ff385c', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '10px' };
const actionLinkStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#ff385c', fontWeight: 'bold', backgroundColor: '#fff1f2', padding: '0.5rem 1rem', borderRadius: '8px' };

export default Inbox;
