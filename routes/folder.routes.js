const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { 
  createFolder, 
  getFolders, 
  updateFolder, 
  deleteFolder, 
  shareFolder 
} = require('../controllers/folder.controller');
const { protect } = require('../middleware/auth');
// const validate = require('../middleware/validate');

// @route   POST /api/folders
// @desc    Create a new folder
// @access  Private
router.post(
  '/',
  protect,
  [check('name', 'Folder name is required').not().isEmpty()],
  createFolder
);

// @route   GET /api/folders
// @desc    Get all folders for a user
// @access  Private
router.get('/', protect, getFolders);

// @route   PUT /api/folders/:id
// @desc    Update folder details
// @access  Private
router.put(
  '/:id',
  protect,
  [check('name', 'Folder name is required').not().isEmpty()],
  updateFolder
);

// @route   DELETE /api/folders/:id
// @desc    Delete a folder
// @access  Private
router.delete('/:id', protect, deleteFolder);

// @route   POST /api/folders/:id/share
// @desc    Share a folder with another user
// @access  Private
router.post(
  '/:id/share',
  protect,
  [
    check('userId', 'User ID is required').not().isEmpty(),
    check('permission', 'Permission must be either read or write').isIn(['read', 'write'])
  ],
  shareFolder
);

module.exports = router;