module.exports = async () => {
    const economyUtils = require('../../utils/economy');

    app.get('/api/economy/generate-link/shareus', async (req, res) => {       
        try {
            if (!req.session.userinfo) return res.redirect("/auth");
            
            const economyEnabled = hc.settings.raw('economy.general.enabled');
            if (!economyEnabled) {
                return res.json({
                    success: false,
                    error: "Economy system is disabled"
                });
            }

            const shareusEnabled = hc.settings.raw('economy.shareus.enabled');
            if (!shareusEnabled) {
                return res.json({
                    success: false,
                    error: "ShareUS feature is disabled"
                });
            }
            
            const apiKey = hc.settings.raw('economy.shareus.apiKey');
            
            if (!apiKey) {
                return res.json(hc.res.internal.error("ShareUS API key not configured"));
            }
            
            const userId = req.session.userinfo.id;
            const link = `https://shareus.io/${apiKey}/generate?user=${userId}`;
            
            return res.json({
                success: true,
                link
            });
        } catch (error) {
            System.err.println(error);
            return res.json(hc.res.internal.error("Failed to generate ShareUS link"));
        }
    });

    app.post('/api/economy/webhooks/shareus', async (req, res) => {       
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

            const shareusEnabled = hc.settings.raw('economy.shareus.enabled');
            if (!shareusEnabled) {
                return res.json({
                    success: false,
                    error: "ShareUS feature is disabled"
                });
            }
            
            const amount = parseInt(hc.settings.raw('economy.shareus.rewardPerLink') || 15);
            
            await economyUtils.addTransaction(userId, amount, "Completed ShareUS link");
            
            return res.json(hc.res.internal.success("Reward added successfully"));
        } catch (error) {
            System.err.println(error);
            return res.json(hc.res.internal.error("Failed to process ShareUS webhook"));
        }
    });
}
