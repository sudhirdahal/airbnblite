const Message = require('../models/Message');

const saveMessage = async (senderId, listingId, content) => {
  try {
    const newMessage = new Message({
      sender: senderId,
      listing: listingId,
      content,
      timestamp: new Date()
    });
    await newMessage.save();
    return newMessage;
  } catch (error) {
    console.error('Backend Error: saveMessage failed', error);
    throw error;
  }
};

const getChatHistory = async (listingId) => {
  try {
    return await Message.find({ listing: listingId })
      .populate('sender', 'name')
      .sort('timestamp');
  } catch (error) {
    console.error('Backend Error: getChatHistory failed', error);
    throw error;
  }
};

const handleChatMessage = async (io, socket, msg) => {
  // Ensure listingId is a string
  const roomId = String(msg.listingId);
  console.log(`Backend: Processing message for room ${roomId}`, msg);

  try {
    const savedMessage = await saveMessage(msg.senderId, roomId, msg.content);
    
    // Populate the sender so the frontend gets the name
    await savedMessage.populate('sender', 'name');

    const payload = {
      _id: savedMessage._id,
      sender: { 
        _id: savedMessage.sender._id, 
        name: savedMessage.sender.name 
      },
      listing: String(savedMessage.listing), // Ensure string
      content: savedMessage.content,
      timestamp: savedMessage.timestamp
    };

    console.log(`Backend: Broadcasting to room ${roomId}`, payload);
    io.to(roomId).emit('chat message', payload);
    
  } catch (error) {
    console.error('Backend Error: handleChatMessage failed', error);
    socket.emit('chat error', { message: 'Server could not process message' });
  }
};

const handleJoinRoom = async (io, socket, listingId) => {
  const roomId = String(listingId);
  console.log(`Backend: Socket ${socket.id} joined room ${roomId}`);
  
  socket.join(roomId);

  try {
    const history = await getChatHistory(roomId);
    socket.emit('chat history', history);
  } catch (error) {
    console.error('Backend Error: handleJoinRoom history fetch failed', error);
    socket.emit('chat error', { message: 'Failed to fetch history' });
  }
};

module.exports = { saveMessage, getChatHistory, handleChatMessage, handleJoinRoom };
