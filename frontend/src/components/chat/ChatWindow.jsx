import React, { useState, useEffect, useRef } from 'react';
import socket from '../../services/socket';
import { Send, MessageCircle, X, Minus, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns'; 
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../services/api';

const ChatWindow = ({ listingId, currentUser, isHost, history = [], onChatOpened }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOtherTyping, setIsOtherTyping] = useState(false); 
  const typingTimeoutRef = useRef(null);
  
  const messagesEndRef = useRef(null);
  const isOpenRef = useRef(isOpen);
  const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'));

  useEffect(() => { if (history.length > 0) setMessages(history); }, [history]);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
      setUnreadCount(0);
      API.put(`/auth/chat-read/${listingId}`).then(() => onChatOpened && onChatOpened()).catch(() => {});
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, listingId, onChatOpened]);

  const getUserId = (user) => user?._id || user?.id;

  useEffect(() => {
    if (!currentUser || !listingId) return; 
    
    socket.emit('join room', listingId);

    const handleNewMessage = (message) => {
      if (message.listingId === listingId) {
        setMessages(prev => [...prev, message]);
        setIsOtherTyping(false); 
        if (!isOpenRef.current) {
          setUnreadCount(prev => prev + 1);
          audioRef.current.play().catch(() => {});
        }
      }
    };

    const handleTyping = (data) => {
      // Show indicator only if it's the OTHER person typing
      if (data.listingId === listingId && data.userId !== getUserId(currentUser)) {
        setIsOtherTyping(true);
      }
    };
    const handleStopTyping = (data) => {
      if (data.listingId === listingId) setIsOtherTyping(false);
    };

    socket.on('chat message', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);

    return () => {
      socket.off('chat message', handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
    };
  }, [listingId, currentUser]);

  useEffect(() => { if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isOpen]);

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // BROADCAST: Let the other person know I'm typing
    socket.emit('typing', { listingId, userId: getUserId(currentUser) });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { listingId });
    }, 3000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;
    socket.emit('chat message', { senderId: getUserId(currentUser), listingId: listingId, content: newMessage });
    socket.emit('stop_typing', { listingId });
    setNewMessage('');
  };

  if (!currentUser) return null;

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} style={floatingBtnStyle(isHost)}>
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        {!isOpen && unreadCount > 0 && (<div style={unreadBadgeStyle}>{unreadCount}</div>)}
      </button>

      <div style={{ ...chatContainerStyle, display: isOpen ? 'flex' : 'none' }}>
        <div style={headerStyle(isHost)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{isHost ? <ShieldCheck size={18} /> : <MessageCircle size={18} />}<span style={{ fontWeight: 'bold' }}>{isHost ? 'Guest Chat' : 'Host Chat'}</span></div>
          <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><Minus size={20} /></button>
        </div>

        <div style={messageListStyle}>
          {messages.map((msg) => {
            const isMe = getUserId(msg.sender) === getUserId(currentUser);
            return (
              <div key={msg._id} style={{ marginBottom: '1.2rem', alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                {!isMe && <div style={senderNameStyle}>{msg.sender?.name || 'User'}</div>}
                <div style={bubbleStyle(isMe, isHost)}>
                  {msg.content}
                </div>
                {/* --- FIXED: HIGH CONTRAST TIMESTAMP --- */}
                {msg.timestamp && (
                  <div style={timeStyle(isMe)}>
                    {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                  </div>
                )}
              </div>
            );
          })}
          
          <AnimatePresence>
            {isOtherTyping && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={typingIndicatorStyle}>
                <div className="pulse-dot" style={dotPulseStyle} />
                <span style={{ fontWeight: '600' }}>{isHost ? 'Guest' : 'Host'}</span> is typing...
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} style={formStyle}>
          <input type="text" value={newMessage} onChange={handleInputChange} placeholder="Write a message..." style={inputStyle} />
          <button type="submit" style={sendBtnStyle(isHost)}><Send size={18} /></button>
        </form>
      </div>
    </>
  );
};

// --- STYLES ---
const floatingBtnStyle = (isHost) => ({ position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isHost ? '#4a148c' : '#ff385c', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 });
const chatContainerStyle = { position: 'fixed', bottom: '100px', right: '30px', width: '380px', height: '520px', maxHeight: 'calc(100vh - 150px)', backgroundColor: 'white', borderRadius: '16px', flexDirection: 'column', boxShadow: '0 12px 40px rgba(0,0,0,0.15)', overflow: 'hidden', zIndex: 2000, border: '1px solid #eee' };
const headerStyle = (isHost) => ({ padding: '1rem', backgroundColor: isHost ? '#4a148c' : '#ff385c', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' });
const messageListStyle = { flexGrow: 1, padding: '1.2rem', overflowY: 'auto', backgroundColor: '#fcfcfc', display: 'flex', flexDirection: 'column' };
const bubbleStyle = (isMe, isHost) => ({ padding: '0.75rem 1.1rem', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', backgroundColor: isMe ? (isHost ? '#4a148c' : '#ff385c') : '#fff', color: isMe ? 'white' : '#222', fontSize: '0.92rem', border: isMe ? 'none' : '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' });
const timeStyle = (isMe) => ({ fontSize: '0.68rem', color: '#888', marginTop: '0.35rem', textAlign: isMe ? 'right' : 'left', marginRight: isMe ? '0.4rem' : 0, marginLeft: isMe ? 0 : '0.4rem', fontWeight: '500' });
const senderNameStyle = { fontSize: '0.72rem', color: '#717171', marginLeft: '0.4rem', marginBottom: '0.2rem', fontWeight: '700' };
const formStyle = { padding: '1rem', borderTop: '1px solid #eee', display: 'flex', gap: '0.5rem', backgroundColor: 'white' };
const inputStyle = { flexGrow: 1, padding: '0.75rem 1.2rem', borderRadius: '24px', border: '1px solid #eee', outline: 'none', fontSize: '0.9rem', backgroundColor: '#f9f9f9' };
const sendBtnStyle = (isHost) => ({ backgroundColor: isHost ? '#4a148c' : '#ff385c', color: 'white', border: 'none', borderRadius: '50%', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' });
const unreadBadgeStyle = { position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#222', color: 'white', borderRadius: '50%', width: '24px', height: '24px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' };
const typingIndicatorStyle = { fontSize: '0.8rem', color: '#717171', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0.5rem' };
const dotPulseStyle = { width: '8px', height: '8px', backgroundColor: '#ff385c', borderRadius: '50%', animation: 'pulse 1.5s infinite' };

export default ChatWindow;
