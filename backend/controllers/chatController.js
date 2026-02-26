const Message = require('../models/Message');
const Listing = require('../models/Listing');

const saveMessage = async (senderId, listingId, content) => {
  const newMessage = new Message({ sender: senderId, listingId, content });
  return await newMessage.save();
};

exports.getInbox = async (req, res) => {
  try {
    const myListings = await Listing.find({ adminId: req.user.id }).select('_id');
    const myListingIds = myListings.map(l => l._id);
    const messages = await Message.find({ $or: [{ sender: req.user.id }, { listingId: { $in: myListingIds } }] }).populate('sender', 'name avatar').populate('listingId', 'title images').sort({ timestamp: -1 });
    const threads = {};
    messages.forEach(msg => {
      if (!msg.listingId || !msg.sender) return;
      const lid = msg.listingId._id.toString();
      if (!threads[lid]) threads[lid] = { listing: msg.listingId, lastMessage: msg, unreadCount: 0 };
      if (!msg.isRead && msg.sender._id.toString() !== req.user.id) threads[lid].unreadCount++;
    });
    res.json(Object.values(threads));
  } catch (err) { res.status(500).send('Server Error'); }
};

exports.markAsRead = async (req, res) => {
  try {
    const { listingId } = req.params;
    await Message.updateMany({ listingId, sender: { $ne: req.user.id }, isRead: false }, { $set: { isRead: true } });
    res.json({ success: true });
  } catch (err) { res.status(500).send('Server Error'); }
};

exports.getMessageHistory = async (req, res) => {
  try {
    const messages = await Message.find({ listingId: req.params.listingId }).populate('sender', 'name avatar').sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) { res.status(500).send('Server Error'); }
};

exports.handleJoinRoom = (io, socket, listingId) => { socket.join(listingId); };

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

    // 1. Send to the listing room (for the active chat window)
    io.to(msg.listingId).emit('chat message', payload);

    // --- SCALABILITY FIX: INSTANT NOTIFICATION ---
    // If I am the guest, notify the host. If I am the host, notify the guest.
    const listing = savedMessage.listingId;
    const recipientId = (msg.senderId === listing.adminId.toString()) 
      ? savedMessage.sender._id // (This logic needs to be careful in Lite, usually we notify the other person in thread)
      : listing.adminId;

    // We emit a global event to the recipient's private room
    io.to(recipientId.toString()).emit('new_message_alert', payload);

  } catch (err) { console.error(err); }
};
