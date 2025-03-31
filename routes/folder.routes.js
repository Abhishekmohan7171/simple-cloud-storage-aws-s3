const express = require('express');
const router = express.Router();
const {createFolder,getFolders, deleteFolder, updateFolder} = require('../controllers/folder.controller');
const { protect } = require('../middleware/auth');


router.post('/', protect,createFolder);

router.get('/', protect, getFolders);

router.put('/:id',protect,updateFolder);

router.delete('/:id',protect,deleteFolder);

module.exports = router;