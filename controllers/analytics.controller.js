const File = require('../models/file');
const User = require('../models/user');

// @desc    Get user storage usage statistics
// @route   GET /api/analytics/storage
// @access  Private
exports.getStorageAnalytics = async (req, res) => {
  try {
    // Get total storage used
    const user = await User.findById(req.user.id);
    
    // Get file type distribution
    const fileTypeAggregation = await File.aggregate([
      { $match: { owner: req.user.id } },
      { $group: {
          _id: "$mimetype",
          count: { $sum: 1 },
          totalSize: { $sum: "$size" }
        }
      },
      { $sort: { totalSize: -1 } }
    ]);
    
    // Get access level distribution
    const accessLevelAggregation = await File.aggregate([
      { $match: { owner: req.user.id } },
      { $group: {
          _id: "$accessLevel",
          count: { $sum: 1 },
          totalSize: { $sum: "$size" }
        }
      }
    ]);
    
    // Get file count by month
    const filesByMonth = await File.aggregate([
      { $match: { owner: req.user.id } },
      { $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 },
          totalSize: { $sum: "$size" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        storageUsed: user.storageUsed,
        fileTypes: fileTypeAggregation,
        accessLevels: accessLevelAggregation,
        filesByMonth: filesByMonth
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get file access frequency
// @route   GET /api/analytics/access
// @access  Private
// @desc    Get file access frequency
// @route   GET /api/analytics/access
// @access  Private
exports.getAccessAnalytics = async (req, res) => {
  try {
    // Get most accessed files
    const mostAccessedFiles = await FileAccess.aggregate([
      { $match: { user: req.user.id } },
      { $group: {
          _id: "$file",
          count: { $sum: 1 },
          lastAccessed: { $max: "$timestamp" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: {
          from: 'files',
          localField: '_id',
          foreignField: '_id',
          as: 'fileInfo'
        }
      },
      { $unwind: "$fileInfo" },
      { $project: {
          file: "$_id",
          fileName: "$fileInfo.originalName",
          accessCount: "$count",
          lastAccessed: 1,
          _id: 0
        }
      }
    ]);
    
    // Get access count by day for the last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const accessByDay = await FileAccess.aggregate([
      { 
        $match: { 
          user: req.user.id,
          timestamp: { $gte: thirtyDaysAgo }
        } 
      },
      { $group: {
          _id: {
            year: { $year: "$timestamp" },
            month: { $month: "$timestamp" },
            day: { $dayOfMonth: "$timestamp" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        mostAccessedFiles,
        accessByDay
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};