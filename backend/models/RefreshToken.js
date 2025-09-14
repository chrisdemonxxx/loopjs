const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '7d', // This will automatically delete tokens after 7 days
  },
});

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
