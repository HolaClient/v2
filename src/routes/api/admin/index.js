const express = require('express');
const router = express.Router();

// Import Pterodactyl routes
const pterodactylRoutes = require('./pterodactyl');

// Use the routes
router.use('/pterodactyl', pterodactylRoutes);

// Add other admin routes here...

module.exports = router;
