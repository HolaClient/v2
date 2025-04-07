module.exports = async () => {
    const economyUtils = require('../../utils/economy');

    app.get('/api/economy/generate-link/linkpays', async (req, res) => {       
        try {
            if (!req.session.userinfo) return res.redirect("/auth");
            
            const economyEnabled = hc.settings.raw('economy.general.enabled');
            if (!economyEnabled) {
                return res.json({
                    success: false,
                    error: "Economy system is disabled"
                });
            }

            const linkpaysEnabled = hc.settings.raw('economy.linkpays.enabled');
            if (!linkpaysEnabled) {
                return res.json({
                    success: false,
                    error: "Linkpays feature is disabled"
                });
            }
            
            const apiKey = hc.settings.raw('economy.linkpays.apiKey');
            
            if (!apiKey) {
                return res.json(hc.res.internal.error("Linkpays API key not configured"));
            }
            
            const userId = req.session.userinfo.id;
            const link = `https://linkpays.net/${apiKey}/generate?user=${userId}`;
            
            return res.json({
                success: true,
                link
            });
        } catch (error) {
            System.err.println(error);
            return res.json(hc.res.internal.error("Failed to generate Linkpays link"));
        }
    });

    app.post('/api/economy/webhooks/linkpays', async (req, res) => {       
        try {
            const { userId } = req.body;
            
            if (!userId) {
                return res.json(hc.res.internal.error("Missing required parameters"));
            }
            
            const economyEnabled = hc.settings.raw('economy.general.enabled');
            if (!economyEnabled) {
                return res.json({
                    success: false,
                    error: "Economy system is disabled"
                });
            }

            const linkpaysEnabled = hc.settings.raw('economy.linkpays.enabled');
            if (!linkpaysEnabled) {
                return res.json({
                    success: false,
                    error: "Linkpays feature is disabled"
                });
            }
            
            const amount = parseInt(hc.settings.raw('economy.linkpays.coinsPerLink') || 100);
            let users = db.get("users", "users") || [];
            let user = users.find(i => i.id == userId);
            await economyUtils.addTransaction(user ? user.email : userId, amount, "Completed Linkpays link");
            
            return res.json(hc.res.internal.success("Reward added successfully"));
        } catch (error) {
            System.err.println(error);
            return res.json(hc.res.internal.error("Failed to process Linkpays webhook"));
        }
    });
}