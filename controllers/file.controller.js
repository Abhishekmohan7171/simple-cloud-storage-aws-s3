const File = require('../models/file');
const User = require('../models/user');
const Folder = require('../models/folder');
const { upload, calculateChecksum } = require('../utils/fileUpload');
const fs = require('fs');
const path = require('path');

// @desc    Upload a file
// @route   POST /api/files/upload
// @access  Private
// @desc    Upload a file with deduplication
// @route   POST /api/files/upload
// @access  Private
exports.uploadFile = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Please upload a file' });
      }
  
      const { folderId, accessLevel, tags, ...metadata } = req.body;
      
      // Check if folder exists and user has access
      if (folderId) {
        const folder = await Folder.findById(folderId);
        if (!folder) {
          return res.status(404).json({ message: 'Folder not found' });
        }
        
        if (folder.owner.toString() !== req.user.id) {
          return res.status(403).json({ message: 'Not authorized to upload to this folder' });
        }
      }
      
      // Calculate file checksum for deduplication
      const checksum = await calculateChecksum(req.file.path);
      
      // Check for duplicates
      const { isDuplicate, existingFile } = await handleDuplication(
        checksum, 
        req.user.id, 
        folderId
      );
      
      if (isDuplicate) {
        // Delete the uploaded file as it's a duplicate
        fs.unlinkSync(req.file.path);
        
        // Return the existing file info
        return res.status(200).json({ 
          success: true,
          deduplicated: true,
          message: 'File deduplicated - already exists in your storage',
          data: existingFile
        });
      }
      
      // Create file object
      const file = await File.create({
        name: req.file.filename,
        originalName: req.file.originalname,
        encoding: req.file.encoding,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        publicUrl: req.file.path.replace(process.env.FILE_UPLOAD_PATH, '/uploads'),
        folder: folderId || null,
        owner: req.user.id,
        accessLevel: accessLevel || 'private',
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        metadata: metadata,
        checksum
      });
      
      // Update user's storage usage
      await User.findByIdAndUpdate(
        req.user.id,
        { $inc: { storageUsed: req.file.size } }
      );
      
      res.status(201).json({ success: true, data: file });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  };

// @desc    Get all files for a user
// @route   GET /api/files
// @access  Private
exports.getFiles = async (req, res) => {
  try {
    const { folderId, search, tag } = req.query;
    
    let query = { owner: req.user.id };
    
    if (folderId) {
      query.folder = folderId;
    }
    
    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { 'metadata.description': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (tag) {
      query.tags = { $in: [tag] };
    }
    
    const files = await File.find(query).sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, count: files.length, data: files });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Download a file
// @route   GET /api/files/:id/download
// @access  Private
exports.downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Check file access
    if (file.accessLevel === 'private' && file.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this file' });
    }
    
    if (file.accessLevel === 'shared') {
      const isSharedWithUser = file.sharedWith.find(
        share => share.user.toString() === req.user.id
      );
      
      if (!isSharedWithUser && file.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to access this file' });
      }
    }
    
    res.download(file.path, file.originalName);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a file
// @route   DELETE /api/files/:id
// @access  Private
exports.deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Make sure user owns the file
    if (file.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this file' });
    }
    
    // Delete file from filesystem
    fs.unlinkSync(file.path);
    
    // Delete previous versions if they exist
    if (file.previousVersions && file.previousVersions.length > 0) {
      file.previousVersions.forEach(version => {
        if (fs.existsSync(version.path)) {
          fs.unlinkSync(version.path);
        }
      });
    }
    
    // Update user's storage usage
    await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { storageUsed: -file.size } }
    );
    
    await file.remove();
    
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update file (new version)
// @route   PUT /api/files/:id
// @access  Private
exports.updateFile = async (req, res) => {
  try {
    let file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Make sure user owns the file
    if (file.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this file' });
    }
    
    if (!req.file) {
      // Just updating metadata
      const { accessLevel, tags, ...metadata } = req.body;
      
      file = await File.findByIdAndUpdate(
        req.params.id,
        {
          accessLevel: accessLevel || file.accessLevel,
          tags: tags ? tags.split(',').map(tag => tag.trim()) : file.tags,
          metadata: { ...file.metadata, ...metadata },
          updatedAt: Date.now()
        },
        { new: true, runValidators: true }
      );
      
      return res.status(200).json({ success: true, data: file });
    }
    
    // Updating the file itself (new version)
    // Save previous version info
    const previousVersion = {
      path: file.path,
      version: file.version,
      createdAt: file.createdAt
    };
    
    // Calculate checksum for new file
    const checksum = await calculateChecksum(req.file.path);
    
    // Update file with new info
    file = await File.findByIdAndUpdate(
      req.params.id,
      {
        name: req.file.filename,
        originalName: req.file.originalname,
        encoding: req.file.encoding,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        publicUrl: req.file.path.replace(process.env.FILE_UPLOAD_PATH, '/uploads'),
        version: file.version + 1,
        previousVersions: [...file.previousVersions, previousVersion],
        checksum,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    // Update user's storage usage (add new file size)
    await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { storageUsed: req.file.size } }
    );
    
    res.status(200).json({ success: true, data: file });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Revert to a previous version
// @route   POST /api/files/:id/revert/:versionNumber
// @access  Private
exports.revertVersion = async (req, res) => {
  try {
    let file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Make sure user owns the file
    if (file.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to revert this file' });
    }
    
    const versionNumber = parseInt(req.params.versionNumber);
    
    // Find the version to revert to
    const versionToRevert = file.previousVersions.find(
      version => version.version === versionNumber
    );
    
    if (!versionToRevert) {
      return res.status(404).json({ message: 'Version not found' });
    }
    
    // Make sure file still exists
    if (!fs.existsSync(versionToRevert.path)) {
      return res.status(404).json({ message: 'Version file not found in storage' });
    }
    
    // Save current version info
    const currentVersion = {
      path: file.path,
      version: file.version,
      createdAt: file.updatedAt
    };
    
    // Get file stats of the version to revert to
    const stats = fs.statSync(versionToRevert.path);
    
    // Remove current version from previousVersions
    const updatedPreviousVersions = file.previousVersions.filter(
      version => version.version !== versionNumber
    );
    
    // Update file with reverted version info
    file = await File.findByIdAndUpdate(
      req.params.id,
      {
        path: versionToRevert.path,
        size: stats.size,
        version: file.version + 1,
        previousVersions: [...updatedPreviousVersions, currentVersion],
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({ success: true, data: file });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Share a file with another user
// @route   POST /api/files/:id/share
// @access  Private
exports.shareFile = async (req, res) => {
  try {
    const { userId, permission } = req.body;
    
    let file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Make sure user owns the file
    if (file.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to share this file' });
    }
    
    // Check if already shared with this user
    const alreadyShared = file.sharedWith.find(
      share => share.user.toString() === userId
    );
    
    if (alreadyShared) {
      return res.status(400).json({ message: 'Already shared with this user' });
    }
    
    file.accessLevel = 'shared';
    file.sharedWith.push({ user: userId, permission });
    
    await file.save();
    
    res.status(200).json({ success: true, data: file });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};