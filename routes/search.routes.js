const express = require('express');
const router = express.Router();
const { search } = require('../controllers/search.controller');
const { protect } = require('../middleware/auth');

router.get('/', protect, search);

module.exports = router;