const mongoose = require('mongoose');

const scheduledMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title:       { type: String, required: true, maxlength: 120 },
  message:     { type: String, required: true, maxlength: 5000 },
  recipientName:  { type: String, required: true },
  recipientEmail: { type: String, required: true, lowercase: true },
  deliveredAt:    { type: Date, default: null },
  isDelivered:    { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('ScheduledMessage', scheduledMessageSchema);
