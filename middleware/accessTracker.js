const FileAccess = require('../models/fileAccess');

exports.trackFileAccess = async (req, res, next) => {
  // Store the original download method
  const originalDownload = res.download;
  
  // Override the download method
  res.download = function(path, filename, options, fn) {
    // Track the access
    FileAccess.create({
      file: req.params.id,
      user: req.user.id,
      accessType: 'download'
    }).catch(err => console.error('Error tracking file access:', err));
    
    // Call the original download method
    return originalDownload.call(this, path, filename, options, fn);
  };
  
  next();
};