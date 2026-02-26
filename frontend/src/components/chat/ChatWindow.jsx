import React, { useState, useEffect, useRef } from 'react';
import socket from '../../services/socket';
import { Send, MessageCircle, X, Minus, ShieldCheck } from 'lucide-react';
import API from '../../services/api'; 

/**
 * ChatWindow Component: Context-aware floating messenger.
 * Features:
 * - Persistent history loading via pre-loaded props.
 * - Real-time Socket.IO communication.
 * - Automatic "Mark as Read" triggers when opening the window.
 * - Unread message counters and audio alerts.
 */
const ChatWindow = ({ listingId, currentUser, isHost, history = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  
  const isOpenRef = useRef(isOpen);
  const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'));

  /**
   * HISTORY SYNC
   * When the parent (ListingDetail) fetches the message history from the REST API,
   * we inject it here to ensure the user sees their previous conversations.
   */
  useEffect(() => {
    if (history.length > 0) setMessages(history);
  }, [history]);

  /**
   * READ STATUS ENGINE
   * When the window is opened, we trigger an API call to mark all messages 
   * in this specific thread as read. This clears the red dots in the Navbar.
   */
  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
      setUnreadCount(0);
      // Mark as read on the backend database
      API.put(`/auth/chat-read/${listingId}`).catch(() => {});
      // Auto-scroll to the latest message
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, listingId]);

  const getUserId = (user) => user?._id || user?.id;

  /**
   * SOCKET LISTENER
   * Listens for incoming messages broadcasted by the server.
   */
  useEffect(() => {
    if (!currentUser || !listingId) return; 

    socket.emit('join room', listingId);

    const handleNewMessage = (message) => {
      /**
       * FILTERING LOGIC
       * We verify that the incoming message actually belongs to the 
       * property currently being viewed.
       */
      if (message.listingId === listingId) {
        setMessages(prev => [...prev, message]);
        
        // If the chat is closed, increment unread count and play sound
        if (!isOpenRef.current) {
          setUnreadCount(prev => prev + 1);
          audioRef.current.play().catch(() => {});
        }
      }

      /* --- OLD CODE: Fragile Filter ---
      if (message.listing === listingId) { // Fails because backend sends 'listingId'
        setMessages(prev => [...prev, message]);
      }
      */
    };

    socket.on('chat message', handleNewMessage);
    return () => {
      socket.off('chat message', handleNewMessage);
    };
  }, [listingId, currentUser]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    socket.emit('chat message', {
      senderId: getUserId(currentUser),
      listingId: listingId,
      content: newMessage
    });
    setNewMessage('');
  };

  if (!currentUser) return null;

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} style={{ position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isHost ? '#4a148c' : '#ff385c', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        {!isOpen && unreadCount > 0 && (<div style={unreadBadgeStyle}>{unreadCount}</div>)}
      </button>

      <div style={{ position: 'fixed', bottom: '100px', right: '30px', width: '380px', height: '500px', maxHeight: 'calc(100vh - 150px)', backgroundColor: 'white', borderRadius: '16px', display: isOpen ? 'flex' : 'none', flexDirection: 'column', boxShadow: '0 12px 40px rgba(0,0,0,0.15)', overflow: 'hidden', zIndex: 2000, border: '1px solid #eee' }}>
        <div style={{ padding: '1rem', backgroundColor: isHost ? '#4a148c' : '#ff385c', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{isHost ? <ShieldCheck size={18} /> : <MessageCircle size={18} />}<span style={{ fontWeight: 'bold' }}>{isHost ? 'Guest Chat' : 'Host Chat'}</span></div>
          <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><Minus size={20} /></button>
        </div>
        <div style={{ flexGrow: 1, padding: '1rem', overflowY: 'auto', backgroundColor: '#f9f9f9', display: 'flex', flexDirection: 'column' }}>
          {messages.map((msg) => {
            const isMe = getUserId(msg.sender) === getUserId(currentUser);
            return (
              <div key={msg._id} style={{ marginBottom: '0.8rem', alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                {!isMe && <div style={{ fontSize: '0.7rem', color: '#717171', marginLeft: '0.4rem', marginBottom: '0.1rem' }}>{msg.sender.name}</div>}
                <div style={{ padding: '0.6rem 1rem', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', backgroundColor: isMe ? (isHost ? '#4a148c' : '#ff385c') : '#e9e9e9', color: isMe ? 'white' : '#333', fontSize: '0.9rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>{msg.content}</div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} style={{ padding: '1rem', borderTop: '1px solid #eee', display: 'flex', gap: '0.5rem' }}>
          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Write a message..." style={{ flexGrow: 1, padding: '0.7rem 1rem', borderRadius: '20px', border: '1px solid #ddd', outline: 'none', fontSize: '0.9rem' }} />
          <button type="submit" style={{ backgroundColor: isHost ? '#4a148c' : '#ff385c', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Send size={18} /></button>
        </form>
      </div>
    </>
  );
};

const unreadBadgeStyle = { position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#222', color: 'white', borderRadius: '50%', width: '24px', height: '24px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' };

export default ChatWindow;
