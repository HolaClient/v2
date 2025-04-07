module.exports = async () => {
    const economyUtils = require('../../utils/economy');

    app.get('/api/economy/generate-link/linkvertise', async (req, res) => {       
        try {
            if (!req.session.userinfo) return res.redirect("/auth");
            
            const economyEnabled = hc.settings.raw('economy.general.enabled');
            if (!economyEnabled) {
                return res.json({
                    success: false,
                    error: "Economy system is disabled"
                });
            }

            const linkvertiseEnabled = hc.settings.raw('economy.linkvertise.enabled');
            if (!linkvertiseEnabled) {
                return res.json({
                    success: false,
                    error: "Linkvertise feature is disabled"
                });
            }
            
            const userId = hc.settings.raw('economy.linkvertise.userId');
            
            if (!userId) {
                return res.json(hc.res.internal.error("Linkvertise User ID not configured"));
            }
            
            const userIdParam = req.session.userinfo.id;
            const link = `https://linkvertise.com/${userId}/generate?user=${userIdParam}`;
            
            return res.json({
                success: true,
                link
            });
        } catch (error) {
            System.err.println(error);
            return res.json(hc.res.internal.error("Failed to generate Linkvertise link"));
        }
    });

    app.post('/api/economy/webhooks/linkvertise', async (req, res) => {       
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

            const linkvertiseEnabled = hc.settings.raw('economy.linkvertise.enabled');
            if (!linkvertiseEnabled) {
                return res.json({
                    success: false,
                    error: "Linkvertise feature is disabled"
                });
            }
            
            const amount = parseInt(hc.settings.raw('economy.linkvertise.rewardPerLink') || 20);
            
            await economyUtils.addTransaction(userId, amount, "Completed Linkvertise link");
            
            return res.json(hc.res.internal.success("Reward added successfully"));
        } catch (error) {
            System.err.println(error);
            return res.json(hc.res.internal.error("Failed to process Linkvertise webhook"));
        }
    });
}
