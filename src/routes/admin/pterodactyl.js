const express = require('express');
const router = express.Router();
const axios = require('axios');

// Middleware to ensure user is admin
const isAdmin = (req, res, next) => {
    if (!req.user || !req.user.permissions || !req.user.permissions.includes('admin')) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    next();
};

// Helper to get Pterodactyl API URL and key
const getPterodactylConfig = () => {
    const apiUrl = hc.settings.pterodactyl.url;
    const apiKey = hc.settings.pterodactyl.key;
    
    if (!apiUrl || !apiKey) {
        throw new Error('Pterodactyl API URL and key must be configured in settings');
    }
    
    return { apiUrl, apiKey };
};

// Fetch locations from Pterodactyl
router.get('/locations', isAdmin, async (req, res) => {
    try {
        const { apiUrl, apiKey } = getPterodactylConfig();
        
        const response = await axios.get(`${apiUrl}/api/application/locations`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        res.json(response.data.data);
    } catch (error) {
        console.error('Error fetching Pterodactyl locations:', error);
        res.status(500).json({ error: 'Failed to fetch locations', details: error.message });
    }
});

// Fetch nodes from Pterodactyl
router.get('/nodes', isAdmin, async (req, res) => {
    try {
        const { apiUrl, apiKey } = getPterodactylConfig();
        
        const response = await axios.get(`${apiUrl}/api/application/nodes`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        res.json(response.data.data);
    } catch (error) {
        console.error('Error fetching Pterodactyl nodes:', error);
        res.status(500).json({ error: 'Failed to fetch nodes', details: error.message });
    }
});

// Fetch eggs from Pterodactyl
router.get('/eggs', isAdmin, async (req, res) => {
    try {
        const { apiUrl, apiKey } = getPterodactylConfig();
        
        // First fetch all nests
        const nestsResponse = await axios.get(`${apiUrl}/api/application/nests`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        const nests = nestsResponse.data.data;
        const allEggs = [];
        
        // For each nest, fetch its eggs
        for (const nest of nests) {
            const eggsResponse = await axios.get(`${apiUrl}/api/application/nests/${nest.attributes.id}/eggs`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            // Add nest name to each egg
            const eggs = eggsResponse.data.data.map(egg => {
                egg.attributes.nest = nest.attributes.name;
                return egg;
            });
            
            allEggs.push(...eggs);
        }
        
        res.json(allEggs);
    } catch (error) {
        console.error('Error fetching Pterodactyl eggs:', error);
        res.status(500).json({ error: 'Failed to fetch eggs', details: error.message });
    }
});

// Save configurations
router.post('/save', isAdmin, async (req, res) => {
    try {
        const { locations, nodes, softwares } = req.body;
        
        // Save to database
        hc.db.set("pterodactyl", {
            locations,
            nodes,
            softwares
        });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving Pterodactyl configurations:', error);
        res.status(500).json({ error: 'Failed to save configurations', details: error.message });
    }
});

module.exports = router;
