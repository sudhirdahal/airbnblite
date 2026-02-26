const Message = require('../models/Message');
const Listing = require('../models/Listing');

/**
 * Persists a new message to the database.
 * Used internally by the Socket.IO handler.
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
 * @route GET /api/auth/inbox
 * 
 * ============================================================================
 * INBOX LOGIC EVOLUTION
 * ============================================================================
 * Initially, this query only found threads where the user owned the property.
 * We refactored it to use '.distinct()' to ensure Guests can see their replies
 * even if they don't own the listing.
 */
exports.getInbox = async (req, res) => {
  try {
    // 1. Get properties I own
    const myListings = await Listing.find({ adminId: req.user.id }).select('_id');
    const myListingIds = myListings.map(l => l._id);

    // 2. Thread Discovery Engine
    // Find every unique listingId the user has ever messaged about or owns
    const allUserMessages = await Message.find({
      $or: [
        { sender: req.user.id }, 
        { listingId: { $in: myListingIds } } 
      ]
    }).distinct('listingId'); 

    // 3. Thread Aggregation
    const messages = await Message.find({ listingId: { $in: allUserMessages } })
      .populate('sender', 'name avatar')
      .populate('listingId', 'title images adminId')
      .sort({ timestamp: -1 });

    const threads = {};
    messages.forEach(msg => {
      // Defensive check for deleted properties
      if (!msg.listingId || !msg.sender) return;

      const lid = msg.listingId._id.toString();
      if (!threads[lid]) {
        threads[lid] = { listing: msg.listingId, lastMessage: msg, unreadCount: 0 };
      }
      
      // Symmetrical Unread Logic: Count if I am not the sender
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
 * @desc Mark messages as read in a specific thread
 * @route PUT /api/auth/chat-read/:listingId
 */
exports.markAsRead = async (req, res) => {
  try {
    const { listingId } = req.params;
    // Security: Users can only mark messages they RECEIVED as read
    await Message.updateMany(
      { listingId, sender: { $ne: req.user.id }, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (err) { res.status(500).send('Server Error'); }
};

/**
 * @desc Fetch full chat history for a listing
 * @route GET /api/auth/chat-history/:listingId
 */
exports.getMessageHistory = async (req, res) => {
  try {
    const messages = await Message.find({ listingId: req.params.listingId })
      .populate('sender', 'name avatar')
      .sort({ timestamp: 1 }); // Chronological order
    res.json(messages);
  } catch (err) { res.status(500).send('Server Error'); }
};

/**
 * Socket.IO Room Handler
 */
exports.handleJoinRoom = (io, socket, listingId) => {
  socket.join(listingId);
};

/**
 * @desc Real-time chat handler (Socket.IO)
 * UPDATED: Includes full hydration and dual-room broadcasting for instant alerts.
 */
exports.handleChatMessage = async (io, socket, msg) => {
  try {
    const savedMessage = await saveMessage(msg.senderId, msg.listingId, msg.content);
    await savedMessage.populate('sender', 'name avatar');
    await savedMessage.populate('listingId', 'adminId title');

    const payload = {
      _id: savedMessage._id,
      listingId: msg.listingId,
      sender: { _id: savedMessage.sender._id, name: savedMessage.sender.name, avatar: savedMessage.sender.avatar },
      content: savedMessage.content,
      timestamp: savedMessage.timestamp,
      isRead: false
    };

    // 1. Broadcast to the active chat window
    io.to(msg.listingId).emit('chat message', payload);

    // 2. Broadcast to private rooms for Navbar/Inbox alerts (Phase 8 Performance)
    const listing = savedMessage.listingId;
    if (listing && listing.adminId) {
      io.to(listing.adminId.toString()).emit('new_message_alert', payload);
      io.to(savedMessage.sender._id.toString()).emit('new_message_alert', payload);
    }

  } catch (err) { console.error('Socket Error:', err); }
};
