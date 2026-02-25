import React, { useState, useEffect, useRef } from 'react';
import socket from '../../services/socket';
import { Send, MessageCircle, X, Minus, ShieldCheck } from 'lucide-react';

const ChatWindow = ({ listingId, currentUser, isHost }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  
  // Use Refs to keep values stable inside the socket listener
  const isOpenRef = useRef(isOpen);
  const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'));

  // Sync ref with state
  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen]);

  const getUserId = (user) => user?._id || user?.id;

  useEffect(() => {
    if (!currentUser || !listingId) return; 

    console.log(`Socket: Connecting for listing ${listingId}`);
    socket.emit('join room', listingId);

    const handleHistory = (history) => {
      setMessages(history);
    };

    const handleNewMessage = (message) => {
      // Check if message belongs to this listing
      if (message.listing === listingId) {
        setMessages(prev => [...prev, message]);
        
        // Use the Ref to check if window is closed
        if (!isOpenRef.current) {
          setUnreadCount(prev => prev + 1);
          audioRef.current.play().catch(() => {});
        }
      }
    };

    socket.on('chat history', handleHistory);
    socket.on('chat message', handleNewMessage);

    return () => {
      console.log('Socket: Cleaning up listeners');
      socket.off('chat history', handleHistory);
      socket.off('chat message', handleNewMessage);
    };
  }, [listingId, currentUser]); // Only re-run if listing or user changes

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px', borderRadius: '50%',
          backgroundColor: isHost ? '#4a148c' : '#ff385c', color: 'white', border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
          transition: 'transform 0.3s'
        }}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        {!isOpen && unreadCount > 0 && (
          <div style={{
            position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#222', color: 'white',
            borderRadius: '50%', width: '24px', height: '24px', fontSize: '0.75rem', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white',
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      <div style={{ 
        position: 'fixed', bottom: '100px', right: '30px', width: '380px', height: '500px', maxHeight: 'calc(100vh - 150px)',
        backgroundColor: 'white', borderRadius: '16px', display: isOpen ? 'flex' : 'none', flexDirection: 'column',
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)', overflow: 'hidden', zIndex: 2000, border: '1px solid #eee'
      }}>
        <div style={{ padding: '1rem', backgroundColor: isHost ? '#4a148c' : '#ff385c', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isHost ? <ShieldCheck size={18} /> : <MessageCircle size={18} />}
            <span style={{ fontWeight: 'bold' }}>{isHost ? 'Guest Chat' : 'Host Chat'}</span>
          </div>
          <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><Minus size={20} /></button>
        </div>

        <div style={{ flexGrow: 1, padding: '1rem', overflowY: 'auto', backgroundColor: '#f9f9f9', display: 'flex', flexDirection: 'column' }}>
          {messages.map((msg) => {
            const isMe = getUserId(msg.sender) === getUserId(currentUser);
            return (
              <div key={msg._id} style={{ marginBottom: '0.8rem', alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                {!isMe && <div style={{ fontSize: '0.7rem', color: '#717171', marginLeft: '0.4rem', marginBottom: '0.1rem' }}>{msg.sender.name}</div>}
                <div style={{ 
                  padding: '0.6rem 1rem', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', 
                  backgroundColor: isMe ? (isHost ? '#4a148c' : '#ff385c') : '#e9e9e9', color: isMe ? 'white' : '#333',
                  fontSize: '0.9rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} style={{ padding: '1rem', borderTop: '1px solid #eee', display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write a message..."
            style={{ flexGrow: 1, padding: '0.7rem 1rem', borderRadius: '20px', border: '1px solid #ddd', outline: 'none', fontSize: '0.9rem' }}
          />
          <button type="submit" style={{ backgroundColor: isHost ? '#4a148c' : '#ff385c', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </>
  );
};

export default ChatWindow;
