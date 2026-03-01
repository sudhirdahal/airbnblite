import React, { useState, useEffect } from 'react';
import { Mail, MessageCircle, ArrowRight, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns'; 
import API from '../services/api';
import socket from '../services/socket';
import PageHeader from '../components/layout/PageHeader';
import { theme } from '../theme'; // --- NEW: THEME AUTHORITY ---
import { useAuth } from '../context/AuthContext';
import ChatWindow from '../components/chat/ChatWindow';

/**
 * ============================================================================
 * INBOX PAGE (The Communication Hub)
 * ============================================================================
 * OVERHAUL: Refactored to consume the centralized Design Token system.
 * Ensures that message threads, status badges, and typography are 
 * visually synchronized across the platform.
 * 
 * Update: Phase 42: Integrated Context-Aware Chat (Inline replies).
 * Update: Phase 43: Ghost Thread Seeding (Proactive Host initiation).
 */
const Inbox = ({ onThreadOpened }) => {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const fetchInbox = async () => {
    try {
      const response = await API.get('/auth/inbox');
      setThreads(response.data);
      
      // Phase 43: Auto-selection Handshake
      const queryListing = searchParams.get('listing');
      const queryGuest = searchParams.get('guest');
      
      if (queryListing && queryGuest) {
        // Search for existing thread using composite key check
        const existing = response.data.find(t => 
          t.listing._id === queryListing && 
          (t.guest?._id === queryGuest || t.guest === queryGuest)
        );

        if (existing) {
          setSelectedThread(existing);
        } else {
          // GHOST THREAD SEEDING: Fetch metadata to start a fresh thread
          try {
            const [lRes, gRes] = await Promise.all([
              API.get(`/listings/${queryListing}`),
              API.get(`/auth/profile/${queryGuest}`)
            ]);
            setSelectedThread({
              listing: lRes.data,
              guest: gRes.data,
              lastMessage: { content: 'Start a new conversation...', sender: user, timestamp: new Date() },
              unreadCount: 0,
              isGhost: true
            });
          } catch (e) { console.warn("Ghost Thread Discovery Failed"); }
        }
      }
    } catch (err) { console.error('Inbox Sync Failure'); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchInbox();
    const handleNewMessageInbox = (message) => fetchInbox();
    socket.on('new_message_alert', handleNewMessageInbox);
    return () => socket.off('new_message_alert', handleNewMessageInbox);
  }, []);

  const handleOpenThread = (thread) => {
    setSelectedThread(thread);
    API.put(`/auth/chat-read/${thread.listing._id}/${thread.guest?._id || user._id}`).catch(() => {});
    if (onThreadOpened) onThreadOpened();
  };

  if (loading && threads.length === 0) {
    return (
      <div style={{ maxWidth: '2560px', width: '98%', margin: '3rem auto', padding: '0 4rem' }}>
        <PageHeader title="Messages" subtitle="Keep track of your conversations." icon={MessageCircle} />
        <div style={{ display: 'grid', gap: '1.2rem' }}>
          {[1, 2, 3].map(i => <InboxSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '2560px', width: '98%', margin: '3rem auto', padding: '0 4rem' }}>
      <PageHeader title="Messages" subtitle="Keep track of your conversations." icon={MessageCircle} />
      
      <div style={inboxLayout}>
        {/* THREAD LIST */}
        <div style={{ ...threadListPanel, display: selectedThread && window.innerWidth < 1024 ? 'none' : 'block' }}>
          {threads.length === 0 ? (
            <div style={emptyStateStyle}><Mail size={48} color={theme.colors.divider} /><h2>No messages yet</h2></div>
          ) : (
            <div style={{ display: 'grid', gap: '1.2rem' }}>
              {threads.map(thread => (
                <ThreadCard 
                  key={`${thread.listing._id}-${thread.guest?._id}`} 
                  thread={thread} 
                  currentUser={user}
                  isActive={selectedThread?.listing?._id === thread.listing._id && selectedThread?.guest?._id === thread.guest?._id}
                  onOpen={() => handleOpenThread(thread)} 
                />
              ))}
            </div>
          )}
        </div>

        {/* INTEGRATED CHAT PANEL */}
        <div style={{ ...chatPanel, display: selectedThread ? 'flex' : 'none' }}>
          {selectedThread ? (
            <div style={{ height: '100%', position: 'relative' }}>
              <button onClick={() => setSelectedThread(null)} style={closePanelBtn}><X size={20} /></button>
              <div style={panelHeader}>
                <div style={{ fontWeight: 'bold' }}>{selectedThread.listing.title}</div>
                <div style={{ fontSize: '0.8rem', color: theme.colors.slate }}>
                  Conversation with {selectedThread.guest?._id === user._id ? 'Host' : selectedThread.guest?.name}
                </div>
              </div>
              <div style={{ height: 'calc(100% - 80px)' }}>
                <ChatWindow 
                  listingId={selectedThread.listing._id} 
                  guestId={selectedThread.guest?._id || user._id}
                  currentUser={user}
                  isHost={user._id === selectedThread.listing.adminId}
                  onChatOpened={fetchInbox}
                />
              </div>
            </div>
          ) : (
            <div style={noThreadSelected}>
              <MessageCircle size={48} color={theme.colors.divider} />
              <p>Select a thread to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ThreadCard = ({ thread, onOpen, currentUser, isActive }) => {
  const { listing, lastMessage, unreadCount, guest } = thread;
  const isUnread = unreadCount > 0;

  // Identify the "Other" party for the UI
  const isHost = (currentUser?._id || currentUser?.id) === (listing.adminId?._id || listing.adminId);
  const participantName = isHost ? guest?.name : 'Host';
  const participantAvatar = isHost ? guest?.avatar : null;

  return (
    <motion.div whileHover={{ y: -2 }} onClick={onOpen} style={threadCardStyle(isUnread, isActive)}>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', width: '100%' }}>
        <img src={listing.images[0]} style={thumbStyle} alt="Listing" />
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: theme.typography.weights.bold }}>
              {listing.title} {isHost && <span style={{ fontWeight: 'normal', color: theme.colors.slate }}>· {participantName}</span>}
            </h3>
            <span style={{ fontSize: '0.75rem', color: theme.colors.slate }}>{formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: true })}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', alignItems: 'center' }}>
            {participantAvatar && <img src={participantAvatar} style={{ width: '20px', height: '20px', borderRadius: '50%' }} alt="Av" />}
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

const InboxSkeleton = () => (
  <div style={{ ...threadCardStyle(false), cursor: 'default' }}>
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', width: '100%' }}>
      <div style={{ ...thumbStyle, backgroundColor: '#f0f0f0', position: 'relative', overflow: 'hidden' }}>
        <div className="shimmer-sweep" style={shimmerOverlay} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
          <div style={{ width: '30%', height: '1.2rem', backgroundColor: '#f0f0f0', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
             <div className="shimmer-sweep" style={shimmerOverlay} />
          </div>
          <div style={{ width: '10%', height: '0.8rem', backgroundColor: '#f0f0f0', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
             <div className="shimmer-sweep" style={shimmerOverlay} />
          </div>
        </div>
        <div style={{ width: '60%', height: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
           <div className="shimmer-sweep" style={shimmerOverlay} />
        </div>
      </div>
    </div>
  </div>
);

// --- TOKEN-BASED STYLES ---
const emptyStateStyle = { padding: '6rem', textAlign: 'center', border: `1px solid ${theme.colors.divider}`, borderRadius: theme.radius.lg };
const threadCardStyle = (isUnread, isActive) => ({ padding: '1.5rem', border: isActive ? `2px solid ${theme.colors.charcoal}` : isUnread ? `2px solid ${theme.colors.brand}` : `1px solid ${theme.colors.divider}`, borderRadius: theme.radius.lg, backgroundColor: isActive ? '#f9fafb' : theme.colors.white, display: 'flex', cursor: 'pointer', boxShadow: isActive ? 'none' : theme.shadows.card });
const thumbStyle = { width: '80px', height: '80px', borderRadius: theme.radius.md, objectFit: 'cover' };
const shimmerOverlay = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%)' };
const messagePreviewStyle = { margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '400px', color: theme.colors.slate };
const badgeStyle = { backgroundColor: theme.colors.brand, color: theme.colors.white, fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px' };
const actionLinkStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', color: theme.colors.brand, fontWeight: theme.typography.weights.bold, backgroundColor: '#fff1f2', padding: '0.6rem 1.2rem', borderRadius: theme.radius.sm, cursor: 'pointer' };

// --- INTEGRATED INBOX STYLES ---
const inboxLayout = { display: 'flex', gap: '2rem', height: '70vh', marginTop: '2rem' };
const threadListPanel = { flex: 1, overflowY: 'auto', paddingRight: '1rem' };
const chatPanel = { flex: 1.5, backgroundColor: '#fff', border: `1px solid ${theme.colors.divider}`, borderRadius: theme.radius.lg, overflow: 'hidden', flexDirection: 'column' };
const noThreadSelected = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: theme.colors.slate };
const closePanelBtn = { position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.slate, zIndex: 10 };
const panelHeader = { padding: '1.5rem 2.5rem', borderBottom: `1px solid ${theme.colors.divider}`, backgroundColor: '#fff' };

export default Inbox;
