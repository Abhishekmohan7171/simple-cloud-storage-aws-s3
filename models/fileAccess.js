const mongoose = require('mongoose');

const FileAccessSchema = new mongoose.Schema({
  file: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accessType: {
    type: String,
    enum: ['view', 'download', 'edit'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('FileAccess', FileAccessSchema);