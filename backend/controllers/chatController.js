const Message = require('../models/Message');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const User = require('../models/User');

/**
 * ============================================================================
 * 💬 CHAT CONTROLLER (The Real-Time Message Authority)
 * ============================================================================
 * 
 * MASTERCLASS NOTES:
 * This controller orchestrates bidirectional communication. Building a chat system
 * requires shifting from RESTful thinking (Request/Response) to Event-Driven
 * thinking (Emit/Broadcast). 
 * 
 * Evolution Timeline:
 * - Phase 4: Simple REST persistence (Users had to refresh the page to see messages).
 * - Phase 8: Socket.IO Integration (Messages pushed instantly).
 * - Phase 25: The Symmetrical Inbox & Targeted Notifications.
 */

/**
 * PERSISTENCE UTILITY: saveMessage
 * Logic: Encapsulates the DB save operation.
 */
const saveMessage = async (senderId, listingId, guestId, content) => {
  const newMessage = new Message({ sender: senderId, listingId, guestId, content });
  return await newMessage.save();
};

/**
 * @desc Fetch unique, organized conversation threads for the current user
 * @route GET /api/auth/inbox
 */
exports.getInbox = async (req, res) => {
  try {
    const myListings = await Listing.find({ adminId: req.user.id }).select('_id');
    const myListingIds = myListings.map(l => l._id);

    // Thread Discovery: Group by Listing AND Guest (Phase 40)
    // Find all messages where I am involved (Sender, Guest, or Owner)
    const messages = await Message.find({
      $or: [
        { sender: req.user.id },
        { guestId: req.user.id },
        { listingId: { $in: myListingIds } }
      ]
    })
    .populate('sender', 'name avatar')
    .populate('guestId', 'name avatar')
    .populate('listingId', 'title images adminId')
    .sort({ timestamp: -1 });

    const threads = {};
    messages.forEach(msg => {
      if (!msg.listingId || !msg.sender) return;
      
      // The "Thread Key": Composite of Property and the specific Guest
      const gid = msg.guestId?._id?.toString() || msg.guestId?.toString();
      const lid = msg.listingId._id.toString();
      const threadKey = `${lid}-${gid}`;
      
      if (!threads[threadKey]) {
        threads[threadKey] = { 
          listing: msg.listingId, 
          guest: msg.guestId,
          lastMessage: msg, 
          unreadCount: 0 
        };
      }
      
      if (!msg.isRead && msg.sender._id.toString() !== req.user.id) {
        threads[threadKey].unreadCount++;
      }
    });
    
    res.json(Object.values(threads));
  } catch (err) { res.status(500).send('Inbox Engine Failure'); }
};

/**
 * @desc Mark messages as read for a specific isolated thread
 * @route PUT /api/auth/inbox/:listingId/:guestId/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { listingId, guestId } = req.params;
    await Message.updateMany(
      { listingId, guestId, sender: { $ne: req.user.id }, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (err) { res.status(500).send('Sync Error'); }
};

/**
 * @desc Fetch isolated chronological chat history (Phase 40)
 * @route GET /api/auth/chat-history/:listingId/:guestId
 */
exports.getMessageHistory = async (req, res) => {
  try {
    const { listingId, guestId } = req.params;
    const messages = await Message.find({ listingId, guestId })
      .populate('sender', 'name avatar')
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) { res.status(500).send('History Retrieval Failure'); }
};

/**
 * @desc Fetch all unique guests who have booked a specific property
 * @route GET /api/auth/participants/:listingId
 */
exports.getListingParticipants = async (req, res) => {
  try {
    const { listingId } = req.params;
    
    // Authorization Check: Only the host can discover participants
    const listing = await Listing.findById(listingId);
    if (!listing || listing.adminId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Unauthorized participant discovery' });
    }

    // Discovery: Aggregate all unique guests from the booking ledger
    const guestIds = await Booking.find({ listingId }).distinct('userId');
    const participants = await User.find({ _id: { $in: guestIds } }).select('name avatar');
    
    res.json(participants);
  } catch (err) { res.status(500).send('Discovery Engine Failure'); }
};

/**
 * Socket.IO Event Handler: Joining an isolated conversation room
 */
exports.handleJoinRoom = (io, socket, data) => {
  // data: { listingId, guestId }
  const roomName = `${data.listingId}-${data.guestId}`;
  socket.join(roomName);
};

/**
 * @desc Real-time chat handler (Socket.IO Event: 'chat message')
 */
exports.handleChatMessage = async (io, socket, msg) => {
  try {
    // 1. Persistence with Guest Isolation
    const savedMessage = await saveMessage(msg.senderId, msg.listingId, msg.guestId, msg.content);
    
    const populated = await Message.findById(savedMessage._id)
      .populate('sender', 'name avatar')
      .populate('guestId', 'name avatar')
      .populate('listingId', 'adminId title');

    if (!populated || !populated.listingId) return;

    const payload = {
      _id: populated._id,
      listingId: populated.listingId._id,
      guestId: populated.guestId._id,
      sender: { 
        _id: populated.sender._id, 
        name: populated.sender.name, 
        avatar: populated.sender.avatar 
      },
      content: populated.content,
      timestamp: populated.timestamp,
      isRead: false
    };

    // 2. BROADCAST TO ISOLATED ROOM
    const roomName = `${populated.listingId._id}-${populated.guestId._id}`;
    io.to(roomName).emit('chat message', payload);

    // 3. TARGETED ALERT (Phase 25/40)
    const hostId = populated.listingId.adminId.toString();
    const guestId = populated.guestId._id.toString();
    const currentSenderId = populated.sender._id.toString();

    // Alert the "other" party in the triangle
    const recipientId = currentSenderId === hostId ? guestId : hostId;
    io.to(recipientId).emit('new_message_alert', payload);

  } catch (err) { console.error('Socket Message Sync Failure:', err); }
};
