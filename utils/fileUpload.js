const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Create custom file naming functionality to prevent duplicates
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const userId = req.user.id;
    let uploadPath = path.join(process.env.FILE_UPLOAD_PATH, userId);
    
    // If folder id is provided, append to path
    if (req.body.folderId) {
      uploadPath = path.join(uploadPath, req.body.folderId);
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  // Allow all file types for now
  cb(null, true);
};

// Initialize upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB size limit
  },
  fileFilter: fileFilter
});

// Calculate file checksum
const calculateChecksum = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    
    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
};

// Handle file deduplication 
const handleDuplication = async (checksum, userId, folderId) => {
  // Check if file with same checksum exists for this user
  const existingFile = await File.findOne({
    owner: userId,
    checksum: checksum
  });
  
  if (!existingFile) {
    return { isDuplicate: false };
  }
  
  // File exists, but could be in a different folder
  if (folderId && existingFile.folder && existingFile.folder.toString() !== folderId) {
    // This is a duplicate file but in a different folder - allow it
    return { isDuplicate: false };
  }
  
  // This is a true duplicate
  return { 
    isDuplicate: true,
    existingFile
  };
};

module.exports = {
  upload,
  calculateChecksum,
  handleDuplication
};