const mongoose = require('mongoose');

// Check if the model already exists before defining it
const File = mongoose.models.File || mongoose.model('File', new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a file name'],
    trim: true
  },
  originalName: {
    type: String,
    required: true
  },
  encoding: String,
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  publicUrl: String,
  folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    path: String,
    version: Number,
    createdAt: Date
  }],
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
  metadata: {
    type: Map,
    of: String,
    default: {}
  },
  tags: [String],
  checksum: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}));

module.exports = File;