const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

// Make uploads folder static
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/files', require('./routes/file.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/search', require('./routes/search.routes'));
app.use('/api/folders', require('./routes/folder.routes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});