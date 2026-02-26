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
 */
exports.getInbox = async (req, res) => {
  try {
    const myListings = await Listing.find({ adminId: req.user.id }).select('_id');
    const myListingIds = myListings.map(l => l._id);

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
      
      /**
       * --- LOGIC FIX: UNIVERSAL UNREAD CALCULATION ---
       * If I am the recipient (I did NOT send this message) and it is unread, 
       * increment the count. This now works for both Hosts and Guests.
       */
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
    
    // --- LOGIC FIX: SECURITY-AWARE READ ---
    // Mark messages as read only if the current user was the RECIPIENT
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
