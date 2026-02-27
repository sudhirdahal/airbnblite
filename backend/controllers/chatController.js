const Message = require('../models/Message');
const Listing = require('../models/Listing');

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
 * Logic: Encapsulates the DB save operation. Even though chat is real-time,
 * we must persist every message to MongoDB so users can view history later.
 */
const saveMessage = async (senderId, listingId, content) => {
  const newMessage = new Message({ sender: senderId, listingId, content });
  return await newMessage.save();
};

/* ============================================================================
 * 👻 HISTORICAL GHOST: PHASE 4 (The One-Way Inbox)
 * ============================================================================
 * Initially, our Inbox logic only worked for Hosts. It looked like this:
 * 
 * exports.getInboxLegacy = async (req, res) => {
 *   // 1. Find properties I own
 *   const myOwnedIds = await Listing.find({ adminId: req.user.id }).select('_id');
 *   // 2. Get messages for those properties
 *   const messages = await Message.find({ listingId: { $in: myOwnedIds } });
 *   res.json(messages); 
 * };
 * 
 * THE FLAW: Guests could send messages, but if they went to their Inbox, 
 * it was completely blank because they didn't "own" any properties! 
 * We needed a "Symmetrical" query that caught messages from both perspectives.
 * ============================================================================ */

/**
 * @desc Fetch unique, organized conversation threads for the current user
 * @route GET /api/auth/inbox
 * 
 * ARCHITECTURE (The Symmetrical Inbox):
 * 1. Identity Matrix: Find properties the user owns OR messages they sent.
 * 2. Distinct Grouping: Extract unique listing IDs from that matrix.
 * 3. Thread Hydration: Fetch and populate all messages for those specific IDs.
 * 4. Data Shaping: Group messages into "Thread" objects with unread counts.
 */
exports.getInbox = async (req, res) => {
  try {
    // 1. Identification: Properties I own (Host Perspective)
    const myListings = await Listing.find({ adminId: req.user.id }).select('_id');
    const myListingIds = myListings.map(l => l._id);

    // 2. Thread Discovery (Symmetrical Query)
    // Find every conversation where I am the Sender OR the Owner
    const allUserMessages = await Message.find({
      $or: [{ sender: req.user.id }, { listingId: { $in: myListingIds } }]
    }).distinct('listingId'); // Return only an array of unique Property IDs

    // 3. Hydration & Aggregation
    // Fetch the actual message data and populate relational fields
    const messages = await Message.find({ listingId: { $in: allUserMessages } })
      .populate('sender', 'name avatar')
      .populate('listingId', 'title images adminId')
      .sort({ timestamp: -1 });

    // 4. Data Shaping (Building the Threads)
    const threads = {};
    messages.forEach(msg => {
      if (!msg.listingId || !msg.sender) return;
      const lid = msg.listingId._id.toString();
      
      // If this is the first time seeing this listing, create the Thread object
      if (!threads[lid]) {
        threads[lid] = { listing: msg.listingId, lastMessage: msg, unreadCount: 0 };
      }
      
      // Unread Rule: Increment count ONLY if I am the recipient and it is unread.
      if (!msg.isRead && msg.sender._id.toString() !== req.user.id) {
        threads[lid].unreadCount++;
      }
    });
    
    res.json(Object.values(threads)); // Return an array of Thread objects
  } catch (err) { res.status(500).send('Inbox Engine Failure'); }
};

/**
 * @desc Mark messages as read when a user opens a chat thread
 * @route PUT /api/auth/inbox/:listingId/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { listingId } = req.params;
    // Security: Only update messages where I am NOT the sender.
    // I shouldn't be able to mark my own sent messages as "read" by myself.
    await Message.updateMany(
      { listingId, sender: { $ne: req.user.id }, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (err) { res.status(500).send('Sync Error'); }
};

/**
 * @desc Fetch full chronological chat history for a specific listing
 * @route GET /api/auth/chat-history/:listingId
 */
exports.getMessageHistory = async (req, res) => {
  try {
    const messages = await Message.find({ listingId: req.params.listingId })
      .populate('sender', 'name avatar')
      .sort({ timestamp: 1 }); // Sort ascending (oldest first) for chat UI flow
    res.json(messages);
  } catch (err) { res.status(500).send('History Retrieval Failure'); }
};

/**
 * Socket.IO Event Handler: Joining a specific Property's chat room
 */
exports.handleJoinRoom = (io, socket, listingId) => {
  socket.join(listingId);
};

/* ============================================================================
 * 👻 HISTORICAL GHOST: PHASE 8 (The Unhydrated Broadcast Crash)
 * ============================================================================
 * When we first implemented sockets, we broadcasted the raw DB save:
 * 
 * const savedMessage = await newMessage.save();
 * io.emit('chat message', savedMessage); 
 * 
 * THE FLAW: `savedMessage` only contained IDs (e.g., `sender: '60d5ec...'`). 
 * The frontend expected `sender.name` and crashed, showing "Undefined said: ...".
 * THE FIX: Explicitly populate the message data *before* broadcasting.
 * ============================================================================ */

/**
 * @desc Real-time chat handler (Socket.IO Event: 'chat message')
 * 
 * ARCHITECTURE (The Dual Push):
 * 1. Broadcasts the populated message to the active Property Room (for users with the window open).
 * 2. Calculates the recipient and pushes a targeted 'new_message_alert' to their private User Room.
 */
exports.handleChatMessage = async (io, socket, msg) => {
  try {
    // 1. Persistence
    const savedMessage = await saveMessage(msg.senderId, msg.listingId, msg.content);
    
    // 2. The Hydration Fix (Phase 8): Ensure the payload has names and avatars
    const populated = await Message.findById(savedMessage._id)
      .populate('sender', 'name avatar')
      .populate('listingId', 'adminId title');

    if (!populated || !populated.listingId) return;

    // 3. Shape the perfect frontend payload
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

    // 4. BROADCAST TO ROOM: Update the open chat windows instantly
    io.to(populated.listingId._id.toString()).emit('chat message', payload);

    // --- 5. TARGETED NOTIFICATION LOGIC (Phase 25) ---
    // Figure out who should get the red "Inbox +1" badge
    const hostId = populated.listingId.adminId.toString();
    const currentSenderId = populated.sender._id.toString();

    if (currentSenderId !== hostId) {
      // SCENARIO A: Guest sent the message -> Alert the Host
      io.to(hostId).emit('new_message_alert', payload);
    } else {
      // SCENARIO B: Host sent the message -> Alert the Guest(s)
      // Since multiple guests might have messaged this property in the past,
      // we must find the specific participants of this thread.
      const participants = await Message.find({ listingId: populated.listingId._id }).distinct('sender');
      participants.forEach(pId => {
        const participantId = pId.toString();
        if (participantId !== hostId) {
          io.to(participantId).emit('new_message_alert', payload); // Alert the guest
        }
      });
    }
  } catch (err) { console.error('Socket Message Sync Failure:', err); }
};
