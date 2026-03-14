const ScheduledMessage = require('../models/ScheduledMessage');
const { auditLog } = require('../config/audit');
const { sendEmail } = require('../config/email');

// ── GET /api/messages ──────────────────────────────
const getMessages = async (req, res) => {
  try {
    const messages = await ScheduledMessage.find({ userId: req.userId }).sort({ createdAt: -1 });
    return res.json({ success: true, messages });
  } catch { return res.status(500).json({ success: false, error: 'Failed to fetch messages.' }); }
};

// ── POST /api/messages ─────────────────────────────
const createMessage = async (req, res) => {
  try {
    const { title, message, recipientName, recipientEmail } = req.body;
    if (!title || !message || !recipientEmail) {
      return res.status(400).json({ success: false, error: 'Title, message, and recipient email are required.' });
    }
    const msg = await ScheduledMessage.create({
      userId: req.userId,
      title,
      message,
      recipientName: recipientName || recipientEmail,
      recipientEmail,
    });
    await auditLog({ userId: req.userId, action: 'SCHEDULED_MESSAGE_CREATED', metadata: { recipientEmail } });
    return res.status(201).json({ success: true, message: 'Scheduled message saved.', data: msg });
  } catch { return res.status(500).json({ success: false, error: 'Failed to create message.' }); }
};

// ── PUT /api/messages/:id ──────────────────────────
const updateMessage = async (req, res) => {
  try {
    const { title, message, recipientName, recipientEmail } = req.body;
    const msg = await ScheduledMessage.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId, isDelivered: false },
      { title, message, recipientName, recipientEmail },
      { new: true }
    );
    if (!msg) return res.status(404).json({ success: false, error: 'Message not found or already delivered.' });
    return res.json({ success: true, message: 'Updated.', data: msg });
  } catch { return res.status(500).json({ success: false, error: 'Failed to update.' }); }
};

// ── DELETE /api/messages/:id ───────────────────────
const deleteMessage = async (req, res) => {
  try {
    const msg = await ScheduledMessage.findOneAndDelete({ _id: req.params.id, userId: req.userId, isDelivered: false });
    if (!msg) return res.status(404).json({ success: false, error: 'Message not found or already delivered.' });
    return res.json({ success: true, message: 'Deleted.' });
  } catch { return res.status(500).json({ success: false, error: 'Failed to delete.' }); }
};

// ── Called by deathController.approveRequest ───────
const deliverMessages = async (userId, ownerName) => {
  const messages = await ScheduledMessage.find({ userId, isDelivered: false });
  const results = [];
  for (const msg of messages) {
    try {
      const html = `
        <div style="font-family:monospace;background:#0a0a0b;color:#c8c8d8;padding:40px;max-width:520px;margin:0 auto;border:1px solid #2a2a35;">
          <div style="color:#c9a84c;font-size:20px;margin-bottom:8px;letter-spacing:2px;">ESTATE VAULT</div>
          <div style="color:#5a5a6e;font-size:11px;margin-bottom:32px;letter-spacing:1px;">A FINAL MESSAGE FROM ${ownerName.toUpperCase()}</div>
          <div style="font-size:18px;color:#eeeef8;margin-bottom:20px;">${msg.title}</div>
          <div style="line-height:1.9;font-size:13px;white-space:pre-wrap;border-left:2px solid #c9a84c;padding-left:16px;">${msg.message}</div>
          <p style="color:#5a5a6e;font-size:11px;margin-top:32px;">This message was written by ${ownerName} and scheduled for delivery through Digital Estate Vault.</p>
        </div>
      `;
      await sendEmail({ to: msg.recipientEmail, subject: `A message from ${ownerName} — ${msg.title}`, html });
      await ScheduledMessage.findByIdAndUpdate(msg._id, { isDelivered: true, deliveredAt: new Date() });
      results.push({ id: msg._id, recipient: msg.recipientEmail, status: 'sent' });
    } catch (err) {
      results.push({ id: msg._id, recipient: msg.recipientEmail, status: 'failed', error: err.message });
    }
  }
  return results;
};

module.exports = { getMessages, createMessage, updateMessage, deleteMessage, deliverMessages };
