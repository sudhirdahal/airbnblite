import React, { useState, useEffect, useRef } from 'react';
import socket from '../../services/socket';
import { SendHorizontal, MessageCircle, X, Minus, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns'; 
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../services/api';

/**
 * ============================================================================
 * 💬 CHAT WINDOW COMPONENT (The Real-Time Presence Layer)
 * ============================================================================
 * 
 * MASTERCLASS NOTES:
 * This component manages the live bidirectional communication channel. 
 * Building a chat widget requires handling complex asynchronous state:
 * 1. Historical Hydration (Loading old messages).
 * 2. Real-time Interception (Catching new messages via Sockets).
 * 3. Presence Indicators (Visualizing when the other user is typing).
 */

/* ============================================================================
 * 👻 HISTORICAL GHOST: PHASE 39 (The Property-Bound Leak)
 * ============================================================================
 * socket.emit('join room', listingId);
 * 
 * THE FLAW: Threads were only isolated by Listing ID. If Guest A and Guest B
 * both messaged the Host, they could see each other's messages because they
 * were in the same socket room. Major privacy breach!
 * 
 * THE FIX: 'Triangular Isolation' using a composite key: listingId-guestId.
 * ============================================================================ */

const ChatWindow = ({ listingId, guestId, currentUser, isHost, history = [], onChatOpened }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Real-Time Interaction States
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUser, setTypingUser] = useState(null); 
  
  // Ref Persistence (Avoiding re-render cycles)
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isOpenRef = useRef(isOpen);
  
  // Audio Feedback: High-fidelity chime for incoming messages
  const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'));

  /**
   * HYDRATION SYNC
   * Logic: When the property history arrives from ListingDetail.jsx,
   * we inject it into the local state.
   */
  useEffect(() => { if (history.length > 0) setMessages(history); }, [history]);

  /**
   * INTERACTION SYNC
   * Logic: When the user opens the window, we tell the backend to mark 
   * these specific messages as 'read'.
   */
  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen && listingId && guestId) {
      setUnreadCount(0);
      API.put(`/auth/chat-read/${listingId}/${guestId}`).then(() => onChatOpened && onChatOpened()).catch(() => {});
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, listingId, guestId, onChatOpened]);

  const getUserId = (user) => user?._id || user?.id;

  /**
   * ⚡ REAL-TIME ENGINE (Socket.IO Handshake)
   */
  useEffect(() => {
    if (!currentUser || !listingId || !guestId) return; 
    
    // Join isolated triangular room
    socket.emit('join room', { listingId, guestId });

    const handleNewMessage = (message) => {
      // STRICT FILTERING: Must match both property AND the specific guest thread
      if (message.listingId === listingId && message.guestId === guestId) {
        setMessages(prev => [...prev, message]);
        setTypingUser(null);
        
        if (!isOpenRef.current) {
          setUnreadCount(prev => prev + 1);
          audioRef.current.play().catch(() => {});
        }
      }
    };

    const handleTyping = (data) => {
      if (data.listingId === listingId && data.guestId === guestId && data.userId !== getUserId(currentUser)) {
        setTypingUser(isHost ? 'Guest' : 'Host');
      }
    };
    
    const handleStopTyping = (data) => {
      if (data.listingId === listingId && data.guestId === guestId) setTypingUser(null);
    };

    socket.on('chat message', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);

    return () => {
      socket.off('chat message', handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
    };
  }, [listingId, guestId, currentUser, isHost]);

  // Auto-scroll logic: Keep the latest message in view
  useEffect(() => { if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isOpen]);

  /**
   * PRESENCE EMITTER
   * Logic: Informs the server we are currently typing.
   * Debounce Pattern: We emit 'stop_typing' after 3 seconds of inactivity.
   */
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    socket.emit('typing', { listingId, guestId, userId: getUserId(currentUser) });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { listingId, guestId });
    }, 3000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;
    
    // Push event to server
    socket.emit('chat message', { 
      senderId: getUserId(currentUser), 
      listingId: listingId, 
      guestId: guestId, // Critical for isolation
      content: newMessage 
    });
    
    socket.emit('stop_typing', { listingId, guestId });
    setNewMessage('');
  };

  if (!currentUser) return null;

  // DESIGN TOKEN: Visual Identity Logic
  // Host uses Purple branding, Guests use Brand Red
  const themeColor = isHost ? '#4a148c' : '#ff385c';

  return (
    <>
      {/* 🔘 FLOATING TOGGLE */}
      <button onClick={() => setIsOpen(!isOpen)} style={floatingBtnStyle(themeColor)}>
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        {!isOpen && unreadCount > 0 && (<div style={unreadBadgeStyle}>{unreadCount}</div>)}
      </button>

      {/* 💬 CHAT PORTAL */}
      <div style={{ ...chatContainerStyle, display: isOpen ? 'flex' : 'none' }}>
        <div style={headerStyle(themeColor)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isHost ? <ShieldCheck size={18} /> : <MessageCircle size={18} />}
            <span style={{ fontWeight: 'bold' }}>{isHost ? 'Host Controls' : 'Message Host'}</span>
          </div>
          <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><Minus size={20} /></button>
        </div>

        <div style={messageListStyle}>
          {messages.map((msg) => {
            const isMe = getUserId(msg.sender) === getUserId(currentUser);
            return (
              <div key={msg._id} style={{ marginBottom: '1.2rem', alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                {!isMe && <div style={senderNameStyle}>{msg.sender?.name || 'User'}</div>}
                <div style={bubbleStyle(isMe, themeColor)}>{msg.content}</div>
                {msg.timestamp && (
                  <div style={timeStyle(isMe)}>{formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}</div>
                )}
              </div>
            );
          })}
          
          <AnimatePresence>
            {typingUser && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={typingIndicatorStyle}>
                <div className="pulse-dot" style={dotPulseStyle(themeColor)} />
                <span style={{ fontWeight: '600' }}>{typingUser}</span> is typing...
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} style={formStyle}>
          <input type="text" value={newMessage} onChange={handleInputChange} placeholder="Write a message..." style={inputStyle} />
          <motion.button 
            type="submit" 
            whileHover={{ scale: 1.05, backgroundColor: isHost ? '#310e5d' : '#e31c5f' }}
            whileTap={{ scale: 0.95 }}
            style={sendBtnStyle(themeColor)}
          >
            <SendHorizontal size={32} color="white" strokeWidth={2.5} style={{ transform: 'translateX(2px)' }} />
          </motion.button>
        </form>
      </div>
    </>
  );
};

// --- DESIGN TOKEN STYLES ---
const floatingBtnStyle = (color) => ({ position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: color, color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 });
const chatContainerStyle = { position: 'fixed', bottom: 100, right: '30px', width: '380px', maxWidth: 'calc(100vw - 60px)', height: '540px', maxHeight: 'calc(100vh - 150px)', backgroundColor: 'white', borderRadius: '16px', flexDirection: 'column', boxShadow: '0 12px 40px rgba(0,0,0,0.15)', overflow: 'hidden', zIndex: 2000, border: '1px solid #eee' };
const headerStyle = (color) => ({ padding: '1.2rem', backgroundColor: color, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' });
const messageListStyle = { flexGrow: 1, padding: '1.2rem', overflowY: 'auto', backgroundColor: '#fcfcfc', display: 'flex', flexDirection: 'column' };
const bubbleStyle = (isMe, color) => ({ padding: '0.8rem 1.2rem', borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px', backgroundColor: isMe ? color : '#fff', color: isMe ? 'white' : '#222', fontSize: '0.95rem', border: isMe ? 'none' : '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' });
const timeStyle = (isMe) => ({ fontSize: '0.68rem', color: '#888', marginTop: '0.35rem', textAlign: isMe ? 'right' : 'left', marginRight: '0.4rem', marginLeft: '0.4rem', fontWeight: '500' });
const senderNameStyle = { fontSize: '0.72rem', color: '#717171', marginLeft: '0.4rem', marginBottom: '0.3rem', fontWeight: '700' };
const formStyle = { padding: '1rem', borderTop: '1px solid #eee', display: 'flex', gap: '0.8rem', backgroundColor: 'white', alignItems: 'center' };
const inputStyle = { flexGrow: 1, padding: '0.8rem 1.4rem', borderRadius: '28px', border: '1.5px solid #eee', outline: 'none', fontSize: '1rem', backgroundColor: '#f9f9f9', color: '#222', WebkitAppearance: 'none' };
const sendBtnStyle = (color) => ({ backgroundColor: color, border: 'none', borderRadius: '50%', width: '54px', height: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', flexShrink: 0, padding: 0, transition: 'background-color 0.2s' });
const unreadBadgeStyle = { position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#222', color: 'white', borderRadius: '50%', width: '24px', height: '24px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' };
const typingIndicatorStyle = { fontSize: '0.8rem', color: '#717171', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0.5rem' };
const dotPulseStyle = (color) => ({ width: '8px', height: '8px', backgroundColor: color, borderRadius: '50%' });

export default ChatWindow;
