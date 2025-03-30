const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { register, login, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  register
);

router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  login
);

router.get('/me', protect, getMe);

module.exports = router;