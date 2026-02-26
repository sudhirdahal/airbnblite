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
      const lid = msg.listingId._id.toString();
      if (!threads[lid]) {
        threads[lid] = { listing: msg.listingId, lastMessage: msg, unreadCount: 0 };
      }
      if (!msg.isRead && msg.sender._id.toString() !== req.user.id) {
        threads[lid].unreadCount++;
      }
    });

    res.json(Object.values(threads));
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

/**
 * @desc Mark messages as read in a thread
 */
exports.markAsRead = async (req, res) => {
  try {
    const { listingId } = req.params;
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
 * UPDATED: Now broadcasts 'listingId' to ensure frontend filtering works perfectly.
 */
exports.handleChatMessage = async (io, socket, msg) => {
  try {
    const savedMessage = await saveMessage(msg.senderId, msg.listingId, msg.content);
    await savedMessage.populate('sender', 'name avatar');
    
    // --- NEW: COMPREHENSIVE PAYLOAD ---
    const payload = {
      _id: savedMessage._id,
      listingId: msg.listingId, // Explicitly added for frontend route matching
      sender: { _id: savedMessage.sender._id, name: savedMessage.sender.name, avatar: savedMessage.sender.avatar },
      content: savedMessage.content,
      timestamp: savedMessage.timestamp,
      isRead: false
    };

    /* --- OLD CODE: SIMPLE PAYLOAD ---
    const payload = {
      _id: savedMessage._id,
      sender: { _id: savedMessage.sender._id, name: savedMessage.sender.name },
      content: savedMessage.content
    };
    */

    io.to(msg.listingId).emit('chat message', payload);
  } catch (err) {
    console.error('Socket Error:', err);
  }
};
