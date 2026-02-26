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

    const allUserMessages = await Message.find({
      $or: [{ sender: req.user.id }, { listingId: { $in: myListingIds } }]
    }).distinct('listingId'); 

    const messages = await Message.find({ listingId: { $in: allUserMessages } })
      .populate('sender', 'name avatar')
      .populate('listingId', 'title images adminId')
      .sort({ timestamp: -1 });

    const threads = {};
    messages.forEach(msg => {
      if (!msg.listingId || !msg.sender) return;
      const lid = msg.listingId._id.toString();
      if (!threads[lid]) {
        threads[lid] = { listing: msg.listingId, lastMessage: msg, unreadCount: 0 };
      }
      if (!msg.isRead && msg.sender._id.toString() !== req.user.id) {
        threads[lid].unreadCount++;
      }
    });
    res.json(Object.values(threads));
  } catch (err) { res.status(500).send('Server Error'); }
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
 * REFACTORED: Now correctly notifies the OTHER party in the conversation.
 */
exports.handleChatMessage = async (io, socket, msg) => {
  try {
    const savedMessage = await saveMessage(msg.senderId, msg.listingId, msg.content);
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

    // 1. BROADCAST to the active room
    io.to(msg.listingId).emit('chat message', payload);

    // 2. TARGETED PUSH: Notify the recipient's private room
    const listing = savedMessage.listingId;
    
    // Logic: If sender is NOT the host, notify the host.
    // If sender IS the host, notify all guests who have messaged about this listing.
    if (msg.senderId !== listing.adminId.toString()) {
      // Sender is Guest -> Notify Host
      io.to(listing.adminId.toString()).emit('new_message_alert', payload);
    } else {
      // Sender is Host -> Notify all guests involved in this property thread
      const participants = await Message.find({ listingId: msg.listingId }).distinct('sender');
      participants.forEach(pId => {
        if (pId.toString() !== msg.senderId) {
          io.to(pId.toString()).emit('new_message_alert', payload);
        }
      });
    }

  } catch (err) { console.error('Socket Error:', err); }
};
