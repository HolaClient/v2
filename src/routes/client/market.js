module.exports = async () => {
    app.get("/api/market/prices", async (req, res) => {
        try {
            const marketPrices = hc.settings.market.resources;
            res.json({ success: true, prices: marketPrices });
        } catch (error) {
            res.json({ success: false, error });
        }
    });
    
    app.post("/api/market/transaction", async (req, res) => {
        try {
            if (!req.session.user) return res.json({ success: false, error: 'Unauthorized' });

            const { resource, action, quantity, price } = req.body;
            
            if (!resource || !action || !quantity || !price) {
                return res.status(400).json({ success: false, error: 'Missing required fields' });
            }
            
            const validResources = ['memory', 'cpu', 'disk', 'subdomains', 'backups', 'databases', 'allocations'];
            if (!validResources.includes(resource)) {
                return res.status(400).json({ success: false, error: 'Invalid resource type' });
            }
            
            if (action !== 'buy' && action !== 'sell') {
                return res.status(400).json({ success: false, error: 'Invalid action' });
            }
            
            const userBalance = db.get("economy", req.session.user.id).coins ?? 0;
            
            const totalPrice = price * quantity;
            
            if (action === 'buy') {
                if (userBalance < totalPrice) {
                    return res.status(400).json({ success: false, error: 'Insufficient balance' });
                }
                
                
            } else if (action === 'sell') {
                const userResources = db.get("resources", req.session.user.id) || {};
                const currentAmount = userResources[resource] || 0;
                
                if (currentAmount < quantity) {
                    return res.status(400).json({ success: false, error: `Insufficient ${resource}` });
                }
                
                
            }
        } catch (error) {
            console.error('Transaction error:', error);
            res.status(500).json({ success: false, error: 'Transaction failed' });
        }
    });
}