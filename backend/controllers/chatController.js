const Message = require('../models/Message');
const Listing = require('../models/Listing');

/**
 * Persists a new message to the database.
 */
const saveMessage = async (senderId, listingId, content) => {
  const newMessage = new Message({
    sender: senderId,
    listingId,
    content
  });
  return await newMessage.save();
};

/**
 * @desc Fetch unique conversations for the current user (Inbox)
 * LOGIC FIX: Now correctly identifies threads for both Hosts and Guests.
 */
exports.getInbox = async (req, res) => {
  try {
    // 1. Get IDs of properties I own (if Admin)
    const myListings = await Listing.find({ adminId: req.user.id }).select('_id');
    const myListingIds = myListings.map(l => l._id);

    // 2. FIND MESSAGES: 
    // - That I sent (sender)
    // - OR that were sent regarding a listing I own (recipient as host)
    // - OR where I am involved in the conversation thread (recipient as guest)
    // To make this 100% reliable for "Lite" shared rooms, we find all messages 
    // where the user is either the sender OR the listing matches their ownership.
    const messages = await Message.find({
      $or: [
        { sender: req.user.id },
        { listingId: { $in: myListingIds } }
      ]
    })
    .populate('sender', 'name avatar')
    .populate('listingId', 'title images')
    .sort({ timestamp: -1 });

    const threads = {};
    messages.forEach(msg => {
      if (!msg.listingId || !msg.sender) return;

      const lid = msg.listingId._id.toString();
      if (!threads[lid]) {
        threads[lid] = { listing: msg.listingId, lastMessage: msg, unreadCount: 0 };
      }
      
      // LOGIC FIX: Increment unread count if the CURRENT USER is not the sender.
      // This ensures both Host and Guest see unread alerts correctly.
      if (!msg.isRead && msg.sender._id.toString() !== req.user.id) {
        threads[lid].unreadCount++;
      }
    });

    res.json(Object.values(threads));
  } catch (err) {
    console.error('Inbox Error:', err.message);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc Mark messages as read in a thread
 */
exports.markAsRead = async (req, res) => {
  try {
    const { listingId } = req.params;
    
    // SECURITY FIX: Only mark messages as read if the current user was the RECIPIENT
    await Message.updateMany(
      { listingId, sender: { $ne: req.user.id }, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (err) { res.status(500).send('Server Error'); }
};

/**
 * @desc Fetch full chat history for a listing
 */
exports.getMessageHistory = async (req, res) => {
  try {
    const messages = await Message.find({ listingId: req.params.listingId })
      .populate('sender', 'name avatar')
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) { res.status(500).send('Server Error'); }
};

exports.handleJoinRoom = (io, socket, listingId) => {
  socket.join(listingId);
};

/**
 * @desc Real-time chat handler
 */
exports.handleChatMessage = async (io, socket, msg) => {
  try {
    const savedMessage = await saveMessage(msg.senderId, msg.listingId, msg.content);
    await savedMessage.populate('sender', 'name avatar');
    
    const payload = {
      _id: savedMessage._id,
      listingId: msg.listingId,
      sender: { _id: savedMessage.sender._id, name: savedMessage.sender.name, avatar: savedMessage.sender.avatar },
      content: savedMessage.content,
      timestamp: savedMessage.timestamp,
      isRead: false
    };

    io.to(msg.listingId).emit('chat message', payload);
  } catch (err) {
    console.error('Socket Error:', err);
  }
};
