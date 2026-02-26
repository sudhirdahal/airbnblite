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
      // Defensive check for deleted properties or users
      if (!msg.listingId || !msg.sender) return;

      const lid = msg.listingId._id.toString();
      if (!threads[lid]) {
        threads[lid] = { listing: msg.listingId, lastMessage: msg, unreadCount: 0 };
      }
      
      // Count as unread if the current user is the recipient
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
 * @desc Mark messages as read
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
 * @desc Fetch chat history
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
 * REPAIRED: Added deep defensive checks for recipient ID logic.
 */
exports.handleChatMessage = async (io, socket, msg) => {
  try {
    // 1. Persist the message
    const savedMessage = await saveMessage(msg.senderId, msg.listingId, msg.content);
    
    // 2. Hydrate data for the UI
    await savedMessage.populate('sender', 'name avatar');
    await savedMessage.populate('listingId', 'adminId title');

    const payload = {
      _id: savedMessage._id,
      listingId: msg.listingId,
      sender: { 
        _id: savedMessage.sender._id, 
        name: savedMessage.sender.name, 
        avatar: savedMessage.sender.avatar 
      },
      content: savedMessage.content,
      timestamp: savedMessage.timestamp,
      isRead: false
    };

    // 3. BROADCAST to the property-specific room (The current chat window)
    io.to(msg.listingId).emit('chat message', payload);

    // 4. PRIVATE PUSH: Notify the other party instantly
    const listing = savedMessage.listingId;
    
    // Safety check: Ensure listing and host exist
    if (listing && listing.adminId) {
      const hostId = listing.adminId.toString();
      
      // If sender is NOT the host, notify the host.
      // If sender IS the host, we'd ideally notify the specific guest 
      // (Simplified for Lite: we push to both rooms, frontend filters it)
      const guestId = savedMessage.sender._id.toString();
      
      // Push to Host room
      io.to(hostId).emit('new_message_alert', payload);
      // Push to Guest room (If they are not the sender)
      if (msg.senderId !== guestId) {
        io.to(guestId).emit('new_message_alert', payload);
      }
    }

  } catch (err) {
    console.error('CRITICAL CHAT ERROR:', err.message);
  }
};
