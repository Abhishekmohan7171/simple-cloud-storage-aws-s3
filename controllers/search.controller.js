const File = require('../models/file');
const Folder = require('../models/folder');

// @desc    Search files and folders
// @route   GET /api/search
// @access  Private
exports.search = async (req, res) => {
  try {
    const { query, type } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    let results = {
      files: [],
      folders: []
    };
    
    // Search files
    if (!type || type === 'files') {
      const fileQuery = {
        owner: req.user.id,
        $or: [
          { originalName: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      };
      
      // Also search in metadata
      Object.keys(req.query).forEach(key => {
        if (key !== 'query' && key !== 'type') {
          const metadataKey = `metadata.${key}`;
          fileQuery[metadataKey] = { $regex: req.query[key], $options: 'i' };
        }
      });
      
      results.files = await File.find(fileQuery).sort({ updatedAt: -1 });
    }
    
    // Search folders
    if (!type || type === 'folders') {
      results.folders = await Folder.find({
        owner: req.user.id,
        name: { $regex: query, $options: 'i' }
      }).sort({ createdAt: -1 });
    }
    
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};