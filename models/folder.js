const mongoose = require('mongoose');

// Check if the model already exists before defining it
const Folder = mongoose.models.Folder || mongoose.model('Folder', new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a folder name'],
    trim: true,
    maxlength: [100, 'Folder name cannot be more than 100 characters']
  },
  path: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  accessLevel: {
    type: String,
    enum: ['private', 'public', 'shared'],
    default: 'private'
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['read', 'write'],
      default: 'read'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}));

module.exports = Folder;