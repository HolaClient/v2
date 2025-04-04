const express = require('express');
const router = express.Router();

// Import admin routes
const adminRoutes = require('./admin');

// Use the routes
router.use('/admin', adminRoutes);

// Add other API routes here...

module.exports = router;
