const express = require('express');
const router = express.Router();
const { 
  uploadFile, 
  getFiles, 
  downloadFile, 
  deleteFile, 
  updateFile, 
  revertVersion, 
  shareFile 
} = require('../controllers/file.controller');
const { protect } = require('../middleware/auth');
const { upload } = require('../utils/fileUpload');
const { trackFileAccess } = require('../middleware/accessTracker');
const { check } = require('express-validator');


router.post('/upload', protect, upload.single('file'), uploadFile);

router.get('/', protect, getFiles);

router.get('/:id/download', protect, trackFileAccess, downloadFile);

router.delete('/:id', protect, deleteFile);

router.put('/:id', protect, upload.single('file'), updateFile);

router.post('/:id/revert/:versionNumber', protect, revertVersion);

router.post(
  '/:id/share',
  protect,
  [
    check('userId', 'User ID is required').not().isEmpty(),
    check('permission', 'Permission must be either read or write').isIn(['read', 'write'])
  ],
  shareFile
);

module.exports = router;