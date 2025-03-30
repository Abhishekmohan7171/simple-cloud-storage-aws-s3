const Folder = require('../models/folder');
const File = require('../models/file');
const { validationResult } = require('express-validator');

// @desc    Create a new folder
// @route   POST /api/folders
// @access  Private
exports.createFolder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, parentId, accessLevel } = req.body;
    
    let path = `/`;
    let parent = null;
    
    // If parent folder id is provided, get the parent folder
    if (parentId) {
      parent = await Folder.findById(parentId);
      if (!parent) {
        return res.status(404).json({ message: 'Parent folder not found' });
      }
      
      // Check if parent folder belongs to user
      if (parent.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to access this folder' });
      }
      
      path = `${parent.path}${name}/`;
    } else {
      path = `/${name}/`;
    }

    // Create new folder
    const folder = await Folder.create({
      name,
      path,
      owner: req.user.id,
      parent: parentId || null,
      accessLevel: accessLevel || 'private'
    });

    res.status(201).json({ success: true, data: folder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all folders for a user
// @route   GET /api/folders
// @access  Private
exports.getFolders = async (req, res) => {
  try {
    const parentId = req.query.parentId || null;
    
    const query = { 
      owner: req.user.id, 
      parent: parentId 
    };
    
    const folders = await Folder.find(query).sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, count: folders.length, data: folders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update folder details
// @route   PUT /api/folders/:id
// @access  Private
exports.updateFolder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, accessLevel } = req.body;
    
    let folder = await Folder.findById(req.params.id);
    
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    
    // Make sure user owns the folder
    if (folder.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this folder' });
    }
    
    folder = await Folder.findByIdAndUpdate(
      req.params.id,
      { name, accessLevel },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({ success: true, data: folder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a folder
// @route   DELETE /api/folders/:id
// @access  Private
exports.deleteFolder = async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    
    // Make sure user owns the folder
    if (folder.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this folder' });
    }
    
    // Check if folder has subfolders
    const subfolders = await Folder.find({ parent: folder._id });
    if (subfolders.length > 0) {
      return res.status(400).json({ message: 'Cannot delete folder with subfolders' });
    }
    
    // Check if folder has files
    const files = await File.find({ folder: folder._id });
    if (files.length > 0) {
      return res.status(400).json({ message: 'Cannot delete folder with files' });
    }
    
    await folder.remove();
    
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Share a folder with another user
// @route   POST /api/folders/:id/share
// @access  Private
exports.shareFolder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, permission } = req.body;
    
    let folder = await Folder.findById(req.params.id);
    
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    
    // Make sure user owns the folder
    if (folder.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to share this folder' });
    }
    
    // Check if already shared with this user
    const alreadyShared = folder.sharedWith.find(
      share => share.user.toString() === userId
    );
    
    if (alreadyShared) {
      return res.status(400).json({ message: 'Already shared with this user' });
    }
    
    folder.accessLevel = 'shared';
    folder.sharedWith.push({ user: userId, permission });
    
    await folder.save();
    
    res.status(200).json({ success: true, data: folder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};