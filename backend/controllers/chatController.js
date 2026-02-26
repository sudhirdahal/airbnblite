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
 * REFACTORED: Now finds all threads where the user is involved, 
 * regardless of whether they are Guest or Host.
 */
exports.getInbox = async (req, res) => {
  try {
    // 1. Get properties I own
    const myListings = await Listing.find({ adminId: req.user.id }).select('_id');
    const myListingIds = myListings.map(l => l._id);

    // 2. FIND ALL THREADS:
    // We need to find every listingId that the user has EVER messaged about.
    const allUserMessages = await Message.find({
      $or: [
        { sender: req.user.id }, // I sent it
        { listingId: { $in: myListingIds } } // It's my property
      ]
    }).distinct('listingId'); // Get unique property IDs

    // 3. GET FULL MESSAGE DATA for those threads
    const messages = await Message.find({
      listingId: { $in: allUserMessages }
    })
    .populate('sender', 'name avatar')
    .populate('listingId', 'title images adminId')
    .sort({ timestamp: -1 });

    const threads = {};
    messages.forEach(msg => {
      if (!msg.listingId || !msg.sender) return;

      const lid = msg.listingId._id.toString();
      
      // If this is the first time we see this listing in the loop (it's the latest message)
      if (!threads[lid]) {
        threads[lid] = {
          listing: msg.listingId,
          lastMessage: msg,
          unreadCount: 0
        };
      }
      
      // LOGIC FIX: Increment unread if I am NOT the sender AND it's marked as unread.
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

    io.to(msg.listingId).emit('chat message', payload);

    const listing = savedMessage.listingId;
    if (listing && listing.adminId) {
      const hostId = listing.adminId.toString();
      const guestId = savedMessage.sender._id.toString();
      
      // Notify both private rooms - the recipient's frontend will catch it
      io.to(hostId).emit('new_message_alert', payload);
      io.to(guestId).emit('new_message_alert', payload);
    }

  } catch (err) { console.error('Socket Error:', err); }
};
