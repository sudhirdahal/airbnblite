const Message = require('../models/Message');
const Listing = require('../models/Listing');

/**
 * ============================================================================
 * CHAT CONTROLLER (The Real-Time Message Authority)
 * ============================================================================
 * This controller orchestrates bidirectional communication and threading.
 * Evolution:
 * 1. Stage 1: Simple DB persistence (Phase 4).
 * 2. Stage 2: Host-only inbox queries (Phase 5).
 * 3. Stage 3: Symmetrical thread aggregation via .distinct() (Current).
 */

/**
 * PERSISTENCE UTILITY: saveMessage
 * Logic: Encapsulates the DB save operation for internal Socket use.
 */
const saveMessage = async (senderId, listingId, content) => {
  const newMessage = new Message({ sender: senderId, listingId, content });
  return await newMessage.save();
};

/**
 * @desc Fetch unique conversations for the current user
 * @route GET /api/auth/inbox
 * 
 * Logic: THE SYMMETRICAL INBOX
 * To ensure guests can see host replies on properties they don't own, we:
 * 1. Find all listingIds where the user is ANY participant (sender or owner).
 * 2. Group the full message collection into threads based on those IDs.
 */
exports.getInbox = async (req, res) => {
  try {
    // 1. Identification: Properties I own
    const myListings = await Listing.find({ adminId: req.user.id }).select('_id');
    const myListingIds = myListings.map(l => l._id);

    // 2. Thread Discovery: Find every conversation I am part of
    const allUserMessages = await Message.find({
      $or: [{ sender: req.user.id }, { listingId: { $in: myListingIds } }]
    }).distinct('listingId'); 

    // 3. Hydration & Aggregation
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
      // Unread Rule: I did not send this, and it is marked unread.
      if (!msg.isRead && msg.sender._id.toString() !== req.user.id) {
        threads[lid].unreadCount++;
      }
    });
    res.json(Object.values(threads));
  } catch (err) { res.status(500).send('Inbox Engine Failure'); }
};

/* --- HISTORICAL STAGE 1: ONE-WAY INBOX (FLAWED) ---
 * exports.getInboxLegacy = async (req, res) => {
 *   const messages = await Message.find({ listingId: { $in: myOwnedIds } });
 *   res.json(messages); // Problem: Guests saw an empty inbox!
 * };
 */

/**
 * @desc Mark messages as read
 * Security: Validates the user is the recipient of the unread messages.
 */
exports.markAsRead = async (req, res) => {
  try {
    const { listingId } = req.params;
    await Message.updateMany(
      { listingId, sender: { $ne: req.user.id }, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (err) { res.status(500).send('Sync Error'); }
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
  } catch (err) { res.status(500).send('History Retrieval Failure'); }
};

exports.handleJoinRoom = (io, socket, listingId) => {
  socket.join(listingId);
};

/**
 * @desc Real-time chat handler (Socket.IO)
 * 
 * Logic: THE PRIVATE ROOM PUSH
 * 1. Broadcasts to the active room (anyone looking at the listing).
 * 2. Pushes an alert directly to the recipient's private UserID room.
 */
exports.handleChatMessage = async (io, socket, msg) => {
  try {
    const savedMessage = await saveMessage(msg.senderId, msg.listingId, msg.content);
    
    // Explicitly populate for the real-time payload
    const populated = await Message.findById(savedMessage._id)
      .populate('sender', 'name avatar')
      .populate('listingId', 'adminId title');

    if (!populated || !populated.listingId) return;

    const payload = {
      _id: populated._id,
      listingId: populated.listingId._id,
      sender: { 
        _id: populated.sender._id, 
        name: populated.sender.name, 
        avatar: populated.sender.avatar 
      },
      content: populated.content,
      timestamp: populated.timestamp,
      isRead: false
    };

    // 1. BROADCAST: Send to the active listing room (for the open chat window)
    io.to(populated.listingId._id.toString()).emit('chat message', payload);

    // 2. TARGETED ALERT: Notify the recipient's private room (for Navbar badges)
    const hostId = populated.listingId.adminId.toString();
    const currentSenderId = populated.sender._id.toString();

    if (currentSenderId !== hostId) {
      // GUEST -> HOST: Alert the Host
      io.to(hostId).emit('new_message_alert', payload);
    } else {
      // HOST -> GUEST: Find the guest(s) in this thread
      const participants = await Message.find({ listingId: populated.listingId._id }).distinct('sender');
      participants.forEach(pId => {
        const participantId = pId.toString();
        if (participantId !== hostId) {
          io.to(participantId).emit('new_message_alert', payload);
        }
      });
    }
  } catch (err) { console.error('Socket Message Sync Failure:', err); }
};
